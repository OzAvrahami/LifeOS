import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import type { ReactNode } from 'react';

import * as settingsApi from '@/features/settings/settings.api';
import * as taskApi from '@/features/tasks/task.api';
import { NotificationSettingsScreen } from '@/features/notifications/notification-settings-screen';
import { NotificationContext } from '@/features/notifications/notification-context';
import { TaskReminderEditor } from '@/features/notifications/task-reminder-editor';
import { defaultNotificationPreferences, type NotificationPermission } from '@/features/notifications/notification.types';
import { reminderLocalParts } from '@/features/notifications/reminder-time';
import { TaskDetailScreen } from '@/features/tasks/task-detail-screen';
import type { Task } from '@/features/tasks/task.types';
import { TestProviders } from '../test-utils/test-providers';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { settingsKeys } from '@/features/settings/settings.queries';

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual('react-native');
  return function Picker(props: { mode: string }) { return <View {...props} testID={`native-${props.mode}`} />; };
});
jest.mock('@/features/settings/settings.api', () => ({ getSettings: jest.fn(), patchNotificationPreferences: jest.fn() }));
jest.mock('@/features/tasks/task.api', () => ({ listTasks: jest.fn(), updateTask: jest.fn(), cancelTask: jest.fn() }));
jest.mock('expo-notifications', () => ({}));

const prefs = { ...defaultNotificationPreferences, enabled: true, taskRemindersEnabled: true };
const settings = { notifications: prefs, persisted: true, timezone: 'Asia/Jerusalem', weekStartDay: 1 as const, defaultDailyCapacityMinutes: 480 };
const requestPermission = jest.fn(async () => {});
const reconcile = jest.fn(async () => {});
function wrap(children: ReactNode, permission: NotificationPermission = 'allowed') {
  return <TestProviders><NotificationContext.Provider value={{ permission, requestPermission, reconcile, error: false, result: null }}>{children}</NotificationContext.Provider></TestProviders>;
}
const press = async (label: string) => fireEvent.press(screen.getByLabelText(label));
const setTime = async (minute: number) => {
  await fireEvent(screen.getByTestId('native-time'), 'onChange', { type: 'set' }, new Date(2099, 0, 5, 9, minute));
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(settingsApi.getSettings).mockResolvedValue(settings);
  jest.mocked(settingsApi.patchNotificationPreferences).mockImplementation(async notifications => ({ ...settings, notifications }));
});

it.each<NotificationPermission>(['not_requested', 'allowed', 'denied', 'unavailable'])('exposes %s without requesting permission merely on opening Settings', async permission => {
  const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  await render(wrap(<NotificationSettingsScreen onBack={jest.fn()} />, permission));
  await screen.findByLabelText('הרשאת התראות');
  const labels = { not_requested: 'טרם התבקשה הרשאה', allowed: 'מותר', denied: 'חסום בהגדרות המכשיר', unavailable: 'קבלת התראות מקומיות זמינה ב־iPhone' };
  expect(screen.getByText(labels[permission])).toBeTruthy();
  expect(requestPermission).not.toHaveBeenCalled();
  if (permission === 'denied') {
    await press('פתיחת הגדרות iPhone'); expect(open).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('switch', { name: 'התראות LifeOS' })).toBeChecked();
  }
  expect(settingsApi.patchNotificationPreferences).not.toHaveBeenCalled();
  open.mockRestore();
});

