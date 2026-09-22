import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CommitmentEditor } from '@/features/commitments/commitment-editor';
import { CommitmentDetailScreen } from '@/features/commitments/commitment-detail-screen';
import { NotificationSettingsScreen } from '@/features/notifications/notification-settings-screen';
import { defaultNotificationPreferences } from '@/features/notifications/notification.types';
import * as settingsApi from '@/features/settings/settings.api';
import * as commitmentApi from '@/features/commitments/commitment.api';
import type { Commitment } from '@/features/commitments/commitment.types';
import { TestProviders } from '../test-utils/test-providers';

jest.mock('@/features/settings/settings.api', () => ({ getSettings: jest.fn(), patchNotificationPreferences: jest.fn() }));
jest.mock('@/features/commitments/commitment.api', () => ({ listCommitments: jest.fn(), updateCommitment: jest.fn(), deleteCommitment: jest.fn() }));
jest.mock('@/features/commitments/commitment-date-time-fields', () => {
  const { TextInput } = jest.requireActual('react-native');
  return {
    CommitmentTimePickerProvider: ({ children }: { children: React.ReactNode }) => children,
    CommitmentTimePicker: () => null,
    CommitmentDateField: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <TextInput accessibilityLabel="תאריך" value={value} onChangeText={onChange} />,
    CommitmentTimeField: ({ value, onChange, accessibilityLabel }: { value: string; onChange: (value: string) => void; accessibilityLabel: string }) => <TextInput accessibilityLabel={accessibilityLabel} value={value ?? ''} onChangeText={onChange} />,
  };
});
const prefs = { ...defaultNotificationPreferences, enabled: true, commitmentRemindersEnabled: true, commitmentDefaultReminderMinutes: 30 };
const settings = { persisted: true, timezone: 'UTC', weekStartDay: 0, defaultDailyCapacityMinutes: 360, notifications: prefs };
const item = { id: '11111111-1111-4111-8111-111111111111', title: 'פגישה', date: '2099-01-02', startTime: '12:37', endTime: null, reminderMinutesBefore: 15 } as Commitment;
const press = async (name: string) => fireEvent.press(screen.getByRole('radio', { name }));
beforeEach(() => {
  jest.clearAllMocks(); jest.mocked(settingsApi.getSettings).mockResolvedValue(settings);
  jest.mocked(settingsApi.patchNotificationPreferences).mockImplementation(async notifications => ({ ...settings, notifications }));
});

it.each([false, true])('new commitment applies the visible account default only when category enabled=%s', async enabled => {
  const save = jest.fn(async () => {});
  await render(<TestProviders><CommitmentEditor visible initialDate="2099-01-02" notificationPreferences={{ ...prefs, commitmentRemindersEnabled: enabled }} onSave={save} onClose={jest.fn()} /></TestProviders>);
  expect(screen.getByRole('radio', { name: enabled ? '30 דקות לפני' : 'ללא תזכורת' })).toBeSelected();
  await fireEvent.changeText(screen.getByLabelText('כותרת התחייבות'), 'New');
  await fireEvent.changeText(screen.getByLabelText('שעת התחלה'), '12:37');
  await fireEvent.press(screen.getByLabelText('שמירת התחייבות'));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ reminderMinutesBefore: enabled ? 30 : null, startTime: '12:37', endTime: null })));
});

it('edits presets/custom/remove; legacy commitments do not inherit defaults; invalid custom values prevent save', async () => {
  const save = jest.fn(async () => {});
  await render(<TestProviders><CommitmentEditor visible commitment={{ ...item, reminderMinutesBefore: null }} initialDate={item.date} notificationPreferences={prefs} onSave={save} onClose={jest.fn()} /></TestProviders>);
  expect(screen.getByRole('radio', { name: 'ללא תזכורת' })).toBeSelected();
  for (const name of ['בזמן ההתחייבות', '5 דקות לפני', '15 דקות לפני', '30 דקות לפני', 'שעה לפני']) {
    await press(name); expect(screen.getByRole('radio', { name })).toBeSelected();
  }
  await press('מותאם אישית'); await fireEvent.changeText(screen.getByLabelText('דקות לפני ההתחייבות'), '1441');
  expect(screen.getByLabelText('שמירת התחייבות')).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('דקות לפני ההתחייבות'), '37');
  await fireEvent.press(screen.getByLabelText('שמירת התחייבות'));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ reminderMinutesBefore: 37, endTime: null })));
});

