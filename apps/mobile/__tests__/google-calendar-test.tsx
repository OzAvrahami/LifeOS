import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { apiRequest } from '@/lib/api/client';
import { GoogleCalendarScreen } from '@/features/settings/google-calendar-screen';
import { googleAttemptStorage, useGoogleCalendar, type GoogleConnection } from '@/features/settings/google-calendar.api';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import { CommitmentEditor } from '@/features/commitments/commitment-editor';
import { commitmentTimeLabel } from '@/features/commitments/commitment-presentation';
import { commitmentDurationMinutes } from '@/features/commitments/commitment.metrics';
import type { Commitment } from '@/features/commitments/commitment.types';
import { synchronizeCommitmentCaches, commitmentKeys } from '@/features/commitments/commitment.queries';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { TestProviders } from '../test-utils/test-providers';
import { rememberAuthDestination, consumeAuthDestination } from '@/features/auth/auth-destination';

jest.mock('@/lib/api/client', () => ({ apiRequest: jest.fn() }));
jest.mock('expo-notifications', () => ({}));
const api = jest.mocked(apiRequest);
const calendars = [
  { id: 'first', summary: 'יומן עם שם עברי ארוך מאוד ששומר על פריסת המסך', timeZone: 'Asia/Jerusalem', accessRole: 'owner', selected: false },
  { id: 'busy', summary: 'זמינות בלבד', timeZone: 'UTC', accessRole: 'freeBusyReader', selected: false },
];
let state: GoogleConnection;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(googleAttemptStorage, 'read').mockResolvedValue(null);
  jest.spyOn(googleAttemptStorage, 'save').mockResolvedValue();
  jest.spyOn(googleAttemptStorage, 'clear').mockResolvedValue();
  state = { configured: true, status: 'connected', revision: 1, email: 'fixture@example.test', calendars: [] };
  api.mockImplementation(async (path, options) => {
    if (path.endsWith('/calendars')) state = { ...state, revision: state.revision + 1, calendars };
    if (path.endsWith('/selection')) {
      const body = JSON.parse(options!.body as string);
      state = { ...state, revision: state.revision + 1, calendars: state.calendars.map(c => ({ ...c, selected: body.ids.includes(c.id) })) };
    }
    if (path.endsWith('/disconnect')) state = { ...state, status: 'disconnected', revision: state.revision + 1, calendars: [] };
    if (path.endsWith('/authorize')) return { id: 'attempt-fixture', proof: 'fixture-proof', authorizationUrl: 'https://accounts.google.com/fixture' };
    return state;
  });
});
afterEach(() => jest.restoreAllMocks());
const page = (user = 'owner-A') => <TestProviders><TaskQueryScopeProvider userId={user}><GoogleCalendarScreen onBack={jest.fn()} /></TaskQueryScopeProvider></TestProviders>;

it('requires explicit readable calendar selection, saving and then importing; hides no provider writes', async () => {
  await render(page());
  await fireEvent.press(await screen.findByRole('button', { name: 'טעינת רשימת היומנים' }));
  const calendar = await screen.findByRole('checkbox', { name: calendars[0]!.summary });
  expect(calendar).not.toBeChecked(); expect(screen.getByRole('checkbox', { name: 'זמינות בלבד' })).toBeDisabled();
  await fireEvent.press(calendar);
  expect(screen.getByRole('button', { name: 'ייבוא מהיומנים שנבחרו' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'שמירת בחירת היומנים' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'ייבוא מהיומנים שנבחרו' })).not.toBeDisabled());
  expect(api.mock.calls.some(([path]) => path.endsWith('/import'))).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'ייבוא מהיומנים שנבחרו' }));
  await waitFor(() => expect(api).toHaveBeenCalledWith('/integrations/google/import', expect.objectContaining({ expectedUserId: 'owner-A', method: 'POST' })));
  expect(screen.getByText(calendars[0]!.summary)).toHaveStyle({ textAlign: 'right', writingDirection: 'rtl' });
});
it('truthfully distinguishes missing setup, disconnected, failed and reconnect-required', async () => {
  state = { ...state, configured: false, status: 'unavailable' };
  const view = await render(page()); await screen.findByText('החיבור עדיין אינו זמין');
  expect(screen.queryByRole('button', { name: 'חיבור חשבון Google' })).toBeNull();
  await view.unmount(); state = { ...state, configured: true, status: 'reconnect_required' };
  await render(page()); await screen.findByText('נדרש חיבור מחדש');
  expect(screen.getByRole('button', { name: 'חיבור מחדש ל־Google' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'ייבוא מהיומנים שנבחרו' })).toBeNull();
});
it('authorization stores only the account-scoped completion proof; cancel does not import', async () => {
  state.status = 'disconnected'; const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  await render(page()); await fireEvent.press(await screen.findByRole('button', { name: 'חיבור חשבון Google' }));
  await waitFor(() => expect(open).toHaveBeenCalledWith('https://accounts.google.com/fixture'));
  expect(googleAttemptStorage.save).toHaveBeenCalledWith('owner-A', { id: 'attempt-fixture', proof: 'fixture-proof' });
  await fireEvent.press(await screen.findByRole('button', { name: 'ביטול בקשת החיבור' }));
  await waitFor(() => expect(googleAttemptStorage.clear).toHaveBeenCalledWith('owner-A'));
  expect(api.mock.calls.some(([path]) => path.endsWith('/import') || path.endsWith('/complete'))).toBe(false);
});
it('disconnect requires confirmation and preserves state on cancellation', async () => {
  await render(page()); await fireEvent.press(await screen.findByRole('button', { name: 'ניתוק Google' }));
  await fireEvent.press(screen.getByRole('button', { name: 'ביטול' }));
  expect(api.mock.calls.some(([path]) => path.endsWith('/disconnect'))).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'ניתוק Google' }));
  await fireEvent.press(screen.getByRole('button', { name: 'אישור ניתוק' }));
  await screen.findByText('לא מחובר');
});
it('shows retry failure and binds queries to the active account', async () => {
  api.mockRejectedValueOnce(new Error('offline'));
  const view = await render(page()); await screen.findByText('לא הצלחנו לבדוק את החיבור.');
  await view.unmount(); state.status = 'disconnected';
  await render(page('owner-B')); await screen.findByText('לא מחובר');
  expect(api).toHaveBeenLastCalledWith('/integrations/google', expect.objectContaining({ expectedUserId: 'owner-B' }));
});

