import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TestProviders } from '../test-utils/test-providers';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import { V2TodayScreen } from '@/features/today/v2-today-screen';
import * as tasks from '@/features/tasks/task.api';
import * as settings from '@/features/settings/settings.api';
import * as plans from '@/features/planning/planning.api';
import * as daily from '@/features/planning/daily-planning.api';
import * as flow from '@/features/planning/daily-flow.api';
import * as commitments from '@/features/commitments/commitment.api';
import type { Task } from '@/features/tasks/task.types';
import { localDateKey } from '@/features/tasks/task-dates';

jest.mock('@/features/tasks/task.api');
jest.mock('@/features/settings/settings.api');
jest.mock('@/features/planning/planning.api');
jest.mock('@/features/planning/daily-planning.api');
jest.mock('@/features/planning/daily-flow.api', () => ({ ...jest.requireActual('@/features/planning/daily-flow.api'), getDailyFlow: jest.fn(), saveDailyFlow: jest.fn() }));
jest.mock('@/features/commitments/commitment.api');
const date = localDateKey(undefined, 'UTC');
let task: Task;
beforeEach(() => {
  jest.clearAllMocks();
  task = { id: 'task-A', title: 'Actual task from API', plannedDate: date, status: 'open', estimatedMinutes: 90, description: null, dueDate: null, weekPlanId: null, position: 0, priority: 'normal', createdAt: '2026-01-01', updatedAt: '2026-01-01', completedAt: null };
  jest.mocked(settings.getSettings).mockResolvedValue({ persisted: true, timezone: 'UTC', weekStartDay: 0, defaultDailyCapacityMinutes: 360 });
  jest.mocked(tasks.listTasks).mockImplementation(async (_, owner) => owner === 'B' ? [] : [task]);
  jest.mocked(tasks.updateTask).mockImplementation(async ({ input }) => { task = { ...task, ...input }; return task; });
  jest.mocked(plans.getDailyPlan).mockResolvedValue({ date, availableMinutes: 271, focusTaskId: null } as Awaited<ReturnType<typeof plans.getDailyPlan>>);
  jest.mocked(plans.putDailyPlan).mockImplementation(async ({ input }) => ({ date, ...input }) as Awaited<ReturnType<typeof plans.putDailyPlan>>);
  jest.mocked(daily.getDailyPlanning).mockResolvedValue(null);
  jest.mocked(daily.getDailyPlanningTasks).mockResolvedValue([]);
  jest.mocked(flow.getDailyFlow).mockImplementation(async owner => ({ plan: null, tasks: owner === 'B' ? [] : [task], snapshot: 'a'.repeat(32), today: date, timezone: 'UTC' }));
  jest.mocked(commitments.listCommitments).mockResolvedValue([]);
});
const content = <V2TodayScreen onNavigateInbox={jest.fn()} onNavigateMore={jest.fn()} onNavigateWeek={jest.fn()} />;
const tree = (owner = 'A') => <TestProviders><TaskQueryScopeProvider userId={owner}>{content}</TaskQueryScopeProvider></TestProviders>;

it('uses approved membership, including undated tasks and empty days, without unioning excluded dated tasks', async () => {
  task = { ...task, plannedDate: null };
  jest.mocked(flow.getDailyFlow).mockImplementation(async () => ({ plan: { id: 'p', date, approved: true, revision: 3, ids: [task.id], proposal: null, source: 'weekly', summary: null }, tasks: [task], snapshot: 'a'.repeat(32), today: date, timezone: 'UTC' }));
  jest.mocked(tasks.listTasks).mockResolvedValue([{ ...task, id: 'excluded', title: 'Dated but excluded', plannedDate: date }]);
  await render(tree());
  await screen.findByText(task.title);
  expect(screen.queryByText('Dated but excluded')).toBeNull();
  await fireEvent.press(screen.getByRole('checkbox', { name: `סימון כהושלמה: ${task.title}` }));
  await screen.findByText('1 מתוך 1 הושלמו');
});

