import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { DailyFlowCard } from '@/features/planning/daily-flow-card';
import { getDailyFlow, saveDailyFlow, type DailyFlow, type FlowCommand } from '@/features/planning/daily-flow.api';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import { ApiError } from '@/lib/api/client';
import { TestProviders } from '../test-utils/test-providers';

jest.mock('@/features/planning/daily-flow.api', () => ({ ...jest.requireActual('@/features/planning/daily-flow.api'), getDailyFlow: jest.fn(), saveDailyFlow: jest.fn() }));
jest.mock('@/features/commitments/commitment.api', () => ({ listCommitments: jest.fn(async () => []) }));
const date = '2026-10-14';
let state: DailyFlow;
let client: QueryClient;
function CaptureClient() { client = useQueryClient(); return null; }
const tree = (today = true) => <TestProviders><CaptureClient /><TaskQueryScopeProvider userId="A"><DailyFlowCard date={date} today={today} onAllTasks={jest.fn()} /></TaskQueryScopeProvider></TestProviders>;
const save = jest.mocked(saveDailyFlow);
function persist(command: FlowCommand) {
  state = { ...state, plan: { ...state.plan!, revision: state.plan!.revision + 1,
    ...(command.action === 'save-draft' ? { proposal: { ...state.plan!.proposal!, ids: command.ids! } }
      : { approved: true, ids: command.ids!, proposal: null, source: 'daily' }) } };
  return structuredClone(state);
}
beforeEach(() => {
  jest.clearAllMocks();
  const task = { description: null, plannedDate: null, dueDate: null, weekPlanId: null, estimatedMinutes: null, status: 'open' as const,
    priority: 'normal' as const, position: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01', completedAt: null };
  state = { today: date, timezone: 'Asia/Jerusalem', snapshot: 'b'.repeat(32),
    tasks: [{ ...task, id: 'a', title: 'בחירה ראשונה' }, { ...task, id: 'b', title: 'בחירה שנייה' }, { ...task, id: 'c', title: 'משימה אחרת' }],
    plan: { id: 'p', date, approved: false, revision: 1, ids: [], source: null, summary: null,
      proposal: { ids: ['a', 'b'], reasons: {}, snapshot: 'a'.repeat(32), rule: 'bounded-v1' } } };
  jest.mocked(getDailyFlow).mockImplementation(async () => structuredClone(state));
  save.mockImplementation(async (_owner, _date, command) => persist(command));
});
const open = async () => fireEvent.press(await screen.findByLabelText('שינוי ההצעה'));

it('opens Today adjustment without regeneration and saves unchanged stale recommendations', async () => {
  await render(tree()); await open();
  expect(save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'אישור התוכנית' }));
  expect(save).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledWith('A', date, expect.objectContaining({ action: 'approve', revision: 1, ids: ['a', 'b'] }));
  await screen.findByText('התוכנית שלך'); expect(state.plan!.ids).toEqual(['a', 'b']);
});

it('deliberately accepts the displayed stale recommendation without replacing it', async () => {
  await render(tree());
  await fireEvent.press(await screen.findByRole('button', { name: 'מתאים לי, מאשר' }));
  expect(save.mock.calls[0]![2]).toEqual(expect.objectContaining({ action: 'approve', ids: ['a', 'b'] }));
  expect(save).toHaveBeenCalledTimes(1);
});

it('opens a manual selected-day editor without generating a proposal and accepts an empty day', async () => {
  state.plan = null;
  save.mockResolvedValueOnce({ ...state, plan: { id: 'new', date, approved: true, revision: 1, ids: [], proposal: null, source: 'weekly', summary: null } });
  await render(tree(false));
  await fireEvent.press(await screen.findByText('בחירת משימות ליום'));
  expect(save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'אישור יום ללא משימות' }));
  expect(save.mock.calls[0]![2]).toEqual(expect.objectContaining({ action: 'approve', revision: 0, ids: [] }));
  await screen.findByText('התוכנית שלך');
});

it('preserves local order through background refresh, persists draft and resumes it before empty approval', async () => {
  let view = await render(tree()); await open();
  await fireEvent.press(screen.getByLabelText('העלה: בחירה שנייה'));
  await fireEvent.press(screen.getByLabelText('הוסף לתוכנית: משימה אחרת'));
  await act(async () => {
    state = { ...state, snapshot: 'c'.repeat(32), tasks: state.tasks.map(t => ({ ...t, updatedAt: 'later' })) };
    await client.invalidateQueries({ queryKey: ['daily-flow', 'A', date] });
  });
  await fireEvent.press(screen.getByRole('button', { name: 'שמירת טיוטה להמשך' }));
  expect(save.mock.calls[0]![2]).toEqual(expect.objectContaining({ action: 'save-draft', ids: ['b', 'a', 'c'], revision: 1 }));
  expect(state.plan!.approved).toBe(false); expect(state.plan!.ids).toEqual([]);
  await view.unmount(); view = await render(tree()); await open();
  expect(screen.getByRole('button', { name: 'העלה: בחירה שנייה' })).toBeDisabled();
  for (const title of ['בחירה ראשונה', 'בחירה שנייה', 'משימה אחרת']) await fireEvent.press(screen.getByLabelText(`הסר לתוכנית: ${title}`));
  await fireEvent.press(screen.getByRole('button', { name: 'אישור יום ללא משימות' }));
  expect(state.plan!.approved).toBe(true); expect(state.plan!.ids).toEqual([]);
  await view.unmount();
});

