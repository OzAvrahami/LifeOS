// Controlled Google responses + real disposable Supabase Auth/RLS. Never contacts Google.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import console from 'node:console';
import { URL } from 'node:url';
import { setTimeout } from 'node:timers';
import { createClient } from '@supabase/supabase-js';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { createGoogleCalendarRouter } from '../src/features/google-calendar/google.routes.ts';
import { googleStore } from '../src/features/google-calendar/google.store.ts';
import { GoogleCalendarService } from '../src/features/google-calendar/google.service.ts';
import { GoogleError } from '../src/features/google-calendar/google.types.ts';

const root = resolve(import.meta.dirname, '../../..');
const workdir = process.env.LIFEOS_INTEGRATION_SUPABASE_WORKDIR;
assert.ok(workdir, 'Explicit disposable workdir required');
const project = /^project_id\s*=\s*"([^"]+)"/m.exec(readFileSync(resolve(workdir, 'supabase/config.toml'), 'utf8'))?.[1];
assert.equal(project, process.env.LIFEOS_INTEGRATION_SUPABASE_PROJECT_ID);
assert.ok(project && /LifeOS(?:17|32)/.test(project), 'Only named disposable integration projects allowed');
const raw = execFileSync(process.execPath, [resolve(root, 'node_modules/supabase/dist/supabase.js'), 'status', '--output', 'json'], { cwd: workdir, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
const status = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
for (const value of [status.API_URL, status.DB_URL]) assert.ok(['localhost','127.0.0.1'].includes(new URL(value).hostname));
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const key = status.PUBLISHABLE_KEY || status.ANON_KEY;
const admin = createClient(status.API_URL, status.SECRET_KEY || status.SERVICE_ROLE_KEY, options);
process.env.SUPABASE_URL = status.API_URL; process.env.SUPABASE_PUBLISHABLE_KEY = key;
const config = { clientId: 'fixture-only', clientSecret: 'fixture-only', redirectUri: 'http://127.0.0.1:3197/integrations/google/callback',
  webReturn: 'http://localhost:8083/settings/google-return', nativeReturn: 'lifeos://settings/google-return', key: randomBytes(32),
  supabaseUrl: status.API_URL, serviceKey: status.SERVICE_ROLE_KEY || status.SECRET_KEY };
const store = googleStore(config);
const calendar = { id: 'calendar-A', summary: 'Fixture calendar', timeZone: 'Asia/Jerusalem', accessRole: 'owner' };
let events = []; let refreshFailure = false; let calendarFailure = false; let accountId = 'fixture-subject'; let releaseEvents;
const provider = {
  authorize: state => `https://accounts.google.com/fixture?state=${state}`,
  exchange: async () => ({ refreshToken: 'fixture-provider-secret', accountId, email: 'fixture@example.test' }),
  refresh: async () => { if (refreshFailure) throw new GoogleError(409, 'reconnect_required'); return 'fixture-access'; },
  calendars: async () => { if (calendarFailure) throw new GoogleError(502, 'provider_unavailable'); return [calendar, { ...calendar, id: 'busy-only', accessRole: 'freeBusyReader' }]; },
  events: async () => { if (releaseEvents) await new Promise(resolve => { releaseEvents = resolve; }); return events; },
};
const app = createApp({ google: createGoogleCalendarRouter({ config: () => config, store, provider }) });
const users = []; const tokens = []; const clients = [];
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.parse(today) + 86400000).toISOString().slice(0, 10);
const dayAfter = new Date(Date.parse(today) + 2 * 86400000).toISOString().slice(0, 10);
async function call(path = '', body, token = tokens[0], method = body === undefined ? 'get' : 'post', expected = 200) {
  const r = request(app)[method]('/integrations/google' + path);
  if (token) r.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) r.send(body);
  const result = await r;
  assert.equal(result.status, expected, `${method} ${path}: ${JSON.stringify(result.body)}`);
  assert.ok(!JSON.stringify(result.body).includes('fixture-provider-secret'));
  return result;
}
async function start(token = tokens[0], platform = 'web') {
  const attempt = (await call('/authorize', { platform }, token)).body;
  return { ...attempt, state: new URL(attempt.authorizationUrl).searchParams.get('state') };
}
async function callback(attempt, error = false) {
  const result = await call(`/callback?state=${attempt.state}&${error ? 'error=access_denied' : 'code=fixture-code'}`, undefined, null, 'get', 303);
  const url = new URL(result.headers.location);
  assert.equal(url.searchParams.get('attempt'), attempt.id);
  return url;
}
async function connect() {
  const attempt = await start(); const url = await callback(attempt);
  const command = { id: attempt.id, proof: attempt.proof, receipt: url.searchParams.get('receipt') };
  const result = (await call('/complete', command)).body;
  assert.deepEqual((await call('/complete', command)).body, result, 'completion retries are idempotent');
  return result;
}
async function select() {
  const catalog = (await call('/calendars')).body;
  assert.ok(catalog.calendars.every(c => !c.selected));
  await call('/selection', { revision: catalog.revision, ids: ['busy-only'] }, tokens[0], 'put', 409);
  return (await call('/selection', { revision: catalog.revision, ids: [calendar.id] }, tokens[0], 'put')).body;
}
try {
  for (let index = 0; index < 2; index++) {
    const email = `google-fixture-${randomUUID()}@example.test`; const password = randomBytes(24).toString('base64url');
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert.ifError(created.error); users.push(created.data.user.id);
    const client = createClient(status.API_URL, key, options);
    const signed = await client.auth.signInWithPassword({ email, password }); assert.ifError(signed.error);
    tokens.push(signed.data.session.access_token); clients.push(client);
  }
  await call('', undefined, null, 'get', 401);
  assert.equal((await call()).body.status, 'disconnected');
  const expired = await start();
  const expiredState = await store.command(users[0], 'read');
  await store.command(users[0], 'begin', { ...expiredState.attempt, expiresAt: '2000-01-01T00:00:00Z' });
  await call(`/callback?state=${expired.state}&code=x`, undefined, null, 'get', 409);
  const denied = await start(); assert.equal((await callback(denied, true)).searchParams.get('result'), 'cancelled');
  assert.equal((await call()).body.status, 'disconnected');
  const old = await start(); const fresh = await start();
  await call(`/callback?state=${old.state}&code=x`, undefined, null, 'get', 409);
  await call('/cancel', { id: fresh.id });
  await call(`/callback?state=${fresh.state}&code=x`, undefined, null, 'get', 409);
  const savedWebReturn = config.webReturn;
  config.webReturn = null;
  assert.equal((await call()).body.configured, true, 'native-only setup remains available');
  await call('/authorize', { platform: 'web' }, tokens[0], 'post', 503);
  const attempt = await start(tokens[0], 'native'); const returned = await callback(attempt);
  assert.equal(returned.protocol, 'lifeos:');
  await call(`/callback?state=${attempt.state}&code=x`, undefined, null, 'get', 409);
  const completion = { id: attempt.id, proof: attempt.proof, receipt: returned.searchParams.get('receipt') };
  await call('/complete', completion, tokens[1], 'post', 409);
  await call('/complete', { ...completion, proof: 'x'.repeat(43) }, tokens[0], 'post', 409);
  await call('/complete', { ...completion, receipt: 'x'.repeat(43) }, tokens[0], 'post', 409);
  await call('/complete', completion);
  config.webReturn = savedWebReturn; // Remaining connection/import checks use the existing local web flow.
  assert.equal((await call('', undefined, tokens[1])).body.status, 'disconnected');
  const secret = await store.command(users[0], 'read');
  assert.ok(secret.credential && !secret.credential.includes('fixture-provider-secret'));
  assert.equal((await call()).body.credential, undefined);
  for (const client of [...clients, createClient(status.API_URL, key, options)]) {
    assert.ok((await client.rpc('google_calendar_command', { p_user_id: users[0], p_action: 'read' })).error, 'server RPC denied');
    assert.ok((await client.schema('lifeos_private').from('google_calendar_state').select('*')).error, 'private credentials inaccessible');
  }
  let selected = await select();
  const local = await request(app).post('/commitments').set('Authorization', `Bearer ${tokens[0]}`).send({ title: 'Local start-only', date: today, startTime: '10:00', location: '  Room 2  ' });
  assert.equal(local.status, 201); assert.equal(local.body.commitment.location, 'Room 2');
  const plan = await clients[0].from('daily_plans').insert({ user_id: users[0], date: today, planning_status: 'completed', planning_step: 3, planning_completed_at: new Date().toISOString(), selected_task_ids: [] }).select('*').single(); assert.ifError(plan.error);
  events = [
    { id: 'timed', summary: 'Timed', description: 'line one\nline two', location: ' Building A ', start: { dateTime: `${today}T09:00:00+03:00` }, end: { dateTime: `${today}T10:00:00+03:00` } },
    { id: 'all-day', summary: 'All day', start: { date: today }, end: { date: dayAfter } },
    { id: 'overnight', summary: 'Overnight', start: { dateTime: `${today}T23:00:00+03:00` }, end: { dateTime: `${tomorrow}T02:00:00+03:00` } },
    { id: 'series-instance', recurringEventId: 'series', originalStartTime: { dateTime: `${today}T11:00:00+03:00` }, start: { dateTime: `${today}T12:00:00+03:00` }, end: { dateTime: `${today}T13:00:00+03:00` } },
  ];
  await call('/import', { revision: selected.revision });
  const list = async (date = today, token = tokens[0]) => {
    const r = await request(app).get('/commitments?date=' + date).set('Authorization', `Bearer ${token}`); assert.equal(r.status, 200); return r.body.commitments;
  };
  const imported = (await list()).filter(c => c.calendarSource); assert.equal(imported.length, 4);
  assert.equal((await list(tomorrow)).length, 2, 'overnight and multi-day overlap');
  assert.equal(imported.find(c => c.calendarSource.eventId === 'all-day').startTime, null);
  assert.equal(imported.find(c => c.calendarSource.eventId === 'timed').location, 'Building A');
  assert.equal((await list(today, tokens[1])).length, 0);
  const first = imported[0];
  for (const method of ['patch','delete']) {
    const r = request(app)[method]('/commitments/' + first.id).set('Authorization', `Bearer ${tokens[0]}`);
    if (method === 'patch') r.send({ title: 'No local divergence' }); assert.equal((await r).status, 409);
  }
  assert.ok((await clients[0].from('commitments').update({ title: 'Forbidden' }).eq('id', first.id)).error);
  assert.ok((await clients[0].from('commitments').delete().eq('id', first.id)).error);
  assert.deepEqual((await clients[1].from('commitments').update({ title: 'Other user' }).eq('id', first.id).select('*')).data, []);
  assert.ok((await clients[1].from('commitments').insert({ user_id: users[0], title: 'Other owner', date: today, start_time: '09:00' })).error);
  assert.ok((await clients[0].from('commitments').update({ calendar_source: first.calendarSource }).eq('id', local.body.commitment.id)).error);
  assert.ok((await clients[0].from('commitments').insert({ user_id: users[0], title: 'No time', date: today })).error, 'local start still required');
  await call('/import', { revision: selected.revision });
  assert.deepEqual((await list()).filter(c => c.calendarSource).map(c => c.id).sort(), imported.map(c => c.id).sort());
  events[0].summary = 'Updated'; events[3] = { id: 'series-instance', status: 'cancelled' };
  await call('/import', { revision: selected.revision });
  assert.equal((await list()).length, 4); assert.equal((await list()).find(c => c.calendarSource?.eventId === 'timed').id, imported.find(c => c.calendarSource.eventId === 'timed').id);
  const before = await list(); calendarFailure = true;
  await call('/import', { revision: selected.revision }, tokens[0], 'post', 502);
  assert.deepEqual(await list(), before); assert.equal((await call()).body.status, 'failed'); calendarFailure = false;
  events.push({ id: 'malformed', start: { date: 'bad' } });
  await call('/import', { revision: selected.revision }, tokens[0], 'post', 500); events.pop();
  assert.deepEqual(await list(), before, 'invalid event keeps complete prior snapshot');
  const noSelection = (await call('/selection', { ids: [], revision: selected.revision }, tokens[0], 'put')).body;
  assert.equal((await list()).length, 1, 'deselection hides imports but preserves local');
  await call('/import', { revision: selected.revision }, tokens[0], 'post', 409);
  selected = (await call('/selection', { ids: [calendar.id], revision: noSelection.revision }, tokens[0], 'put')).body;
  await call('/import', { revision: selected.revision });
  const service = new GoogleCalendarService(config, store, provider);
  releaseEvents = true; const running = service.sync(users[0], selected.revision, 'Asia/Jerusalem');
  while (typeof releaseEvents !== 'function') await new Promise(resolve => setTimeout(resolve, 10));
  const failure = assert.rejects(running); // Observe before releasing concurrent request.
  await call('/disconnect', {}); releaseEvents(); releaseEvents = undefined; await failure;
  assert.equal((await list()).length, 1); assert.equal((await call()).body.status, 'disconnected');
  await connect(); selected = await select(); await call('/import', { revision: selected.revision });
  assert.equal((await list()).find(c => c.calendarSource?.eventId === 'timed').id, imported.find(c => c.calendarSource.eventId === 'timed').id);
  releaseEvents = true; const staleSelection = service.sync(users[0], selected.revision, 'Asia/Jerusalem');
  while (typeof releaseEvents !== 'function') await new Promise(resolve => setTimeout(resolve, 10));
  const staleFailure = assert.rejects(staleSelection);
  const cleared = (await call('/selection', { ids: [], revision: selected.revision }, tokens[0], 'put')).body;
  releaseEvents(); releaseEvents = undefined; await staleFailure;
  assert.equal((await list()).length, 1, 'in-flight import cannot undo deselection');
  selected = (await call('/selection', { ids: [calendar.id], revision: cleared.revision }, tokens[0], 'put')).body;
  await call('/import', { revision: selected.revision });
  refreshFailure = true; await call('/import', { revision: selected.revision }, tokens[0], 'post', 409);
  assert.equal((await call()).body.status, 'reconnect_required'); assert.equal((await store.command(users[0], 'read')).credential, undefined); refreshFailure = false;
  accountId = 'different-subject'; const other = await start(); const otherReturn = await callback(other);
  await call('/complete', { id: other.id, proof: other.proof, receipt: otherReturn.searchParams.get('receipt') }, tokens[0], 'post', 409);
  assert.deepEqual((await clients[0].from('daily_plans').select('*').eq('id', plan.data.id).single()).data, plan.data, 'import never changes approved plan');
  await call('/disconnect', {});
  console.log('PASS Google fixture/Auth/RLS: ownership + dual proof, replay/cancel/supersede, explicit selection, read-only roles, atomic retries, overlap, recurrence cancellation, reconnect IDs, stale/disconnect races, local preservation and approved-plan isolation');
} finally {
  for (const id of users) { const result = await admin.auth.admin.deleteUser(id); assert.ifError(result.error); }
}