it('saves explicit master/category/weekly weekday and exact time; turning off retains configured choices', async () => {
  jest.mocked(settingsApi.getSettings).mockResolvedValue({ ...settings, notifications: defaultNotificationPreferences });
  await render(wrap(<NotificationSettingsScreen onBack={jest.fn()} />, 'not_requested'));
  await screen.findByLabelText('התראות LifeOS');
  await press('התראות LifeOS'); await press('תזכורות למשימות'); await press('תזכורת לתכנון השבוע');
  expect(screen.getByLabelText('שמירת התראות')).toBeDisabled();
  expect(screen.queryByRole('radio', { name: 'שני' })).toBeNull();
  await press('הגדרות תזכורת לתכנון השבוע');
  await fireEvent.press(screen.getByRole('radio', { name: 'שני' }));
  await press('שעת תכנון השבוע'); await setTime(17);
  expect(settingsApi.patchNotificationPreferences).not.toHaveBeenCalled();
  await press('אישור שעה'); await press('שמירת התראות');
  const expected = { ...defaultNotificationPreferences, enabled: true, taskRemindersEnabled: true, weeklyPlanningEnabled: true, weeklyPlanningWeekday: 1, weeklyPlanningTime: '09:17' };
  await waitFor(() => expect(settingsApi.patchNotificationPreferences).toHaveBeenCalledWith(expected, 'Asia/Jerusalem', 'current-session'));
  await waitFor(() => expect(reconcile).toHaveBeenCalled());
  expect(requestPermission).toHaveBeenCalledTimes(1);
  expect(jest.mocked(settingsApi.patchNotificationPreferences).mock.invocationCallOrder[0]).toBeLessThan(requestPermission.mock.invocationCallOrder[0]);
  await press('תזכורות למשימות'); await press('תזכורת לתכנון השבוע'); await press('התראות LifeOS');
  await press('שמירת התראות');
  await waitFor(() => expect(settingsApi.patchNotificationPreferences).toHaveBeenLastCalledWith({ ...expected, enabled: false, taskRemindersEnabled: false, weeklyPlanningEnabled: false }, 'Asia/Jerusalem', 'current-session'));
  expect(requestPermission).toHaveBeenCalledTimes(1);
});

it('keeps category choices across hiding, master-off persistence and reopening', async () => {
  const saved = { ...prefs, commitmentRemindersEnabled: true, commitmentDefaultReminderMinutes: 30, weeklyPlanningEnabled: true, weeklyPlanningWeekday: 2, weeklyPlanningTime: '09:17' };
  jest.mocked(settingsApi.getSettings).mockResolvedValue({ ...settings, notifications: saved });
  const view = await render(wrap(<NotificationSettingsScreen onBack={jest.fn()} />));
  await screen.findByRole('switch', { name: 'התראות LifeOS' });
  expect(screen.queryByRole('radio', { name: 'שלישי' })).toBeNull();
  await press('הגדרות תזכורת לתכנון השבוע');
  expect(screen.getByRole('radio', { name: 'שלישי' })).toBeChecked();
  expect(screen.getByText('09:17')).toBeTruthy();
  await press('סגירת הגדרות תכנון השבוע');
  expect(screen.queryByText('09:17')).toBeNull();
  await press('התראות LifeOS');
  for (const name of ['תזכורות למשימות', 'תזכורות להתחייבויות', 'תזכורת לתכנון השבוע']) {
    expect(screen.getByRole('switch', { name })).toBeDisabled();
    expect(screen.getByRole('switch', { name })).toBeChecked();
    await press(name);
  }
  await press('שמירת התראות');
  await waitFor(() => expect(settingsApi.patchNotificationPreferences).toHaveBeenCalledWith({ ...saved, enabled: false }, 'Asia/Jerusalem', 'current-session'));
  expect(requestPermission).not.toHaveBeenCalled();
  await view.unmount();
  jest.mocked(settingsApi.getSettings).mockResolvedValue({ ...settings, notifications: { ...saved, enabled: false } });
  await render(wrap(<NotificationSettingsScreen onBack={jest.fn()} />));
  await screen.findByRole('switch', { name: 'התראות LifeOS' });
  await press('התראות LifeOS');
  await press('הגדרות תזכורת לתכנון השבוע');
  expect(screen.getByRole('radio', { name: 'שלישי' })).toBeChecked();
  expect(screen.getByText('09:17')).toBeTruthy();
  await press('הגדרות תזכורות להתחייבויות');
  expect(screen.queryByText('09:17')).toBeNull();
  expect(screen.getByRole('radio', { name: '30 דקות לפני', selected: true })).toBeTruthy();
});

