import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { V2TaskList } from '@/features/tasks/v2-task-list';
import { TaskDetails } from '@/features/tasks/task-details';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { getDailyFlow } from '@/features/planning/daily-flow.api';
import { getTaskMemberships } from '@/features/planning/week-allocation.api';
import { getSettings } from '@/features/settings/settings.api';
import { updateTask } from '@/features/tasks/task.api';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import { taskContentError, normalizeTaskDescription } from '@/features/tasks/task-content';
import { palettes } from '@/theme/theme-provider';
import { TestProviders } from '../test-utils/test-providers';
let mockMode: 'light' | 'dark' = 'light';
jest.mock('@/theme/theme-provider', () => ({ ...jest.requireActual('@/theme/theme-provider'), useTheme: () => ({ colors: jest.requireActual('@/theme/theme-provider').palettes[mockMode], mode: mockMode }) }));
jest.mock('@/features/settings/settings.api', () => ({ getSettings: jest.fn() }));
jest.mock('@/features/planning/daily-flow.api', () => ({ getDailyFlow: jest.fn() }));
jest.mock('@/features/planning/week-allocation.api', () => ({ getTaskMemberships: jest.fn() }));
jest.mock('@/features/tasks/task.api', () => ({ updateTask: jest.fn(), createTask: jest.fn(), listTasks: jest.fn(), cancelTask: jest.fn() }));
const task = { id: '00000000-0000-4000-8000-000000000001', title: 'משימה מקורית', description: ' שורה א\n\nשורה ב ', plannedDate: null, dueDate: null,
  weekPlanId: null, estimatedMinutes: null, status: 'open' as const, priority: 'normal' as const, position: 0,
  createdAt: '2026-10-01T12:00:00Z', updatedAt: '2026-10-01T12:00:00Z', completedAt: null };
