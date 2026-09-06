import { act, render, screen } from '@testing-library/react-native';

import * as commitmentApi from '@/features/commitments/commitment.api';
import * as planningApi from '@/features/planning/planning.api';
import * as settingsApi from '@/features/settings/settings.api';
import * as taskApi from '@/features/tasks/task.api';
import { localDateKey } from '@/features/tasks/task-dates';
import type { Task } from '@/features/tasks/task.types';
import { TodayScreen } from '@/features/today/today-screen';

import { TestProviders } from '../test-utils/test-providers';

jest.mock('@/features/tasks/task.api', () => ({
  createTask: jest.fn(),
  listTasks: jest.fn(),
  updateTask: jest.fn(),
}));
jest.mock('@/features/commitments/commitment.api', () => ({
  createCommitment: jest.fn(),
  deleteCommitment: jest.fn(),
  listCommitments: jest.fn(),
  updateCommitment: jest.fn(),
}));
jest.mock('@/features/planning/planning.api', () => ({
  getDailyPlan: jest.fn(),
  putDailyPlan: jest.fn(),
}));
jest.mock('@/features/settings/settings.api', () => ({
  getSettings: jest.fn(),
  putSettings: jest.fn(),
}));

const completedTask = {
  completedAt: '2026-08-20T09:00:00.000Z',
  createdAt: '2026-08-20T08:00:00.000Z',
  description: null,
  dueDate: null,
  estimatedMinutes: 30,
  id: 'persisted-completed-task',
  plannedDate: localDateKey(),
  position: 0,
  priority: 'normal',
  status: 'completed',
  title: 'משימה שהושלמה ונשמרה',
  updatedAt: '2026-08-20T09:00:00.000Z',
  weekPlanId: null,
} satisfies Task;

const openTask = {
  ...completedTask,
  completedAt: null,
  id: 'persisted-open-task',
  status: 'open',
  title: 'משימה פתוחה שנשמרה',
} satisfies Task;

function renderServerToday() {
  return render(
    <TestProviders>
      <TodayScreen taskSource="server" />
    </TestProviders>,
  );
}

beforeEach(() => {
  jest.mocked(commitmentApi.listCommitments).mockResolvedValue([]);
  jest.mocked(planningApi.getDailyPlan).mockResolvedValue(null);
  jest.mocked(settingsApi.getSettings).mockResolvedValue({
    defaultDailyCapacityMinutes: 480,
    persisted: true,
    timezone: 'Asia/Jerusalem',
    weekStartDay: 0,
  });
});

describe('Today server hydration', () => {
  it('does not render an empty day before a persisted completed Task resolves', async () => {
    let resolveTasks: ((tasks: Task[]) => void) | undefined;
    jest.mocked(taskApi.listTasks).mockReturnValue(new Promise((resolve) => {
      resolveTasks = resolve;
    }));

    await renderServerToday();

    expect(screen.getByLabelText('טוען משימות')).toBeTruthy();
    expect(screen.queryByText('0 משימות')).toBeNull();

    await act(async () => {
      resolveTasks?.([completedTask]);
    });

    expect(await screen.findByText('1 הושלמה · 0 נשארו')).toBeTruthy();
    expect(screen.getByText(completedTask.title)).toBeTruthy();
  });

  it('renders the existing empty day only after an empty response resolves', async () => {
    let resolveTasks: ((tasks: Task[]) => void) | undefined;
    jest.mocked(taskApi.listTasks).mockReturnValue(new Promise((resolve) => {
      resolveTasks = resolve;
    }));

    await renderServerToday();

    expect(screen.getByLabelText('טוען משימות')).toBeTruthy();
    expect(screen.queryByText('0 משימות')).toBeNull();

    await act(async () => {
      resolveTasks?.([]);
    });

    expect(await screen.findByText('0 משימות')).toBeTruthy();
    expect(screen.getByLabelText('המשימות שלי')).toBeTruthy();
    expect(screen.getByLabelText('אפשר להוסיף להיום')).toBeTruthy();
  });

  it('renders a populated open day after server hydration', async () => {
    jest.mocked(taskApi.listTasks).mockResolvedValue([openTask]);

    await renderServerToday();

    expect(await screen.findByText(openTask.title)).toBeTruthy();
    expect(screen.getByText('1 משימות')).toBeTruthy();
    expect(screen.getByLabelText(`התחל משימה: ${openTask.title}`)).toBeTruthy();
  });

  it('summarizes only identifiable Task estimates and discloses unknown estimates', async () => {
    jest.mocked(taskApi.listTasks).mockResolvedValue([
      { ...openTask, estimatedMinutes: 165 },
      { ...openTask, estimatedMinutes: null, id: 'unknown-task', position: 1, title: 'משימה ללא הערכה' },
    ]);
    jest.mocked(commitmentApi.listCommitments).mockResolvedValue([{
      createdAt: '2026-08-20T08:00:00.000Z',
      date: localDateKey(),
      description: null,
      endTime: '13:00',
      id: 'long-commitment',
      lifeArea: 'work',
      startTime: '08:00',
      title: 'התחייבות של חמש שעות',
      updatedAt: '2026-08-20T08:00:00.000Z',
    }]);

    await renderServerToday();

    expect(await screen.findByText('זמן משימות מתוכנן: שעתיים ו־45 דקות')).toBeTruthy();
    expect(screen.getByText('למשימה אחת אין הערכת זמן')).toBeTruthy();
    expect(screen.getByText('1 התחייבויות')).toBeTruthy();
    expect(screen.queryByText(/7:45|5 שעות|זמן פנוי|מתוך/)).toBeNull();
  });

  it('waits for Settings and Daily Plan hydration before rendering the Task-time summary', async () => {
    let resolveSettings: ((settings: Awaited<ReturnType<typeof settingsApi.getSettings>>) => void) | undefined;
    let resolveDailyPlan: ((plan: Awaited<ReturnType<typeof planningApi.getDailyPlan>>) => void) | undefined;
    jest.mocked(taskApi.listTasks).mockResolvedValue([]);
    jest.mocked(settingsApi.getSettings).mockReturnValue(new Promise((resolve) => {
      resolveSettings = resolve;
    }));
    jest.mocked(planningApi.getDailyPlan).mockReturnValue(new Promise((resolve) => {
      resolveDailyPlan = resolve;
    }));

    await renderServerToday();
    expect(screen.getByLabelText('טוען משימות')).toBeTruthy();
    expect(screen.queryByText('זמן משימות מתוכנן: 0 דקות')).toBeNull();

    await act(async () => {
      resolveSettings?.({
        defaultDailyCapacityMinutes: 480,
        persisted: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekStartDay: 0,
      });
    });
    expect(screen.getByLabelText('טוען משימות')).toBeTruthy();
    expect(screen.queryByText('זמן משימות מתוכנן: 0 דקות')).toBeNull();

    await act(async () => {
      resolveDailyPlan?.(null);
    });
    expect(await screen.findByText('זמן משימות מתוכנן: 0 דקות')).toBeTruthy();
    expect(screen.queryByText(/8:00|6:00|פנוי|מאוזן|עמוס/)).toBeNull();
  });
});
