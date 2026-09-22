import assert from 'node:assert/strict';

// Called only by the guarded local harness with disposable real Auth sessions.
export async function verifyCommitmentReminders({ apiRequest, tokenA, tokenB, callerA, callerB, anonymous, userA, userB }) {
  const before = (await apiRequest('GET', '/settings', tokenA)).settings;
  assert.equal(before.notifications.commitmentRemindersEnabled, false);
  assert.equal(before.notifications.commitmentDefaultReminderMinutes, 15);
  const prefs = { ...before.notifications, commitmentRemindersEnabled: true, commitmentDefaultReminderMinutes: 37 };
  const patch = notifications => apiRequest('PATCH', '/settings', tokenA, { notifications, timezone: 'UTC' });
  const saved = (await patch(prefs)).settings;
  assert.deepEqual(saved, { ...before, notifications: prefs });
  const old = { ...prefs }; delete old.commitmentRemindersEnabled; delete old.commitmentDefaultReminderMinutes;
  assert.deepEqual((await patch(old)).settings, saved);
  assert.equal((await apiRequest('GET', '/settings', tokenB)).settings.notifications.commitmentRemindersEnabled, false);
  for (const value of [-1, 1441, 1.5, '15']) await apiRequest('PATCH', '/settings', tokenA, { notifications: { ...prefs, commitmentDefaultReminderMinutes: value }, timezone: 'UTC' }, 400);
  for (const value of [-1, 1441]) {
    const result = await callerA.from('user_settings').update({ commitment_default_reminder_minutes: value }).eq('user_id', userA);
    assert.ok(result.error, 'Database accepted out-of-range default');
  }
  const foreignSettings = await callerB.from('user_settings').update({ commitment_reminders_enabled: true }).eq('user_id', userA).select('user_id');
  assert.ifError(foreignSettings.error); assert.deepEqual(foreignSettings.data, []);
  assert.ok((await anonymous.from('user_settings').update({ commitment_reminders_enabled: true }).eq('user_id', userA)).error);

  const create = input => apiRequest('POST', '/commitments', tokenA, { title: 'Disposable relative reminder', description: 'Preserve', date: '2099-01-02', startTime: '12:37', ...input }, 201);
  const legacy = (await create({})).commitment;
  assert.equal(legacy.reminderMinutesBefore, null, 'Server must not apply account default');
  for (const lead of [0, 37]) {
    const changed = (await apiRequest('PATCH', `/commitments/${legacy.id}`, tokenA, { reminderMinutesBefore: lead })).commitment;
    assert.deepEqual(changed, { ...legacy, reminderMinutesBefore: lead, updatedAt: changed.updatedAt });
  }
  for (const lead of [null, 0, 5, 15, 30, 60, 37, 1440]) {
    const item = (await create({ reminderMinutesBefore: lead })).commitment;
    assert.equal(item.reminderMinutesBefore, lead); assert.equal(item.endTime, null);
    const path = `/commitments/${item.id}`;
    const moved = (await apiRequest('PATCH', path, tokenA, { date: '2099-02-03', startTime: '13:30' })).commitment;
    assert.equal(moved.reminderMinutesBefore, lead); assert.equal(moved.description, item.description); assert.equal(moved.id, item.id);
    const loaded = (await apiRequest('GET', `/commitments?id=${item.id}`, tokenA)).commitments;
    assert.deepEqual(loaded, [moved]);
    const direct = await callerA.from('commitments').select('reminder_minutes_before').eq('id', item.id).single();
    assert.ifError(direct.error); assert.equal(direct.data.reminder_minutes_before, lead);
    assert.deepEqual((await apiRequest('GET', `/commitments?id=${item.id}`, tokenB)).commitments, []);
    await apiRequest('PATCH', path, tokenB, { reminderMinutesBefore: 0 }, 404);
    assert.equal((await apiRequest('PATCH', path, tokenA, { reminderMinutesBefore: null })).commitment.reminderMinutesBefore, null);
  }
  for (const value of [-1, 1441, 1.5, '15']) {
    await apiRequest('PATCH', `/commitments/${legacy.id}`, tokenA, { reminderMinutesBefore: value }, 400);
    await apiRequest('POST', '/commitments', tokenA, { title: 'Invalid', date: '2099-01-02', startTime: '12:37', reminderMinutesBefore: value }, 400);
  }
  for (const value of [-1, 1441]) assert.ok((await callerA.from('commitments').update({ reminder_minutes_before: value }).eq('id', legacy.id)).error);
  const foreign = await callerB.from('commitments').update({ reminder_minutes_before: 0 }).eq('id', legacy.id).select('id');
  assert.ifError(foreign.error); assert.deepEqual(foreign.data, []);
  assert.ok((await callerB.from('commitments').insert({ user_id: userA, title: 'Forbidden', date: '2099-01-01', start_time: '12:00', reminder_minutes_before: 0 })).error);
  assert.ok((await anonymous.from('commitments').select('reminder_minutes_before')).error);
  assert.ok((await anonymous.from('commitments').update({ reminder_minutes_before: 0 }).eq('id', legacy.id)).error);
  await apiRequest('GET', '/commitments?reminders=true', null, undefined, 401);
  // All equal date/time: ID tie-breaker and explicit pages must retain 1,001 rows.
  const bulk = Array.from({ length: 1001 }, () => ({ user_id: userA, title: 'Disposable commitment pagination', date: '2099-01-02', start_time: '12:37', reminder_minutes_before: 15 }));
  for (let offset = 0; offset < bulk.length; offset += 500) assert.ifError((await callerA.from('commitments').insert(bulk.slice(offset, offset + 500))).error);
  const items = (await apiRequest('GET', '/commitments?reminders=true', tokenA)).commitments.filter(c => c.title === bulk[0].title);
  assert.equal(items.length, 1001); assert.equal(new Set(items.map(c => c.id)).size, 1001);
  assert.equal((await apiRequest('GET', '/commitments?reminders=true', tokenB)).commitments.some(c => c.title === bulk[0].title), false);
  await apiRequest('DELETE', `/commitments/${items[0].id}`, tokenA);
  assert.equal((await apiRequest('GET', `/commitments?id=${items[0].id}`, tokenA)).commitments.length, 0);
  assert.equal((await callerB.from('user_settings').select('commitment_default_reminder_minutes').eq('user_id', userB).single()).data.commitment_default_reminder_minutes, 15);
}
