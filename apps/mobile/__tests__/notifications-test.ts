import * as Expo from 'expo-notifications';
import { Linking } from 'react-native';

import { NotificationReconciler, desiredNotifications } from '@/features/notifications/notification-reconciler';
import { NotificationResponseRouter } from '@/features/notifications/notification-routing';
import { notificationDriver, requestNotificationPermission, openNotificationSettings } from '@/features/notifications/notification.service';
import { defaultNotificationPreferences, type LocalRequest, type NotificationSnapshot } from '@/features/notifications/notification.types';
import { reminderInstant, reminderLocalParts } from '@/features/notifications/reminder-time';
import type { Task } from '@/features/tasks/task.types';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(), scheduleNotificationAsync: jest.fn(), cancelScheduledNotificationAsync: jest.fn(),
  getPresentedNotificationsAsync: jest.fn(), dismissNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date', WEEKLY: 'weekly' },
}));
const user = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
const now = Date.parse('2099-01-01T00:00:00Z');
const task = { id, title: 'תזכורת אמיתית', description: 'private description', status: 'open', reminderAt: '2099-01-02T09:17:00Z' } as Task;
const prefs = { ...defaultNotificationPreferences, enabled: true, taskRemindersEnabled: true };
const snapshot = (tasks = [task], preferences = prefs): NotificationSnapshot => ({ tasks, preferences });
let scheduled: LocalRequest[];
let presented: LocalRequest[];
let reconciler: NotificationReconciler;
const run = (state = snapshot(), scope: string | null = user) => reconciler.reconcile(scope, async () => state);
function permission(status: 'granted' | 'denied' | 'undetermined') {
  jest.mocked(Expo.getPermissionsAsync).mockResolvedValue({ status, granted: status === 'granted', canAskAgain: status === 'undetermined', expires: 'never' } as Expo.NotificationPermissionsStatus);
}
beforeEach(() => {
  jest.clearAllMocks(); scheduled = []; presented = []; reconciler = new NotificationReconciler(notificationDriver, () => now);
  permission('granted');
  jest.mocked(Expo.getAllScheduledNotificationsAsync).mockImplementation(async () => [...scheduled] as Expo.NotificationRequest[]);
  jest.mocked(Expo.scheduleNotificationAsync).mockImplementation(async request => { scheduled.push(request as LocalRequest); return request.identifier!; });
  jest.mocked(Expo.cancelScheduledNotificationAsync).mockImplementation(async identifier => { scheduled = scheduled.filter(item => item.identifier !== identifier); });
  jest.mocked(Expo.getPresentedNotificationsAsync).mockImplementation(async () => presented.map(request => ({ request })) as Expo.Notification[]);
  jest.mocked(Expo.dismissNotificationAsync).mockImplementation(async identifier => { presented = presented.filter(item => item.identifier !== identifier); });
});
afterEach(() => jest.restoreAllMocks());

