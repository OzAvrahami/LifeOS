import assert from 'node:assert/strict';
import console from 'node:console';
import { randomUUID } from 'node:crypto';

// Only invoked by the existing disposable-account/local-only harness.
export async function verifyDailyEntry({ apiRequest, tokenA, tokenB, freshTokenA }) {
  const today = (await apiRequest('GET', '/daily-plans/2031-01-01/flow', tokenA)).today;
  const next = new Date(`${today}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
  const tomorrow = next.toISOString().slice(0, 10);
  const get = (date = today, token = tokenA) => apiRequest('GET', `/daily-plans/${date}/flow`, token);
  const enter = (date = today, token = tokenA) => apiRequest('POST', `/daily-plans/${date}/initialize`, token);
  const save = (state, action, extra = {}, date = today, expected = 200) => apiRequest('PUT', `/daily-plans/${date}/flow`, tokenA,
    { action, revision: state.plan?.revision ?? 0, snapshot: state.snapshot, operationId: randomUUID(), ...extra }, expected);
  assert.equal((await enter()).plan, null); // no empty draft written by opening Today
  const future = (await apiRequest('POST', '/tasks', tokenA, { title: 'Tomorrow only', planning: { type: 'day', plannedDate: tomorrow } }, 201)).task;
  assert.equal((await enter()).plan, null);
  const task = (await apiRequest('POST', '/tasks', tokenA, { title: 'Actual eligible task' }, 201)).task;
  const entries = await Promise.all([enter(), enter(), enter()]);
  entries.forEach(state => { assert.deepEqual(state.plan.proposal.ids, [task.id]); assert.equal(state.plan.approved, false); });
  let state = await get(); assert.equal(state.plan.revision, 1);
  assert.equal((await enter()).plan.revision, 1);
  assert.equal((await enter(today, tokenB)).plan, null);
  assert.equal((await enter(today, tokenB)).tasks.length, 0);
  state = await save(state, 'save-draft', { ids: [] });
  assert.deepEqual((await enter(today, await freshTokenA())).plan, state.plan);
  state = await save(state, 'save-draft', { ids: [task.id] });
  const original = state;
  await apiRequest('PATCH', `/tasks/${task.id}`, tokenA, { title: 'Edited after review' });
  state = await enter();
  assert.deepEqual(state.plan, original.plan); // stale draft is kept for explicit review
  assert.notEqual(state.snapshot, state.plan.proposal.snapshot);
  await save(original, 'approve', { ids: [task.id], source: 'daily' }, today, 409);
  state = await save(state, 'propose');
  state = await save(state, 'approve', { ids: [task.id], source: 'weekly' });
  assert.deepEqual((await enter()).plan, state.plan);
  const history = state.plan;
  const following = await enter(tomorrow);
  assert.deepEqual(following.plan.proposal.ids, [future.id, task.id]);
  assert.equal(following.plan.proposal.reasons[task.id].origin, today);
  assert.deepEqual((await get()).plan, history);
  let empty = await save(following, 'approve', { ids: [], source: 'daily' }, tomorrow);
  assert.deepEqual((await enter(tomorrow)).plan, empty.plan);
  state = await save(await get(), 'propose');
  state = await save(state, 'discard');
  assert.deepEqual((await enter()).plan, state.plan);
  console.log('PASS Today entry: empty/future-only, concurrent idempotence, saved/empty/stale choices, approval, next-day identity/history and account isolation');
}
