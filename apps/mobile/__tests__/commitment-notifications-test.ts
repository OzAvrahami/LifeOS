import { commitmentReminderInstant } from '@/features/notifications/commitment-reminder-time';
import { desiredNotifications, NotificationReconciler } from '@/features/notifications/notification-reconciler';
import { notificationDestination } from '@/features/notifications/notification-routing';
import { defaultNotificationPreferences, type LocalRequest, type NotificationDriver, type NotificationSnapshot } from '@/features/notifications/notification.types';
import type { Commitment } from '@/features/commitments/commitment.types';
import type { Task } from '@/features/tasks/task.types';

const user = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
const item = { id, title: 'פגישה', description: 'private', date: '2099-01-02', startTime: '12:37', endTime: null, reminderMinutesBefore: 15 } as Commitment;
const prefs = { ...defaultNotificationPreferences, enabled: true, taskRemindersEnabled: true, commitmentRemindersEnabled: true };
const now = new Date(2099, 0, 1).getTime();
const snapshot = (commitments = [item], preferences = prefs): NotificationSnapshot => ({ tasks: [], commitments, preferences });

it('derives exact local minutes for start-only commitments, including midnight/year boundaries', () => {
  expect(commitmentReminderInstant(item)).toBe(new Date(2099, 0, 2, 12, 22).getTime());
  expect(commitmentReminderInstant({ ...item, date: '2099-01-01', startTime: '00:05', reminderMinutesBefore: 15 })).toBe(new Date(2098, 11, 31, 23, 50).getTime());
  expect(commitmentReminderInstant({ ...item, reminderMinutesBefore: 0 })).toBe(new Date(2099, 0, 2, 12, 37).getTime());
  for (const lead of [-1, 1441, 1.5, NaN]) expect(commitmentReminderInstant({ ...item, reminderMinutesBefore: lead })).toBeNull();
});

it('respects native local DST construction without shifting nonexistent wall-clock times', () => {
  // Also run this suite with TZ=America/New_York to exercise the spring gap.
  const gap = new Date(2027, 2, 14, 2, 30);
  const calculated = commitmentReminderInstant({ ...item, date: '2027-03-14', startTime: '02:30' });
  expect(calculated).toBe(gap.getHours() === 2 ? gap.getTime() - 15 * 60_000 : null);
  const fall = new Date(2027, 10, 7, 1, 30);
  expect(commitmentReminderInstant({ ...item, date: '2027-11-07', startTime: '01:30' })).toBe(fall.getTime() - 15 * 60_000);
});

it('does not invent a replacement time for a past relative reminder and does not expose descriptions', () => {
  expect(desiredNotifications(user, snapshot(), new Date(2099, 0, 2, 12, 30).getTime())).toEqual([]);
  const [request] = desiredNotifications(user, snapshot(), now);
  expect(request.content).toEqual({ title: 'תזכורת להתחייבות', body: 'פגישה', data: { owner: 'lifeos', userId: user, kind: 'commitment', commitmentId: id } });
});

function fixture() {
  let pending: LocalRequest[] = [{ identifier: 'foreign', content: { data: { owner: 'another-app' } } }];
  const driver: NotificationDriver = {
    permission: async () => 'allowed', list: async () => pending,
    schedule: jest.fn(async request => { pending.push(request); return request.identifier; }),
    cancel: jest.fn(async identifier => { pending = pending.filter(r => r.identifier !== identifier); }),
    presented: async () => [], dismiss: jest.fn(async () => {}),
  };
  const reconciler = new NotificationReconciler(driver, () => now);
  const run = (state = snapshot(), account: string | null = user) => reconciler.reconcile(account, async () => state);
  return { driver, run, pending: () => pending };
}