it('clears an existing reminder and preserves a past lead with a visible no-reschedule warning', async () => {
  const save = jest.fn(async () => {});
  const view = await render(<TestProviders><CommitmentEditor visible commitment={{ ...item, date: '2000-01-01' }} initialDate={item.date} notificationPreferences={prefs} onSave={save} onClose={jest.fn()} /></TestProviders>);
  expect(screen.getByText(/זמן התזכורת כבר עבר/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('שמירת התחייבות'));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ reminderMinutesBefore: 15 })));
  await view.unmount();
  await render(<TestProviders><CommitmentEditor visible commitment={item} initialDate={item.date} notificationPreferences={prefs} onSave={save} onClose={jest.fn()} /></TestProviders>);
  await press('ללא תזכורת'); await fireEvent.press(screen.getByLabelText('שמירת התחייבות'));
  await waitFor(() => expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ reminderMinutesBefore: null })));
});

it('preserves unsaved lead on API failure for retry', async () => {
  const save = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  await render(<TestProviders><CommitmentEditor visible commitment={item} initialDate={item.date} notificationPreferences={prefs} onSave={save} onClose={jest.fn()} /></TestProviders>);
  await press('5 דקות לפני'); await fireEvent.press(screen.getByLabelText('שמירת התחייבות'));
  await screen.findByText('לא הצלחנו לשמור. אפשר לנסות שוב.');
  expect(screen.getByRole('radio', { name: '5 דקות לפני' })).toBeSelected();
  await fireEvent.press(screen.getByLabelText('שמירת התחייבות'));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
});

it('Settings saves explicit commitment category/default without altering other intent', async () => {
  await render(<TestProviders><NotificationSettingsScreen onBack={jest.fn()} /></TestProviders>);
  await screen.findByRole('switch', { name: 'תזכורות להתחייבויות' });
  await press('מותאם אישית'); await fireEvent.changeText(screen.getByLabelText('דקות לפני ההתחייבות'), '37');
  await fireEvent.press(screen.getByLabelText('שמירת התראות'));
  await waitFor(() => expect(settingsApi.patchNotificationPreferences).toHaveBeenCalledWith({ ...prefs, commitmentDefaultReminderMinutes: 37 }, 'UTC'));
  await fireEvent.press(screen.getByRole('switch', { name: 'תזכורות להתחייבויות' }));
  await fireEvent.press(screen.getByLabelText('שמירת התראות'));
  await waitFor(() => expect(settingsApi.patchNotificationPreferences).toHaveBeenLastCalledWith({ ...prefs, commitmentRemindersEnabled: false, commitmentDefaultReminderMinutes: 37 }, 'UTC'));
});

it('notification details resolve the latest date and reuse the editor; missing/deleted records show an unavailable state', async () => {
  jest.mocked(commitmentApi.listCommitments).mockResolvedValue([{ ...item, date: '2099-02-03' }]);
  const view = await render(<TestProviders><CommitmentDetailScreen id={item.id} onBack={jest.fn()} /></TestProviders>);
  await screen.findByLabelText('עורך התחייבות');
  expect(commitmentApi.listCommitments).toHaveBeenCalledWith({ id: item.id });
  expect(screen.getByLabelText('תאריך')).toHaveDisplayValue('2099-02-03');
  await view.unmount(); jest.mocked(commitmentApi.listCommitments).mockResolvedValue([]);
  await render(<TestProviders><CommitmentDetailScreen id={item.id} onBack={jest.fn()} /></TestProviders>);
  await screen.findByText('ההתחייבות אינה זמינה עוד.');
  expect(screen.queryByLabelText('עורך התחייבות')).toBeNull();
});
