import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { WeekAllocationEditor } from '@/features/week/week-allocation-editor';
import { getDailyFlow, type DailyFlow } from '@/features/planning/daily-flow.api';
import { saveWeekAllocation } from '@/features/planning/week-allocation.api';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import { ApiError } from '@/lib/api/client';
import { TestProviders } from '../test-utils/test-providers';
jest.mock('@/features/planning/daily-flow.api', () => ({ getDailyFlow: jest.fn() }));
jest.mock('@/features/planning/week-allocation.api', () => ({ saveWeekAllocation: jest.fn() }));
const date = '2026-10-09';
const next = '2026-10-10';
const task = { id: 'a', title: 'ראשונה', description: 'שורה א\nשורה ב', plannedDate: null, dueDate: null,
  weekPlanId: null, estimatedMinutes: null, status: 'open' as const, priority: 'normal' as const, position: 0,
  createdAt: '2026-10-01T12:00:00Z', updatedAt: '2026-10-01T12:00:00Z', completedAt: null };
let flows: Record<string, DailyFlow>;
const close = jest.fn();
const press = async (label: string) => fireEvent.press(await screen.findByLabelText(label));
const tree = (owner = 'A') => <TestProviders><TaskQueryScopeProvider userId={owner}><WeekAllocationEditor weekStart="2026-10-04" today={date} onClose={close} /></TaskQueryScopeProvider></TestProviders>;
beforeEach(() => {
  jest.clearAllMocks();
  const tasks = [task, { ...task, id: 'b', title: 'שנייה' }];
  flows = Object.fromEntries([date, next].map(day => [day, { tasks, today: date, timezone: 'UTC', snapshot: 'a'.repeat(32),
    plan: { id: day, date: day, approved: true, revision: 4, ids: day === date ? ['a', 'b'] : [], proposal: null, source: 'daily', summary: null } }]));
  jest.mocked(getDailyFlow).mockImplementation(async (_owner, day) => structuredClone(flows[day]!));
  jest.mocked(saveWeekAllocation).mockResolvedValue({ days: [], tasks: [] });
});
it('cancels a draft without writes and retains approved order', async () => {
  await render(tree()); await press('העלה בשבוע: שנייה');
  expect(screen.getByText('1. שנייה')).toBeTruthy();
  await press('ביטול וחזרה לשבוע');
  expect(saveWeekAllocation).not.toHaveBeenCalled(); expect(close).toHaveBeenCalledTimes(1);
  expect(flows[date]!.plan!.ids).toEqual(['a', 'b']);
});
it('reviews ordered moves between approved days and saves all days only on explicit approval', async () => {
  await render(tree()); await press('שינוי יום בשבוע: ראשונה'); await press('העבר ליום ' + next);
  await press('סקירת החלוקה'); expect(saveWeekAllocation).not.toHaveBeenCalled();
  await press('אישור ושמירת השבוע'); await waitFor(() => expect(close).toHaveBeenCalled());
  expect(saveWeekAllocation).toHaveBeenCalledWith('A', '2026-10-04', expect.objectContaining({ operationId: expect.any(String),
    days: [{ date, revision: 4, snapshot: 'a'.repeat(32), ids: ['b'] }, { date: next, revision: 4, snapshot: 'a'.repeat(32), ids: ['a'] }] }));
  expect(new Set(jest.mocked(getDailyFlow).mock.calls.map(call => call[1]))).toEqual(new Set([date, next])); // no historical dates
});
it('saves valid empty plans and retries the identical request after an unknown outcome', async () => {
  flows[date]!.plan!.ids = [];
  jest.mocked(saveWeekAllocation).mockRejectedValueOnce(new Error('response lost'));
  await render(tree()); await press('סקירת החלוקה'); await press('אישור ושמירת השבוע');
  await press('נסה שוב'); await waitFor(() => expect(close).toHaveBeenCalled());
  const calls = jest.mocked(saveWeekAllocation).mock.calls;
  expect(calls[1]).toEqual(calls[0]); expect(calls[0]![2].days.every(day => day.ids.length === 0)).toBe(true);
});
it('forces reload and a new review after conflict without overwriting a concurrent change', async () => {
  jest.mocked(saveWeekAllocation).mockRejectedValueOnce(new ApiError('conflict', 409));
  await render(tree()); await press('סקירת החלוקה'); await press('אישור ושמירת השבוע');
  await screen.findByText('השבוע השתנה. אף יום לא נדרס; יש לטעון ולסקור מחדש.');
  flows[date]!.plan!.revision = 5; flows[date]!.plan!.ids = ['b'];
  await press('נסה שוב'); await screen.findByText('1. שנייה');
  expect(saveWeekAllocation).toHaveBeenCalledTimes(1);
  await press('סקירת החלוקה'); await press('אישור ושמירת השבוע');
  await waitFor(() => expect(close).toHaveBeenCalled());
  const calls = jest.mocked(saveWeekAllocation).mock.calls;
  expect(calls[1]![2].operationId).not.toBe(calls[0]![2].operationId);
  expect(calls[1]![2].days[0]).toMatchObject({ revision: 5, ids: ['b'] });
});
it('does not approve an existing system proposal on opening or reviewing', async () => {
  flows[date]!.plan = { ...flows[date]!.plan!, approved: false, ids: [], proposal: { ids: ['b'], reasons: {}, snapshot: 'a'.repeat(32), rule: 'bounded-v1' } };
  await render(tree()); await screen.findByText('טיוטת הצעה · ממתינה לאישור'); await press('סקירת החלוקה');
  expect(saveWeekAllocation).not.toHaveBeenCalled(); expect(flows[date]!.plan!.approved).toBe(false);
});
it('isolates account drafts and ignores an old account save response', async () => {
  let finish!: () => void;
  jest.mocked(saveWeekAllocation).mockImplementationOnce(() => new Promise(resolve => { finish = () => resolve({ days: [], tasks: [] }); }));
  const view = await render(tree()); await press('סקירת החלוקה'); await press('אישור ושמירת השבוע');
  flows[date]!.tasks = []; flows[next]!.tasks = []; flows[date]!.plan!.ids = [];
  await view.rerender(tree('B')); await screen.findByText('חלוקה שמתאימה לך');
  expect(screen.queryByText('1. ראשונה')).toBeNull();
  await act(async () => finish()); expect(close).not.toHaveBeenCalled();
  expect(getDailyFlow).toHaveBeenCalledWith('B', date, expect.anything());
});
