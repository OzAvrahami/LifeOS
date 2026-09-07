import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, userEvent, waitFor, within } from '@testing-library/react-native';
import { useEffect, type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as commitmentApi from '@/features/commitments/commitment.api';
import { planningKeys } from '@/features/planning/planning.queries';
import * as planningApi from '@/features/planning/planning.api';
import * as settingsApi from '@/features/settings/settings.api';
import { settingsKeys } from '@/features/settings/settings.queries';
import type { UserSettings } from '@/features/settings/settings.types';
import * as taskApi from '@/features/tasks/task.api';
import { localDateKey } from '@/features/tasks/task-dates';
import { DemoTaskProvider } from '@/features/tasks/demo-task-provider';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import type { Task } from '@/features/tasks/task.types';
import { TodayScreen } from '@/features/today/today-screen';
import { WeekScreen } from '@/features/week/week-screen';

jest.mock('@/features/tasks/task.api', () => ({
  cancelTask: jest.fn(), createTask: jest.fn(), listTasks: jest.fn(), updateTask: jest.fn(),
}));
jest.mock('@/features/planning/planning.api', () => ({
  getDailyPlan: jest.fn(), getWeeklyFocuses: jest.fn(), putDailyPlan: jest.fn(), replaceWeeklyFocuses: jest.fn(),
}));
jest.mock('@/features/commitments/commitment.api', () => ({
  createCommitment: jest.fn(), deleteCommitment: jest.fn(), listCommitments: jest.fn(), updateCommitment: jest.fn(),
}));
jest.mock('@/features/settings/settings.api', () => ({
  getSettings: jest.fn(), putSettings: jest.fn(),
}));

const userId = 'settings-integration-user';
const initialMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};
const sundaySettings: UserSettings = {
  defaultDailyCapacityMinutes: 360,
  persisted: true,
  timezone: 'Asia/Jerusalem',
  weekStartDay: 0,
};

beforeAll(() => {
  notifyManager.setScheduler((callback) => callback());
});

afterAll(() => {
  notifyManager.setScheduler((callback) => setTimeout(callback, 0));
});

function Providers({ children, client }: PropsWithChildren<{ client: QueryClient }>) {
  useEffect(() => () => client.clear(), [client]);
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <QueryClientProvider client={client}>
        <TaskQueryScopeProvider userId={userId}>
          <DemoTaskProvider>{children}</DemoTaskProvider>
        </TaskQueryScopeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function makeClient(settings = sundaySettings) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  client.setQueryData(settingsKeys.user(userId), settings);
  return client;
}

function taskFor(date: string): Task {
  return {
    completedAt: null,
    createdAt: '2026-08-15T08:00:00.000Z',
    description: null,
    dueDate: null,
    estimatedMinutes: 300,
    id: 'load-task',
    plannedDate: date,
    position: 0,
    priority: 'normal',
    status: 'open',
    title: 'משימת עומס',
    updatedAt: '2026-08-15T08:00:00.000Z',
    weekPlanId: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(settingsApi.getSettings).mockResolvedValue(sundaySettings);
  jest.mocked(commitmentApi.listCommitments).mockResolvedValue([]);
  jest.mocked(planningApi.getWeeklyFocuses).mockResolvedValue([]);
  jest.mocked(planningApi.getDailyPlan).mockResolvedValue(null);
});

