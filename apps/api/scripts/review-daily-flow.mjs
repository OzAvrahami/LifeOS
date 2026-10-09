import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createClient } from '@supabase/supabase-js';

// Review utility only. Never imported by the application. Requires the explicitly
// named disposable project, reads keys internally, and never prints credentials.
const root = fileURLToPath(new URL('../../..', import.meta.url));
const workdir = process.env.LIFEOS_INTEGRATION_SUPABASE_WORKDIR;
if (!workdir || !/^project_id\s*=\s*"LifeOS32"\s*$/m.test(readFileSync(resolve(workdir, 'supabase/config.toml'), 'utf8'))) {
  throw new Error('Set LIFEOS_INTEGRATION_SUPABASE_WORKDIR to the isolated LifeOS32 project');
}
const raw = execFileSync(process.execPath, [resolve(root, 'node_modules/supabase/dist/supabase.js'), 'status', '--output', 'json'], { cwd: workdir, encoding: 'utf8' });
const status = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
for (const name of ['API_URL', 'DB_URL']) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(status[name]).hostname)) throw new Error('Review requires localhost');
}
const publishable = status.PUBLISHABLE_KEY || status.ANON_KEY;
const command = process.argv[2];
if (command === 'api' || command === 'web') {
  const api = command === 'api';
  const child = spawn(process.execPath, api ? ['--import', 'tsx', 'apps/api/src/server.ts']
    : [resolve(root, 'node_modules/expo/bin/cli'), 'start', '--web', '--localhost', '--port', '8083'], {
    cwd: api ? root : resolve(root, 'apps/mobile'), stdio: 'inherit',
    env: { ...process.env, ...(api ? { NODE_ENV: 'test', TSX_TSCONFIG_PATH: resolve(root, 'apps/api/tsconfig.json'), PORT: '3197', SUPABASE_URL: status.API_URL, SUPABASE_PUBLISHABLE_KEY: publishable }
      : { EXPO_NO_DOTENV: '1', EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3197', EXPO_PUBLIC_SUPABASE_URL: status.API_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable }) },
  });
  child.on('exit', code => { process.exitCode = code ?? 0; });
  process.on('SIGINT', () => child.kill('SIGINT'));
} else if (command === 'seed') {
  const email = process.argv[3];
  if (!email || !email.endsWith('@example.test')) throw new Error('Use a dedicated local @example.test review account');
  const admin = createClient(status.API_URL, status.SECRET_KEY || status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let user;
  for (let page = 1; !user; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error('Could not read disposable accounts');
    user = data.users.find(item => item.email === email);
    if (data.users.length < 100) break;
  }
  if (!user) throw new Error('Register this account in the isolated preview first');
  // Product tables deliberately grant access to authenticated callers, not an
  // assumed administrative bypass. Obtain a local-only caller session internally.
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (link.error) throw new Error('Could not issue a local fixture session');
  const caller = createClient(status.API_URL, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
  const session = await caller.auth.verifyOtp({ type: 'magiclink', token_hash: link.data.properties.hashed_token });
  if (session.error || session.data.user?.id !== user.id) throw new Error('Local fixture identity mismatch');
  for (const table of ['tasks', 'daily_plans', 'commitments', 'week_plans']) {
    const existing = await caller.from(table).select('id').eq('user_id', user.id).limit(1);
    if (existing.error) throw new Error('Could not inspect local review data');
    if (existing.data.length) throw new Error('Use a fresh review account; existing work will not be overwritten');
  }
  const settings = await caller.from('user_settings').select('timezone').eq('user_id', user.id).maybeSingle();
  if (settings.error) throw new Error('Could not read local date context');
  const timezone = settings.data?.timezone ?? 'Asia/Jerusalem';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const add = days => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
  const ids = Array.from({ length: 7 }, () => randomUUID());
  const titles = ['Due unfinished work', 'Recent unfinished work', 'Unselected older work', 'Completed work', 'Deferred future work', 'New important work', 'Approved weekly task'];
  const rows = ids.map((id, index) => ({ id, user_id: user.id, title: `[V2 #32 review] ${titles[index]}`, position: index,
    priority: index === 5 ? 'important' : 'normal', due_date: index === 0 || index === 4 ? today : null,
    planned_date: index === 4 ? add(3) : index === 6 ? add(1) : null }));
  const check = (result, operation) => { if (result.error) throw new Error(`Local fixture ${operation} failed; use a new isolated account to retry`); };
  check(await caller.from('tasks').insert(rows), 'tasks');
  check(await caller.from('daily_plans').insert([
    { user_id: user.id, date: add(-5), planning_status: 'completed', planning_step: 3, planning_completed_at: new Date().toISOString(), selected_task_ids: [ids[0], ids[2], ids[4]] },
    { user_id: user.id, date: add(-2), planning_status: 'completed', planning_step: 3, planning_completed_at: new Date().toISOString(), selected_task_ids: [ids[1], ids[3]] },
    { user_id: user.id, date: add(1), planning_status: 'completed', planning_step: 3, planning_completed_at: new Date().toISOString(), selected_task_ids: [ids[6]], flow_state: { source: 'weekly', proposal: null, summary: null } },
  ]), 'plans');
  check(await caller.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', ids[3]), 'completion');
  check(await caller.from('commitments').insert({ user_id: user.id, title: '[V2 #32 review] Local event', date: today, start_time: '09:17', end_time: '10:43' }), 'event');
  const tasks = await caller.from('tasks').select('id').eq('user_id', user.id);
  const plans = await caller.from('daily_plans').select('id').eq('user_id', user.id);
  if (tasks.data?.length !== 7 || plans.data?.length !== 3) throw new Error('Local fixture readback did not match');
  console.log(`Isolated review rows created for ${today} (${timezone}); reload Today. Historical fixtures: ${add(-5)} and ${add(-2)}; approved weekly day: ${add(1)}.`);
} else {
  throw new Error('Usage: node apps/api/scripts/review-daily-flow.mjs api | web | seed <local-email@example.test>');
}
