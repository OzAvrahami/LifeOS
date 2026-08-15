import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import console from 'node:console';
import { randomBytes } from 'node:crypto';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath, URL } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url));
const apiPort = 3199;
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseLocalStatus() {
  const executable = process.platform === 'win32' ? process.env.ComSpec : 'npx';
  if (!executable) throw new Error('Windows command processor was not available');
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npx.cmd supabase status --output json']
    : ['supabase', 'status', '--output', 'json'];
  const raw = execFileSync(
    executable,
    args,
    { cwd: repositoryRoot, encoding: 'utf8' },
  );
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace < firstBrace) throw new Error('Local Supabase status was not JSON');
  return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
}

function requireLocalUrl(value) {
  const url = new URL(value);
  if (!['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) {
    throw new Error('Refusing integration verification against a non-local Supabase URL');
  }
  return url.origin;
}

function quietClient(url, key, accessToken) {
  return createClient(url, key, {
    ...(accessToken ? { accessToken: async () => accessToken } : {}),
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function waitForApi(processHandle) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (processHandle.exitCode !== null) throw new Error('Local API exited before becoming ready');
    try {
      const response = await globalThis.fetch(`${apiBaseUrl}/health`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await sleep(200);
  }
  throw new Error('Local API did not become ready');
}

async function apiRequest(method, path, token, body, expectedStatus = 200) {
  const response = await globalThis.fetch(`${apiBaseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    method,
  });
  const payload = await response.json();
  assert.equal(response.status, expectedStatus, `${method} ${path} returned ${response.status}`);
  return payload;
}

function assertUuid(value) {
  assert.equal(typeof value, 'string');
  assert.match(value, uuidPattern);
  return value;
}

function discoverLocalDatabaseContainer() {
  const docker = process.platform === 'win32' ? 'docker.exe' : 'docker';
  const output = execFileSync(docker, ['ps', '--format', '{{.Names}}'], { encoding: 'utf8' });
  const containers = output.split(/\r?\n/).filter(Boolean);
  const databaseContainers = containers.filter((name) => name.startsWith('supabase_db_'));
  const databaseContainer = databaseContainers.find((name) => name === 'supabase_db_LifeOS')
    ?? (databaseContainers.length === 1 ? databaseContainers[0] : undefined);
  if (!databaseContainer) throw new Error('Local Supabase database container was not found');
  return { databaseContainer, docker };
}

function localSql(docker, databaseContainer, sql, expectFailure = false) {
  const result = spawnSync(
    docker,
    ['exec', databaseContainer, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-Atc', sql],
    { encoding: 'utf8' },
  );
  if (expectFailure) {
    assert.notEqual(result.status, 0, 'PostgreSQL unexpectedly accepted an invalid state');
    return;
  }
  if (result.status !== 0) throw new Error('Local PostgreSQL verification query failed');
  return result.stdout.trim();
}

async function signIn(url, publishableKey, email, password) {
  const client = quietClient(url, publishableKey);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error('Disposable local user could not sign in normally');
  return data.session;
}

async function main() {
  const status = parseLocalStatus();
  const supabaseUrl = requireLocalUrl(status.API_URL);
  const publishableKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
  const adminKey = status.SECRET_KEY || status.SERVICE_ROLE_KEY;
  if (!publishableKey || !adminKey) throw new Error('Local Supabase credentials were not available');

  const { databaseContainer, docker } = discoverLocalDatabaseContainer();
  const admin = quietClient(supabaseUrl, adminKey);
  const suffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;
  const password = `Local-${randomBytes(18).toString('base64url')}!9`;
  const createdUserIds = [];
  let apiProcess;

  try {
    const users = [];
    for (const label of ['a', 'b']) {
      const email = `lifeos-local-${label}-${suffix}@example.test`;
      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
      });
      if (error || !data.user) throw new Error('Disposable local Auth user setup failed');
      createdUserIds.push(data.user.id);
      users.push({ email, id: data.user.id });
    }

    const sessionA = await signIn(supabaseUrl, publishableKey, users[0].email, password);
    const sessionB = await signIn(supabaseUrl, publishableKey, users[1].email, password);
    assert.equal(sessionA.user.id, users[0].id);
    assert.equal(sessionB.user.id, users[1].id);

    apiProcess = spawn(
      process.execPath,
      ['--import', 'tsx', 'apps/api/src/server.ts'],
      {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PORT: String(apiPort),
          SUPABASE_PUBLISHABLE_KEY: publishableKey,
          SUPABASE_URL: supabaseUrl,
        },
        stdio: ['ignore', 'ignore', 'ignore'],
      },
    );
    await waitForApi(apiProcess);

    const tokenA = sessionA.access_token;
    const tokenB = sessionB.access_token;
    const identityA = await apiRequest('GET', '/auth/me', tokenA);
    const identityB = await apiRequest('GET', '/auth/me', tokenB);
    assert.equal(identityA.id, users[0].id);
    assert.equal(identityB.id, users[1].id);

    const callerA = quietClient(supabaseUrl, publishableKey, tokenA);
    const callerB = quietClient(supabaseUrl, publishableKey, tokenB);

    const defaultSettingsA = (await apiRequest('GET', '/settings', tokenA)).settings;
    const defaultSettingsB = (await apiRequest('GET', '/settings', tokenB)).settings;
    assert.deepEqual(defaultSettingsA, {
      defaultDailyCapacityMinutes: 360,
      persisted: false,
      timezone: null,
      weekStartDay: 0,
    });
    assert.deepEqual(defaultSettingsB, defaultSettingsA);
    assert.equal(localSql(docker, databaseContainer, 'select count(*) from public.user_settings;'), '0');

    const savedSettingsA = (await apiRequest('PUT', '/settings', tokenA, {
      defaultDailyCapacityMinutes: 480,
      timezone: 'Asia/Jerusalem',
      weekStartDay: 1,
    })).settings;
    assert.deepEqual(savedSettingsA, {
      defaultDailyCapacityMinutes: 480,
      persisted: true,
      timezone: 'Asia/Jerusalem',
      weekStartDay: 1,
    });
    assert.deepEqual((await apiRequest('GET', '/settings', tokenA)).settings, savedSettingsA);
    assert.deepEqual((await apiRequest('GET', '/settings', tokenB)).settings, defaultSettingsB);
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.user_settings where user_id = '${users[0].id}'::uuid;`), '1');

    const directSettingsA = await callerA.from('user_settings').select('user_id,default_daily_capacity_minutes,week_start_day,timezone');
    const directSettingsB = await callerB.from('user_settings').select('user_id,default_daily_capacity_minutes,week_start_day,timezone');
    assert.ifError(directSettingsA.error);
    assert.ifError(directSettingsB.error);
    assert.deepEqual(directSettingsA.data.map((row) => row.user_id), [users[0].id]);
    assert.deepEqual(directSettingsB.data, []);
    const crossSettingsUpdate = await callerB
      .from('user_settings')
      .update({ default_daily_capacity_minutes: 60 })
      .eq('user_id', users[0].id)
      .select('user_id');
    assert.ifError(crossSettingsUpdate.error);
    assert.deepEqual(crossSettingsUpdate.data, []);
    const crossSettingsInsert = await callerB.from('user_settings').insert({
      default_daily_capacity_minutes: 60,
      timezone: 'Europe/London',
      user_id: users[0].id,
      week_start_day: 0,
    });
    assert.ok(crossSettingsInsert.error, 'Cross-user Settings insert unexpectedly succeeded');

    await apiRequest('PUT', '/settings', tokenB, {
      defaultDailyCapacityMinutes: 300,
      timezone: 'America/New_York',
      weekStartDay: 6,
    });
    assert.equal(localSql(docker, databaseContainer, 'select count(*) from public.user_settings;'), '2');
    await apiRequest('PUT', '/settings', tokenA, {
      defaultDailyCapacityMinutes: 1441,
      timezone: 'Asia/Jerusalem',
      weekStartDay: 1,
    }, 400);
    await apiRequest('PUT', '/settings', tokenA, {
      defaultDailyCapacityMinutes: 360,
      timezone: 'Asia/Jerusalem',
      weekStartDay: 7,
    }, 400);
    await apiRequest('PUT', '/settings', tokenA, {
      defaultDailyCapacityMinutes: 360,
      timezone: 'Not/A_Real_Zone',
      weekStartDay: 0,
    }, 400);
    const invalidCapacity = await callerB.from('user_settings')
      .update({ default_daily_capacity_minutes: -1 })
      .eq('user_id', users[1].id);
    const invalidWeekday = await callerB.from('user_settings')
      .update({ week_start_day: 7 })
      .eq('user_id', users[1].id);
    assert.ok(invalidCapacity.error, 'PostgreSQL unexpectedly accepted invalid Settings capacity');
    assert.ok(invalidWeekday.error, 'PostgreSQL unexpectedly accepted invalid Settings weekday');
    assert.deepEqual((await apiRequest('GET', '/settings', tokenA)).settings, savedSettingsA);

    const createdA = (await apiRequest('POST', '/tasks', tokenA, {
      title: 'User A integration task',
    }, 201)).task;
    const originalTaskId = assertUuid(createdA.id);
    assert.equal(createdA.status, 'open');
    assert.equal(createdA.plannedDate, null);
    assert.equal(createdA.weekPlanId, null);
    assert.equal((await apiRequest('GET', '/tasks?placement=inbox', tokenA)).tasks.some((task) => task.id === originalTaskId), true);
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.tasks where id = '${originalTaskId}'::uuid;`), '1');

    assert.equal((await apiRequest('GET', '/tasks', tokenB)).tasks.some((task) => task.id === originalTaskId), false);
    await apiRequest('PATCH', `/tasks/${originalTaskId}`, tokenB, { title: 'blocked' }, 404);
    await apiRequest('DELETE', `/tasks/${originalTaskId}`, tokenB, undefined, 404);

    const createdB = (await apiRequest('POST', '/tasks', tokenB, {
      title: 'User B integration task',
    }, 201)).task;
    const userBTaskId = assertUuid(createdB.id);
    assert.equal((await apiRequest('GET', '/tasks', tokenA)).tasks.some((task) => task.id === userBTaskId), false);

    const directAInitial = await callerA.from('tasks').select('id,user_id');
    const directBInitial = await callerB.from('tasks').select('id,user_id');
    assert.ifError(directAInitial.error);
    assert.ifError(directBInitial.error);
    assert.deepEqual(new Set(directAInitial.data.map((row) => row.user_id)), new Set([users[0].id]));
    assert.deepEqual(new Set(directBInitial.data.map((row) => row.user_id)), new Set([users[1].id]));
    assert.equal(directAInitial.data.some((row) => row.id === userBTaskId), false);
    assert.equal(directBInitial.data.some((row) => row.id === originalTaskId), false);

    const directCrossUpdate = await callerB
      .from('tasks')
      .update({ title: 'blocked direct update' })
      .eq('id', originalTaskId)
      .select('id');
    const directCrossDelete = await callerB
      .from('tasks')
      .delete()
      .eq('id', originalTaskId)
      .select('id');
    assert.ifError(directCrossUpdate.error);
    assert.ifError(directCrossDelete.error);
    assert.deepEqual(directCrossUpdate.data, []);
    assert.deepEqual(directCrossDelete.data, []);
    const userATaskAfterDirectCrossWrites = await callerA
      .from('tasks')
      .select('id,title')
      .eq('id', originalTaskId)
      .single();
    assert.ifError(userATaskAfterDirectCrossWrites.error);
    assert.equal(userATaskAfterDirectCrossWrites.data.title, 'User A integration task');

    const weekStart = '2026-08-09';
    const weekly = (await apiRequest('PATCH', `/tasks/${originalTaskId}`, tokenA, {
      planning: { type: 'week', weekStart },
    })).task;
    assert.equal(weekly.id, originalTaskId);
    assert.equal(weekly.plannedDate, null);
    const weekPlanId = assertUuid(weekly.weekPlanId);
    const userAWeek = await callerA.from('week_plans').select('id,user_id,week_start').eq('id', weekPlanId).single();
    const userBWeek = await callerB.from('week_plans').select('id').eq('id', weekPlanId);
    assert.ifError(userAWeek.error);
    assert.equal(userAWeek.data.user_id, users[0].id);
    assert.equal(userAWeek.data.week_start, weekStart);
    assert.ifError(userBWeek.error);
    assert.equal(userBWeek.data.length, 0);
    assert.equal((await apiRequest('GET', `/tasks?weekStart=${weekStart}`, tokenA)).tasks.some((task) => task.id === originalTaskId), true);
    assert.equal((await apiRequest('GET', '/tasks?placement=inbox', tokenA)).tasks.some((task) => task.id === originalTaskId), false);
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.tasks where id = '${originalTaskId}'::uuid;`), '1');

    const crossWeek = await callerB
      .from('tasks')
      .update({ week_plan_id: weekPlanId })
      .eq('id', userBTaskId)
      .select('id,week_plan_id')
      .single();
    assert.ok(crossWeek.error, 'Cross-user WeekPlan association unexpectedly succeeded');
    const userBTaskAfterCrossWeek = await callerB.from('tasks').select('id,week_plan_id').eq('id', userBTaskId).single();
    assert.ifError(userBTaskAfterCrossWeek.error);
    assert.equal(userBTaskAfterCrossWeek.data.week_plan_id, null);

    const plannedDate = '2026-08-13';
    const today = (await apiRequest('PATCH', `/tasks/${originalTaskId}`, tokenA, {
      planning: { type: 'day', plannedDate },
    })).task;
    assert.equal(today.id, originalTaskId);
    assert.equal(today.plannedDate, plannedDate);
    assert.equal(today.weekPlanId, null);
    assert.equal((await apiRequest('GET', `/tasks?weekStart=${weekStart}`, tokenA)).tasks.length, 0);
    assert.equal((await apiRequest('GET', `/tasks?plannedDate=${plannedDate}`, tokenA)).tasks.some((task) => task.id === originalTaskId), true);
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.tasks where id = '${originalTaskId}'::uuid;`), '1');

    const dailyPlan = (await apiRequest('PUT', `/daily-plans/${plannedDate}`, tokenA, {
      availableMinutes: 420,
      focusTaskId: originalTaskId,
    })).dailyPlan;
    const dailyPlanId = assertUuid(dailyPlan.id);
    assert.equal(dailyPlan.focusTaskId, originalTaskId);
    assert.equal(dailyPlan.availableMinutes, 420);
    assert.equal((await apiRequest('GET', `/daily-plans/${plannedDate}`, tokenA)).dailyPlan.id, dailyPlanId);
    assert.equal((await apiRequest('GET', `/daily-plans/${plannedDate}`, tokenB)).dailyPlan, null);
    await apiRequest('PUT', `/daily-plans/${plannedDate}`, tokenB, {
      availableMinutes: null,
      focusTaskId: originalTaskId,
    }, 400);

    const directDailyA = await callerA.from('daily_plans').select('id,user_id,focus_task_id');
    const directDailyB = await callerB.from('daily_plans').select('id,user_id,focus_task_id');
    assert.ifError(directDailyA.error);
    assert.ifError(directDailyB.error);
    assert.deepEqual(directDailyA.data.map((row) => row.id), [dailyPlanId]);
    assert.deepEqual(directDailyB.data, []);
    const crossDailyInsert = await callerB.from('daily_plans').insert({
      date: plannedDate,
      focus_task_id: originalTaskId,
      user_id: users[1].id,
    });
    assert.ok(crossDailyInsert.error, 'Cross-user Daily Focus association unexpectedly succeeded');

    const updatedDailyPlan = (await apiRequest('PUT', `/daily-plans/${plannedDate}`, tokenA, {
      availableMinutes: 480,
      focusTaskId: originalTaskId,
    })).dailyPlan;
    assert.equal(updatedDailyPlan.id, dailyPlanId);
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.daily_plans where user_id = '${users[0].id}'::uuid and date = '${plannedDate}'::date;`), '1');
    const capacityOnly = (await apiRequest('PUT', `/daily-plans/${plannedDate}`, tokenA, {
      availableMinutes: 480,
      focusTaskId: null,
    })).dailyPlan;
    assert.equal(capacityOnly.id, dailyPlanId);
    assert.equal(capacityOnly.focusTaskId, null);
    assert.equal((await apiRequest('PUT', `/daily-plans/${plannedDate}`, tokenA, {
      availableMinutes: null,
      focusTaskId: null,
    })).dailyPlan, null);
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.daily_plans where id = '${dailyPlanId}'::uuid;`), '0');

    const focusTitles = ['User A focus one', 'User A focus two', 'User A focus three'];
    const savedFocuses = (await apiRequest('PUT', `/week-plans/${weekStart}/focuses`, tokenA, {
      titles: focusTitles,
    })).focuses;
    assert.deepEqual(savedFocuses.map((focus) => focus.position), [0, 1, 2]);
    assert.deepEqual(savedFocuses.map((focus) => focus.title), focusTitles);
    assert.deepEqual(
      (await apiRequest('GET', `/week-plans/${weekStart}/focuses`, tokenA)).focuses.map((focus) => focus.title),
      focusTitles,
    );
    assert.deepEqual((await apiRequest('GET', `/week-plans/${weekStart}/focuses`, tokenB)).focuses, []);
    await apiRequest('PUT', `/week-plans/${weekStart}/focuses`, tokenA, {
      titles: [...focusTitles, 'Too many'],
    }, 400);

    const directFocusA = await callerA.from('weekly_focuses').select('id,week_plan_id,title,position').order('position');
    const directFocusB = await callerB.from('weekly_focuses').select('id,week_plan_id,title,position').order('position');
    assert.ifError(directFocusA.error);
    assert.ifError(directFocusB.error);
    assert.deepEqual(directFocusA.data.map((focus) => focus.title), focusTitles);
    assert.deepEqual(directFocusB.data, []);
    const fourthFocus = await callerA.from('weekly_focuses').insert({
      position: 3,
      title: 'Blocked fourth focus',
      week_plan_id: weekPlanId,
    });
    assert.ok(fourthFocus.error, 'PostgreSQL unexpectedly accepted a fourth WeeklyFocus');
    const crossFocusInsert = await callerB.from('weekly_focuses').insert({
      position: 0,
      title: 'Blocked focus',
      week_plan_id: weekPlanId,
    });
    assert.ok(crossFocusInsert.error, 'Cross-user WeeklyFocus association unexpectedly succeeded');
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.weekly_focuses where week_plan_id = '${weekPlanId}'::uuid;`), '3');
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.tasks where id = '${originalTaskId}'::uuid;`), '1');

    const commitmentDate = '2026-08-17';
    const commitmentA = (await apiRequest('POST', '/commitments', tokenA, {
      date: commitmentDate,
      endTime: '10:30',
      lifeArea: 'health',
      startTime: '09:30',
      title: 'User A doctor appointment',
    }, 201)).commitment;
    const commitmentAId = assertUuid(commitmentA.id);
    const commitmentALater = (await apiRequest('POST', '/commitments', tokenA, {
      date: commitmentDate,
      startTime: '14:00',
      title: 'User A later commitment',
    }, 201)).commitment;
    const commitmentANextDay = (await apiRequest('POST', '/commitments', tokenA, {
      date: '2026-08-18',
      startTime: '08:00',
      title: 'User A next-day commitment',
    }, 201)).commitment;
    const commitmentB = (await apiRequest('POST', '/commitments', tokenB, {
      date: commitmentDate,
      startTime: '08:30',
      title: 'User B private commitment',
    }, 201)).commitment;
    const commitmentBId = assertUuid(commitmentB.id);

    assert.deepEqual(
      (await apiRequest('GET', `/commitments?date=${commitmentDate}`, tokenA)).commitments.map((item) => item.id),
      [commitmentAId, commitmentALater.id],
    );
    assert.deepEqual(
      (await apiRequest('GET', '/commitments?dateFrom=2026-08-17&dateTo=2026-08-18', tokenA)).commitments.map((item) => item.id),
      [commitmentAId, commitmentALater.id, commitmentANextDay.id],
    );
    assert.equal((await apiRequest('GET', '/commitments', tokenB)).commitments.some((item) => item.id === commitmentAId), false);
    await apiRequest('PATCH', `/commitments/${commitmentAId}`, tokenB, { title: 'blocked' }, 404);
    await apiRequest('DELETE', `/commitments/${commitmentAId}`, tokenB, undefined, 404);
    await apiRequest('POST', '/commitments', tokenA, {
      date: commitmentDate,
      endTime: '09:00',
      startTime: '09:30',
      title: 'Invalid time',
    }, 400);

    const directCommitmentsA = await callerA.from('commitments').select('id,user_id').order('start_time');
    const directCommitmentsB = await callerB.from('commitments').select('id,user_id').order('start_time');
    assert.ifError(directCommitmentsA.error);
    assert.ifError(directCommitmentsB.error);
    assert.deepEqual(new Set(directCommitmentsA.data.map((row) => row.user_id)), new Set([users[0].id]));
    assert.deepEqual(new Set(directCommitmentsB.data.map((row) => row.user_id)), new Set([users[1].id]));
    assert.equal(directCommitmentsA.data.some((row) => row.id === commitmentBId), false);
    assert.equal(directCommitmentsB.data.some((row) => row.id === commitmentAId), false);

    const crossCommitmentUpdate = await callerB
      .from('commitments')
      .update({ title: 'blocked direct update' })
      .eq('id', commitmentAId)
      .select('id');
    const crossCommitmentDelete = await callerB
      .from('commitments')
      .delete()
      .eq('id', commitmentAId)
      .select('id');
    assert.ifError(crossCommitmentUpdate.error);
    assert.ifError(crossCommitmentDelete.error);
    assert.deepEqual(crossCommitmentUpdate.data, []);
    assert.deepEqual(crossCommitmentDelete.data, []);
    const invalidDirectCommitment = await callerA.from('commitments').insert({
      date: commitmentDate,
      end_time: '09:00',
      start_time: '09:30',
      title: 'Invalid direct range',
      user_id: users[0].id,
    });
    assert.ok(invalidDirectCommitment.error, 'PostgreSQL unexpectedly accepted an invalid Commitment range');

    const updatedCommitment = (await apiRequest('PATCH', `/commitments/${commitmentAId}`, tokenA, {
      endTime: '11:15',
      startTime: '10:15',
      title: 'User A updated appointment',
    })).commitment;
    assert.equal(updatedCommitment.id, commitmentAId);
    assert.equal(updatedCommitment.startTime, '10:15');
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.commitments where id = '${commitmentAId}'::uuid;`), '1');
    const deletedCommitment = (await apiRequest('DELETE', `/commitments/${commitmentALater.id}`, tokenA)).commitment;
    assert.equal(deletedCommitment.id, commitmentALater.id);
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.commitments where id = '${commitmentALater.id}'::uuid;`), '0');

    const started = (await apiRequest('PATCH', `/tasks/${originalTaskId}`, tokenA, { status: 'in_progress' })).task;
    const stopped = (await apiRequest('PATCH', `/tasks/${originalTaskId}`, tokenA, { status: 'open' })).task;
    const restarted = (await apiRequest('PATCH', `/tasks/${originalTaskId}`, tokenA, { status: 'in_progress' })).task;
    const completed = (await apiRequest('PATCH', `/tasks/${originalTaskId}`, tokenA, { status: 'completed' })).task;
    for (const task of [started, stopped, restarted, completed]) assert.equal(task.id, originalTaskId);
    assert.equal(started.status, 'in_progress');
    assert.equal(stopped.status, 'open');
    assert.equal(stopped.plannedDate, plannedDate);
    assert.equal(restarted.status, 'in_progress');
    assert.equal(completed.status, 'completed');
    assert.ok(completed.completedAt);

    const taskA1 = (await apiRequest('POST', '/tasks', tokenA, { title: 'A1' }, 201)).task;
    const taskA2 = (await apiRequest('POST', '/tasks', tokenA, { title: 'A2' }, 201)).task;
    const taskA1Id = assertUuid(taskA1.id);
    const taskA2Id = assertUuid(taskA2.id);
    await apiRequest('PATCH', `/tasks/${taskA1Id}`, tokenA, { status: 'in_progress' });
    await apiRequest('PATCH', `/tasks/${taskA2Id}`, tokenA, { status: 'in_progress' });
    const activeTasks = (await apiRequest('GET', '/tasks?status=in_progress', tokenA)).tasks;
    assert.deepEqual(activeTasks.map((task) => task.id), [taskA2Id]);
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.tasks where user_id = '${users[0].id}'::uuid and status = 'in_progress';`), '1');
    assert.equal(localSql(docker, databaseContainer, `select status from public.tasks where id = '${taskA1Id}'::uuid;`), 'open');

    localSql(
      docker,
      databaseContainer,
      `update public.tasks set status = 'in_progress' where id = '${taskA1Id}'::uuid;`,
      true,
    );
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.tasks where user_id = '${users[0].id}'::uuid and status = 'in_progress';`), '1');

    const cancelled = (await apiRequest('DELETE', `/tasks/${taskA1Id}`, tokenA)).task;
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.completedAt, null);
    assert.equal((await apiRequest('GET', '/tasks', tokenA)).tasks.some((task) => task.id === taskA1Id), false);
    const cancelledDirect = await callerA.from('tasks').select('id,status,completed_at').eq('id', taskA1Id).single();
    assert.ifError(cancelledDirect.error);
    assert.equal(cancelledDirect.data.status, 'cancelled');
    assert.equal(cancelledDirect.data.completed_at, null);
    assert.equal(localSql(docker, databaseContainer, `select count(*) from public.tasks where id = '${taskA1Id}'::uuid;`), '1');

    const finalDirectA = await callerA.from('tasks').select('user_id');
    const finalDirectB = await callerB.from('tasks').select('user_id');
    assert.ifError(finalDirectA.error);
    assert.ifError(finalDirectB.error);
    assert.deepEqual(new Set(finalDirectA.data.map((row) => row.user_id)), new Set([users[0].id]));
    assert.deepEqual(new Set(finalDirectB.data.map((row) => row.user_id)), new Set([users[1].id]));

    console.log('PASS local stack and real Auth sessions');
    console.log('PASS caller-scoped Task and WeekPlan RLS isolation');
    console.log('PASS stable Task planning and execution transitions');
    console.log('PASS atomic active-task handoff and database unique index');
    console.log('PASS retained cancellation and PostgreSQL persistence');
    console.log('PASS DailyPlan ownership, focus ownership, upsert, capacity, and clearing');
    console.log('PASS ordered WeeklyFocus replacement, maximum, and WeekPlan-derived RLS');
    console.log('PASS one-time Commitment CRUD, ordering, physical delete, constraints, and caller RLS');
    console.log('PASS UserSettings defaults, persistence, validation, one-row ownership, and caller RLS');
  } finally {
    if (apiProcess && apiProcess.exitCode === null) {
      apiProcess.kill();
      await Promise.race([
        new Promise((resolve) => apiProcess.once('exit', resolve)),
        sleep(5_000),
      ]);
    }
    for (const userId of createdUserIds.reverse()) {
      await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    }
  }
}

await main();
