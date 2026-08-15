import { render, screen, within } from '@testing-library/react-native';
import { notifyManager } from '@tanstack/react-query';

import * as planningApi from '@/features/planning/planning.api';
import type { DailyPlan } from '@/features/planning/planning.types';
import * as taskApi from '@/features/tasks/task.api';
import { localDateKey } from '@/features/tasks/task-dates';
import type { Task } from '@/features/tasks/task.types';
import { TodayScreen } from '@/features/today/today-screen';

import { TestProviders } from '../test-utils/test-providers';

jest.mock('@/features/tasks/task.api', () => ({
  cancelTask: jest.fn(),
  createTask: jest.fn(),
  listTasks: jest.fn(),
  updateTask: jest.fn(),
}));
jest.mock('@/features/planning/planning.api', () => ({
  getDailyPlan: jest.fn(),
  getWeeklyFocuses: jest.fn(),
  putDailyPlan: jest.fn(),
  replaceWeeklyFocuses: jest.fn(),
}));

const listTasksMock = jest.mocked(taskApi.listTasks);
const getDailyPlanMock = jest.mocked(planningApi.getDailyPlan);
const today = localDateKey();
const task: Task = {
  completedAt: null,
  createdAt: '2026-08-14T08:00:00.000Z',
  description: null,
  dueDate: null,
  estimatedMinutes: 45,
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  plannedDate: today,
  position: 0,
  priority: 'normal',
  status: 'open',
  title: 'משימת מיקוד אמיתית',
  updatedAt: '2026-08-14T08:00:00.000Z',
  weekPlanId: null,
};

beforeAll(() => notifyManager.setScheduler((callback) => callback()));
afterAll(() => notifyManager.setScheduler((callback) => setTimeout(callback, 0)));

describe('Today persisted Daily Focus', () => {
  it('renders the persisted same-ID focus returned by a fresh query', async () => {
    const dailyPlan: DailyPlan = {
      availableMinutes: null,
      createdAt: '2026-08-14T08:00:00.000Z',
      date: today,
      focusTaskId: task.id,
      id: 'daily-plan-1',
      updatedAt: '2026-08-14T09:00:00.000Z',
    };
    listTasksMock.mockResolvedValue([task]);
    getDailyPlanMock.mockResolvedValue(dailyPlan);

    const first = await render(
      <TestProviders><TodayScreen taskSource="server" /></TestProviders>,
    );
    expect(within(await screen.findByLabelText('עכשיו')).getByText(task.title)).toBeTruthy();
    expect(getDailyPlanMock).toHaveBeenCalledTimes(1);
    expect([task].filter((candidate) => candidate.id === dailyPlan.focusTaskId)).toHaveLength(1);
    first.unmount();
  });

});