it('keeps the honest Task-time summary independent of legacy defaults and DailyPlan overrides', async () => {
  const client = makeClient();
  const today = localDateKey(undefined, sundaySettings.timezone ?? undefined);
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters) => filters?.plannedDate ? [taskFor(today)] : []);
  const view = await render(
    <Providers client={client}><TodayScreen taskSource="server" /></Providers>,
  );
  expect(await screen.findByText('זמן משימות מתוכנן: 5 שעות')).toBeTruthy();
  expect(screen.queryByText(/6:00|עמוס|מאוזן/)).toBeNull();

  await act(async () => {
    client.setQueryData(settingsKeys.user(userId), {
      ...sundaySettings,
      defaultDailyCapacityMinutes: 480,
    });
  });
  expect(screen.getByText('זמן משימות מתוכנן: 5 שעות')).toBeTruthy();
  expect(screen.queryByText(/8:00|עמוס|מאוזן/)).toBeNull();

  await act(async () => {
    client.setQueryData(planningKeys.dailyPlan(userId, today), {
      availableMinutes: 431,
      createdAt: '2026-08-15T08:00:00.000Z',
      date: today,
      focusTaskId: null,
      id: 'daily-override',
      updatedAt: '2026-08-15T08:00:00.000Z',
    });
  });
  expect(screen.getByText('זמן משימות מתוכנן: 5 שעות')).toBeTruthy();
  expect(screen.queryByText(/7:11|זמן זמין מיוחד/)).toBeNull();
  await act(async () => {
    client.setQueryData(settingsKeys.user(userId), sundaySettings);
  });
  expect(screen.getByText('זמן משימות מתוכנן: 5 שעות')).toBeTruthy();
  expect(screen.queryByText(/7:11|6:00|זמן זמין מיוחד/)).toBeNull();
  view.unmount();
});

it('does not rewrite a legacy override, Daily Focus, or another date while rendering Today', async () => {
  const settings = { ...sundaySettings, defaultDailyCapacityMinutes: 480 };
  const client = makeClient(settings);
  const today = localDateKey(undefined, settings.timezone ?? undefined);
  const otherDate = '2099-01-01';
  const dailyPlan = {
    availableMinutes: 431,
    createdAt: '2026-08-15T08:00:00.000Z',
    date: today,
    focusTaskId: 'load-task',
    id: 'daily-override',
    updatedAt: '2026-08-15T08:00:00.000Z',
  };
  const otherPlan = { ...dailyPlan, date: otherDate, id: 'other-date-plan' };
  client.setQueryData(planningKeys.dailyPlan(userId, today), dailyPlan);
  client.setQueryData(planningKeys.dailyPlan(userId, otherDate), otherPlan);
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters) => (
    filters?.plannedDate === today ? [taskFor(today)] : []
  ));

  await render(<Providers client={client}><TodayScreen taskSource="server" /></Providers>);

  expect(await screen.findByText('זמן משימות מתוכנן: 5 שעות')).toBeTruthy();
  expect(within(screen.getByLabelText('עכשיו')).getByText('משימת עומס')).toBeTruthy();
  expect(screen.queryByText(/7:11|8:00|זמן זמין מיוחד/)).toBeNull();
  expect(planningApi.putDailyPlan).not.toHaveBeenCalled();
  expect(client.getQueryData(planningKeys.dailyPlan(userId, today))).toBe(dailyPlan);
  expect(client.getQueryData(planningKeys.dailyPlan(userId, otherDate))).toBe(otherPlan);
});

it('does not create a capacity override during Daily Focus edits and preserves an existing override', async () => {
  const client = makeClient({ ...sundaySettings, defaultDailyCapacityMinutes: 480 });
  const today = localDateKey(undefined, sundaySettings.timezone ?? undefined);
  const inheritedFocusPlan = {
    availableMinutes: null,
    createdAt: '2026-08-15T08:00:00.000Z',
    date: today,
    focusTaskId: 'load-task',
    id: 'daily-focus',
    updatedAt: '2026-08-15T08:00:00.000Z',
  };
  const overriddenFocusPlan = { ...inheritedFocusPlan, availableMinutes: 431 };
  const overriddenNoFocusPlan = { ...overriddenFocusPlan, focusTaskId: null };
  client.setQueryData(planningKeys.dailyPlan(userId, today), null);
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters) => (
    filters?.plannedDate === today ? [taskFor(today)] : []
  ));
  jest.mocked(planningApi.putDailyPlan)
    .mockResolvedValueOnce(inheritedFocusPlan)
    .mockResolvedValueOnce(overriddenNoFocusPlan);

  await render(<Providers client={client}><TodayScreen taskSource="server" /></Providers>);
  const taskRow = await screen.findByLabelText('התחל משימה: משימת עומס');
  const user = userEvent.setup();
  await user.longPress(taskRow);
  await waitFor(() => expect(jest.mocked(planningApi.putDailyPlan).mock.calls[0]?.[0]).toEqual({
    date: today,
    input: { availableMinutes: null, focusTaskId: 'load-task' },
  }));

  await act(async () => {
    client.setQueryData(planningKeys.dailyPlan(userId, today), overriddenFocusPlan);
  });
  expect(await screen.findByText('זמן משימות מתוכנן: 5 שעות')).toBeTruthy();
  await user.longPress(taskRow);
  await waitFor(() => expect(jest.mocked(planningApi.putDailyPlan).mock.calls[1]?.[0]).toEqual({
    date: today,
    input: { availableMinutes: 431, focusTaskId: null },
  }));
});

