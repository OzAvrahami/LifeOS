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
  await fireEvent.press(screen.getByRole('radio', { name: 'שני' }));
  await press('שעת תכנון השבוע'); await setTime(17);
  expect(settingsApi.patchNotificationPreferences).not.toHaveBeenCalled();
  await press('אישור שעה'); await press('שמירת התראות');
  const expected = { ...defaultNotificationPreferences, enabled: true, taskRemindersEnabled: true, weeklyPlanningEnabled: true, weeklyPlanningWeekday: 1, weeklyPlanningTime: '09:17' };
  await waitFor(() => expect(settingsApi.patchNotificationPreferences).toHaveBeenCalledWith(expected, 'Asia/Jerusalem'));
  await waitFor(() => expect(reconcile).toHaveBeenCalled());
  expect(requestPermission).toHaveBeenCalledTimes(1);
  expect(jest.mocked(settingsApi.patchNotificationPreferences).mock.invocationCallOrder[0]).toBeLessThan(requestPermission.mock.invocationCallOrder[0]);
  await press('התראות LifeOS'); await press('תזכורות למשימות'); await press('תזכורת לתכנון השבוע');
  await press('שמירת התראות');
  await waitFor(() => expect(settingsApi.patchNotificationPreferences).toHaveBeenLastCalledWith({ ...expected, enabled: false, taskRemindersEnabled: false, weeklyPlanningEnabled: false }, 'Asia/Jerusalem'));
  expect(requestPermission).toHaveBeenCalledTimes(1);
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