it('preserves a failed draft for retry and discards it only on explicit cancellation', async () => {
  jest.mocked(settingsApi.patchNotificationPreferences).mockRejectedValueOnce(new Error('offline'));
  await render(wrap(<NotificationSettingsScreen onBack={jest.fn()} />));
  await screen.findByRole('switch', { name: 'התראות LifeOS' });
  await press('תזכורות למשימות'); await press('שמירת התראות');
  await screen.findByText('לא הצלחנו לשמור את ההגדרות. הבחירות נשארו כאן ואפשר לנסות שוב.');
  expect(screen.getByRole('switch', { name: 'תזכורות למשימות' })).not.toBeChecked();
  expect(requestPermission).not.toHaveBeenCalled();
  await press('שמירת התראות');
  await waitFor(() => expect(reconcile).toHaveBeenCalledTimes(1));
  expect(settingsApi.patchNotificationPreferences).toHaveBeenCalledTimes(2);
  await press('תזכורות למשימות'); await press('ביטול השינויים');
  expect(screen.getByRole('switch', { name: 'תזכורות למשימות' })).not.toBeChecked();
  expect(settingsApi.patchNotificationPreferences).toHaveBeenCalledTimes(2);
});

it('does not erase unsaved choices when the server settings cache refreshes', async () => {
  let client!: QueryClient;
  function Capture() { client = useQueryClient(); return <NotificationSettingsScreen onBack={jest.fn()} />; }
  await render(wrap(<Capture />));
  await screen.findByRole('switch', { name: 'התראות LifeOS' });
  await press('תזכורות למשימות');
  await act(() => client.setQueryData(settingsKeys.user('current-session'), { ...settings, notifications: { ...prefs, commitmentDefaultReminderMinutes: 60 } }));
  expect(screen.getByRole('switch', { name: 'תזכורות למשימות' })).not.toBeChecked();
  await press('ביטול השינויים');
  expect(screen.getByRole('switch', { name: 'תזכורות למשימות' })).toBeChecked();
  expect(settingsApi.patchNotificationPreferences).not.toHaveBeenCalled();
});

it('isolates drafts and ignores an old account save acknowledgement after switching accounts', async () => {
  let finish!: (value: typeof settings) => void;
  jest.mocked(settingsApi.patchNotificationPreferences).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const tree = (userId: string) => wrap(<TaskQueryScopeProvider userId={userId}><NotificationSettingsScreen onBack={jest.fn()} /></TaskQueryScopeProvider>);
  const view = await render(tree('account-a'));
  await screen.findByRole('switch', { name: 'התראות LifeOS' });
  await press('תזכורות למשימות'); await press('שמירת התראות');
  expect(settingsApi.patchNotificationPreferences).toHaveBeenCalledWith({ ...prefs, taskRemindersEnabled: false }, 'Asia/Jerusalem', 'account-a');
  jest.mocked(settingsApi.getSettings).mockResolvedValue({ ...settings, notifications: defaultNotificationPreferences });
  await view.rerender(tree('account-b'));
  await waitFor(() => expect(settingsApi.getSettings).toHaveBeenCalledWith('account-b'));
  await screen.findByRole('switch', { name: 'התראות LifeOS' });
  await act(() => finish({ ...settings, notifications: { ...prefs, taskRemindersEnabled: false } }));
  expect(screen.getByRole('switch', { name: 'התראות LifeOS' })).not.toBeChecked();
  expect(screen.getByRole('switch', { name: 'תזכורות למשימות' })).toBeDisabled();
  expect(requestPermission).not.toHaveBeenCalled(); expect(reconcile).not.toHaveBeenCalled();
  expect(screen.queryByText('ביטול השינויים')).toBeNull();
});

it('sets and reopens exact reminder minutes only after persistence, then clears without stale wheel state', async () => {
  const save = jest.fn(async (_value: string | null) => {});
  const close = jest.fn();
  const rendered = await render(wrap(<TaskReminderEditor value={null} onSave={save} onCancel={close} />));
  await waitFor(() => expect(settingsApi.getSettings).toHaveBeenCalled());
  await press('הוספת תזכורת');
  await fireEvent.press(screen.getByRole('button', { name: /^תאריך תזכורת:/ }));
  await fireEvent(screen.getByTestId('native-date'), 'onValueChange', {}, new Date(2099, 0, 5));
  await press('אישור תאריך');
  await press('שעת תזכורת'); await setTime(10); await setTime(25); await setTime(17);
  expect(save).not.toHaveBeenCalled();
  await press('אישור שעה'); await press('שמירת תזכורת');
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  const instant = save.mock.calls[0][0]!;
  expect(reminderLocalParts(instant)).toEqual({ date: '2099-01-05', time: '09:17' });
  expect(save.mock.invocationCallOrder[0]).toBeLessThan(requestPermission.mock.invocationCallOrder[0]);
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  await rendered.rerender(wrap(<TaskReminderEditor key="reopen" value={instant} onSave={save} onCancel={close} />));
  expect(screen.getByText('09:17')).toBeTruthy();
  await press('שעת תזכורת');
  const abandoned = screen.getByTestId('native-time').props.onChange;
  await setTime(25); await press('ביטול בחירת שעה');
  expect(screen.getByText('09:17')).toBeTruthy();
  await press('שעת תזכורת'); await press('ניקוי תזכורת');
  await act(() => abandoned({ type: 'set' }, new Date(2099, 0, 5, 10, 25)));
  await press('שמירת תזכורת');
  await waitFor(() => expect(save).toHaveBeenLastCalledWith(null));
  await rendered.rerender(wrap(<TaskReminderEditor key="cleared" value={null} onSave={save} onCancel={close} />));
  expect(screen.getByLabelText('הוספת תזכורת')).toBeTruthy();
  expect(screen.queryByText('09:17')).toBeNull();
});

