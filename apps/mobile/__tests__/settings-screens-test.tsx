import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@testing-library/react-native';
import { useEffect, type PropsWithChildren, type ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccountScreen } from '@/features/settings/account-screen';
import { DailyCapacityScreen } from '@/features/settings/daily-capacity-screen';
import { DayWindowScreen } from '@/features/settings/day-window-screen';
import { MoreScreen } from '@/features/settings/more-screen';
import * as settingsApi from '@/features/settings/settings.api';
import { settingsKeys } from '@/features/settings/settings.queries';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { TimezoneScreen } from '@/features/settings/timezone-screen';
import type { UserSettings } from '@/features/settings/settings.types';
import { WeekStartScreen } from '@/features/settings/week-start-screen';
import * as taskApi from '@/features/tasks/task.api';
import { DemoTaskProvider } from '@/features/tasks/demo-task-provider';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';

jest.mock('@/features/settings/settings.api', () => ({
  getSettings: jest.fn(),
  putSettings: jest.fn(),
}));
jest.mock('@/features/tasks/task.api', () => ({
  cancelTask: jest.fn(), createTask: jest.fn(), listTasks: jest.fn(), updateTask: jest.fn(),
}));

const mockSignOut = jest.fn();
const mockAuthUser = {
  email: 'oz@example.com',
  id: 'settings-user',
  user_metadata: { name: 'עוז אברהמי' },
};
jest.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({ signOut: mockSignOut, user: mockAuthUser }),
}));

const userId = mockAuthUser.id;
const initialMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};
const initialSettings: UserSettings = {
  dayEndTime: null,
  dayStartTime: null,
  dayWindowSupported: true,
  defaultDailyCapacityMinutes: 360,
  persisted: true,
  timezone: 'Asia/Jerusalem',
  weekStartDay: 0,
};

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
}