it('does not move Tasks or DailyPlans or change Task time when the Day Window changes', async () => {
  const client = makeClient({
    ...sundaySettings,
    dayEndTime: null,
    dayStartTime: null,
    dayWindowSupported: true,
  });
  const today = localDateKey(undefined, sundaySettings.timezone ?? undefined);
  const task = taskFor(today);
  const plan = {
    availableMinutes: null,
    createdAt: '2026-08-15T08:00:00.000Z',
    date: today,
    focusTaskId: task.id,
    id: 'same-calendar-day-plan',
    updatedAt: '2026-08-15T08:00:00.000Z',
  };
  client.setQueryData(planningKeys.dailyPlan(userId, today), plan);
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters) => filters?.plannedDate === today ? [task] : []);

  await render(<Providers client={client}><TodayScreen taskSource="server" /></Providers>);
  expect(await screen.findByText('זמן משימות מתוכנן: 5 שעות')).toBeTruthy();

  await act(async () => {
    client.setQueryData(settingsKeys.user(userId), {
      ...sundaySettings,
      dayEndTime: '01:00',
      dayStartTime: '07:00',
      dayWindowSupported: true,
    });
  });

  expect(screen.getByText('זמן משימות מתוכנן: 5 שעות')).toBeTruthy();
  expect(taskApi.listTasks).toHaveBeenCalledWith({ plannedDate: today });
  expect(client.getQueryData(planningKeys.dailyPlan(userId, today))).toBe(plan);
  expect(task).toEqual(expect.objectContaining({ estimatedMinutes: 300, plannedDate: today, status: 'open' }));
  expect(planningApi.putDailyPlan).not.toHaveBeenCalled();
  expect(taskApi.updateTask).not.toHaveBeenCalled();
});

