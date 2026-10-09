import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Called only by the established localhost-only harness. All rows belong to its
// disposable accounts, including historical fixtures; never writes a hosted DB.
export async function verifyDailyFlow({ apiRequest, tokenA, tokenB, callerA, callerB, anonymous, freshTokenA }) {
  const today = (await apiRequest('GET', '/daily-plans/2031-01-01/flow', tokenA)).today;
  const add = (date, days) => { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };
  const get = (date = today, token = tokenA) => apiRequest('GET', `/daily-plans/${date}/flow`, token);
  const put = (input, status = 200, date = today, token = tokenA) => apiRequest('PUT', `/daily-plans/${date}/flow`, token, input, status);
  const command = (state, action, extra = {}) => ({ action, revision: state.plan?.revision ?? 0, snapshot: state.snapshot, operationId: randomUUID(), ...extra });
  const create = async (title, extra = {}, token = tokenA) => (await apiRequest('POST', '/tasks', token, { title, ...extra }, 201)).task;
  const a = await create('Unfinished older work', { priority: 'important', dueDate: today, estimatedMinutes: 75, reminderAt: `${add(today, 1)}T08:00:00.000Z` });
  const b = await create('Unfinished recent work');
  const c = await create('Unselected work remains open');
  const done = await create('Completed work');
  const deferred = await create('Explicit future deferral', { planning: { type: 'day', plannedDate: add(today, 3) }, dueDate: today });
  const foreign = await create('Other account', {}, tokenB);
  const event = (await apiRequest('POST', '/commitments', tokenA, { title: 'Actual local event', date: today, startTime: '09:17', endTime: '10:43' }, 201)).commitment;
  const past = add(today, -5); const recent = add(today, -2);
  const owner = (await callerA.from('tasks').select('user_id').eq('id', a.id).single()).data.user_id;
  for (const [date, ids] of [[past, [a.id, c.id, deferred.id]], [recent, [b.id, done.id]]]) {
    const result = await callerA.from('daily_plans').insert({ date, user_id: owner,
      planning_status: 'completed', planning_step: 3, planning_completed_at: new Date().toISOString(), selected_task_ids: ids });
    assert.ifError(result.error);
  }
  await apiRequest('PATCH', `/tasks/${done.id}`, tokenA, { status: 'completed' });
  const historyBefore = (await callerA.from('daily_plans').select('*').in('date', [past, recent]).order('date')).data;
  let state = await get(); assert.equal(state.plan, null);
  const generate = command(state, 'propose');
  state = await put(generate);
  assert.equal(state.plan.approved, false); assert.deepEqual(state.plan.ids, []);
  assert.ok(state.plan.proposal.ids.includes(a.id)); assert.ok(state.plan.proposal.ids.includes(b.id));
  assert.ok(!state.plan.proposal.ids.includes(c.id)); assert.ok(!state.plan.proposal.ids.includes(deferred.id));
  assert.ok(!state.plan.proposal.ids.includes(done.id)); assert.ok(!state.tasks.some(t => t.id === foreign.id));
  assert.equal(state.plan.proposal.reasons.a, undefined);
  assert.equal(state.plan.proposal.reasons[a.id].origin, past); assert.equal(state.plan.proposal.reasons[a.id].kind, 'due');
  assert.deepEqual(await put(generate), state); // operation response lost / idempotent generation
  const draft = command(state, 'save-draft', { ids: [b.id, a.id] }); state = await put(draft);
  assert.deepEqual((await get(today, await freshTokenA())).plan.proposal.ids, [b.id, a.id]);
  assert.deepEqual((await get()).plan.ids, []); // draft has not changed approval
  await put(command(state, 'approve', { ids: [foreign.id], source: 'daily' }), 400);
  const approve = command(state, 'approve', { ids: [b.id, a.id], source: 'weekly' });
  const retries = await Promise.all([put(approve), put(approve), put(approve)]);
  retries.forEach(r => assert.deepEqual(r.plan.ids, [b.id, a.id]));
  state = await get(); assert.equal(state.plan.source, 'weekly'); assert.equal(state.plan.approved, true);
  assert.deepEqual((await apiRequest('GET', `/tasks?id=${a.id}`, tokenA)).tasks[0], a);
  state = await put(command(state, 'propose'));
  assert.deepEqual(state.plan.ids, [b.id, a.id]); assert.equal(state.plan.approved, true);
  state = await put(command(state, 'discard'));
  assert.deepEqual(state.plan.ids, [b.id, a.id]); assert.equal(state.plan.proposal, null);
  assert.deepEqual((await put(approve)).plan.ids, [b.id, a.id]); // delayed retry after later operations
  // Task changes invalidate an existing review; a failed apply leaves the plan intact.
  state = await put(command(state, 'propose'));
  const stale = command(state, 'approve', { ids: [a.id], source: 'daily' });
  await apiRequest('PATCH', `/tasks/${a.id}`, tokenA, { title: 'Changed after review' });
  await put(stale, 409); assert.deepEqual((await get()).plan.ids, [b.id, a.id]);
  state = await get(); state = await put(command(state, 'propose'));
  const edit = command(state, 'edit', { ids: [a.id] });
  const responses = await Promise.all([0, 1].map(async n => {
    try { await put({ ...edit, operationId: randomUUID(), ids: n ? [] : [a.id] }); return 200; }
    catch (error) { assert.match(String(error), /409/); return 409; }
  }));
  assert.deepEqual(responses.sort(), [200, 409]);
  state = await get(); state = await put(command(state, 'edit', { ids: [] }));
  assert.equal(state.plan.approved, true); assert.deepEqual(state.plan.ids, []);
  assert.equal((await get(today, await freshTokenA())).plan.approved, true);
  state = await put(command(state, 'summarize', { note: 'Optional reflection' }));
  assert.equal(state.plan.summary.note, 'Optional reflection');
  const manual = await create('Explicit capture on approved day', { planning: { type: 'day', plannedDate: today } });
  state = await get(); assert.deepEqual(state.plan.ids, [manual.id]);
  const week = await apiRequest('GET', `/week-plans/${today}/days`, tokenA);
  assert.deepEqual(week.days.find(d => d.date === today).ids, state.plan.ids);
  await apiRequest('PATCH', `/tasks/${manual.id}`, tokenA, { status: 'completed' });
  assert.equal((await get()).tasks.find(t => t.id === manual.id).status, 'completed');
  assert.equal((await apiRequest('GET', `/week-plans/${today}/days`, tokenA)).tasks.find(t => t.id === manual.id).status, 'completed');
  await apiRequest('PATCH', `/tasks/${manual.id}`, tokenA, { planning: { type: 'day', plannedDate: add(today, 2) } });
  assert.deepEqual((await get()).plan.ids, []); // direct reschedule is an intentional edit
  assert.equal((await get()).tasks.find(t => t.id === manual.id).status, 'completed');
  assert.deepEqual((await callerA.from('daily_plans').select('*').in('date', [past, recent]).order('date')).data, historyBefore);
  assert.deepEqual((await apiRequest('GET', `/commitments?date=${today}`, tokenA)).commitments.find(item => item.id === event.id), event);
  const next = add(today, 1); const nextState = await get(next);
  assert.equal(nextState.plan, null); // no rollover or summary prerequisite
  const nextProposal = await put(command(nextState, 'propose'), 200, next);
  assert.equal(nextProposal.plan.approved, false); assert.deepEqual(nextProposal.plan.ids, []);
  await put(command(await get(past), 'propose'), 409, past);
  assert.equal((await get(today, tokenB)).plan, null);
  assert.ok((await anonymous.rpc('daily_flow_context', { p_date: today })).error);
  assert.ok((await anonymous.rpc('save_daily_flow', { p_date: today, p_command: approve })).error);
  assert.deepEqual((await callerB.from('daily_flow_operations').select('*').eq('operation_id', approve.operationId)).data, []);
  assert.deepEqual((await callerB.from('daily_plans').update({ flow_state: {} }).eq('id', state.plan.id).select('id')).data, []);
  assert.ok((await callerA.from('daily_plans').update({ selected_task_ids: [foreign.id] }).eq('id', state.plan.id)).error);
  // A used operation cannot silently become another command or target another day.
  await put({ ...approve, ids: [] }, 409);
  await put(approve, 409, next);
  // Real database date context follows the account timezone; changing it invalidates reviews.
  const beforeZone = await get(next);
  for (const timezone of ['Pacific/Kiritimati', 'America/Adak']) {
    assert.ifError((await callerA.from('user_settings').upsert({ user_id: owner, timezone }, { onConflict: 'user_id' })).error);
    const zoned = await get(next);
    const expected = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    assert.equal(zoned.today, expected); assert.equal(zoned.timezone, timezone);
  }
  await put(command(beforeZone, 'approve', { ids: beforeZone.plan.proposal.ids, source: 'daily' }), 409, next);
  const legacyDate = add(today, 4);
  const oldStart = (await apiRequest('PUT', `/daily-plans/${legacyDate}/planning`, tokenA, { action: 'start', revision: 0, operationId: randomUUID() })).plan;
  await apiRequest('PUT', `/daily-plans/${legacyDate}/planning`, tokenA, { action: 'save', revision: oldStart.revision, operationId: randomUUID(), step: 2, selectedTaskIds: [c.id] });
  const oldDraft = await get(legacyDate);
  const migratedDraft = await put(command(oldDraft, 'propose'), 200, legacyDate);
  assert.equal(migratedDraft.plan.proposal.ids[0], c.id); assert.equal(migratedDraft.plan.approved, false);
  const legacyApprovedDate = add(today, 5);
  assert.ifError((await callerA.from('daily_plans').insert({ user_id: owner, date: legacyApprovedDate, planning_status: 'completed', planning_step: 3,
    planning_completed_at: new Date().toISOString(), selected_task_ids: [] })).error);
  const capturedLegacy = await create('Explicit capture on legacy approved day', { planning: { type: 'day', plannedDate: legacyApprovedDate } });
  assert.deepEqual((await get(legacyApprovedDate)).plan.ids, [capturedLegacy.id]);
  await apiRequest('PATCH', `/tasks/${capturedLegacy.id}`, tokenA, { planning: { type: 'inbox' } });
  assert.deepEqual((await get(legacyApprovedDate)).plan.ids, []);
}
