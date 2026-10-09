import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import console from 'node:console';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:net';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath, URL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { notificationDefaults } from './verify-notifications.mjs';

// Narrow #34 persistence check. Never resets/migrates the DB or touches review accounts.
const root = fileURLToPath(new URL('../../..', import.meta.url));
const workdir = process.env.LIFEOS_INTEGRATION_SUPABASE_WORKDIR;
assert.ok(workdir && /^project_id\s*=\s*"LifeOS32"\s*$/m.test(readFileSync(resolve(workdir, 'supabase/config.toml'), 'utf8')), 'Use the existing disposable LifeOS32 project');
const raw = execFileSync(process.execPath, [resolve(root, 'node_modules/supabase/dist/supabase.js'), 'status', '--output', 'json'], { cwd: workdir, encoding: 'utf8' });
const status = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
for (const key of ['API_URL', 'DB_URL']) assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(status[key]).hostname), 'Local services only');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const publicKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
const admin = createClient(status.API_URL, status.SECRET_KEY || status.SERVICE_ROLE_KEY, options);
const created = [];
await new Promise((resolveReady, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(3196, () => probe.close(resolveReady));
});
const api = spawn(process.execPath, ['--import', 'tsx', 'apps/api/src/server.ts'], {
  cwd: root, stdio: 'ignore', env: { ...process.env, NODE_ENV: 'test', TSX_TSCONFIG_PATH: resolve(root, 'apps/api/tsconfig.json'), PORT: '3196', SUPABASE_URL: status.API_URL, SUPABASE_PUBLISHABLE_KEY: publicKey },
});
const base = 'http://127.0.0.1:3196';
async function request(token, method = 'GET', notifications) {
  const response = await globalThis.fetch(`${base}/settings`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(notifications ? { body: JSON.stringify({ notifications, timezone: 'Asia/Jerusalem' }) } : {}) });
  assert.equal(response.status, 200, 'Settings request failed');
  return (await response.json()).settings.notifications;
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    assert.equal(api.exitCode, null, 'Isolated API exited');
    try { ready = (await globalThis.fetch(`${base}/health`, { signal: globalThis.AbortSignal.timeout(500) })).ok; } catch { /* starting */ }
    if (ready) break;
    await sleep(100);
  }
  assert.ok(ready, 'Isolated API not ready');
  const accounts = [];
  for (let i = 0; i < 2; i++) {
    const credentials = { email: `settings-34-${randomUUID()}@example.test`, password: randomUUID() + 'Aa!7' };
    const result = await admin.auth.admin.createUser({ ...credentials, email_confirm: true });
    assert.ok(!result.error && result.data.user, 'Disposable fixture account creation failed');
    created.push(result.data.user.id);
    const client = createClient(status.API_URL, publicKey, options);
    const signed = await client.auth.signInWithPassword(credentials);
    assert.ok(!signed.error && signed.data.session, 'Disposable fixture sign-in failed');
    accounts.push({ credentials, client, token: signed.data.session.access_token });
  }
  const [a, b] = accounts;
  const initial = await request(a.token);
  assert.deepEqual(initial, notificationDefaults);
  const prefs = { ...initial, enabled: true, taskRemindersEnabled: true, commitmentRemindersEnabled: true, commitmentDefaultReminderMinutes: 37,
    weeklyPlanningEnabled: true, weeklyPlanningWeekday: 2, weeklyPlanningTime: '09:17' };
  assert.deepEqual(await request(a.token, 'PATCH', prefs), prefs);
  assert.deepEqual(await request(a.token, 'PATCH', prefs), prefs); // identical retry
  const off = { ...prefs, enabled: false };
  assert.deepEqual(await request(a.token, 'PATCH', off), off);
  assert.deepEqual(await request(b.token), initial);
  const foreign = await b.client.from('user_settings').update({ notifications_enabled: true }).eq('user_id', created[0]).select('user_id');
  assert.ok(!foreign.error); assert.deepEqual(foreign.data, []);
  await a.client.auth.signOut();
  const fresh = createClient(status.API_URL, publicKey, options);
  const restarted = await fresh.auth.signInWithPassword(a.credentials);
  assert.ok(!restarted.error && restarted.data.session, 'Fresh session failed');
  const token = restarted.data.session.access_token;
  assert.deepEqual(await request(token), off);
  assert.deepEqual(await request(token, 'PATCH', prefs), prefs);
  assert.deepEqual(await request(b.token), initial);
  const denied = await globalThis.fetch(`${base}/settings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notifications: prefs, timezone: 'UTC' }) });
  assert.equal(denied.status, 401);
  console.log('PASS: real local preference persistence, identical retry, master-off retention, fresh-session reload, account isolation, foreign-row RLS and anonymous rejection. No delivery/provider acceptance.');
} finally {
  api.kill('SIGINT');
  for (const id of created) {
    const result = await admin.auth.admin.deleteUser(id);
    assert.ok(!result.error, 'Disposable fixture cleanup failed');
  }
  console.log('Removed only the two disposable fixture accounts; no DB reset or migrations.');
}
