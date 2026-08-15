import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { notifyManager } from '@tanstack/react-query';

import * as planningApi from '@/features/planning/planning.api';
import type { WeeklyFocus } from '@/features/planning/planning.types';
import * as taskApi from '@/features/tasks/task.api';
import { WeekScreen } from '@/features/week/week-screen';

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
const getWeeklyFocusesMock = jest.mocked(planningApi.getWeeklyFocuses);
const replaceWeeklyFocusesMock = jest.mocked(planningApi.replaceWeeklyFocuses);

beforeAll(() => notifyManager.setScheduler((callback) => callback()));
afterAll(() => notifyManager.setScheduler((callback) => setTimeout(callback, 0)));

describe('Week persisted WeeklyFocus', () => {
  it('saves planning selections in order and restores them after remount', async () => {
    let focuses: WeeklyFocus[] = [{
      createdAt: '2026-08-14T08:00:00.000Z',
      id: 'existing-focus',
      position: 0,
      title: 'מיקוד קיים',
      updatedAt: '2026-08-14T08:00:00.000Z',
      weekPlanId: 'week-plan-1',
    }];
    listTasksMock.mockResolvedValue([]);
    getWeeklyFocusesMock.mockImplementation(async () => focuses);
    replaceWeeklyFocusesMock.mockImplementation(async ({ titles }) => {
      focuses = titles.map((title, position) => ({
        createdAt: '2026-08-14T08:00:00.000Z',
        id: `focus-${position}`,
        position,
        title,
        updatedAt: '2026-08-14T09:00:00.000Z',
        weekPlanId: 'week-plan-1',
      }));
      return focuses;
    });

    const user = userEvent.setup();
    const first = await render(<TestProviders><WeekScreen taskSource="server" /></TestProviders>);
    expect(await screen.findByText('מיקוד קיים')).toBeTruthy();
    await user.press(screen.getByText('עריכה'));
    await user.type(screen.getByLabelText('מיקוד חדש'), 'מיקוד נוסף');
    await user.press(screen.getByText('המשך'));
    await waitFor(() => expect(focuses.map((focus) => focus.title)).toEqual([
      'מיקוד קיים',
      'מיקוד נוסף',
    ]));
    expect(replaceWeeklyFocusesMock).toHaveBeenCalledTimes(1);
    await user.press(screen.getByText('סיום התכנון'));
    expect(await screen.findByText('מיקוד נוסף')).toBeTruthy();
    expect(getWeeklyFocusesMock).toHaveBeenCalledTimes(1);
    first.unmount();
  });
});
