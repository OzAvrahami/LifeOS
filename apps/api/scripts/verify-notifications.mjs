import assert from 'node:assert/strict';

export const notificationDefaults = { enabled: false, taskRemindersEnabled: false, weeklyPlanningEnabled: false,
  commitmentRemindersEnabled: false, commitmentDefaultReminderMinutes: 15,
  weeklyPlanningWeekday: null, weeklyPlanningTime: null };

// Runs only inside the guarded local harness and its disposable user fixtures.
export async function verifyNotifications({ apiRequest, tokenA, tokenB, callerA, callerB, anonymous, userA, userB }) {
  const before = (await apiRequest('GET', '/settings', tokenA)).settings;
  assert.deepEqual(before.notifications, notificationDefaults);
  const prefs = { ...notificationDefaults, enabled: true, taskRemindersEnabled: true, weeklyPlanningEnabled: true,
    weeklyPlanningWeekday: 6, weeklyPlanningTime: '09:17' };
  const patchSettings = (notifications, token = tokenA, status = 200) => apiRequest('PATCH', '/settings', token,
    { notifications, timezone: 'America/New_York' }, status);
  const saved = (await patchSettings(prefs)).settings;
  assert.deepEqual(saved, { ...before, notifications: prefs });
  assert.deepEqual((await apiRequest('GET', '/settings', tokenA)).settings, saved);
  assert.deepEqual((await apiRequest('GET', '/settings', tokenB)).settings.notifications, notificationDefaults);
  const oldClient = (await apiRequest('PUT', '/settings', tokenA, {
    timezone: before.timezone, weekStartDay: before.weekStartDay, defaultDailyCapacityMinutes: before.defaultDailyCapacityMinutes,
  })).settings;
  assert.deepEqual(oldClient, saved);
  const off = { ...prefs, enabled: false, taskRemindersEnabled: false, weeklyPlanningEnabled: false };
  assert.deepEqual((await patchSettings(off)).settings.notifications, off);
  assert.deepEqual((await patchSettings(prefs, tokenB)).settings.notifications, prefs);
  const foreignSettings = await callerB.from('user_settings').update({ notifications_enabled: true }).eq('user_id', userA).select('user_id');
  assert.ifError(foreignSettings.error); assert.deepEqual(foreignSettings.data, []);
  assert.deepEqual((await apiRequest('GET', '/settings', tokenA)).settings.notifications, off);
  for (const invalid of [{ weeklyPlanningWeekday: 7 }, { weeklyPlanningTime: '24:00' }, { weeklyPlanningTime: '09:17:15' },
    { weeklyPlanningTime: null }, { enabled: 'true' }]) await patchSettings({ ...prefs, ...invalid }, tokenA, 400);
  for (const invalid of [{ weekly_planning_reminder_weekday: 7 }, { weekly_planning_reminder_time: '24:00' },
    { weekly_planning_reminder_time: '09:17:15' }, { weekly_planning_reminder_enabled: true, weekly_planning_reminder_time: null }]) {
    const result = await callerB.from('user_settings').update(invalid).eq('user_id', userB);
    assert.ok(result.error, 'Invalid notification settings accepted by database');
  }
  const anonymousSettings = await anonymous.from('user_settings').update({ notifications_enabled: true }).eq('user_id', userA);
  assert.ok(anonymousSettings.error);
  await apiRequest('PATCH', '/settings', null, { notifications: prefs, timezone: 'UTC' }, 401);

  const task = (await apiRequest('POST', '/tasks', tokenA, { title: 'Disposable reminder', description: 'Preserved', dueDate: '2099-03-10', estimatedMinutes: 17 }, 201)).task;
  assert.equal(task.reminderAt, null);
  const path = `/tasks/${task.id}`;
  for (const time of ['09:10', '09:25', '09:17']) {
    const reminderAt = `2099-03-09T${time}:00.000Z`;
    const updated = (await apiRequest('PATCH', path, tokenA, { reminderAt })).task;
    assert.equal(Date.parse(updated.reminderAt), Date.parse(reminderAt));
    for (const key of ['title', 'description', 'dueDate', 'estimatedMinutes', 'id']) assert.equal(updated[key], task[key]);
    const direct = await callerA.from('tasks').select('reminder_at').eq('id', task.id).single();
    assert.ifError(direct.error); assert.equal(Date.parse(direct.data.reminder_at), Date.parse(reminderAt));
    assert.equal(Date.parse((await apiRequest('GET', `/tasks?id=${task.id}`, tokenA)).tasks[0].reminderAt), Date.parse(reminderAt));
  }
  const last = '2099-03-09T09:17:00.000Z';
  const moved = (await apiRequest('PATCH', path, tokenA, { planning: { type: 'day', plannedDate: '2099-03-11' } })).task;
  assert.equal(Date.parse(moved.reminderAt), Date.parse(last));
  const reminderTasks = async token => (await apiRequest('GET', '/tasks?reminders=true', token)).tasks;
  for (const status of ['completed', 'open', 'cancelled', 'open']) {
    const updated = (await apiRequest('PATCH', path, tokenA, { status })).task;
    assert.equal(Date.parse(updated.reminderAt), Date.parse(last));
    assert.equal((await reminderTasks(tokenA)).some(t => t.id === task.id), status === 'open');
  }
  assert.deepEqual((await apiRequest('GET', `/tasks?id=${task.id}`, tokenB)).tasks, []);
  assert.equal((await reminderTasks(tokenB)).some(t => t.id === task.id), false);
  await apiRequest('PATCH', path, tokenB, { reminderAt: null }, 404);
  const foreignTask = await callerB.from('tasks').update({ reminder_at: null }).eq('id', task.id).select('id');
  assert.ifError(foreignTask.error); assert.deepEqual(foreignTask.data, []);
  const anonymousTask = await anonymous.from('tasks').update({ reminder_at: null }).eq('id', task.id);
  assert.ok(anonymousTask.error);
  for (const reminderAt of ['2000-01-01T09:17:00Z', '2099-01-01', '2099-02-30T09:17:00Z', '2099-01-01T24:00:00Z', 'infinity']) {
    await apiRequest('PATCH', path, tokenA, { reminderAt }, 400);
  }
  for (const reminder_at of ['infinity', '-infinity', 'not-a-time']) {
    const result = await callerA.from('tasks').update({ reminder_at }).eq('id', task.id);
    assert.ok(result.error, 'Invalid timestamp accepted by database');
  }
  assert.equal((await apiRequest('PATCH', path, tokenA, { reminderAt: null })).task.reminderAt, null);
  assert.equal((await reminderTasks(tokenA)).some(t => t.id === task.id), false);
  const created = (await apiRequest('POST', '/tasks', tokenA, { title: 'Created with reminder', reminderAt: last }, 201)).task;
  assert.equal(Date.parse(created.reminderAt), Date.parse(last));
  // Reconciliation must see beyond PostgREST's usual 1,000-row response limit.
  const bulk = Array.from({ length: 1001 }, () => ({ user_id: userA, title: 'Disposable pagination', reminder_at: last }));
  for (let offset = 0; offset < bulk.length; offset += 500) {
    const result = await callerA.from('tasks').insert(bulk.slice(offset, offset + 500));
    assert.ifError(result.error);
  }
  assert.equal((await reminderTasks(tokenA)).filter(t => t.title === 'Disposable pagination').length, 1001);
  assert.equal((await reminderTasks(tokenB)).some(t => t.title === 'Disposable pagination'), false);
}