it('retains order on genuine plan conflict and requires review before using the latest revision', async () => {
  save.mockRejectedValueOnce(new ApiError('Changed', 409, 'daily_plan_conflict'));
  await render(tree()); await open();
  await fireEvent.press(screen.getByLabelText('העלה: בחירה שנייה'));
  state = { ...state, plan: { ...state.plan!, revision: 2, approved: true, ids: ['c'], proposal: null } };
  await fireEvent.press(screen.getByRole('button', { name: 'אישור התוכנית' }));
  await screen.findByText(/התוכנית ליום הזה השתנתה/);
  jest.mocked(getDailyFlow).mockRejectedValueOnce(new Error('offline'));
  await fireEvent.press(screen.getByText('טעינת התוכנית העדכנית לסקירה'));
  await screen.findByText(/לא הצלחנו לטעון את המצב העדכני/);
  await fireEvent.press(screen.getByText('טעינת התוכנית העדכנית לסקירה'));
  await screen.findByText('1. משימה אחרת');
  expect(screen.getByRole('button', { name: 'קבלת השינויים המוצעים' })).toBeDisabled();
  expect(save).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText('סקרתי, המשך עם הבחירה שלי'));
  await fireEvent.press(screen.getByRole('button', { name: 'קבלת השינויים המוצעים' }));
  expect(save.mock.calls[1]![2]).toEqual(expect.objectContaining({ revision: 2, ids: ['b', 'a'] }));
  expect(state.plan!.ids).toEqual(['b', 'a']);
});

it('identifies unavailable selections and removes only those after intentional recovery', async () => {
  save.mockRejectedValueOnce(new ApiError('Unavailable', 422, 'selection_unavailable'));
  await render(tree()); await open();
  await fireEvent.press(screen.getByLabelText('העלה: בחירה שנייה'));
  await fireEvent.press(screen.getByLabelText('הוסף לתוכנית: משימה אחרת'));
  state = { ...state, tasks: state.tasks.filter(t => t.id !== 'a').map(t => t.id === 'c' ? { ...t, status: 'cancelled' } : t) };
  await fireEvent.press(screen.getByRole('button', { name: 'אישור התוכנית' }));
  await screen.findByText(/חלק מהמשימות שנבחרו כבר אינן זמינות/);
  await fireEvent.press(screen.getByText('טעינת מצב המשימות'));
  await screen.findByLabelText('הסר לתוכנית: משימה שאינה זמינה');
  expect(screen.getByRole('button', { name: 'אישור התוכנית' })).toBeDisabled();
  await fireEvent.press(screen.getByText('הסרת המשימות שאינן זמינות מהבחירה'));
  await fireEvent.press(screen.getByRole('button', { name: 'אישור התוכנית' }));
  expect(save.mock.calls[1]![2].ids).toEqual(['b']);
});

it('allows intentional cancellation after failure and reopening without a stuck recovery state', async () => {
  save.mockRejectedValueOnce(new ApiError('Changed', 409, 'daily_plan_conflict'));
  await render(tree()); await open();
  await fireEvent.press(screen.getByRole('button', { name: 'אישור התוכנית' }));
  await screen.findByText(/התוכנית ליום הזה השתנתה/);
  await fireEvent.press(screen.getByText('ביטול וחזרה ליום'));
  await open();
  expect(screen.getByRole('button', { name: 'אישור התוכנית' })).not.toBeDisabled();
  expect(screen.queryByText('טעינת התוכנית העדכנית לסקירה')).toBeNull();
  expect(save).toHaveBeenCalledTimes(1);
});

it('prevents duplicate pending submits and retries a lost response with the identical operation', async () => {
  let reject!: (error: Error) => void;
  save.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
  await render(tree()); await open();
  await fireEvent.press(screen.getByRole('button', { name: 'אישור התוכנית' }));
  const button = screen.getByRole('button', { name: 'אישור התוכנית' });
  expect(button).toBeDisabled(); expect(button.props.accessibilityState.busy).toBe(true);
  await fireEvent.press(button); expect(save).toHaveBeenCalledTimes(1);
  const original = save.mock.calls[0]![2];
  await act(async () => reject(new Error('response lost')));
  await fireEvent.press(await screen.findByText('נסה שוב'));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save.mock.calls[1]![2]).toEqual(original);
});