describe('configured Week start with a controlled calendar date', () => {
  afterEach(() => jest.useRealTimers());

  it.each([
    { scenario: 'Monday is Today', now: '2026-09-07T09:00:00Z', todayLabel: 'שני' },
    { scenario: 'Thursday is Today', now: '2026-09-10T09:00:00Z', todayLabel: 'חמישי' },
  ])('switches Sunday to Monday with correct boundaries, ordering and preserved cache: $scenario', async ({ now, todayLabel }) => {
    // Freeze Date only. Query notifications and testing-library waits keep their
    // real scheduling; no timer advancement or application timezone changes.
    jest.useFakeTimers({
      now: new Date(now),
      doNotFake: [
        'hrtime', 'nextTick', 'performance', 'queueMicrotask',
        'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback',
        'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout',
      ],
    });
    const client = makeClient();
    jest.mocked(taskApi.listTasks).mockResolvedValue([]);
    const sundayFocuses = [{
      createdAt: '2026-08-15T08:00:00.000Z', id: 'sunday-focus', position: 0,
      title: 'מיקוד בגבול הקודם', updatedAt: '2026-08-15T08:00:00.000Z', weekPlanId: 'sunday-week-plan',
    }];
    const priorWeekFocuses = [{ ...sundayFocuses[0]!, id: 'historical-focus', weekPlanId: 'prior-week-plan' }];
    client.setQueryData(planningKeys.weeklyFocuses(userId, '2026-08-30'), priorWeekFocuses);
    jest.mocked(planningApi.getWeeklyFocuses).mockImplementation(async (weekStart) => (
      weekStart === '2026-09-06' ? sundayFocuses : []
    ));

    // Independent calendar expectations, not outputs from the production helpers.
    const assertRows = (expected: [string, number][]) => {
      const overview = within(screen.getByLabelText('סקירת שבעת ימי השבוע'));
      const rows = overview.getAllByRole('button');
      expect(rows.map((row) => row.props.accessibilityLabel)).toEqual(
        expected.map(([weekday]) => `הוסף התחייבות ליום ${weekday}`),
      );
      expect(overview.getAllByText('היום')).toHaveLength(1);
      expected.forEach(([weekday, dayOfMonth], index) => {
        const row = rows[index]!;
        const today = weekday === todayLabel;
        expect(within(row).getByText(today ? 'היום' : weekday)).toBeTruthy();
        expect(within(row).getByText(String(dayOfMonth))).toBeTruthy();
        expect(row.props.accessibilityState.selected).toBe(today);
        if (today) expect(within(row).queryByText(weekday)).toBeNull();
      });
    };

    const view = await render(<Providers client={client}><WeekScreen taskSource="server" /></Providers>);
    try {
      await waitFor(() => {
        expect(taskApi.listTasks).toHaveBeenCalledWith({ plannedDateFrom: '2026-09-06', plannedDateTo: '2026-09-12' });
        expect(taskApi.listTasks).toHaveBeenCalledWith({ weekStart: '2026-09-06' });
        expect(commitmentApi.listCommitments).toHaveBeenCalledWith({ dateFrom: '2026-09-06', dateTo: '2026-09-12' });
        expect(planningApi.getWeeklyFocuses).toHaveBeenCalledWith('2026-09-06');
        expect(client.getQueryData(planningKeys.weeklyFocuses(userId, '2026-09-06'))).toEqual(sundayFocuses);
      });
      assertRows([['ראשון', 6], ['שני', 7], ['שלישי', 8], ['רביעי', 9], ['חמישי', 10], ['שישי', 11], ['שבת', 12]]);
      const cachedSundayFocuses = client.getQueryData(planningKeys.weeklyFocuses(userId, '2026-09-06'));

      await act(async () => {
        client.setQueryData(settingsKeys.user(userId), { ...sundaySettings, weekStartDay: 1 });
      });
      await waitFor(() => {
        expect(taskApi.listTasks).toHaveBeenCalledWith({ plannedDateFrom: '2026-09-07', plannedDateTo: '2026-09-13' });
        expect(taskApi.listTasks).toHaveBeenCalledWith({ weekStart: '2026-09-07' });
        expect(commitmentApi.listCommitments).toHaveBeenCalledWith({ dateFrom: '2026-09-07', dateTo: '2026-09-13' });
        expect(planningApi.getWeeklyFocuses).toHaveBeenCalledWith('2026-09-07');
        expect(client.getQueryData(planningKeys.weeklyFocuses(userId, '2026-09-07'))).toEqual([]);
      });
      assertRows([['שני', 7], ['שלישי', 8], ['רביעי', 9], ['חמישי', 10], ['שישי', 11], ['שבת', 12], ['ראשון', 13]]);
      expect(taskApi.listTasks).toHaveBeenCalledTimes(4);
      expect(commitmentApi.listCommitments).toHaveBeenCalledTimes(2);
      expect(planningApi.getWeeklyFocuses).toHaveBeenCalledTimes(2);
      expect(client.getQueryData(planningKeys.weeklyFocuses(userId, '2026-09-06'))).toBe(cachedSundayFocuses);
      expect(client.getQueryData(planningKeys.weeklyFocuses(userId, '2026-08-30'))).toBe(priorWeekFocuses);
      expect(planningApi.replaceWeeklyFocuses).not.toHaveBeenCalled();
      expect(taskApi.updateTask).not.toHaveBeenCalled();
      expect(commitmentApi.updateCommitment).not.toHaveBeenCalled();
    } finally {
      await view.unmount();
    }
  });
});

it('keeps canonical previews independent of persisted Settings', async () => {
  const client = makeClient();
  await render(
    <Providers client={client}>
      <TodayScreen initialState="overloaded" />
      <WeekScreen initialState="unplanned" />
    </Providers>,
  );
  expect(settingsApi.getSettings).not.toHaveBeenCalled();
  expect(taskApi.listTasks).not.toHaveBeenCalled();
});