it('uses real query results and scoped completion/reopen/start/focus commands without task duration framing', async () => {
  await render(tree());
  await screen.findByText(task.title);
  expect(tasks.listTasks).toHaveBeenCalledWith({ plannedDate: date }, 'A');
  expect(screen.queryByText(/90 דקות/)).toBeNull();
  await fireEvent.press(screen.getByRole('checkbox', { name: `סימון כהושלמה: ${task.title}` }));
  await screen.findByRole('checkbox', { name: `פתיחה מחדש: ${task.title}` });
  expect(tasks.updateTask).toHaveBeenLastCalledWith({ id: task.id, input: { status: 'completed' } }, 'A');
  await fireEvent.press(screen.getByRole('checkbox', { name: `פתיחה מחדש: ${task.title}` }));
  await screen.findByRole('button', { name: `התחל משימה: ${task.title}` });
  await fireEvent.press(screen.getByRole('button', { name: `התחל משימה: ${task.title}` }));
  await screen.findByRole('button', { name: `עצירת משימה: ${task.title}` });
  await fireEvent.press(screen.getByRole('button', { name: `בחירה כמיקוד: ${task.title}` }));
  await waitFor(() => expect(plans.putDailyPlan).toHaveBeenCalledWith({ date, input: { availableMinutes: 271, focusTaskId: task.id } }, 'A'));
  expect(task.estimatedMinutes).toBe(90);
  expect(daily.saveDailyPlanning).not.toHaveBeenCalled();
});
it('keeps duplicate selection identity once, labels unapproved choices and displays exact event times', async () => {
  jest.mocked(daily.getDailyPlanning).mockResolvedValue({ id: 'plan', date, revision: 1, resumeStep: 3, status: 'in_progress', completedAt: null, selectedTaskIds: [task.id] });
  jest.mocked(daily.getDailyPlanningTasks).mockResolvedValue([task]);
  jest.mocked(commitments.listCommitments).mockResolvedValue([{ id: 'event', title: 'Actual commitment', startTime: '09:17', endTime: '10:43' } as Awaited<ReturnType<typeof commitments.listCommitments>>[number]]);
  await render(tree());
  await screen.findByText('טיוטת התכנון · טרם אושרה');
  expect(screen.getAllByRole('checkbox', { name: `סימון כהושלמה: ${task.title}` })).toHaveLength(1);
  expect(await screen.findByText('09:17–10:43 · LifeOS')).toBeTruthy();
  expect(screen.getByText(/חיבורי Google ו־Apple עדיין אינם זמינים/)).toBeTruthy();
});
it('shows fetch errors rather than an empty success and supports retry', async () => {
  jest.mocked(tasks.listTasks).mockRejectedValueOnce(new Error('offline'));
  await render(tree());
  await screen.findByText(/לא הצלחנו לרענן את המשימות/);
  expect(screen.queryByText('יש מקום ליום שלך.')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'נסה שוב' }));
  expect(await screen.findByText(task.title)).toBeTruthy();
});
it('waits for account timezone settings before querying Today and clears account-specific editors on account change', async () => {
  let resolve: (value: Awaited<ReturnType<typeof settings.getSettings>>) => void = () => {};
  jest.mocked(settings.getSettings).mockReturnValueOnce(new Promise(done => { resolve = done; }));
  const view = await render(tree());
  expect(screen.getByText(/ממתין להגדרות היום/)).toBeTruthy();
  expect(tasks.listTasks).not.toHaveBeenCalled();
  await act(async () => resolve({ timezone: 'UTC', weekStartDay: 0, defaultDailyCapacityMinutes: 360, persisted: true }));
  await screen.findByText(task.title);
  await fireEvent.press(screen.getByLabelText('הוספה מהירה'));
  await screen.findByLabelText('חלונית הוספה מהירה');
  await view.rerender(tree('B'));
  expect(screen.queryByLabelText('חלונית הוספה מהירה')).toBeNull();
  expect(screen.queryByText(task.title)).toBeNull();
  expect(await screen.findByText('יש מקום ליום שלך.')).toBeTruthy();
});
