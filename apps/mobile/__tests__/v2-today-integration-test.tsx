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
import * as ReactNative from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@/theme/theme-provider';

jest.mock('@/features/tasks/task.api');
jest.mock('@/features/settings/settings.api');
jest.mock('@/features/planning/planning.api');
jest.mock('@/features/planning/daily-planning.api');
jest.mock('@/features/planning/daily-flow.api', () => ({ ...jest.requireActual('@/features/planning/daily-flow.api'), getDailyFlow: jest.fn(), initializeDailyFlow: jest.fn(), saveDailyFlow: jest.fn() }));
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
  jest.mocked(flow.initializeDailyFlow).mockImplementation(async owner => ({ plan: owner === 'B' ? null : { id: 'p', date, approved: true, revision: 3, ids: [task.id], proposal: null, source: 'weekly', summary: null }, tasks: owner === 'B' ? [] : [task], snapshot: 'a'.repeat(32), today: date, timezone: 'UTC' }));
  jest.mocked(commitments.listCommitments).mockResolvedValue([]);
});
const content = <V2TodayScreen onNavigateInbox={jest.fn()} onNavigateMore={jest.fn()} onNavigateWeek={jest.fn()} />;
const tree = (owner = 'A') => <TestProviders><TaskQueryScopeProvider userId={owner}>{content}</TaskQueryScopeProvider></TestProviders>;

it('uses approved membership, including undated tasks and empty days, without unioning excluded dated tasks', async () => {
  task = { ...task, plannedDate: null };
  jest.mocked(flow.initializeDailyFlow).mockImplementation(async () => ({ plan: { id: 'p', date, approved: true, revision: 3, ids: [task.id], proposal: null, source: 'weekly', summary: null }, tasks: [task], snapshot: 'a'.repeat(32), today: date, timezone: 'UTC' }));
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
  expect(flow.initializeDailyFlow).toHaveBeenCalledWith('A', date, expect.anything());
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
it('presents the proposal on entry, with one card per identity, truthful reasons, adjustment and a single approval', async () => {
  jest.mocked(flow.initializeDailyFlow).mockResolvedValue({ plan: { id: 'p', date, revision: 1, approved: false, ids: [], source: null, summary: null, proposal: { ids: [task.id], reasons: { [task.id]: { kind: 'planned', origin: null } }, snapshot: 'a'.repeat(32), rule: 'bounded-v1' } }, tasks: [task], snapshot: 'a'.repeat(32), today: date, timezone: 'UTC' });
  jest.mocked(commitments.listCommitments).mockResolvedValue([{ id: 'event', title: 'Actual commitment', startTime: '09:17', endTime: '10:43' } as Awaited<ReturnType<typeof commitments.listCommitments>>[number]]);
  await render(tree());
  await screen.findByText('שובצה לתאריך הזה');
  expect(screen.getAllByText(task.title)).toHaveLength(1);
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.getByRole('button', { name: 'שינוי ההצעה' })).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'מתאים לי, מאשר' })).toHaveLength(1);
  expect(flow.saveDailyFlow).not.toHaveBeenCalled();
  expect(screen.queryByText('הצעת היום')).toBeNull();
  expect(await screen.findByText('09:17–10:43 · LifeOS')).toBeTruthy();
  expect(screen.getByText(/ייבוא Google מנוהל בהגדרות היומן/)).toBeTruthy();
});
it('shows fetch errors rather than an empty success and supports retry', async () => {
  jest.mocked(flow.initializeDailyFlow).mockRejectedValueOnce(new Error('offline'));
  await render(tree());
  await screen.findByText(/לא הצלחנו לטעון את היום שלך/);
  expect(screen.queryByText('יש מקום ליום שלך.')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'נסה שוב' }));
  expect(await screen.findByText(task.title)).toBeTruthy();
});
it('waits for account timezone settings before querying Today and clears account-specific editors on account change', async () => {
  let resolve: (value: Awaited<ReturnType<typeof settings.getSettings>>) => void = () => {};
  jest.mocked(settings.getSettings).mockReturnValueOnce(new Promise(done => { resolve = done; }));
  const view = await render(tree());
  expect(screen.getByText('טוען את היום שלך…')).toBeTruthy();
  expect(flow.initializeDailyFlow).not.toHaveBeenCalled();
  await act(async () => resolve({ timezone: 'UTC', weekStartDay: 0, defaultDailyCapacityMinutes: 360, persisted: true }));
  await screen.findByText(task.title);
  await fireEvent.press(screen.getByLabelText('הוספה מהירה'));
  await screen.findByLabelText('חלונית הוספה מהירה');
  await view.rerender(tree('B'));
  expect(screen.queryByLabelText('חלונית הוספה מהירה')).toBeNull();
  expect(screen.queryByText(task.title)).toBeNull();
  expect(await screen.findByText('יש מקום ליום שלך.')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'הוספת משימה ראשונה' })).toHaveLength(1);
  expect(screen.queryByText('כל המשימות')).toBeNull();
  expect(screen.queryByText('ביומן היום')).toBeNull();
});

