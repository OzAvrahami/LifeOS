import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Only run through verify-local-tasks: localhost, isolated accounts, existing DB;
// no reset, hosted credentials, production writes or replacement mock RPC.
export async function verifyDailySelection({ apiRequest, tokenA, tokenB, callerA, callerB, anonymous, freshTokenA, deleteTaskFixture }) {
  const today = (await apiRequest('GET', '/daily-plans/2031-01-01/flow', tokenA)).today;
  const add = n => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const get = (date = today, token = tokenA) => apiRequest('GET', `/daily-plans/${date}/flow`, token);
  const enter = () => apiRequest('POST', `/daily-plans/${today}/initialize`, tokenA);
  const command = (s, action, ids, extra = {}) => ({ action, revision: s.plan?.revision ?? 0,
    snapshot: s.snapshot, operationId: randomUUID(), ...(ids ? { ids } : {}), ...(action === 'approve' ? { source: 'daily' } : {}), ...extra });
  const put = (c, status = 200, date = today) => apiRequest('PUT', `/daily-plans/${date}/flow`, tokenA, c, status);
  const create = async (title, token = tokenA) => (await apiRequest('POST', '/tasks', token, { title }, 201)).task;
  const a = await create('First selection'); const b = await create('Second selection');
  const unrelated = await create('Unrelated metadata'); const foreign = await create('Other owner', tokenB);
  const { data: ownerRow, error: ownerError } = await callerA.from('tasks').select('user_id').eq('id', a.id).single();
  assert.ifError(ownerError); const owner = ownerRow.user_id;
  const oldDate = add(-2);
  assert.ifError((await callerA.from('daily_plans').insert({ user_id: owner, date: oldDate,
    planning_status: 'completed', planning_step: 3, planning_completed_at: new Date().toISOString(), selected_task_ids: [] })).error);
  let state = await enter();
  const initialProposal = state.plan.proposal;
  // Fresh editor context + older persisted recommendation, the audited incident.
  await apiRequest('PATCH', `/tasks/${unrelated.id}`, tokenA, { description: 'Changed after generation' });
  state = await enter();
  assert.notEqual(state.snapshot, state.plan.proposal.snapshot);
  assert.deepEqual(state.plan.proposal, initialProposal);
  state = await put(command(state, 'approve', initialProposal.ids)); // unchanged selection
  assert.deepEqual(state.plan.ids, initialProposal.ids);

  const mutateUnrelated = async n => {
    await apiRequest('PATCH', `/tasks/${unrelated.id}`, tokenA, { description: `Unrelated ${n}` });
    const before = await callerA.from('tasks').select('description,updated_at').eq('id', unrelated.id).single();
    assert.ifError(before.error);
    const sameValues = await callerA.from('tasks').update({ description: before.data.description }).eq('id', unrelated.id).select('description,updated_at').single();
    assert.ifError(sameValues.error);
    assert.equal(sameValues.data.description, before.data.description);
    assert.notEqual(sameValues.data.updated_at, before.data.updated_at); // timestamp-only mutation
    const past = await get(oldDate);
    await put(command(past, 'summarize', undefined, { note: `Historical summary ${n}` }), 200, oldDate);
    // A distant empty week participates in the old global hash but not this selection.
    assert.ifError((await callerA.from('week_plans').insert({ user_id: owner, week_start: add(100 + 7 * n) })).error);
  };
  // All three save actions accept old command hashes; drafts retain order without approval changes.
  for (const [n, action] of ['save-draft', 'approve', 'edit'].entries()) {
    state = await get(); const before = state.plan;
    const c = command(state, action, [b.id, a.id]);
    await mutateUnrelated(n);
    state = await put(c);
    assert.equal(state.plan.id, before.id);
    assert.deepEqual(action === 'save-draft' ? state.plan.proposal.ids : state.plan.ids, [b.id, a.id]);
    if (action === 'save-draft') { assert.equal(state.plan.approved, before.approved); assert.deepEqual(state.plan.ids, before.ids); }
    const resumed = await get(today, await freshTokenA()); assert.deepEqual(resumed.plan, state.plan);
  }
  const tasksAfter = (await get()).tasks;
  for (const original of [a, b]) assert.deepEqual(tasksAfter.find(t => t.id === original.id), original); // no cloning/date rewrite
  const week = await apiRequest('GET', `/week-plans/${today}/days`, tokenA);
  assert.deepEqual(week.days.find(d => d.date === today).ids, state.plan.ids);

  // Duplicate concurrent delivery, then replay after a newer operation, never reapplies an old selection.
  const once = command(state, 'edit', [a.id, b.id]);
  const duplicates = await Promise.all([put(once), put(once), put(once)]);
  for (const result of duplicates) assert.equal(result.plan.revision, state.plan.revision + 1);
  state = await put(command(duplicates[0], 'edit', [b.id]));
  assert.deepEqual((await put(once)).plan, state.plan);
  await put({ ...once, ids: [] }, 409);
  assert.deepEqual((await get()).plan, state.plan);
  const raceBase = state;
  const c1 = command(raceBase, 'edit', [a.id]); const c2 = command(raceBase, 'edit', [b.id]);
  const race = await Promise.all([c1, c2].map(async c => {
    const { error } = await callerA.rpc('save_daily_flow', { p_date: today, p_command: c });
    return error?.code ?? 'ok';
  }));
  assert.deepEqual(race.sort(), ['55000', 'ok']);
  const conflict = await put(command(raceBase, 'edit', []), 409);
  assert.equal(conflict.code, 'daily_plan_conflict');
  state = await get();

  // Rejected writes have neither partial plan changes nor an idempotency ledger entry.
  const cancelled = await create('Cancelled selection');
  await apiRequest('PATCH', `/tasks/${cancelled.id}`, tokenA, { status: 'cancelled' });
  const deleted = await create('Deleted selection');
  assert.equal((await callerA.from('tasks').delete().eq('id', deleted.id)).error?.code, '42501');
  // Product users cannot physically delete tasks. Simulate a missing record only
  // through the localhost harness, constrained to this run's disposable owner.
  await deleteTaskFixture(deleted.id);
  const completed = await create('Completed outside plan');
  await apiRequest('PATCH', `/tasks/${completed.id}`, tokenA, { status: 'completed' });
  for (const action of ['approve', 'save-draft', 'edit']) for (const bad of [cancelled.id, deleted.id, foreign.id, completed.id]) {
    const before = await get(); const c = command(before, action, [a.id, bad]);
    const failure = await put(c, 422); assert.equal(failure.code, 'selection_unavailable');
    assert.deepEqual((await get()).plan, before.plan);
    const ledger = await callerA.from('daily_flow_operations').select('operation_id').eq('operation_id', c.operationId);
    assert.ifError(ledger.error); assert.deepEqual(ledger.data, []);
  }
  state = await get();
  await put(command(state, 'edit', ['not-a-uuid']), 400);
  await put(command(state, 'edit', [a.id, a.id]), 400);
  assert.deepEqual((await get()).plan, state.plan);
  state = await put(command(state, 'edit', [a.id]));
  await apiRequest('PATCH', `/tasks/${a.id}`, tokenA, { status: 'completed' });
  state = await put(command(state, 'edit', [a.id, b.id])); // completed member remains eligible
  assert.deepEqual(state.plan.ids, [a.id, b.id]);
  assert.ok((await anonymous.rpc('save_daily_flow', { p_date: today, p_command: command(state, 'edit', []) })).error);
  assert.deepEqual((await callerB.from('daily_plans').select('id').eq('id', state.plan.id)).data, []);
  assert.deepEqual((await callerB.from('daily_flow_operations').select('operation_id').eq('operation_id', once.operationId)).data, []);
  await put(command(await get(oldDate), 'approve', []), 409, oldDate);

  // New manual draft has no prerequisite proposal, retains ordering, then allows an empty approval.
  const tomorrow = add(1); let draft = await get(tomorrow);
  draft = await put(command(draft, 'save-draft', [b.id, unrelated.id]), 200, tomorrow);
  assert.equal(draft.plan.approved, false); assert.deepEqual(draft.plan.ids, []);
  assert.deepEqual((await get(tomorrow, await freshTokenA())).plan.proposal.ids, [b.id, unrelated.id]);
  draft = await put(command(draft, 'approve', []), 200, tomorrow);
  assert.equal(draft.plan.approved, true); assert.deepEqual(draft.plan.ids, []);
  const emptyDate = add(2);
  const empty = await put(command(await get(emptyDate), 'approve', [], { snapshot: undefined }), 200, emptyDate);
  assert.equal(empty.plan.approved, true); assert.deepEqual((await get(emptyDate)).plan.ids, []);
}
