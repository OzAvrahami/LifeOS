import assert from 'node:assert/strict';

// Called only by the existing guarded local Supabase harness, using its disposable users.
export async function verifyWeeklyPlanning({ apiRequest, tokenA, tokenB, callerA, callerB, anonymous, freshTokenA }) {
  const week = '2028-09-18';
  const path = `/week-plans/${week}`;
  const get = (token = tokenA) => apiRequest('GET', path, token);
  const put = (input, status = 200, token = tokenA) => apiRequest('PUT', path, token, input, status);
  assert.deepEqual(await get(), { weekPlan: null, focuses: [] });
  const legacy = await apiRequest('PUT', `${path}/focuses`, tokenA, { titles: ['Existing focus'] });
  const original = await get();
  assert.equal(original.weekPlan.status, 'not_started'); assert.equal(original.weekPlan.resumeStep, 0);
  const id = original.weekPlan.id;
  assert.equal(legacy.focuses[0].weekPlanId, id);
  const starts = await Promise.all(Array.from({ length: 5 }, () => put({ action: 'start' })));
  starts.forEach(s => { assert.equal(s.weekPlan.id, id); assert.equal(s.weekPlan.resumeStep, 1); assert.deepEqual(s.focuses, legacy.focuses); });
  await put({ action: 'complete' }, 409);
  await put({ action: 'save', step: 3, advance: true }, 409);
  await put({ action: 'save', step: 1, advance: true });
  await put({ action: 'save', step: 2, advance: true });
  const focusSave = await put({ action: 'save', step: 3, titles: ['Persisted draft'] });
  assert.equal(focusSave.weekPlan.resumeStep, 3);
  // A fresh normal sign-in uses server state, not a client's in-memory session/cache.
  const restored = await get(await freshTokenA());
  assert.equal(restored.weekPlan.resumeStep, 3); assert.equal(restored.focuses[0].title, 'Persisted draft');
  await put({ action: 'save', step: 1, advance: true });
  assert.equal((await get()).weekPlan.resumeStep, 3);
  await put({ action: 'save', step: 3, advance: true });
  const completions = await Promise.all([1,2,3].map(() => put({ action: 'complete' })));
  completions.forEach(s => { assert.equal(s.weekPlan.id, id); assert.equal(s.weekPlan.status, 'completed'); assert.equal(s.weekPlan.completedAt, completions[0].weekPlan.completedAt); });
  await put({ action: 'save', step: 3, titles: ['Edited completed'] });
  const edited = await put({ action: 'start' });
  assert.equal(edited.weekPlan.status, 'completed'); assert.equal(edited.weekPlan.id, id);
  assert.equal(edited.focuses[0].title, 'Edited completed');
  // The existing standalone Focus RPC must not reset lifecycle or identity.
  await apiRequest('PUT', `${path}/focuses`, tokenA, { titles: [] });
  assert.equal((await get()).weekPlan.status, 'completed'); assert.deepEqual((await get()).focuses, []);
  assert.deepEqual(await get(tokenB), { weekPlan: null, focuses: [] });
  const ownB = await put({ action: 'start' }, 200, tokenB); assert.notEqual(ownB.weekPlan.id, id);
  const forbidden = await callerB.from('week_plans').update({ planning_step: 2 }).eq('id', id).select('id');
  assert.ifError(forbidden.error); assert.deepEqual(forbidden.data, []);
  const ownRows = await callerA.from('week_plans').select('id').eq('week_start', week);
  assert.ifError(ownRows.error); assert.deepEqual(ownRows.data, [{ id }]);
  const anon = await anonymous.rpc('save_weekly_planning', { p_week_start: week, p_action: 'start' });
  assert.ok(anon.error, 'Anonymous lifecycle RPC unexpectedly succeeded');
  for (const invalid of [{ planning_status: 'completed', planning_completed_at: null },
    { planning_status: 'in_progress', planning_step: 0, planning_completed_at: null },
    { planning_status: 'not_started', planning_step: 1, planning_completed_at: null },
    { planning_status: 'unknown' }, { planning_status: null }]) {
    const failed = await callerA.from('week_plans').update(invalid).eq('id', id);
    assert.ok(failed.error, 'PostgreSQL accepted an invalid lifecycle combination');
  }
  const before = await get();
  const badFocus = await callerA.rpc('save_weekly_planning', {
    p_week_start: week, p_action: 'save', p_step: 3, p_advance: true, p_titles: ['duplicate','duplicate'],
  });
  assert.ok(badFocus.error); assert.deepEqual(await get(), before);
  const next = '/week-plans/2028-09-25';
  await apiRequest('PUT', `${next}/focuses`, tokenA, { titles: [] });
  assert.equal((await apiRequest('GET', next, tokenA)).weekPlan.status, 'not_started');
  assert.equal((await get()).weekPlan.status, 'completed');
}
