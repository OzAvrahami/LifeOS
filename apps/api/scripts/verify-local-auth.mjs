import assert from 'node:assert/strict';
import console from 'node:console';
import process from 'node:process';
import { URL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';
import { GoTrueClient } from '@supabase/auth-js';
import { processAuthCallback } from '../../mobile/src/features/auth/auth-callback.ts';
import { newAccountMetadata, needsOnboarding } from '../../mobile/src/features/auth/onboarding-state.ts';
const { fetch } = globalThis;

// Uses only the named disposable project's synthetic accounts. Never modifies
// the existing Auth container/config, owner accounts, or hosted configuration.
const workdir = process.env.LIFEOS_INTEGRATION_SUPABASE_WORKDIR;
if (!workdir || !/^project_id\s*=\s*"LifeOS32"\s*$/m.test(readFileSync(resolve(workdir, 'supabase/config.toml'), 'utf8'))) throw new Error('Requires disposable LifeOS32');
const raw = execFileSync(process.execPath, [resolve('node_modules/supabase/dist/supabase.js'), 'status', '--output', 'json'], { cwd: workdir, encoding: 'utf8' });
const status = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
assert.equal(new URL(status.API_URL).origin, 'http://127.0.0.1:56321');
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const info = JSON.parse(docker('inspect', 'supabase_auth_LifeOS32'))[0];
const env = Object.fromEntries(info.Config.Env.map(line => { const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)]; }));
assert.equal(env.GOTRUE_MAILER_AUTOCONFIRM, 'true');
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const key = status.PUBLISHABLE_KEY || status.ANON_KEY;
const admin = createClient(status.API_URL, status.SECRET_KEY || status.SERVICE_ROLE_KEY, clientOptions);
const publicClient = () => createClient(status.API_URL, key, clientOptions);
const run = randomUUID(); const password = `Local-only-${randomUUID()}!`;
const created = []; const emails = []; let sidecarStarted = false;
const sidecar = `lifeos-auth-confirm-${run}`;
const authUrl = 'http://127.0.0.1:56329';
const authClient = () => new GoTrueClient({ url: authUrl, headers: { apikey: key }, persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
async function signup(auth, suffix) {
  const email = `review-${run}-${suffix}@example.test`;
  const result = await auth.signUp({ email, password, options: { data: { ...newAccountMetadata, name: 'Local review' }, emailRedirectTo: 'http://localhost:8083/auth/callback?intent=signup' } });
  assert.equal(result.error, null, 'Synthetic signup failed');
  assert.ok(result.data.user?.id); created.push(result.data.user.id);
  return { ...result.data, email };
}
try {
  const auto = await signup(publicClient().auth, 'auto');
  assert.ok(auto.session); assert.ok(auto.user.email_confirmed_at); assert.ok(needsOnboarding(auto.user));
  console.log('PASS existing local Auth: AUTOCONFIRM=true; actual signup returns a confirmed user/session, onboarding still required');

  const testEnv = { ...Object.fromEntries(Object.entries(env).filter(([key]) => key.startsWith('GOTRUE_') || key === 'API_EXTERNAL_URL')), GOTRUE_MAILER_AUTOCONFIRM: 'false', API_EXTERNAL_URL: authUrl,
    GOTRUE_SITE_URL: 'http://localhost:8083', GOTRUE_URI_ALLOW_LIST: 'http://localhost:8083/**',
    GOTRUE_MAILER_URLPATHS_CONFIRMATION: '/verify' };
  const network = Object.keys(info.NetworkSettings.Networks).find(name => name.includes('LifeOS32'));
  assert.ok(network, 'Expected isolated Docker network');
  execFileSync('docker', ['run', '--detach', '--name', sidecar, '--network', network, '--publish', '127.0.0.1:56329:9999',
    ...Object.keys(testEnv).flatMap(name => ['--env', name]), info.Config.Image],
  { env: { ...process.env, ...testEnv }, stdio: ['ignore', 'pipe', 'pipe'] });
  sidecarStarted = true;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`${authUrl}/health`)).ok) break; } catch { /* startup */ }
    if (attempt === 99) throw new Error('Temporary confirmation service did not start');
    await sleep(100);
  }
  const requiring = await signup(authClient(), 'confirm');
  assert.equal(requiring.session, null); assert.equal(requiring.user.email_confirmed_at, undefined);
  const denied = await authClient().signInWithPassword({ email: requiring.email, password });
  assert.equal(denied.data.session, null); assert.equal(denied.error?.code, 'email_not_confirmed');
  let message;
  for (let attempt = 0; attempt < 50; attempt++) {
    const list = await (await fetch('http://127.0.0.1:56324/api/v1/messages')).json();
    message = list.messages?.find(item => item.To?.some(recipient => recipient.Address === requiring.email));
    if (message) break;
    await sleep(100);
  }
  assert.ok(message, 'Confirmation email must arrive in local Mailpit'); emails.push(message.ID);
  const mail = await (await fetch(`http://127.0.0.1:56324/api/v1/message/${message.ID}`)).json();
  const link = mail.HTML.match(/href="([^"]*\/verify\?[^"]*)"/)?.[1]?.replaceAll('&amp;', '&');
  assert.ok(link, 'Expected actual confirmation link'); assert.equal(new URL(link).origin, authUrl);
  const confirmed = await fetch(link, { redirect: 'manual' });
  const callback = confirmed.headers.get('location');
  assert.ok(callback); assert.equal(new URL(callback).origin, 'http://localhost:8083');
  assert.equal(new URL(callback).pathname, '/auth/callback');
  const auth = authClient();
  const result = await processAuthCallback({ auth }, callback);
  assert.equal(result.intent, 'signup'); assert.equal(result.session.user.id, requiring.user.id);
  assert.ok(needsOnboarding(result.session.user));
  const resumedBefore = await authClient().signInWithPassword({ email: requiring.email, password });
  assert.ok(needsOnboarding(resumedBefore.data.user));
  const saved = await auth.updateUser({ data: { lifeos_onboarding_completed_at: new Date().toISOString() } });
  assert.equal(saved.error, null); assert.equal(saved.data.user.user_metadata.name, 'Local review');
  assert.equal(needsOnboarding(saved.data.user), false);
  const restarted = await publicClient().auth.signInWithPassword({ email: requiring.email, password });
  assert.equal(restarted.error, null); assert.equal(needsOnboarding(restarted.data.user), false);
  const other = await publicClient().auth.signInWithPassword({ email: auto.email, password });
  assert.ok(needsOnboarding(other.data.user));
  console.log('PASS confirmation-required local sidecar: null signup session, sign-in blocked, real mail/verify redirect, application callback, explicit onboarding metadata, restart and account isolation');
} finally {
  for (const id of created) {
    const result = await admin.auth.admin.deleteUser(id); assert.equal(result.error, null, 'Synthetic account cleanup');
  }
  for (const id of emails) await fetch(`http://127.0.0.1:56324/api/v1/messages/${id}`, { method: 'DELETE' });
  if (sidecarStarted) docker('rm', '--force', sidecar);
}
