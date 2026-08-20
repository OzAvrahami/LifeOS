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
});
