import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seal, unseal, googleScopes, readGoogleConfig, type GoogleConfig } from '../src/features/google-calendar/google.config.js';
import { GoogleCalendarService } from '../src/features/google-calendar/google.service.js';
import { GoogleError, type GoogleState, type GoogleStore } from '../src/features/google-calendar/google.types.js';
import { importWindow, normalizeGoogleEvent } from '../src/features/google-calendar/google.import.js';
import { HttpGoogleProvider } from '../src/features/google-calendar/google.provider.js';
import { createGoogleCalendarRouter } from '../src/features/google-calendar/google.routes.js';
import { parseCreateCommitment, parseUpdateCommitment } from '../src/features/commitments/commitment.validation.js';

const calendar = { id: 'a/b@example.test', summary: 'Calendar', timeZone: 'America/New_York', accessRole: 'reader' };
const config: GoogleConfig = { clientId: 'fixture', clientSecret: 'fixture-secret', key: randomBytes(32),
  redirectUri: 'http://127.0.0.1:3197/integrations/google/callback', webReturn: 'http://localhost:8083/settings/google-return',
  nativeReturn: 'lifeos://settings/google-return', supabaseUrl: 'http://127.0.0.1:56321', serviceKey: 'fixture' };

function configured(overrides: Record<string, string | undefined> = {}) {
  const values: Record<string, string | undefined> = { NODE_ENV: 'production', GOOGLE_CALENDAR_CLIENT_ID: 'fixture',
    GOOGLE_CALENDAR_CLIENT_SECRET: 'fixture-secret', GOOGLE_CALENDAR_REDIRECT_URI: 'https://api.example.test/integrations/google/callback',
    GOOGLE_CALENDAR_WEB_RETURN_URI: undefined, GOOGLE_CALENDAR_ENCRYPTION_KEY: config.key.toString('base64'),
    SUPABASE_URL: 'https://database.example.test', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service', ...overrides };
  const saved = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(values)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    return readGoogleConfig();
  } finally {
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
}

test('native-only production configuration needs no web return and retains server checks', () => {
  const native = configured();
  assert.ok(native); assert.equal(native.webReturn, null); assert.equal(native.nativeReturn, 'lifeos://settings/google-return');
  for (const key of ['GOOGLE_CALENDAR_CLIENT_ID', 'GOOGLE_CALENDAR_CLIENT_SECRET', 'GOOGLE_CALENDAR_REDIRECT_URI', 'GOOGLE_CALENDAR_ENCRYPTION_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    assert.equal(configured({ [key]: undefined }), null);
  }
  assert.equal(configured({ GOOGLE_CALENDAR_ENCRYPTION_KEY: 'invalid' }), null);
  for (const uri of ['http://127.0.0.1:3197/integrations/google/callback', 'https://api.example.test/wrong', 'https://user:pass@api.example.test/integrations/google/callback', 'https://api.example.test/integrations/google/callback?next=elsewhere']) {
    assert.equal(configured({ GOOGLE_CALENDAR_REDIRECT_URI: uri }), null);
  }
});

test('explicit web return keeps HTTPS/path validation and the existing local web configuration', () => {
  const webReturn = 'https://web.example.test/settings/google-return';
  assert.equal(configured({ GOOGLE_CALENDAR_WEB_RETURN_URI: webReturn })?.webReturn, webReturn);
  for (const uri of ['http://localhost:8083/settings/google-return', 'https://web.example.test/wrong', 'https://user:pass@web.example.test/settings/google-return', 'https://web.example.test/settings/google-return#fragment', 'https://web.example.test/settings/google-return?next=elsewhere', 'lifeos://settings/google-return', 'not-a-url']) {
    assert.equal(configured({ GOOGLE_CALENDAR_WEB_RETURN_URI: uri }), null);
  }
  const local = configured({ NODE_ENV: 'test', GOOGLE_CALENDAR_REDIRECT_URI: config.redirectUri,
    GOOGLE_CALENDAR_WEB_RETURN_URI: config.webReturn!, SUPABASE_URL: config.supabaseUrl });
  assert.equal(local?.webReturn, config.webReturn); assert.equal(local?.redirectUri, config.redirectUri);
});

test('web authorization without a configured return fails before creating an attempt or contacting Google', async () => {
  const store: GoogleStore = { async command() { assert.fail('No attempt should be stored'); } };
  const provider = new HttpGoogleProvider(config);
  const service = new GoogleCalendarService({ ...config, webReturn: null }, store, provider);
  await assert.rejects(service.begin('owner', 'web'), error => error instanceof GoogleError && error.statusCode === 503 && error.code === 'setup_required');
});

for (const platform of ['native', 'web'] as const) {
  for (const outcome of ['ready', 'cancelled', 'failed', 'missing-code'] as const) {
    test(`${platform} callback safely handles ${outcome} with the stored return and one-use state`, async () => {
      const selectedConfig = platform === 'native' ? { ...config, webReturn: null } : config;
      let stored: GoogleState = { status: 'disconnected', revision: 0, calendars: [], userId: 'owner' };
      const store: GoogleStore = { async command(user, action, payload = {}) {
        if (action === 'begin') stored.attempt = { ...payload, stage: 'started' } as GoogleState['attempt'];
        else if (action === 'consume') {
          if (!stored.attempt || stored.attempt.stage !== 'started' || stored.attempt.stateHash !== payload.stateHash) throw new GoogleError(409, 'invalid_attempt');
          stored.attempt.stage = 'claimed';
        } else if (action === 'pending') stored.attempt = { ...stored.attempt!, ...payload, stage: 'pending' };
        else if (action === 'cancel') stored = { ...stored, attempt: undefined };
        else assert.fail('Unexpected command');
        if (action !== 'consume') assert.equal(user, 'owner');
        return structuredClone(stored);
      } };
      let exchanges = 0;
      const provider = new HttpGoogleProvider(selectedConfig);
      provider.exchange = async () => {
        exchanges++;
        if (outcome === 'failed') throw new Error('fixture-private-provider-error');
        return { refreshToken: 'fixture-private-refresh', accountId: 'subject', email: 'owner@example.test' };
      };
      const service = new GoogleCalendarService(selectedConfig, store, provider);
      const attempt = await service.begin('owner', platform);
      const authorization = new URL(attempt.authorizationUrl);
      assert.equal(authorization.searchParams.get('redirect_uri'), config.redirectUri);
      assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
      const state = authorization.searchParams.get('state')!;
      await assert.rejects(service.callback('forged-state', 'code'), /invalid_attempt/);
      const returned = new URL(await service.callback(state, outcome === 'missing-code' ? undefined : 'fixture-code', outcome === 'cancelled'));
      assert.equal(`${returned.protocol}//${returned.host}${returned.pathname}`, platform === 'native' ? config.nativeReturn : config.webReturn);
      assert.equal(returned.searchParams.get('attempt'), attempt.id);
      assert.equal(returned.searchParams.get('result'), outcome === 'missing-code' ? 'failed' : outcome);
      assert.equal(returned.searchParams.has('receipt'), outcome === 'ready');
      assert.equal(exchanges, outcome === 'cancelled' || outcome === 'missing-code' ? 0 : 1);
      assert.ok(!returned.href.includes('fixture-private')); assert.ok(!returned.href.includes(attempt.proof));
      await assert.rejects(service.callback(state, 'fixture-code'), /invalid_attempt/);
    });
  }
}

test('encrypted credentials bind owner, purpose and integrity', () => {
  const value = seal('fixture-refresh', 'owner-A', 'refresh', config.key);
  assert.equal(unseal(value, 'owner-A', 'refresh', config.key), 'fixture-refresh');
  assert.throws(() => unseal(value, 'owner-B', 'refresh', config.key));
  assert.throws(() => unseal(value, 'owner-A', 'pkce', config.key));
  assert.throws(() => unseal(value.slice(0, -4), 'owner-A', 'refresh', config.key));
  assert.ok(!value.includes('fixture-refresh'));
});
test('OAuth requests fixed callback, read-only scopes, offline consent and PKCE', () => {
  const url = new URL(new HttpGoogleProvider(config).authorize('state', 'verifier'));
  assert.equal(url.origin, 'https://accounts.google.com');
  assert.equal(url.searchParams.get('redirect_uri'), config.redirectUri);
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.deepEqual(url.searchParams.get('scope')?.split(' '), googleScopes);
  assert.ok(!url.href.includes('fixture-secret'));
});
test('missing configuration is unavailable and cannot fake authorization', async () => {
  const app = createApp({ google: createGoogleCalendarRouter({ config: () => null, auth: (_req, _res, next) => next() }) });
  const status = await request(app).get('/integrations/google');
  assert.equal(status.body.configured, false);
  assert.equal((await request(app).post('/integrations/google/authorize').send({ platform: 'web' })).status, 503);
});
test('provider pagination keeps fixed origins and issues no event writes', async () => {
  const calls: { url: URL; method: string }[] = [];
  const provider = new HttpGoogleProvider(config, (async (input, init) => {
    const url = new URL(String(input)); calls.push({ url, method: init?.method ?? 'GET' });
    return new Response(JSON.stringify(url.searchParams.has('pageToken') ? { items: [{ id: 'two' }] } : { items: [{ id: 'one' }], nextPageToken: 'page-2' }));
  }) as typeof fetch);
  const events = await provider.events('fixture', calendar.id, '2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z');
  assert.deepEqual(events.map(e => e.id), ['one', 'two']);
  assert.ok(calls.every(c => c.method === 'GET' && c.url.origin === 'https://www.googleapis.com'));
  assert.ok(calls[0]!.url.pathname.includes('a%2Fb%40example.test'));
  assert.equal(calls[0]!.url.searchParams.get('singleEvents'), 'true');
  assert.equal(calls[0]!.url.searchParams.get('showDeleted'), 'true');
  assert.equal(calls[0]!.url.searchParams.has('syncToken'), false);
});
test('partial consent, revoked tokens and pagination loops fail without provider payload leakage', async () => {
  const partial = new HttpGoogleProvider(config, (async () => new Response(JSON.stringify({ access_token: 'secret', refresh_token: 'secret', scope: 'openid' }))) as typeof fetch);
  await assert.rejects(partial.exchange('code', 'verifier'), /consent_required/);
  const revoked = new HttpGoogleProvider(config, (async () => new Response('private provider detail', { status: 400 })) as typeof fetch);
  await assert.rejects(revoked.refresh('secret'), /reconnect_required/);
  const loop = new HttpGoogleProvider(config, (async () => new Response(JSON.stringify({ items: [], nextPageToken: 'same' }))) as typeof fetch);
  await assert.rejects(loop.events('secret', 'id', 'from', 'to'), /invalid_provider_response/);
});
test('all-day floating dates use exclusive ends; overnight and midnight boundaries are truthful', () => {
  const allDay = normalizeGoogleEvent({ id: 'all', start: { date: '2026-03-08' }, end: { date: '2026-03-10' } }, calendar, 'owner', 'Asia/Jerusalem')!;
  assert.equal(allDay.date, '2026-03-08'); assert.equal(allDay.endDate, '2026-03-09'); assert.equal(allDay.startTime, null);
  assert.equal(allDay.source.endDateExclusive, '2026-03-10');
  const overnight = normalizeGoogleEvent({ id: 'night', start: { dateTime: '2026-03-08T23:00:00-04:00' }, end: { dateTime: '2026-03-09T02:00:00-04:00' } }, calendar, 'owner', 'America/New_York')!;
  assert.equal(overnight.endDate, '2026-03-09'); assert.equal(overnight.startTime, '23:00:00');
  const midnight = normalizeGoogleEvent({ id: 'midnight', start: { dateTime: '2026-03-08T23:00:00-04:00' }, end: { dateTime: '2026-03-09T00:00:00-04:00' } }, calendar, 'owner', 'America/New_York')!;
  assert.equal(midnight.endDate, midnight.date);
});
test('DST elapsed instants, modified recurrence identity, description and location survive', () => {
  const event = { id: 'instance', recurringEventId: 'series', originalStartTime: { dateTime: '2026-03-08T03:00:00-04:00' },
    start: { dateTime: '2026-03-08T01:30:00-05:00' }, end: { dateTime: '2026-03-08T03:30:00-04:00' }, description: '<b>text</b>\nsecond line', location: ' Room A ', transparency: 'transparent' };
  const mapped = normalizeGoogleEvent(event, calendar, 'subject', calendar.timeZone)!;
  assert.equal(Date.parse(mapped.source.endAt!) - Date.parse(mapped.source.startAt!), 3600000);
  assert.equal(mapped.source.recurringEventId, 'series'); assert.deepEqual(mapped.source.originalStartTime, event.originalStartTime);
  assert.equal(mapped.description, event.description); assert.equal(mapped.location, 'Room A'); assert.equal(mapped.source.transparency, 'transparent');
  const fallback = normalizeGoogleEvent({ id: 'fallback', start: { dateTime: '2026-11-01T01:30:00-04:00' }, end: { dateTime: '2026-11-01T01:30:00-05:00' } }, calendar, 'subject', calendar.timeZone)!;
  assert.equal(Date.parse(fallback.source.endAt!) - Date.parse(fallback.source.startAt!), 3600000);
  assert.equal(normalizeGoogleEvent({ id: 'cancel', status: 'cancelled' }, calendar, 'owner', 'UTC'), null);
});
test('invalid times and oversize data fail; rolling window and shared location validate', () => {
  const event = { id: 'x', start: { dateTime: '2026-03-08T01:00:00' }, end: { dateTime: '2026-03-08T02:00:00Z' } };
  assert.throws(() => normalizeGoogleEvent(event, calendar, 'owner', 'UTC'));
  assert.throws(() => normalizeGoogleEvent({ id: 'x', summary: 'x'.repeat(501) }, calendar, 'owner', 'UTC'));
  const window = importWindow(new Date('2026-10-09T19:00:00Z')); assert.equal(window.from, '2026-09-09T00:00:00.000Z');
  assert.equal(Date.parse(window.to) - Date.parse(window.from), 210 * 86400000);
  assert.equal(parseCreateCommitment({ title: 'test', date: '2026-10-09', startTime: '09:00', location: '  ' }).location, null);
  assert.equal(parseUpdateCommitment({ location: ' Room A ' }).location, 'Room A');
  assert.throws(() => parseUpdateCommitment({ location: 'a'.repeat(2001) }));
  assert.throws(() => parseUpdateCommitment({ calendarSource: {} }));
});