function Providers({ children, queryClient }: PropsWithChildren<{ queryClient: QueryClient }>) {
  useEffect(() => () => queryClient.clear(), [queryClient]);
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <QueryClientProvider client={queryClient}>
        <TaskQueryScopeProvider userId={userId}>
          <DemoTaskProvider>{children}</DemoTaskProvider>
        </TaskQueryScopeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

async function renderSettings(ui: ReactElement, settings = initialSettings) {
  const queryClient = makeClient();
  queryClient.setQueryData(settingsKeys.user(userId), settings);
  return {
    queryClient,
    ...await render(<Providers queryClient={queryClient}>{ui}</Providers>),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(settingsApi.getSettings).mockResolvedValue(initialSettings);
  jest.mocked(taskApi.createTask).mockRejectedValue(new Error('not used'));
  mockSignOut.mockResolvedValue(undefined);
});

describe('More and Settings screens', () => {
  it('makes More navigation functional and reuses Quick Capture', async () => {
    const onSettings = jest.fn();
    const onAccount = jest.fn();
    const onToday = jest.fn();
    const onWeek = jest.fn();
    const onInbox = jest.fn();
    await renderSettings(
      <MoreScreen
        onNavigateAccount={onAccount}
        onNavigateInbox={onInbox}
        onNavigateSettings={onSettings}
        onNavigateToday={onToday}
        onNavigateWeek={onWeek}
      />,
    );
    const user = userEvent.setup();
    await user.press(screen.getByLabelText('הגדרות'));
    await user.press(screen.getByLabelText('חשבון'));
    await user.press(screen.getByText('היום'));
    await user.press(screen.getByText('שבוע'));
    await user.press(screen.getByText('Inbox'));
    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(onAccount).toHaveBeenCalledTimes(1);
    expect(onToday).toHaveBeenCalledTimes(1);
    expect(onWeek).toHaveBeenCalledTimes(1);
    expect(onInbox).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('תחומי חיים').props.accessibilityState.disabled).toBe(true);
    await user.press(screen.getByLabelText('הוספה מהירה'));
    expect(screen.getByLabelText('כותרת')).toBeTruthy();
  });

  it('navigates from Settings and displays persisted values with a dynamic offset', async () => {
    const dayWindow = jest.fn();
    const week = jest.fn();
    const timezone = jest.fn();
    await renderSettings(<SettingsScreen onBack={jest.fn()} onDayWindow={dayWindow} onTimezone={timezone} onWeekStart={week} />);
    const user = userEvent.setup();
    expect(screen.getAllByText('לא הוגדר')).toHaveLength(2);
    expect(screen.getByText('ראשון')).toBeTruthy();
    expect(screen.getByText(/ישראל · GMT\+/)).toBeTruthy();
    await user.press(screen.getByLabelText('תחילת היום: לא הוגדר'));
    await user.press(screen.getByLabelText('תחילת שבוע: ראשון'));
    expect(dayWindow).toHaveBeenCalledTimes(1);
    expect(week).toHaveBeenCalledTimes(1);
  });

  it('saves Daily Capacity as complete settings without refetching', async () => {
    const capacitySaved = { ...initialSettings, defaultDailyCapacityMinutes: 480 };
    jest.mocked(settingsApi.putSettings).mockResolvedValueOnce(capacitySaved);
    const capacityClose = jest.fn();
    const capacityRender = await renderSettings(<DailyCapacityScreen onClose={capacityClose} />);
    const user = userEvent.setup();
    await user.press(screen.getByLabelText('8 שעות'));
    await user.press(screen.getByLabelText('שמירת זמן זמין ביום'));
    await waitFor(() => expect(capacityClose).toHaveBeenCalledTimes(1));
    expect(jest.mocked(settingsApi.putSettings).mock.calls.at(-1)?.[0]).toEqual({
      defaultDailyCapacityMinutes: 480,
      timezone: 'Asia/Jerusalem',
      weekStartDay: 0,
    });
    expect(capacityRender.queryClient.getQueryData(settingsKeys.user(userId))).toEqual(capacitySaved);
  });

  it('saves and reloads an overnight Day Window through the caller cache', async () => {
    const configured = { ...initialSettings, dayEndTime: '01:00', dayStartTime: '07:00' };
    jest.mocked(settingsApi.putSettings).mockResolvedValueOnce(configured);
    const onBack = jest.fn();
    const rendered = await renderSettings(<DayWindowScreen onBack={onBack} />, configured);
    expect(screen.getByLabelText('סיום ביום הבא')).toBeTruthy();
    expect(screen.getByText('07:00')).toBeTruthy();
    expect(screen.getByText('01:00')).toBeTruthy();

    await userEvent.setup().press(screen.getByLabelText('שמירת היום שלי'));
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(jest.mocked(settingsApi.putSettings).mock.calls[0]?.[0]).toEqual({
      dayEndTime: '01:00',
      dayStartTime: '07:00',
      defaultDailyCapacityMinutes: 360,
      timezone: 'Asia/Jerusalem',
      weekStartDay: 0,
    });
    expect(rendered.queryClient.getQueryData(settingsKeys.user(userId))).toEqual(configured);
    expect(settingsApi.getSettings).not.toHaveBeenCalled();
  });

  it('clears both Day Window values explicitly without changing other settings', async () => {
    const configured = { ...initialSettings, dayEndTime: '23:30', dayStartTime: '08:00' };
    const cleared = { ...configured, dayEndTime: null, dayStartTime: null };
    jest.mocked(settingsApi.putSettings).mockResolvedValueOnce(cleared);
    const onBack = jest.fn();
    await renderSettings(<DayWindowScreen onBack={onBack} />, configured);
    const user = userEvent.setup();
    await user.press(screen.getByLabelText('ניקוי חלון היום'));
    await user.press(screen.getByLabelText('שמירת היום שלי'));
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(jest.mocked(settingsApi.putSettings).mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      dayEndTime: null,
      dayStartTime: null,
      timezone: 'Asia/Jerusalem',
      weekStartDay: 0,
    }));
  });

  it('keeps edited Day Window values visible and the cache unchanged when saving fails', async () => {
    const configured = { ...initialSettings, dayEndTime: '00:00', dayStartTime: '06:30' };
    jest.mocked(settingsApi.putSettings).mockRejectedValueOnce(new Error('offline'));
    const onBack = jest.fn();
    const rendered = await renderSettings(<DayWindowScreen onBack={onBack} />, configured);
    await userEvent.setup().press(screen.getByLabelText('שמירת היום שלי'));
    expect(await screen.findByText('לא הצלחנו לשמור. השעות שבחרת נשארו כאן ואפשר לנסות שוב.')).toBeTruthy();
    expect(screen.getByText('06:30')).toBeTruthy();
    expect(screen.getByText('00:00')).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();
    expect(rendered.queryClient.getQueryData(settingsKeys.user(userId))).toEqual(configured);
  });

  it('shows a non-destructive update-required state against a pre-upgrade API response', async () => {
    const oldResponse: UserSettings = {
      defaultDailyCapacityMinutes: 360,
      persisted: true,
      timezone: 'Asia/Jerusalem',
      weekStartDay: 0,
    };
    await renderSettings(<DayWindowScreen onBack={jest.fn()} />, oldResponse);
    expect(screen.getByLabelText('חלון היום אינו זמין')).toBeTruthy();
    expect(screen.getByText('נדרש עדכון שרת')).toBeTruthy();
    expect(screen.queryByLabelText('שמירת היום שלי')).toBeNull();
    expect(settingsApi.putSettings).not.toHaveBeenCalled();
  });

  it('saves Week Start as complete settings without refetching', async () => {
    const capacitySaved = { ...initialSettings, defaultDailyCapacityMinutes: 480 };
    const weekSaved = { ...capacitySaved, weekStartDay: 1 };
    jest.mocked(settingsApi.putSettings).mockResolvedValue(weekSaved);
    const weekClose = jest.fn();
    await renderSettings(<WeekStartScreen onClose={weekClose} />, capacitySaved);
    const user = userEvent.setup();
    await user.press(screen.getByLabelText('שני'));
    await user.press(screen.getByLabelText('שמירת תחילת שבוע'));
    await waitFor(() => expect(weekClose).toHaveBeenCalledTimes(1));
    expect(jest.mocked(settingsApi.putSettings).mock.calls.at(-1)?.[0]).toEqual({
      defaultDailyCapacityMinutes: 480,
      timezone: 'Asia/Jerusalem',
      weekStartDay: 1,
    });
    expect(settingsApi.getSettings).not.toHaveBeenCalled();
  });

  it('searches and persists a curated IANA timezone with dynamic GMT metadata', async () => {
    const saved = { ...initialSettings, timezone: 'America/New_York' };
    jest.mocked(settingsApi.putSettings).mockResolvedValueOnce(saved);
    const onBack = jest.fn();
    await renderSettings(<TimezoneScreen onBack={onBack} />);
    const user = userEvent.setup();
    expect(screen.getByText(/Asia\/Jerusalem · GMT\+/)).toBeTruthy();
    await user.type(screen.getByLabelText('חיפוש עיר או אזור'), 'ניו');
    await user.press(screen.getByLabelText('ניו יורק, America/New_York'));
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(jest.mocked(settingsApi.putSettings).mock.calls[0]?.[0]).toEqual({
      defaultDailyCapacityMinutes: 360,
      timezone: 'America/New_York',
      weekStartDay: 0,
    });
  });

  it('shows Auth metadata and clears every user-scoped cache after confirmed sign out', async () => {
    const onSignedOut = jest.fn();
    const { queryClient } = await renderSettings(<AccountScreen onBack={jest.fn()} onSignedOut={onSignedOut} />);
    queryClient.setQueryData(['tasks', userId, 'list'], [{ id: 'sensitive-task' }]);
    queryClient.setQueryData(['commitments', userId, 'list'], [{ id: 'sensitive-commitment' }]);
    expect(screen.getByText('עוז אברהמי')).toBeTruthy();
    expect(screen.getByText('oz@example.com')).toBeTruthy();
    const user = userEvent.setup();
    await user.press(screen.getByLabelText('התנתקות'));
    const confirmation = screen.getByLabelText('אישור התנתקות');
    await user.press(within(confirmation).getByText('התנתקות'));
    await waitFor(() => expect(onSignedOut).toHaveBeenCalledTimes(1));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