const imported: Commitment = { id: 'imported', title: 'אירוע עם כותרת ארוכה', description: 'שורה ראשונה\nשורה שנייה', location: 'בניין א', date: '2026-10-09', endDate: '2026-10-10', startTime: null, endTime: null, lifeArea: null, createdAt: '', updatedAt: '',
  calendarSource: { provider: 'google', accountId: 'subject', calendarId: 'calendar', calendarName: 'אישי', eventId: 'event', readOnly: true, allDay: true, timeZone: 'UTC', displayTimeZone: 'Asia/Jerusalem', startAt: null, endAt: null, endDateExclusive: '2026-10-11', accessRole: 'owner', transparency: 'opaque' } };
it('imported details preserve description/location and cannot invoke the local editor or reminders', async () => {
  const save = jest.fn(); const remove = jest.fn();
  await render(<TestProviders><CommitmentEditor commitment={imported} initialDate={imported.date} visible onClose={jest.fn()} onSave={save} onDelete={remove} /></TestProviders>);
  expect(screen.getByText(imported.description!)).toBeTruthy(); expect(screen.getByText('בניין א')).toBeTruthy();
  expect(screen.queryByLabelText('שמירת התחייבות')).toBeNull(); expect(screen.queryByText('מחיקת ההתחייבות')).toBeNull();
  expect(save).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
});
it('multi-day cache membership and counts stay unique and account isolated', () => {
  const client = new QueryClient();
  for (const date of ['2026-10-09', '2026-10-10', '2026-10-11']) client.setQueryData(commitmentKeys.list('A', { date }), []);
  client.setQueryData(commitmentKeys.list('B', { date: imported.date }), []);
  synchronizeCommitmentCaches(client, 'A', imported, 'upsert'); synchronizeCommitmentCaches(client, 'A', imported, 'upsert');
  expect(client.getQueryData(commitmentKeys.list('A', { date: '2026-10-10' }))).toEqual([imported]);
  expect(client.getQueryData(commitmentKeys.list('A', { date: '2026-10-11' }))).toEqual([]);
  expect(client.getQueryData(commitmentKeys.list('B', { date: imported.date }))).toEqual([]); client.clear();
  expect(commitmentTimeLabel(imported)).toContain('כל היום'); expect(commitmentDurationMinutes(imported)).toBe(0);
  const timed = { ...imported, startTime: '01:30', endTime: '03:30', calendarSource: { ...imported.calendarSource!, allDay: false, startAt: '2026-03-08T01:30:00-05:00', endAt: '2026-03-08T03:30:00-04:00' } };
  expect(commitmentDurationMinutes(timed)).toBe(60);
  expect(commitmentDurationMinutes({ ...timed, calendarSource: { ...timed.calendarSource, transparency: 'transparent' } })).toBe(0);
});

it('preserves only a validated internal Google return through sign-in; never provider credentials or arbitrary URLs', () => {
  const attempt = '7d4a9b1f-b253-4a58-8fda-d7ca74af629a'; const receipt = 'r'.repeat(43);
  rememberAuthDestination('/settings/google-return', undefined, { attempt, receipt, result: 'ready', code: 'never-retain', next: 'https://example.test' });
  const target = consumeAuthDestination();
  expect(target).toContain('/settings/google-return?'); expect(target).toContain(receipt); expect(target).not.toContain('never-retain'); expect(target).not.toContain('example.test');
  rememberAuthDestination('https://example.test'); expect(consumeAuthDestination()).toBe('/');
  rememberAuthDestination('/settings/google-return', undefined, { attempt: '../bad', result: 'ready' }); expect(consumeAuthDestination()).toBe('/');
});

it('confirmed disconnect hides cached imports immediately while retaining local and other-account data', async () => {
  const { result } = await renderHook(() => ({ google: useGoogleCalendar(), client: useQueryClient() }), { wrapper: TestProviders });
  const key = commitmentKeys.list('current-session', { date: imported.date });
  const other = commitmentKeys.list('other-user', { date: imported.date });
  const local = { ...imported, id: 'local', calendarSource: undefined, startTime: '09:00' };
  result.current.client.setQueryData(key, [imported, local]); result.current.client.setQueryData(other, [imported]);
  await act(() => result.current.google.accept({ ...state, status: 'disconnected', calendars: [] }));
  expect(result.current.client.getQueryData(key)).toEqual([local]);
  expect(result.current.client.getQueryData(other)).toEqual([imported]);
});
