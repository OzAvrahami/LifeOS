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
import { currentWeekDateKeys, currentWeekStart, localDateKey } from '@/features/tasks/task-dates';
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

it('changes every normal Week query boundary and seven-day order without rewriting the prior WeekPlan cache', async () => {
  const client = makeClient();
  jest.mocked(taskApi.listTasks).mockResolvedValue([]);
  const sundayStart = currentWeekStart(undefined, sundaySettings);
  const mondaySettings = { ...sundaySettings, weekStartDay: 1 };
  const mondayStart = currentWeekStart(undefined, mondaySettings);
  const sundayEnd = currentWeekDateKeys(undefined, sundaySettings)[6]!;
  const mondayEnd = currentWeekDateKeys(undefined, mondaySettings)[6]!;
  client.setQueryData(planningKeys.weeklyFocuses(userId, sundayStart), [{
    createdAt: '2026-08-15T08:00:00.000Z', id: 'historical-focus', position: 0,
    title: 'מיקוד בגבול הקודם', updatedAt: '2026-08-15T08:00:00.000Z', weekPlanId: 'old-week-plan',
  }]);

  await render(<Providers client={client}><WeekScreen taskSource="server" /></Providers>);
  await waitFor(() => expect(commitmentApi.listCommitments).toHaveBeenCalledWith({ dateFrom: sundayStart, dateTo: sundayEnd }));
  expect(taskApi.listTasks).toHaveBeenCalledWith({ weekStart: sundayStart });

  await act(async () => {
    client.setQueryData(settingsKeys.user(userId), mondaySettings);
  });
  await waitFor(() => expect(commitmentApi.listCommitments).toHaveBeenCalledWith({ dateFrom: mondayStart, dateTo: mondayEnd }));
  expect(taskApi.listTasks).toHaveBeenCalledWith({ weekStart: mondayStart });
  expect(planningApi.getWeeklyFocuses).toHaveBeenCalledWith(mondayStart);
  expect(screen.getAllByText('שני').length).toBeGreaterThan(0);
  expect(client.getQueryData(planningKeys.weeklyFocuses(userId, sundayStart))).toEqual([
    expect.objectContaining({ id: 'historical-focus' }),
  ]);
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