it('keeps an explicitly approved empty day distinct from a fresh empty account', async () => {
  jest.mocked(flow.initializeDailyFlow).mockResolvedValue({ plan: { id: 'p', date, approved: true, revision: 2, ids: [], proposal: null, source: 'daily', summary: null }, tasks: [task], snapshot: 'a'.repeat(32), today: date, timezone: 'UTC' });
  await render(tree());
  await screen.findByText('בחרת יום ללא משימות. אפשר להשאיר אותו כך.');
  expect(screen.queryByText(task.title)).toBeNull();
  expect(screen.queryByText('הוספת משימה ראשונה')).toBeNull();
  expect(flow.saveDailyFlow).not.toHaveBeenCalled();
});

it('cancels proposal adjustment without writing and approves exactly the reviewed identities', async () => {
  const state: flow.DailyFlow = { plan: { id: 'p', date, revision: 1, approved: false, ids: [], source: null, summary: null, proposal: { ids: [task.id], reasons: {}, snapshot: 'a'.repeat(32), rule: 'bounded-v1' } }, tasks: [task], snapshot: 'a'.repeat(32), today: date, timezone: 'UTC' };
  jest.mocked(flow.initializeDailyFlow).mockResolvedValue(state);
  jest.mocked(flow.saveDailyFlow).mockResolvedValue({ ...state, plan: { ...state.plan!, approved: true, revision: 2, ids: [task.id], proposal: null, source: 'daily' } });
  await render(tree());
  await screen.findByText(task.title);
  await fireEvent.press(screen.getByRole('button', { name: 'שינוי ההצעה' }));
  await fireEvent.press(screen.getByRole('button', { name: 'ביטול וחזרה ליום' }));
  expect(flow.saveDailyFlow).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'מתאים לי, מאשר' }));
  await screen.findByRole('checkbox', { name: `סימון כהושלמה: ${task.title}` });
  expect(flow.saveDailyFlow).toHaveBeenCalledTimes(1);
  expect(flow.saveDailyFlow).toHaveBeenCalledWith('A', date, expect.objectContaining({ action: 'approve', revision: 1, snapshot: state.snapshot, ids: [task.id], source: 'daily' }));
  expect(screen.queryByText('בדיקת הצעות לשינוי')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'סיכום היום ואפשרויות נוספות' }));
  expect(screen.getByRole('button', { name: 'סיכום היום · לא חובה' })).toBeTruthy();
  expect(flow.saveDailyFlow).toHaveBeenCalledTimes(1);
});

it.each([
  [440, 'light'], [440, 'dark'], [320, 'light'], [320, 'dark'],
] as const)('retains long Hebrew content and navigation actions at mocked width %s in %s component state', async (width, mode) => {
  const dimensions = jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width, height: 956, scale: 1, fontScale: 1 });
  await AsyncStorage.setItem('lifeos.appearance', mode);
  const name = 'נועה';
  task = { ...task, title: 'להכין את כל המסמכים הדרושים לקראת הפגישה המשפחתית ולבדוק שכל הפרטים המעודכנים נשמרו במקום הנכון' };
  const state: flow.DailyFlow = { plan: { id: 'p', date, revision: 1, approved: false, ids: [], source: null, summary: null, proposal: { ids: [task.id], reasons: { [task.id]: { kind: 'backlog', origin: null } }, snapshot: 'a'.repeat(32), rule: 'bounded-v1' } }, tasks: [task], snapshot: 'a'.repeat(32), today: date, timezone: 'UTC' };
  jest.mocked(flow.initializeDailyFlow).mockResolvedValue(state);
  const more = jest.fn(); const inbox = jest.fn(); const week = jest.fn();
  try {
    await render(<TestProviders><ThemeProvider><TaskQueryScopeProvider userId="A"><V2TodayScreen displayName={name} onNavigateMore={more} onNavigateInbox={inbox} onNavigateWeek={week} /></TaskQueryScopeProvider></ThemeProvider></TestProviders>);
    await screen.findByText(task.title);
    expect(screen.getByText('נ')).toBeTruthy();
    expect(screen.getByRole('header', { name: /נועה/ })).toBeTruthy();
    expect(screen.getByText('משימה פתוחה, לפי סדר הרשימה')).toBeTruthy();
    expect(screen.queryByText('1 · מוצעת להיום')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'מתאים לי, מאשר' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'היום', selected: true })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'עוד והגדרות' })); expect(more).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'משימות' })); expect(inbox).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'השבוע' })); expect(week).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'הוספה מהירה' }));
    expect(await screen.findByLabelText('חלונית הוספה מהירה')).toBeTruthy();
    expect(flow.saveDailyFlow).not.toHaveBeenCalled();
  } finally {
    dimensions.mockRestore(); await AsyncStorage.removeItem('lifeos.appearance');
  }
});