it('rejects past and incomplete reminders, preserves draft on save failure, and cancellation does not save', async () => {
  const save = jest.fn(async () => { throw new Error('offline'); });
  const close = jest.fn();
  const rendered = await render(wrap(<TaskReminderEditor value="2000-01-05T09:17:00Z" onSave={save} onCancel={close} />, 'denied'));
  await press('שמירת תזכורת');
  expect(screen.getByRole('alert')).toHaveTextContent('צריך לבחור תזכורת בעתיד.'); expect(save).not.toHaveBeenCalled();
  await rendered.rerender(wrap(<TaskReminderEditor key="future" value="2099-01-05T09:17:00Z" onSave={save} onCancel={close} />));
  await press('שמירת תזכורת');
  await screen.findByText('לא הצלחנו לשמור את התזכורת. אפשר לנסות שוב.');
  expect(screen.getByLabelText('שעת תזכורת')).toBeTruthy(); expect(close).not.toHaveBeenCalled();
  await press('ביטול עריכת תזכורת'); expect(close).toHaveBeenCalledTimes(1); expect(save).toHaveBeenCalledTimes(1);
  await rendered.rerender(wrap(<TaskReminderEditor key="empty" value={null} onSave={save} onCancel={close} />));
  await press('הוספת תזכורת'); await press('שמירת תזכורת');
  expect(screen.getByRole('alert')).toHaveTextContent(/תאריך ושעה/); expect(save).toHaveBeenCalledTimes(1);
});

it('opens the real task detail, persists only reminder intent and handles a missing notification task safely', async () => {
  const task: Task = { id: '11111111-1111-4111-8111-111111111111', title: 'Original task', description: 'Keep', plannedDate: '2099-01-02', dueDate: '2099-01-03', reminderAt: '2099-01-05T09:17:00Z',
    status: 'open', priority: 'normal', estimatedMinutes: 17, position: 0, weekPlanId: null, completedAt: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
  jest.mocked(taskApi.listTasks).mockResolvedValue([task]);
  jest.mocked(taskApi.updateTask).mockImplementation(async ({ input }) => ({ ...task, ...input }));
  const back = jest.fn();
  const rendered = await render(wrap(<TaskDetailScreen id={task.id} onBack={back} />));
  await screen.findByText('Original task'); await press('הזכר לי'); await press('ניקוי תזכורת'); await press('שמירת תזכורת');
  await waitFor(() => expect(jest.mocked(taskApi.updateTask).mock.calls[0][0]).toEqual({ id: task.id, input: { reminderAt: null } }));
  await screen.findByText('Original task'); expect(back).not.toHaveBeenCalled();
  expect(screen.getByText('מועד אחרון: 2099-01-03')).toBeTruthy();
  await rendered.rerender(wrap(<TaskDetailScreen id="invalid" onBack={back} />));
  expect(screen.getByText('המשימה אינה זמינה עוד.')).toBeTruthy();
  jest.mocked(taskApi.listTasks).mockResolvedValue([]);
  await rendered.rerender(wrap(<TaskDetailScreen id="22222222-2222-4222-8222-222222222222" onBack={back} />));
  await screen.findByText('המשימה אינה זמינה עוד.'); expect(taskApi.cancelTask).not.toHaveBeenCalled();
});