const press = async (label: string) => fireEvent.press(await screen.findByLabelText(label));
const list = (owner = 'A') => <TestProviders><TaskQueryScopeProvider userId={owner}><V2TaskList /></TaskQueryScopeProvider></TestProviders>;
beforeEach(() => {
  jest.clearAllMocks(); jest.mocked(getDailyFlow).mockReset(); mockMode = 'light';
  jest.mocked(getSettings).mockResolvedValue({ persisted: true, timezone: 'UTC', weekStartDay: 0, defaultDailyCapacityMinutes: 360 });
  jest.mocked(getDailyFlow).mockResolvedValue({ plan: null, tasks: [task], snapshot: 'a'.repeat(32), today: '2026-10-09', timezone: 'UTC' });
  jest.mocked(getTaskMemberships).mockResolvedValue({ days: [] });
});
it('loads approved membership and counts after remount, excludes assigned tasks from no-day, and preserves completion identity', async () => {
  const other = { ...task, id: '00000000-0000-4000-8000-000000000002', title: 'ללא תכנון' };
  const flow = { plan: null, tasks: [task, other], snapshot: 'a'.repeat(32), today: '2026-10-09', timezone: 'UTC' };
  jest.mocked(getDailyFlow).mockResolvedValue(flow);
  jest.mocked(getTaskMemberships).mockResolvedValue({ days: [{ date: '2026-10-10', ids: [task.id] }] });
  jest.mocked(updateTask).mockImplementation(async ({ id, input }) => {
    const result = { ...task, ...input, id };
    jest.mocked(getDailyFlow).mockResolvedValue({ ...flow, tasks: [result, other] }); return result;
  });
  let view = await render(list()); await screen.findByText('2 משימות ברשימה');
  await fireEvent.press(screen.getByRole('button', { name: 'ללא יום' }));
  await screen.findByText('1 משימות ברשימה'); expect(screen.queryByText(task.title)).toBeNull();
  await fireEvent.press(screen.getByText('פתוחות')); await press('סימון כהושלמה: ' + task.title);
  await waitFor(() => expect(updateTask).toHaveBeenCalledWith({ id: task.id, input: { status: 'completed' } }, 'A'));
  await view.unmount(); view = await render(list()); await screen.findByText('1 משימות ברשימה');
  await fireEvent.press(screen.getByText('הושלמו')); await screen.findByText(task.title);
  expect(screen.getByText('בתוכנית: 2026-10-10')).toBeTruthy();
  expect(screen.getByLabelText('פתיחה מחדש: ' + task.title).props.accessibilityState.checked).toBe(true);
  await view.unmount();
});
it('shows loading and retryable error without inventing an empty plan', async () => {
  let fail!: (e: Error) => void;
  jest.mocked(getDailyFlow).mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
  await render(list()); await screen.findByText('טוען משימות ותוכניות…');
  await waitFor(() => expect(fail).toEqual(expect.any(Function)));
  await act(async () => fail(new Error('offline')));
  await screen.findByText('הרשימה אינה זמינה כרגע.'); await press('נסה שוב'); await screen.findByText(task.title);
});
it('clears account-specific list content on account change', async () => {
  const view = await render(list()); await screen.findByText(task.title);
  jest.mocked(getDailyFlow).mockResolvedValue({ plan: null, tasks: [], snapshot: 'b'.repeat(32), today: '2026-10-09', timezone: 'UTC' });
  await view.rerender(list('B')); await screen.findByText('0 משימות ברשימה'); expect(screen.queryByText(task.title)).toBeNull();
  expect(getTaskMemberships).toHaveBeenCalledWith('B', expect.any(String), expect.anything());
});
it('cancels capture without writes and retries the same title, multiline description and operation identity', async () => {
  const save = jest.fn().mockRejectedValueOnce(new Error('response lost')).mockResolvedValue(undefined);
  const close = jest.fn();
  const tree = () => <TestProviders><QuickCaptureSheet visible onSave={save} onClose={close} /></TestProviders>;
  let view = await render(tree());
  await fireEvent.changeText(screen.getByLabelText('כותרת'), 'טיוטה'); await press('ביטול');
  expect(save).not.toHaveBeenCalled(); await view.unmount(); view = await render(tree());
  await fireEvent.changeText(screen.getByLabelText('כותרת'), '  חדש  ');
  await fireEvent.changeText(screen.getByLabelText('תיאור (לא חובה)'), task.description);
  await fireEvent.press(screen.getByText('שמירה')); await screen.findByText('לא הצלחנו לשמור. אפשר לנסות שוב.');
  expect(screen.getByLabelText('כותרת').props.editable).toBe(false);
  await fireEvent.press(screen.getByText('שמירה'));
  expect(save.mock.calls[1]).toEqual(save.mock.calls[0]);
  expect(save).toHaveBeenCalledWith('חדש', { destination: 'inbox' }, { description: task.description, creationId: expect.any(String) });
  await view.unmount();
});
it.each(['light', 'dark'] as const)('preserves editable Hebrew multiline content and theme tokens in %s (component evidence only)', async mode => {
  mockMode = mode;
  const update = jest.fn().mockResolvedValue(undefined);
  await render(<TestProviders><TaskDetails task={task} onUpdate={update} onDelete={jest.fn()} onClose={jest.fn()} /></TestProviders>);
  expect(screen.getByText(task.description).props.selectable).toBe(true);
  await press('עריכת כותרת');
  const input = screen.getByLabelText('תיאור (לא חובה)');
  expect(input.props.multiline).toBe(true); expect(input.props.value).toBe(task.description);
  expect(StyleSheet.flatten(input.props.style)).toMatchObject({ color: palettes[mode].text, writingDirection: 'rtl', textAlign: 'right' });
  await fireEvent.changeText(screen.getByLabelText('כותרת משימה'), 'כותרת חדשה');
  await press('שמירת שינויים'); expect(update).toHaveBeenCalledWith({ title: 'כותרת חדשה' });
});
it('validates limits without silently truncating, cancels edits, and explicitly clears whitespace-only description', async () => {
  expect(taskContentError(' ', '')).toBeTruthy(); expect(taskContentError('x'.repeat(501), '')).toBeTruthy();
  expect(taskContentError('x'.repeat(500), 'y'.repeat(10000))).toBeNull(); expect(taskContentError('x', 'y'.repeat(10001))).toBeTruthy();
  expect(normalizeTaskDescription('  \n ')).toBeNull();
  const update = jest.fn().mockResolvedValue(undefined);
  await render(<TestProviders><TaskDetails task={task} onUpdate={update} onDelete={jest.fn()} onClose={jest.fn()} /></TestProviders>);
  await press('עריכת כותרת'); await fireEvent.changeText(screen.getByLabelText('כותרת משימה'), 'discard');
  await press('ביטול עריכה'); expect(update).not.toHaveBeenCalled(); await press('עריכת כותרת');
  expect(screen.getByLabelText('כותרת משימה').props.value).toBe(task.title);
  await fireEvent.changeText(screen.getByLabelText('תיאור (לא חובה)'), ' \n '); await press('שמירת שינויים');
  expect(update).toHaveBeenCalledWith({ description: null });
});
