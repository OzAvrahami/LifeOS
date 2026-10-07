import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Only invoked by the guarded localhost harness with disposable Auth users.
export async function verifyDailyPlanning({ apiRequest, tokenA, tokenB, callerA, callerB, anonymous, freshTokenA }) {
  const date = '2029-10-07';
  const path = `/daily-plans/${date}`;
  const get = async (token = tokenA) => (await apiRequest('GET', `${path}/planning`, token)).plan;
  const put = async (input, status = 200, token = tokenA) => (await apiRequest('PUT', `${path}/planning`, token, input, status)).plan;
  const command = (action, revision, extra = {}) => ({ action, revision, operationId: randomUUID(), ...extra });
  assert.equal(await get(), null);
  const creationId = randomUUID();
  const captureInput = { title: 'Retry-safe capture', planning: { type: 'inbox' } };
  const captureHeaders = { 'Idempotency-Key': creationId };
  const captures = await Promise.all([0, 1, 2].map(() => apiRequest('POST', '/tasks', tokenA, captureInput, 201, captureHeaders)));
  captures.forEach(c => assert.equal(c.task.id, creationId));
  assert.equal((await callerA.from('tasks').select('id').eq('id', creationId)).data.length, 1);
  await apiRequest('POST', '/tasks', tokenA, { ...captureInput, title: 'Changed retry' }, 409, captureHeaders);
  await apiRequest('POST', '/tasks', tokenB, captureInput, 409, captureHeaders);
  const dated = (await apiRequest('POST', '/tasks', tokenA, { title: 'Dated but not selected', planning: { type: 'day', plannedDate: date } }, 201)).task;
  const inbox = (await apiRequest('POST', '/tasks', tokenA, { title: 'Intentional unscheduled work', priority: 'important', dueDate: '2029-10-09', reminderAt: '2029-10-08T08:00:00.000Z', estimatedMinutes: 25 }, 201)).task;
  const foreign = (await apiRequest('POST', '/tasks', tokenB, { title: 'Private B' }, 201)).task;
  const legacy = (await apiRequest('PUT', path, tokenA, { focusTaskId: dated.id, availableMinutes: 120 })).dailyPlan;
  assert.equal((await get()).status, 'not_started');
  const start = command('start', 0);
  const started = await put(start);
  assert.equal(started.id, legacy.id); assert.equal(started.resumeStep, 1);
  assert.deepEqual(started.selectedTaskIds, []);
  const duplicates = await Promise.all([put(start), put(start), put(start)]);
  duplicates.forEach(result => assert.deepEqual(result, started));
  const earlyComplete = await callerA.rpc('save_daily_planning', { p_date: date, p_action: 'complete', p_revision: started.revision, p_operation_id: randomUUID() });
  assert.equal(earlyComplete.error?.code, '55000');
  await put(command('complete', started.revision), 409);
  await put(command('save', started.revision, { step: 3, selectedTaskIds: [] }), 409);
  await put(command('save', started.revision, { step: 2, selectedTaskIds: [foreign.id] }), 400);
  await put(command('save', started.revision, { step: 2, selectedTaskIds: [inbox.id, inbox.id] }), 400);
  assert.deepEqual(await get(), started);
  const selection = command('save', started.revision, { step: 2, selectedTaskIds: [inbox.id, dated.id] });
  let plan = await put(selection);
  assert.deepEqual(await put(selection), plan); // lost response / duplicate submission
  assert.deepEqual(await get(await freshTokenA()), plan); // independent auth session and fresh DB read
  const preserved = (await apiRequest('GET', `/tasks?id=${inbox.id}`, tokenA)).tasks[0];
  assert.deepEqual(preserved, inbox); // scheduling, importance, deadline, reminder and duration untouched
  await put({ ...selection, selectedTaskIds: [dated.id] }, 409); // UUID cannot be reused for a changed command
  await put(command('save', started.revision, { step: 2, selectedTaskIds: [] }), 409);
  assert.deepEqual(await get(), plan);
  const concurrent = await Promise.all([0, 1].map(async index => {
    const response = await fetchResult(command('save', plan.revision, { step: 3, selectedTaskIds: index ? [dated.id, inbox.id] : [inbox.id] }));
    return response;
  }));
  assert.equal(concurrent.filter(r => r === 200).length, 1);
  assert.equal(concurrent.filter(r => r === 409).length, 1);
  async function fetchResult(input) {
    // apiRequest asserts status, so inspect the failure only to retry the expected conflict assertion.
    try { await put(input); return 200; }
    catch (error) { assert.match(String(error), /409/); await put(input, 409); return 409; }
  }
  plan = await get();
  plan = await put(command('save', plan.revision, { step: 3, selectedTaskIds: [inbox.id, dated.id] }));
  const complete = command('complete', plan.revision);
  plan = await put(complete);
  assert.equal(plan.status, 'completed'); assert.ok(plan.completedAt);
  assert.deepEqual(await put(complete), plan);
  assert.deepEqual(await get(), plan); // review never starts a write
  const noRestart = await put(command('start', plan.revision));
  assert.equal(noRestart.status, 'completed'); assert.equal(noRestart.id, plan.id);
  plan = noRestart;
  // Installed API's exact legacy operations, including direct DELETE, must preserve the new state.
  await apiRequest('PUT', path, tokenA, { focusTaskId: null, availableMinutes: null });
  assert.deepEqual(await get(), plan);
  const legacyWrite = await apiRequest('PUT', path, tokenA, { focusTaskId: dated.id, availableMinutes: 90 });
  assert.equal(legacyWrite.dailyPlan.id, plan.id);
  assert.deepEqual(await get(), plan);
  const oldDelete = await callerA.from('daily_plans').delete().eq('id', plan.id);
  assert.ifError(oldDelete.error); assert.deepEqual(await get(), plan);
  const cleared = (await apiRequest('GET', path, tokenA)).dailyPlan;
  assert.equal(cleared.focusTaskId, null); assert.equal(cleared.availableMinutes, null);
  await apiRequest('PATCH', `/tasks/${inbox.id}`, tokenA, { status: 'completed' });
  await apiRequest('PATCH', `/tasks/${dated.id}`, tokenA, { planning: { type: 'inbox' } });
  const edited = await put(command('edit', plan.revision));
  assert.equal(edited.id, plan.id); assert.equal(edited.resumeStep, 2);
  assert.equal(edited.completedAt, plan.completedAt); assert.deepEqual(edited.selectedTaskIds, plan.selectedTaskIds);
  plan = await put(command('save', edited.revision, { step: 3, selectedTaskIds: edited.selectedTaskIds }));
  await apiRequest('DELETE', `/tasks/${dated.id}`, tokenA);
  const candidates = (await apiRequest('GET', `${path}/tasks`, tokenA)).tasks;
  assert.equal(candidates.find(t => t.id === inbox.id).status, 'completed');
  assert.equal(candidates.find(t => t.id === dated.id).status, 'cancelled');
  assert.equal(candidates.some(t => t.id === foreign.id), false);
  plan = await put(command('save', plan.revision, { step: 3, selectedTaskIds: [] }));
  plan = await put(command('complete', plan.revision));
  assert.equal(plan.status, 'completed'); assert.deepEqual(plan.selectedTaskIds, []);
  assert.equal(await get(tokenB), null);
  const ownB = await put(command('start', 0), 200, tokenB);
  assert.notEqual(ownB.id, plan.id);
  for (const tableAction of ['update', 'delete']) {
    const result = tableAction === 'update'
      ? await callerB.from('daily_plans').update({ planning_step: 1 }).eq('id', plan.id).select('id')
      : await callerB.from('daily_plans').delete().eq('id', plan.id).select('id');
    assert.ifError(result.error); assert.deepEqual(result.data, []);
  }
  for (const invalid of [{ selected_task_ids: [foreign.id] }, { selected_task_ids: [randomUUID()] },
    { selected_task_ids: [null] }, { selected_task_ids: [inbox.id, inbox.id] },
    { planning_status: 'completed', planning_completed_at: null }, { planning_step: 0 },
    { date: '2029-10-08' }, { user_id: foreign.id }]) {
    const result = await callerA.from('daily_plans').update(invalid).eq('id', plan.id);
    assert.ok(result.error, `Invalid direct update accepted: ${Object.keys(invalid)}`);
  }
  assert.deepEqual(await get(), plan);
  const anon = await anonymous.rpc('save_daily_planning', { p_date: date, p_action: 'start', p_revision: 0, p_operation_id: randomUUID() });
  assert.ok(anon.error);
  assert.ok((await anonymous.from('daily_plans').select('*')).error);
  assert.equal((await apiRequest('GET', '/daily-plans/2029-10-08/planning', tokenA)).plan, null);
  // A legacy-only clear still removes its row, and previous selection never auto-populates another date.
  const legacyPath = '/daily-plans/2029-10-06';
  await apiRequest('PUT', legacyPath, tokenA, { availableMinutes: 60, focusTaskId: null });
  await apiRequest('PUT', legacyPath, tokenA, { availableMinutes: null, focusTaskId: null });
  assert.equal((await apiRequest('GET', `${legacyPath}/planning`, tokenA)).plan, null);
}
