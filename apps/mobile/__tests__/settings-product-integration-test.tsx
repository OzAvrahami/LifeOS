import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
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

it('recalculates Today immediately from the cached global capacity while preserving a DailyPlan override', async () => {
  const client = makeClient();
  const today = localDateKey(undefined, sundaySettings.timezone ?? undefined);
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters) => filters?.plannedDate ? [taskFor(today)] : []);
  const view = await render(
    <Providers client={client}><TodayScreen taskSource="server" /></Providers>,
  );
  expect(await screen.findByText('5:00 / 6:00')).toBeTruthy();
  expect(screen.getByText('עמוס')).toBeTruthy();

  client.setQueryData(settingsKeys.user(userId), {
    ...sundaySettings,
    defaultDailyCapacityMinutes: 480,
  });
  expect(await screen.findByText('5:00 / 8:00')).toBeTruthy();
  expect(screen.getByText('מאוזן')).toBeTruthy();

  client.setQueryData(planningKeys.dailyPlan(userId, today), {
    availableMinutes: 180,
    createdAt: '2026-08-15T08:00:00.000Z',
    date: today,
    focusTaskId: null,
    id: 'daily-override',
    updatedAt: '2026-08-15T08:00:00.000Z',
  });
  expect(await screen.findByText('5:00 / 3:00')).toBeTruthy();
  client.setQueryData(settingsKeys.user(userId), sundaySettings);
  expect(screen.getByText('5:00 / 3:00')).toBeTruthy();
  view.unmount();
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

  client.setQueryData(settingsKeys.user(userId), mondaySettings);
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
