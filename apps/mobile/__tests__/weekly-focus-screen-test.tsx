import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { notifyManager } from '@tanstack/react-query';

import * as commitmentApi from '@/features/commitments/commitment.api';
import * as planningApi from '@/features/planning/planning.api';
import type { WeeklyFocus } from '@/features/planning/planning.types';
import * as settingsApi from '@/features/settings/settings.api';
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
jest.mock('@/features/commitments/commitment.api', () => ({
  createCommitment: jest.fn(),
  deleteCommitment: jest.fn(),
  listCommitments: jest.fn(),
  updateCommitment: jest.fn(),
}));
jest.mock('@/features/settings/settings.api', () => ({
  getSettings: jest.fn(),
  putSettings: jest.fn(),
}));

const listTasksMock = jest.mocked(taskApi.listTasks);
const createTaskMock = jest.mocked(taskApi.createTask);
const getWeeklyFocusesMock = jest.mocked(planningApi.getWeeklyFocuses);
const replaceWeeklyFocusesMock = jest.mocked(planningApi.replaceWeeklyFocuses);
const listCommitmentsMock = jest.mocked(commitmentApi.listCommitments);
const getSettingsMock = jest.mocked(settingsApi.getSettings);

beforeAll(() => notifyManager.setScheduler((callback) => callback()));
afterAll(() => notifyManager.setScheduler((callback) => setTimeout(callback, 0)));

function focus(id: string, title: string, position: number): WeeklyFocus {
  return {
    createdAt: '2026-09-06T08:00:00.000Z',
    id,
    position,
    title,
    updatedAt: '2026-09-06T08:00:00.000Z',
    weekPlanId: 'week-plan-1',
  };
}