it('schedules exactly one explicit reminder; retries retain exact time and omit private description', async () => {
  await run(); await run(); await Promise.all([run(), run(), run()]);
  expect(scheduled).toHaveLength(1);
  expect(Expo.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  const request = jest.mocked(Expo.scheduleNotificationAsync).mock.calls[0]![0];
  expect(request.trigger).toEqual({ type: 'date', date: new Date(task.reminderAt!) });
  expect(request.content.body).toBe(task.title);
  expect(request.content.data).toEqual({ owner: 'lifeos', userId: user, kind: 'task', taskId: id });
  expect(JSON.stringify(request)).not.toContain(task.description);
});

it('cancels old time before replacement and updates changed titles without duplicate requests', async () => {
  await run(); const previous = scheduled[0]!.identifier;
  await run(snapshot([{ ...task, reminderAt: '2099-01-03T09:25:00Z', title: 'changed title' }]));
  expect(scheduled).toHaveLength(1); expect(scheduled[0]!.identifier).not.toBe(previous);
  expect(Expo.cancelScheduledNotificationAsync).toHaveBeenCalledWith(previous);
  await run(snapshot([{ ...task, reminderAt: '2099-01-03T09:25:00Z', title: 'new title' }]));
  expect(scheduled).toHaveLength(1); expect(scheduled[0]!.content.body).toBe('new title');
});

it.each(['cleared', 'completed', 'cancelled', 'missing', 'past', 'master-off', 'category-off', 'denied'] as const)('cancels pending reminder when %s and preserves input intent', async reason => {
  await run();
  let state = snapshot();
  if (reason === 'cleared') state = snapshot([{ ...task, reminderAt: null }]);
  if (reason === 'completed' || reason === 'cancelled') state = snapshot([{ ...task, status: reason }]);
  if (reason === 'missing') state = snapshot([]);
  if (reason === 'past') state = snapshot([{ ...task, reminderAt: '2000-01-01T09:17:00Z' }]);
  if (reason === 'master-off') state = snapshot([task], { ...prefs, enabled: false });
  if (reason === 'category-off') state = snapshot([task], { ...prefs, taskRemindersEnabled: false });
  if (reason === 'denied') permission('denied');
  const before = JSON.stringify(state);
  await run(state); expect(scheduled).toEqual([]); expect(JSON.stringify(state)).toBe(before);
  permission('granted'); await run(); expect(scheduled).toHaveLength(1);
});

it('ignores planned/due dates, estimates and completed history when deriving explicit reminders', async () => {
  await run(); const original = scheduled[0];
  await run(snapshot([{ ...task, plannedDate: '2098-12-15', dueDate: '2098-12-14', estimatedMinutes: 25 }]));
  expect(scheduled).toEqual([original]);
  await run(snapshot([{ ...task, reminderAt: null, plannedDate: '2099-01-03' }])); expect(scheduled).toEqual([]);
});

it('keeps one weekly local wall-clock schedule with explicit weekday conversion and replaces/clears it', async () => {
  const weekly = { ...prefs, weeklyPlanningEnabled: true, weeklyPlanningWeekday: 0, weeklyPlanningTime: '09:17' };
  await run(snapshot([], weekly)); await run(snapshot([], weekly));
  expect(scheduled).toHaveLength(1);
  expect(jest.mocked(Expo.scheduleNotificationAsync).mock.calls[0]![0].trigger).toEqual({ type: 'weekly', weekday: 1, hour: 9, minute: 17 });
  await run(snapshot([], { ...weekly, weeklyPlanningWeekday: 6, weeklyPlanningTime: '20:25' }));
  expect(scheduled).toHaveLength(1);
  expect(jest.mocked(Expo.scheduleNotificationAsync).mock.lastCall![0].trigger).toEqual({ type: 'weekly', weekday: 7, hour: 20, minute: 25 });
  await run(snapshot([], { ...weekly, weeklyPlanningEnabled: false })); expect(scheduled).toEqual([]);
});

it('removes prior-user scheduled/delivered notifications while preserving unrelated ones', async () => {
  const other = { identifier: 'another-feature', content: { data: { owner: 'other' } } };
  scheduled.push(other); await run(); presented = [...scheduled];
  await run(snapshot(), 'another-user');
  expect(scheduled).toHaveLength(2); expect(scheduled[0]).toBe(other);
  expect(presented).toEqual([other]);
  await run(snapshot(), null); expect(scheduled).toEqual([other]);
});

it('logout cleanup does not wait for a stale network fetch and that fetch cannot recreate notifications', async () => {
  await run();
  let finish!: (value: NotificationSnapshot) => void;
  let started!: () => void;
  const fetching = new Promise<void>(resolve => { started = resolve; });
  const old = reconciler.reconcile(user, () => { started(); return new Promise(resolve => { finish = resolve; }); });
  await fetching; await run(snapshot(), null); expect(scheduled).toEqual([]);
  finish(snapshot()); await old; expect(scheduled).toEqual([]);
});

it('keeps schedules on unavailable authoritative state and safely retries a partial scheduling failure', async () => {
  await run();
  await expect(reconciler.reconcile(user, async () => { throw new Error('offline'); })).rejects.toThrow('offline');
  expect(scheduled).toHaveLength(1);
  jest.mocked(Expo.scheduleNotificationAsync).mockRejectedValueOnce(new Error('OS failed'));
  const state = snapshot([{ ...task, reminderAt: '2099-01-03T09:10:00Z' }]);
  await expect(run(state)).rejects.toThrow('OS failed'); await run(state); await run(state);
  expect(scheduled).toHaveLength(1);
});

it('does not overclaim device capacity and reserves existing non-LifeOS requests', async () => {
  scheduled = [{ identifier: 'other', content: { data: {} } }];
  const tasks = Array.from({ length: 70 }, (_, i) => ({ ...task, id: String(i) }));
  const result = await run(snapshot(tasks));
  expect(result).toEqual({ scheduled: 63, deferred: 7 }); expect(scheduled).toHaveLength(64);
});

it('requests alert permission contextually once; denied/granted states do not repeat system prompts', async () => {
  permission('undetermined');
  jest.mocked(Expo.requestPermissionsAsync).mockResolvedValue({ status: 'denied', granted: false, canAskAgain: false, expires: 'never' } as Expo.NotificationPermissionsStatus);
  expect(await Promise.all([requestNotificationPermission(), requestNotificationPermission()])).toEqual(['denied', 'denied']);
  expect(Expo.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(Expo.requestPermissionsAsync).toHaveBeenCalledWith({ ios: { allowAlert: true, allowBadge: false, allowSound: false } });
  permission('denied'); expect(await requestNotificationPermission()).toBe('denied');
  permission('granted'); expect(await requestNotificationPermission()).toBe('allowed');
  expect(Expo.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
  await openNotificationSettings(); expect(open).toHaveBeenCalledTimes(1);
});

it('routes only owned responses, once per delivery, with a fresh weekly occurrence allowed', () => {
  const router = new NotificationResponseRouter();
  const request = desiredNotifications(user, snapshot(), now)[0]!;
  expect(router.consume(request, 1, user)).toEqual({ pathname: '/task', params: { id } });
  expect(router.consume(request, 1, user)).toBeNull();
  expect(router.consume(request, 2, 'other')).toBeNull();
  expect(router.consume(request, 3, null)).toBeNull();
  const weekly = { ...request, content: { ...request.content, data: { owner: 'lifeos', userId: user, kind: 'weekly' } } };
  expect(router.consume(weekly, 4, user)).toEqual({ pathname: '/week' });
  expect(router.consume(weekly, 5, user)).toEqual({ pathname: '/week' });
  expect(router.consume({ ...request, content: { data: { url: 'https://untrusted' } } }, 6, user)).toBeNull();
});

it('round trips exact local minutes and rejects missing or past reminders', () => {
  for (const time of ['09:10', '09:25', '09:17']) {
    const instant = reminderInstant('2099-01-05', time, now);
    expect(reminderLocalParts(instant)).toEqual({ date: '2099-01-05', time });
  }
  expect(() => reminderInstant('2000-01-01', '09:17', now)).toThrow('בעתיד');
  expect(() => reminderInstant('2099-01-05', null, now)).toThrow('תאריך ושעה');
  expect(() => reminderInstant('2099-02-30', '09:17', now)).toThrow();
});