it('moves start/date by cancelling the old request, retries without duplicates, clears and deletes', async () => {
  const f = fixture();
  await f.run(); const oldId = f.pending()[1].identifier;
  await f.run(); expect(f.driver.schedule).toHaveBeenCalledTimes(1);
  await f.run(snapshot([{ ...item, startTime: '13:30' }]));
  expect(f.driver.cancel).toHaveBeenCalledWith(oldId);
  expect(jest.mocked(f.driver.schedule).mock.calls.at(-1)?.[0].trigger).toEqual({ type: 'date', date: new Date(2099, 0, 2, 13, 15) });
  await f.run(snapshot([{ ...item, date: '2099-01-03' }])); expect(f.pending()).toHaveLength(2);
  await f.run(snapshot([{ ...item, reminderMinutesBefore: null }])); expect(f.pending()).toHaveLength(1);
  await f.run(); await f.run(snapshot([])); expect(f.pending()).toEqual([{ identifier: 'foreign', content: { data: { owner: 'another-app' } } }]);
});

it('turns category/master off without changing intent, restores future reminders, and cleans old accounts', async () => {
  const f = fixture(); await f.run();
  await f.run(snapshot([item], { ...prefs, commitmentRemindersEnabled: false })); expect(f.pending()).toHaveLength(1);
  await f.run(); expect(f.pending()).toHaveLength(2);
  await f.run(snapshot([item], { ...prefs, enabled: false })); expect(f.pending()).toHaveLength(1);
  await f.run(); await f.run(snapshot([]), 'another-user'); expect(f.pending()).toHaveLength(1);
  await f.run(); await f.run(snapshot([]), null); expect(f.pending()).toHaveLength(1);
  expect(item.reminderMinutesBefore).toBe(15);
});

it('reserves weekly capacity and chooses Tasks and Commitments together by fire time', async () => {
  const f = fixture();
  const tasks = Array.from({ length: 70 }, (_, i) => ({ id: `task-${i}`, title: `Task ${i}`, status: 'open', reminderAt: new Date(now + (i + 1) * 60_000).toISOString() } as Task));
  const soon = { ...item, date: '2099-01-01', startTime: '00:00', reminderMinutesBefore: 0 };
  // Two minutes after now; tie ordering is deterministic, independent of type.
  soon.startTime = '00:02';
  const result = await f.run({ tasks, commitments: [soon, { ...item, id: 'far' }], preferences: { ...prefs, weeklyPlanningEnabled: true, weeklyPlanningWeekday: 0, weeklyPlanningTime: '09:17' } });
  expect(result).toEqual({ scheduled: 63, deferred: 10 });
  expect(f.pending()).toHaveLength(64);
  const kinds = f.pending().slice(1).map(r => r.content.data?.kind);
  expect(kinds[0]).toBe('weekly'); expect(kinds.slice(1, 4)).toContain('commitment');
  expect(f.pending().some(r => r.content.data?.commitmentId === 'far')).toBe(false);
});

it('recomputes local instants on a new snapshot rather than retaining cached dates across timezone changes', async () => {
  const f = fixture(); await f.run(); const oldId = f.pending()[1].identifier;
  // Simulate a changed local-zone construction boundary without changing server values.
  const original = Date.prototype.getTime;
  const spy = jest.spyOn(Date.prototype, 'getTime').mockImplementation(function (this: Date) { return original.call(this) + 3_600_000; });
  await f.run(); spy.mockRestore();
  expect(f.driver.cancel).toHaveBeenCalledWith(oldId);
  expect(f.driver.schedule).toHaveBeenCalledTimes(2);
});

it('routes by current commitment identity, rejects invalid/foreign payloads, never routes from stale date', () => {
  const r = desiredNotifications(user, snapshot(), now)[0];
  expect(notificationDestination({ ...r, content: { ...r.content, data: { ...r.content.data, date: '2000-01-01' } } }, user)).toEqual({ pathname: '/commitment', params: { id } });
  expect(notificationDestination(r, 'other')).toBeNull();
  expect(notificationDestination({ ...r, content: { data: { owner: 'lifeos', userId: user, kind: 'commitment', commitmentId: '../bad' } } }, user)).toBeNull();
});