function savedFocuses(titles: string[]) {
  return titles.map((title, position) => focus(`saved-${position}`, title, position));
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

async function renderServerWeek() {
  return render(<TestProviders><WeekScreen taskSource="server" /></TestProviders>);
}

beforeEach(() => {
  jest.clearAllMocks();
  listTasksMock.mockResolvedValue([]);
  listCommitmentsMock.mockResolvedValue([]);
  getSettingsMock.mockResolvedValue({
    dayEndTime: null,
    dayStartTime: null,
    dayWindowSupported: true,
    defaultDailyCapacityMinutes: 360,
    persisted: true,
    timezone: 'Asia/Jerusalem',
    weekStartDay: 0,
  });
});

describe('Week persisted Weekly Focus editor', () => {
  it('waits for a successful initial load before exposing an empty editor', async () => {
    const request = deferred<WeeklyFocus[]>();
    getWeeklyFocusesMock.mockReturnValue(request.promise);

    await renderServerWeek();

    expect(await screen.findByText('טוען מיקודים…')).toBeTruthy();
    expect(screen.queryByText('הוסף מיקודים')).toBeNull();
    expect(screen.queryByLabelText('עורך מיקודים לשבוע')).toBeNull();

    await act(async () => request.resolve([]));

    expect(await screen.findByText('עוד לא נשמרו מיקודים לשבוע הזה.')).toBeTruthy();
    expect(screen.getByText('הוסף מיקודים')).toBeTruthy();
    expect(screen.queryByText('לסיים את אפיון LifeOS')).toBeNull();
    expect(screen.queryByText('לטפל בנושא בבית')).toBeNull();
  });

  it('does not expose an editable empty form when the initial focus query fails', async () => {
    getWeeklyFocusesMock.mockRejectedValue(new Error('focus load failed'));

    await renderServerWeek();

    expect(await screen.findByText('לא הצלחנו לטעון את המיקודים.')).toBeTruthy();
    expect(screen.queryByText('הוסף מיקודים')).toBeNull();
    expect(screen.queryByText('עריכת מיקודים')).toBeNull();
    expect(screen.queryByLabelText('עורך מיקודים לשבוע')).toBeNull();
    expect(replaceWeeklyFocusesMock).not.toHaveBeenCalled();
  });

  it('opens a genuine empty state and cancels without writing or injecting fixtures', async () => {
    getWeeklyFocusesMock.mockResolvedValue([]);
    const user = userEvent.setup();
    await renderServerWeek();

    await user.press(await screen.findByText('הוסף מיקודים'));

    expect(screen.getByLabelText('עורך מיקודים לשבוע')).toBeTruthy();
    expect(screen.getByLabelText('אין מיקודים שמורים')).toBeTruthy();
    expect(screen.queryByText('נשאר משבוע שעבר · להכין הצעת מחיר')).toBeNull();
    expect(screen.queryByText('פגישת צוות')).toBeNull();
    expect(screen.queryByText(/שלב .* מתוך 4/)).toBeNull();

    await user.press(screen.getByText('ביטול'));

    expect(await screen.findByText('הוסף מיקודים')).toBeTruthy();
    expect(replaceWeeklyFocusesMock).not.toHaveBeenCalled();
    expect(createTaskMock).not.toHaveBeenCalled();
  });

  it('keeps a legitimately persisted fixture-like title visible and cancels edits without writing', async () => {
    getWeeklyFocusesMock.mockResolvedValue([
      focus('legitimate-focus', 'לסיים את אפיון LifeOS', 0),
    ]);
    const user = userEvent.setup();
    await renderServerWeek();

    expect(await screen.findByText('לסיים את אפיון LifeOS')).toBeTruthy();
    await user.press(screen.getByText('עריכת מיקודים'));

    expect(screen.getByLabelText('לסיים את אפיון LifeOS').props.accessibilityState.checked).toBe(true);
    expect(screen.queryByText('לטפל בנושא בבית')).toBeNull();
    await user.press(screen.getByText('ביטול'));

    expect(await screen.findByText('לסיים את אפיון LifeOS')).toBeTruthy();
    expect(replaceWeeklyFocusesMock).not.toHaveBeenCalled();
  });

  it('saves only selected titles in order, updates Week cache, and reopens the saved focuses', async () => {
    let focuses = [focus('existing-focus', 'מיקוד קיים', 0)];
    let loadedWeekStart = '';
    getWeeklyFocusesMock.mockImplementation(async (weekStart) => {
      loadedWeekStart = weekStart;
      return focuses;
    });
    replaceWeeklyFocusesMock.mockImplementation(async ({ titles }) => {
      focuses = savedFocuses(titles);
      return focuses;
    });
    const user = userEvent.setup();
    await renderServerWeek();

    expect(await screen.findByText('מיקוד קיים')).toBeTruthy();
    await user.press(screen.getByText('עריכת מיקודים'));
    await user.type(screen.getByLabelText('מיקוד חדש'), 'מיקוד נוסף');
    await user.press(screen.getByLabelText('הוסף מיקוד'));
    expect(screen.getByLabelText('מיקוד נוסף').props.accessibilityState.checked).toBe(false);
    await user.press(screen.getByLabelText('מיקוד נוסף'));
    await user.press(screen.getByText('שמירת מיקודים'));

    expect(await screen.findByText('מיקוד נוסף')).toBeTruthy();
    expect(replaceWeeklyFocusesMock.mock.calls[0]?.[0]).toEqual({
      titles: ['מיקוד קיים', 'מיקוד נוסף'],
      weekStart: loadedWeekStart,
    });
    expect(replaceWeeklyFocusesMock).toHaveBeenCalledTimes(1);
    expect(getWeeklyFocusesMock).toHaveBeenCalledTimes(1);
    expect(createTaskMock).not.toHaveBeenCalled();

    await user.press(screen.getByText('עריכת מיקודים'));
    expect(screen.getByLabelText('מיקוד קיים').props.accessibilityState.checked).toBe(true);
    expect(screen.getByLabelText('מיקוד נוסף').props.accessibilityState.checked).toBe(true);
  });

  it('allows Save to intentionally clear every focus for only the loaded week', async () => {
    const initial = [focus('one', 'מיקוד ראשון', 0), focus('two', 'מיקוד שני', 1)];
    getWeeklyFocusesMock.mockResolvedValue(initial);
    replaceWeeklyFocusesMock.mockResolvedValue([]);
    const user = userEvent.setup();
    await renderServerWeek();

    await user.press(await screen.findByText('עריכת מיקודים'));
    await user.press(screen.getByLabelText('מיקוד ראשון'));
    await user.press(screen.getByLabelText('מיקוד שני'));
    await user.press(screen.getByText('שמירת מיקודים'));

    expect(await screen.findByText('עוד לא נשמרו מיקודים לשבוע הזה.')).toBeTruthy();
    expect(replaceWeeklyFocusesMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ titles: [] }));
    expect(replaceWeeklyFocusesMock).toHaveBeenCalledTimes(1);
    expect(createTaskMock).not.toHaveBeenCalled();

    await user.press(screen.getByText('הוסף מיקודים'));
    expect(screen.getByLabelText('אין מיקודים שמורים')).toBeTruthy();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('keeps the draft after a failed save, blocks duplicate submission, and allows retry', async () => {
    getWeeklyFocusesMock.mockResolvedValue([focus('one', 'מיקוד קיים', 0)]);
    const firstSave = deferred<WeeklyFocus[]>();
    replaceWeeklyFocusesMock.mockReturnValueOnce(firstSave.promise);
    const user = userEvent.setup();
    await renderServerWeek();

    await user.press(await screen.findByText('עריכת מיקודים'));
    await user.type(screen.getByLabelText('מיקוד חדש'), 'טיוטה לניסיון חוזר');
    await user.press(screen.getByLabelText('הוסף מיקוד'));
    await user.press(screen.getByLabelText('טיוטה לניסיון חוזר'));
    await user.press(screen.getByText('שמירת מיקודים'));
    await user.press(screen.getByText('שומר…'));

    expect(replaceWeeklyFocusesMock).toHaveBeenCalledTimes(1);
    await act(async () => firstSave.reject(new Error('offline')));

    expect(await screen.findByText('לא הצלחנו לשמור את המיקודים. הטיוטה נשמרה כאן ואפשר לנסות שוב.')).toBeTruthy();
    expect(screen.getByLabelText('טיוטה לניסיון חוזר').props.accessibilityState.checked).toBe(true);

    replaceWeeklyFocusesMock.mockResolvedValueOnce(savedFocuses([
      'מיקוד קיים',
      'טיוטה לניסיון חוזר',
    ]));
    await user.press(screen.getByText('שמירת מיקודים'));

    await waitFor(() => expect(replaceWeeklyFocusesMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('טיוטה לניסיון חוזר')).toBeTruthy();
    expect(screen.queryByLabelText('עורך מיקודים לשבוע')).toBeNull();
  });
});
