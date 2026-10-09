import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import console from 'node:console';

export async function verifyWeekAllocation({ apiRequest, tokenA, tokenB, callerA, callerB, anonymous, freshTokenA }) {
  const today = (await apiRequest('GET', '/daily-plans/2031-01-01/flow', tokenA)).today;
  const add = n => { const date = new Date(today + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + n); return date.toISOString().slice(0, 10); };
  const start = add(14); const next = add(15); const empty = add(16);
  const get = date => apiRequest('GET', '/daily-plans/' + date + '/flow', tokenA);
  const create = async (title, extra = {}, token = tokenA, headers = {}) =>
    (await apiRequest('POST', '/tasks', token, { title, ...extra }, 201, headers)).task;
  const description = 'עברית & English\n  second line!\n';
  const captureId = randomUUID();
  const a = await create('Week A', { description, priority: 'important', dueDate: add(30), reminderAt: add(20) + 'T08:00:00Z' }, tokenA, { 'Idempotency-Key': captureId });
  const retry = await create('Week A', { description, priority: 'important', dueDate: add(30), reminderAt: add(20) + 'T08:00:00Z' }, tokenA, { 'Idempotency-Key': captureId });
  assert.equal(retry.id, a.id);
  const b = await create('Week B'); const foreign = await create('Foreign', {}, tokenB);
  const owner = (await callerA.from('tasks').select('user_id').eq('id', a.id).single()).data.user_id;
  const past = add(-40);
  const history = await callerA.from('daily_plans').insert({ user_id: owner, date: past, planning_status: 'completed',
    planning_step: 3, planning_completed_at: new Date().toISOString(), selected_task_ids: [a.id] }).select('*').single();
  assert.ifError(history.error);
  const build = async selections => ({ operationId: randomUUID(), days: await Promise.all(Object.entries(selections).map(async ([date, ids]) => {
    const flow = await get(date); return { date, ids, revision: flow.plan?.revision ?? 0, snapshot: flow.snapshot };
  })) });
  const put = (command, status = 200, token = tokenA) => apiRequest('PUT', '/week-plans/' + start + '/allocation', token, command, status);
  const original = await build({ [start]: [b.id, a.id], [next]: [], [empty]: [] });
  const [saved, duplicate] = await Promise.all([put(original), put(original)]);
  for (const result of [saved, duplicate]) {
    assert.deepEqual(result.days.find(day => day.date === start).ids, [b.id, a.id]);
    assert.equal(result.days.find(day => day.date === empty).approved, true);
    assert.deepEqual(result.days.find(day => day.date === empty).ids, []);
  }
  const moved = await build({ [start]: [b.id], [next]: [a.id], [empty]: [] });
  await put(moved);
  assert.deepEqual((await get(start)).plan.ids, [b.id]); assert.deepEqual((await get(next)).plan.ids, [a.id]);
  assert.equal((await get(next)).plan.source, 'weekly');
  assert.deepEqual((await put(original)).days.find(day => day.date === start).ids, [b.id]); // late retry never restores old membership
  assert.deepEqual((await apiRequest('GET', '/tasks?id=' + a.id, tokenA)).tasks[0], a);
  const memberships = await apiRequest('GET', '/task-plan-memberships/' + today, tokenA);
  assert.ok(memberships.days.some(day => day.date === next && day.ids.includes(a.id)));
  assert.ok(!memberships.days.some(day => day.date === start && day.ids.includes(a.id)));
  // The stored Task has no date even though it belongs to an approved plan.
  // Explicitly choosing no day must remove membership despite unchanged columns.
  await apiRequest('PATCH', '/tasks/' + a.id, tokenA, { planning: { type: 'inbox' } });
  assert.deepEqual((await get(next)).plan.ids, []);
  await apiRequest('PATCH', '/tasks/' + a.id, tokenA, { planning: { type: 'day', plannedDate: start } });
  assert.deepEqual((await get(start)).plan.ids, [b.id, a.id]);
  await put(await build({ [start]: [b.id], [next]: [a.id] }));
  // Re-selecting the stored date is an intentional move back from the Week plan.
  await apiRequest('PATCH', '/tasks/' + a.id, tokenA, { planning: { type: 'day', plannedDate: start } });
  assert.deepEqual((await get(next)).plan.ids, []);
  assert.deepEqual((await get(start)).plan.ids, [b.id, a.id]);
  await put(await build({ [start]: [b.id], [next]: [a.id] }));
  const stale = await build({ [start]: [], [next]: [] });
  await apiRequest('PATCH', '/tasks/' + a.id, tokenA, { title: 'Renamed from task list' });
  await put(stale, 409);
  assert.deepEqual((await get(start)).plan.ids, [b.id]); assert.deepEqual((await get(next)).plan.ids, [a.id]);
  const invalid = await build({ [start]: [], [next]: [foreign.id] });
  await put(invalid, 400); assert.deepEqual((await get(start)).plan.ids, [b.id]);
  const concurrent = await build({ [start]: [b.id], [next]: [a.id] });
  const results = await Promise.all([concurrent, { ...concurrent, operationId: randomUUID() }].map(async command => {
    try { await put(command); return 200; } catch (error) { assert.match(String(error), /409/); return 409; }
  }));
  assert.deepEqual(results.sort(), [200, 409]);
  await put({ ...concurrent, days: concurrent.days.map(day => ({ ...day, ids: [] })) }, 409);
  await put(await build({ [past]: [] }), 400); // outside week, history unchanged
  const pastFlow = await get(past);
  await apiRequest('PUT', '/week-plans/' + past + '/allocation', tokenA,
    { operationId: randomUUID(), days: [{ date: past, revision: pastFlow.plan.revision, snapshot: pastFlow.snapshot, ids: [] }] }, 409);
  assert.deepEqual((await callerA.from('daily_plans').select('*').eq('id', history.data.id).single()).data, history.data);
  await apiRequest('PATCH', '/tasks/' + a.id, tokenA, { status: 'completed' });
  const reloaded = await apiRequest('GET', '/week-plans/' + start + '/days', await freshTokenA());
  assert.equal(reloaded.tasks.find(task => task.id === a.id).status, 'completed');
  assert.deepEqual(reloaded.days.find(day => day.date === next).ids, [a.id]);
  await put(await build({ [next]: [a.id] })); // retaining completed membership is valid
  await put(await build({ [empty]: [a.id] }), 400); // not silently adding completed work elsewhere
  const afterTitle = (await apiRequest('GET', '/tasks?id=' + a.id, tokenA)).tasks[0];
  assert.equal(afterTitle.description, description); assert.equal(afterTitle.priority, a.priority);
  assert.equal(afterTitle.dueDate, a.dueDate); assert.equal(afterTitle.reminderAt, a.reminderAt);
  await apiRequest('PATCH', '/tasks/' + a.id, tokenA, { description: ' \n\t ' });
  assert.equal((await apiRequest('GET', '/tasks?id=' + a.id, tokenA)).tasks[0].description, null);
  const tooLong = await apiRequest('POST', '/tasks', tokenA, { title: 'x', description: 'x'.repeat(10001) }, 400);
  assert.ok(tooLong.error);
  const mine = await callerA.from('week_allocation_operations').select('*'); assert.ifError(mine.error); assert.ok(mine.data.length);
  assert.ok((await callerA.from('week_allocation_operations').delete().eq('operation_id', original.operationId)).error, 'Retry ledger is append-only');
  assert.ok((await callerA.from('week_allocation_operations').update({ command: {} }).eq('operation_id', original.operationId)).error);
  assert.equal((await callerB.from('week_allocation_operations').select('*').eq('user_id', owner)).data.length, 0);
  assert.ok((await anonymous.from('week_allocation_operations').select('*')).error);
  assert.ok((await anonymous.rpc('save_week_allocation', { p_week_start: start, p_command: original })).error);
  const wrongOwner = await callerB.rpc('save_week_allocation', { p_week_start: start, p_command: await build({ [start]: [a.id] }) });
  assert.ok(wrongOwner.error);
  const bulkDate = add(60);
  const bulk = await callerA.from('tasks').insert(Array.from({ length: 1001 }, (_, position) => ({
    user_id: owner, title: 'Pagination ' + position, position, planned_date: bulkDate,
  })));
  assert.ifError(bulk.error);
  const all = (await apiRequest('GET', '/tasks?plannedDate=' + bulkDate, tokenA)).tasks;
  assert.equal(all.length, 1001); assert.equal(new Set(all.map(task => task.id)).size, 1001);
  assert.deepEqual(all.map(task => task.position), Array.from({ length: 1001 }, (_, i) => i));
  assert.equal((await apiRequest('GET', '/tasks?plannedDate=' + bulkDate, tokenB)).tasks.length, 0);
  console.log('PASS V2 Week atomic allocation/order/empty days, retries/stale/concurrent edits, history, task descriptions and caller/anonymous RLS');
}
