import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DailyFlowCard } from '@/features/planning/daily-flow-card';
import { approvedDayTasks, type DailyFlow, type FlowCommand, getDailyFlow, saveDailyFlow } from '@/features/planning/daily-flow.api';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import { addDaysToDateKey, localDateKey } from '@/features/tasks/task-dates';
import { ApiError } from '@/lib/api/client';
import { TestProviders } from '../test-utils/test-providers';
jest.mock('@/features/planning/daily-flow.api', () => ({ ...jest.requireActual('@/features/planning/daily-flow.api'), getDailyFlow: jest.fn(), saveDailyFlow: jest.fn() }));
jest.mock('@/features/commitments/commitment.api', () => ({ listCommitments: jest.fn(async () => []) }));
const date = '2026-10-09';
let state: DailyFlow;
const allTasks = jest.fn();
const task = { id: 'a', title: 'משימה מיום קודם', description: null, plannedDate: null, dueDate: null,
  weekPlanId: null, estimatedMinutes: null, status: 'open' as const, priority: 'normal' as const, position: 0,
  createdAt: '2026-10-01T12:00:00Z', updatedAt: '2026-10-01T12:00:00Z', completedAt: null };
const tree = (day = date, owner = 'a') => <TestProviders><TaskQueryScopeProvider userId={owner}><DailyFlowCard date={day} source="weekly" onAllTasks={allTasks} /></TaskQueryScopeProvider></TestProviders>;
function proposal(): NonNullable<DailyFlow['plan']> {
  return { id: 'p', date, revision: 1, approved: false, ids: [], source: null, summary: null,
    proposal: { ids: ['a'], reasons: { a: { kind: 'carry', origin: '2026-10-04' } }, snapshot: state.snapshot, rule: 'bounded-v1' } };
}
function saved(input: FlowCommand) {
  const p = state.plan ?? proposal();
  state = { ...state, plan: { ...p, revision: p.revision + 1,
    ...(input.action === 'propose' ? { proposal: proposal().proposal } : {}),
    ...(input.action === 'approve' || input.action === 'edit' ? { approved: true, ids: input.ids!, proposal: null, source: p.source ?? input.source ?? 'daily' } : {}),
    ...(input.action === 'save-draft' ? { proposal: { ...p.proposal!, ids: input.ids! } } : {}),
    ...(input.action === 'summarize' ? { summary: { note: input.note!, savedAt: 'now' } } : {}) } };
  return structuredClone(state);
}
beforeEach(() => {
  jest.clearAllMocks();
  state = { plan: null, tasks: [task], snapshot: 'a'.repeat(32), today: date, timezone: 'Asia/Jerusalem' };
  jest.mocked(getDailyFlow).mockImplementation(async () => structuredClone(state));
  jest.mocked(saveDailyFlow).mockImplementation(async (_owner, _date, input) => saved(input));
});
it('reviews real reasons, cancels without approval, and approves an intentionally empty plan', async () => {
  await render(tree());
  await fireEvent.press(await screen.findByText('הצעת היום'));
  expect(await screen.findByText(/נשארה מ־2026-10-04/)).toBeTruthy();
  expect(state.plan?.approved).toBe(false);
  await fireEvent.press(screen.getByText('ביטול וחזרה ליום'));
  expect(saveDailyFlow).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText('סקירת ההצעה השמורה'));
  await fireEvent.press(screen.getByLabelText(`הסר לתוכנית: ${task.title}`));
  await fireEvent.press(screen.getByText('אישור יום ללא משימות'));
  await screen.findByText('התוכנית שלך');
  expect(state.plan?.ids).toEqual([]); expect(state.plan?.approved).toBe(true);
  expect(saveDailyFlow).toHaveBeenLastCalledWith('a', date, expect.objectContaining({ action: 'approve', ids: [], source: 'weekly' }));
});
it('resumes a persisted draft after remount and preserves weekly approval until explicit edit/save', async () => {
  state.plan = { ...proposal(), approved: true, source: 'weekly', ids: ['a'] };
  let view = await render(tree());
  await fireEvent.press(await screen.findByText('סקירת ההצעה השמורה'));
  expect(screen.getByText('התוכנית הקיימת נשארת בתוקף עד קבלת השינויים.')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText(`הסר לתוכנית: ${task.title}`));
  await fireEvent.press(screen.getByText('שמירת טיוטה להמשך'));
  await waitFor(() => expect(state.plan?.proposal?.ids).toEqual([]));
  expect(state.plan?.ids).toEqual(['a']); expect(state.plan?.approved).toBe(true);
  await view.unmount(); view = await render(tree());
  await fireEvent.press(await screen.findByText('עריכת התוכנית'));
  await fireEvent.press(screen.getByLabelText(`הסר לתוכנית: ${task.title}`));
  expect(state.plan?.ids).toEqual(['a']);
  await fireEvent.press(screen.getByText('שמירת השינויים'));
  await waitFor(() => expect(state.plan?.ids).toEqual([])); expect(state.plan?.source).toBe('weekly');
  await view.unmount();
});
it('retains a failed approval and retries the exact operation, while summary skipping writes nothing', async () => {
  state.plan = proposal();
  jest.mocked(saveDailyFlow).mockRejectedValueOnce(new Error('lost response'));
  await render(tree());
  await fireEvent.press(await screen.findByText('סקירת ההצעה השמורה'));
  await fireEvent.press(screen.getByText('אישור התוכנית'));
  await screen.findByText(/לא התקבל אישור לשמירה/);
  const failed = jest.mocked(saveDailyFlow).mock.calls[0]![2];
  await fireEvent.press(screen.getByText('נסה שוב'));
  await screen.findByText('התוכנית שלך');
  expect(jest.mocked(saveDailyFlow).mock.calls[1]![2]).toEqual(failed);
  await fireEvent.press(screen.getByText('סיכום היום · לא חובה'));
  await fireEvent.press(screen.getByText('דילוג וחזרה ליום'));
  expect(saveDailyFlow).toHaveBeenCalledTimes(2);
});
it('requires refresh on conflict, preserves the approved plan, and resets a review on day/account change', async () => {
  state.plan = { ...proposal(), approved: true, ids: ['a'], source: 'weekly' };
  jest.mocked(saveDailyFlow).mockRejectedValueOnce(new ApiError('Changed', 409));
  const view = await render(tree());
  await fireEvent.press(await screen.findByText('עריכת התוכנית'));
  await fireEvent.press(screen.getByLabelText(`הסר לתוכנית: ${task.title}`));
  await fireEvent.press(screen.getByText('שמירת השינויים'));
  await screen.findByText(/הנתונים השתנו/);
  expect(state.plan.ids).toEqual(['a']);
  await fireEvent.press(screen.getByText('נסה שוב'));
  await fireEvent.press(await screen.findByText('עריכת התוכנית'));
  await act(async () => { state = { ...state, plan: null, tasks: [] }; });
  await view.rerender(tree('2026-10-10', 'b'));
  await screen.findByText('יום חדש, בחירה חדשה');
  expect(screen.queryByText('שמירת השינויים')).toBeNull();
  expect(getDailyFlow).toHaveBeenLastCalledWith('b', '2026-10-10', expect.anything());
});
it('uses stable task identity and completion in both views, retaining history while omitting deleted rows', () => {
  const p = { ...proposal(), approved: true, ids: ['a', 'b', 'missing'] };
  const completed = { ...task, status: 'completed' as const };
  const tasks = [completed, { ...task, id: 'b', status: 'cancelled' as const }];
  expect(approvedDayTasks(p, tasks)).toEqual([completed]);
  expect(approvedDayTasks(p, tasks)[0]).toBe(completed);
  expect(p.ids).toEqual(['a', 'b', 'missing']);
});
it('selects the account-local day across midnight, DST, month/year and missed-day boundaries', () => {
  expect(localDateKey(new Date('2026-10-08T20:59:59Z'), 'Asia/Jerusalem')).toBe('2026-10-08');
  expect(localDateKey(new Date('2026-10-08T21:00:00Z'), 'Asia/Jerusalem')).toBe('2026-10-09');
  expect(localDateKey(new Date('2026-10-08T21:00:00Z'), 'America/Los_Angeles')).toBe('2026-10-08');
  expect(localDateKey(new Date('2026-10-25T00:30:00Z'), 'Asia/Jerusalem')).toBe('2026-10-25');
  expect(addDaysToDateKey('2026-12-31', 4)).toBe('2027-01-04');
});

it('keeps unselected past and future work discoverable beyond the Inbox filter', async () => {
  state.tasks = [{ ...task, plannedDate: '2026-10-01' }, { ...task, id: 'future', title: 'Later task', plannedDate: '2026-10-20' }];
  await render(tree());
  await fireEvent.press(await screen.findByText('כל המשימות'));
  expect(await screen.findByText(task.title)).toBeTruthy();
  expect(screen.getByText('Later task')).toBeTruthy();
  expect(screen.getByText('תאריך המשימה: 2026-10-01')).toBeTruthy();
  expect(saveDailyFlow).not.toHaveBeenCalled();
});
