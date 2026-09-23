import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { notifyManager } from '@tanstack/react-query';

import * as api from '@/features/planning/planning.api';
import type { WeeklyPlanningState, WeeklyFocus } from '@/features/planning/planning.types';
import * as settingsApi from '@/features/settings/settings.api';
import * as taskApi from '@/features/tasks/task.api';
import * as commitmentApi from '@/features/commitments/commitment.api';
import { WeekScreen } from '@/features/week/week-screen';
import { TestProviders } from '../test-utils/test-providers';

jest.mock('@/features/planning/planning.api');
jest.mock('@/features/settings/settings.api');
jest.mock('@/features/tasks/task.api');
jest.mock('@/features/commitments/commitment.api');
const current = '2026-09-14';
const future = '2026-09-21';
const stamp = '2026-09-16T10:00:00Z';
let stored: Map<string, WeeklyPlanningState>;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const empty = (): WeeklyPlanningState => ({ weekPlan: null, focuses: [] });
const entry = () => within(screen.getByLabelText('מצב התכנון השבועי'));
const session = () => within(screen.getByLabelText('תכנון שבועי שמור'));
const press = async (label: string) => fireEvent.press(await screen.findByLabelText(label));
const mount = () => render(<TestProviders><WeekScreen taskSource="server" /></TestProviders>);
const makeFocus = (title: string, week = current): WeeklyFocus => ({ id: `focus:${title}`, weekPlanId: `plan:${week}`, title, position: 0, createdAt: stamp, updatedAt: stamp });
const planAt = (step: number, status: 'not_started' | 'in_progress' | 'completed' = 'in_progress', week = current): WeeklyPlanningState => ({
  weekPlan: { id: `plan:${week}`, weekStart: week, resumeStep: step, status, completedAt: status === 'completed' ? stamp : null, createdAt: stamp, updatedAt: stamp }, focuses: [],
});

beforeAll(() => notifyManager.setScheduler(callback => callback()));
afterAll(() => notifyManager.setScheduler(callback => setTimeout(callback, 0)));
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: new Date(stamp), doNotFake: ['hrtime','nextTick','performance','queueMicrotask','requestAnimationFrame','cancelAnimationFrame','requestIdleCallback','cancelIdleCallback','setImmediate','clearImmediate','setInterval','clearInterval','setTimeout','clearTimeout'] });
  stored = new Map();
  jest.mocked(settingsApi.getSettings).mockResolvedValue({ persisted: true, timezone: 'Asia/Jerusalem', weekStartDay: 1, defaultDailyCapacityMinutes: 360 });
  jest.mocked(taskApi.listTasks).mockResolvedValue([]);
  jest.mocked(commitmentApi.listCommitments).mockResolvedValue([]);
  jest.mocked(api.getWeeklyPlan).mockImplementation(async week => clone(stored.get(week) ?? empty()));
  jest.mocked(api.getWeeklyFocuses).mockImplementation(async week => clone(stored.get(week)?.focuses ?? []));
  jest.mocked(api.saveWeeklyPlan).mockImplementation(async ({ weekStart, input }) => {
    const state = clone(stored.get(weekStart) ?? empty());
    if (input.action === 'start' && (!state.weekPlan || state.weekPlan.status === 'not_started')) state.weekPlan = planAt(1, 'in_progress', weekStart).weekPlan;
    const plan = state.weekPlan;
    if (!plan) throw new Error('Start first');
    if (input.action === 'save') {
      if (input.step > plan.resumeStep) throw new Error('Invalid transition');
      if (input.titles) state.focuses = input.titles.map((title, position) => ({ ...makeFocus(title, weekStart), position }));
      plan.resumeStep = Math.max(plan.resumeStep, Math.min(4, input.step + (input.advance ? 1 : 0)));
    }
    if (input.action === 'complete') {
      if (plan.resumeStep !== 4) throw new Error('Incomplete');
      plan.status = 'completed'; plan.completedAt ??= stamp;
    }
    stored.set(weekStart, clone(state));
    return state;
  });
});
afterEach(() => jest.useRealTimers());

it('loads before showing an untouched selected-week action, with no fixture or Edit plan', async () => {
  let resolve!: (value: WeeklyPlanningState) => void;
  jest.mocked(api.getWeeklyPlan).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  await mount(); await screen.findByText('טוען את מצב התכנון…');
  expect(entry().queryByText('תכנן את השבוע')).toBeNull();
  await act(async () => resolve(empty()));
  await screen.findByLabelText('תכנן את השבוע');
  expect(entry().queryByText('עריכת התכנון')).toBeNull();
  expect(screen.queryByLabelText('תצוגת פיתוח: תכנון השבוע')).toBeNull();
  await press('תכנן את השבוע'); await screen.findByText('שלב 1 מתוך 4');
  expect(jest.mocked(api.saveWeeklyPlan).mock.calls[0]?.[0]).toEqual({ weekStart: current, input: { action: 'start' } });
});

it('does not present lifecycle errors as not started and retries only the selected week', async () => {
  jest.mocked(api.getWeeklyPlan).mockRejectedValueOnce(new Error('migration required'));
  await mount(); await screen.findByLabelText('נסה שוב טעינת תכנון');
  expect(entry().queryByText('תכנן את השבוע')).toBeNull();
  await press('נסה שוב טעינת תכנון'); await screen.findByLabelText('תכנן את השבוע');
  expect(api.getWeeklyPlan).toHaveBeenLastCalledWith(current);
});

it('saves progress and focuses, survives a new provider, resumes at step 3 and supports Back', async () => {
  const view = await mount(); await press('תכנן את השבוע');
  await waitFor(() => expect(screen.getByLabelText('שמירה והמשך').props.accessibilityState.disabled).toBe(false));
  await press('שמירה והמשך'); await screen.findByText('שלב 2 מתוך 4');
  await waitFor(() => expect(screen.getByLabelText('שמירה והמשך').props.accessibilityState.disabled).toBe(false));
  await press('שמירה והמשך'); await screen.findByText('שלב 3 מתוך 4');
  await press('בחירת מיקודים');
  await fireEvent.changeText(screen.getByLabelText('מיקוד חדש'), 'Saved direction');
  await press('הוסף מיקוד'); await press('Saved direction');
  await fireEvent.press(screen.getByText('שמירת מיקודים'));
  await screen.findByLabelText('תכנון שבועי שמור');
  expect(session().getByText('Saved direction')).toBeTruthy();
  await press('סגירת התכנון וחזרה לשבוע');
  await screen.findByText('תכנון שבועי בתהליך · שלב 3 מתוך 4');
  expect(entry().queryByText('עריכת התכנון')).toBeNull();
  await view.unmount(); await mount(); await press('המשך תכנון');
  await screen.findByText('שלב 3 מתוך 4'); expect(session().getByText('Saved direction')).toBeTruthy();
  await press('השלב הקודם'); await screen.findByText('שלב 2 מתוך 4');
  await press('השלב הקודם'); await screen.findByText('שלב 1 מתוך 4');
  await press('סגירת התכנון וחזרה לשבוע');
  expect(stored.get(current)?.weekPlan?.resumeStep).toBe(3);
});

it('completes explicitly, reviews and edits saved values while preserving completion and identity', async () => {
  stored.set(current, { ...planAt(4), focuses: [makeFocus('Original direction')] });
  await mount(); await press('המשך תכנון');
  await waitFor(() => expect(screen.getByLabelText('סיום תכנון').props.accessibilityState.disabled).toBe(false));
  await press('סיום תכנון'); await screen.findByText('סקירת התכנון שהושלם');
  await press('סגירת התכנון וחזרה לשבוע'); await press('סקירת התכנון');
  expect(session().getByText('Original direction')).toBeTruthy();
  await press('עריכת התכנון'); expect(screen.getByLabelText('Original direction').props.accessibilityState.checked).toBe(true);
  await press('Original direction');
  await fireEvent.changeText(screen.getByLabelText('מיקוד חדש'), 'Changed direction');
  await press('הוסף מיקוד'); await press('Changed direction');
  await fireEvent.press(screen.getByText('שמירת מיקודים'));
  await screen.findByText('סקירת התכנון שהושלם');
  expect(session().getByText('Changed direction')).toBeTruthy();
  expect(stored.get(current)?.weekPlan).toMatchObject({ id: `plan:${current}`, status: 'completed', completedAt: stamp });
  await press('סגירת התכנון וחזרה לשבוע'); expect(entry().getByText('התכנון השבועי הושלם')).toBeTruthy();
});

it('starts a future selected week and keeps current/previous lifecycle and navigation independent', async () => {
  stored.set(current, planAt(3));
  await mount(); await screen.findByLabelText('המשך תכנון');
  await press('שבוע הבא'); await screen.findByLabelText('תכנן את השבוע');
  await press('תכנן את השבוע'); await screen.findByText('שלב 1 מתוך 4');
  expect(jest.mocked(api.saveWeeklyPlan).mock.calls[0]?.[0].weekStart).toBe(future);
  await press('סגירת התכנון וחזרה לשבוע');
  await press('שבוע קודם'); await screen.findByText('תכנון שבועי בתהליך · שלב 3 מתוך 4');
  await press('שבוע קודם'); await screen.findByLabelText('תכנן את השבוע');
  await press('השבוע הזה'); await screen.findByLabelText('המשך תכנון');
  expect(stored.get(current)?.weekPlan?.resumeStep).toBe(3);
  await press('פתח יום 2026-09-16'); await press('חזרה לשבוע'); await screen.findByLabelText('המשך תכנון');
});

it('keeps failed Focus drafts for retry without false progress or completion and supports cancellation', async () => {
  stored.set(current, planAt(3)); await mount(); await press('המשך תכנון'); await press('בחירת מיקודים');
  await fireEvent.changeText(screen.getByLabelText('מיקוד חדש'), 'Retry draft');
  await press('הוסף מיקוד'); await press('Retry draft');
  jest.mocked(api.saveWeeklyPlan).mockRejectedValueOnce(new Error('offline'));
  await fireEvent.press(screen.getByText('שמירת מיקודים'));
  await screen.findByText('לא הצלחנו לשמור את המיקודים. הטיוטה נשמרה כאן ואפשר לנסות שוב.');
  expect(screen.getByLabelText('Retry draft').props.accessibilityState.checked).toBe(true);
  expect(stored.get(current)?.weekPlan?.resumeStep).toBe(3);
  await fireEvent.press(screen.getByText('שמירת מיקודים')); await screen.findByLabelText('תכנון שבועי שמור');
  await press('בחירת מיקודים'); await press('Retry draft'); await press('ביטול עריכת מיקודים');
  expect(stored.get(current)?.focuses[0]?.title).toBe('Retry draft');
});

it('keeps failed completion in progress and safely retries', async () => {
  stored.set(current, planAt(4)); await mount(); await press('המשך תכנון');
  await waitFor(() => expect(screen.getByLabelText('סיום תכנון').props.accessibilityState.disabled).toBe(false));
  jest.mocked(api.saveWeeklyPlan).mockRejectedValueOnce(new Error('offline'));
  await press('סיום תכנון'); await screen.findByText('לא הצלחנו לשמור את התכנון. אפשר לנסות שוב; השלמה מוצגת רק אחרי אישור מהשרת.');
  expect(session().queryByText('סקירת התכנון שהושלם')).toBeNull();
  expect(stored.get(current)?.weekPlan?.status).toBe('in_progress');
  await press('סיום תכנון'); await screen.findByText('סקירת התכנון שהושלם');
});

it('blocks review advancement on real data load failure and retries without inventing empty data', async () => {
  stored.set(current, planAt(1));
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters = {}) => {
    if (filters.weekStart === '2026-09-07' || filters.plannedDateFrom === '2026-09-07') throw new Error('offline');
    return [];
  });
  await mount(); await press('המשך תכנון'); await screen.findByLabelText('נסה שוב נתוני סקירה');
  expect(screen.getByLabelText('שמירה והמשך').props.accessibilityState.disabled).toBe(true);
  expect(session().queryByText('אין משימות בתכנון הזה.')).toBeNull();
  jest.mocked(taskApi.listTasks).mockResolvedValue([]); await press('נסה שוב נתוני סקירה');
  await waitFor(() => expect(screen.getByLabelText('שמירה והמשך').props.accessibilityState.disabled).toBe(false));
});

it('preserves legacy focuses without inferring completion, including an empty focus-only owner', async () => {
  stored.set(current, { ...planAt(0, 'not_started'), focuses: [makeFocus('Legacy direction')] });
  await mount(); await screen.findByLabelText('תכנן את השבוע');
  expect(entry().queryByText('סקירת התכנון')).toBeNull();
  await press('תכנן את השבוע'); await screen.findByText('שלב 1 מתוך 4');
  expect(stored.get(current)?.focuses[0]?.title).toBe('Legacy direction');
  await press('סגירת התכנון וחזרה לשבוע');
  stored.set(future, planAt(0, 'not_started', future));
  await press('שבוע הבא'); await screen.findByLabelText('תכנן את השבוע');
});

it('reviews real prior-week Tasks, selected-week commitments and final dated work without fixture scheduling', async () => {
  stored.set(future, planAt(1, 'in_progress', future));
  const prior = { id: 'prior', title: 'Prior real Task', status: 'open', plannedDate: '2026-09-16', weekPlanId: null, estimatedMinutes: 20 };
  const planned = { ...prior, id: 'planned', title: 'Selected real Task', plannedDate: '2026-09-24', estimatedMinutes: null };
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters = {}) => filters.weekStart ? [] : [prior, planned, { ...prior, id: 'done', title: 'Historical Task', status: 'completed' }]
    .filter(t => t.plannedDate >= filters.plannedDateFrom! && t.plannedDate <= filters.plannedDateTo!) as Awaited<ReturnType<typeof taskApi.listTasks>>);
  jest.mocked(commitmentApi.listCommitments).mockImplementation(async (filters = {}) => [
    { id: 'later', title: 'Later real commitment', date: '2026-09-23', startTime: '14:00', endTime: null },
    { id: 'early', title: 'Early real commitment', date: '2026-09-23', startTime: '09:17', endTime: '10:00' },
  ].filter(c => c.date >= filters.dateFrom! && c.date <= filters.dateTo!) as Awaited<ReturnType<typeof commitmentApi.listCommitments>>);
  await mount(); await screen.findByLabelText('תכנן את השבוע'); await press('שבוע הבא'); await press('המשך תכנון');
  await waitFor(() => expect(screen.getByLabelText('שמירה והמשך').props.accessibilityState.disabled).toBe(false));
  expect(session().getByText('Prior real Task · 0:20 משוער · 2026-09-16')).toBeTruthy();
  expect(session().queryByText(/Historical Task/)).toBeNull();
  expect(taskApi.listTasks).toHaveBeenCalledWith({ plannedDateFrom: current, plannedDateTo: '2026-09-20' });
  await press('שמירה והמשך'); await screen.findByText('שלב 2 מתוך 4');
  await waitFor(() => expect(screen.getByLabelText('שמירה והמשך').props.accessibilityState.disabled).toBe(false));
  expect(session().getAllByText(/real commitment/).map(t => t.props.children.join(''))).toEqual([
    'Early real commitment · 2026-09-23 · 09:17–10:00', 'Later real commitment · 2026-09-23 · 14:00 · ללא שעת סיום',
  ]);
  expect(commitmentApi.listCommitments).toHaveBeenCalledWith({ dateFrom: future, dateTo: '2026-09-27' });
  await press('שמירה והמשך'); await screen.findByText('שלב 3 מתוך 4');
  await press('שמירה והמשך'); await screen.findByText('שלב 4 מתוך 4');
  await waitFor(() => expect(screen.getByLabelText('סיום תכנון').props.accessibilityState.disabled).toBe(false));
  expect(session().getByText('Selected real Task · ללא הערכת זמן · 2026-09-24')).toBeTruthy();
  expect(session().queryByText(/Prior real Task/)).toBeNull();
  expect(taskApi.updateTask).not.toHaveBeenCalled(); expect(taskApi.createTask).not.toHaveBeenCalled();
});

it('leaves a failed start recoverable and retries without claiming started state', async () => {
  await mount(); await screen.findByLabelText('תכנן את השבוע');
  jest.mocked(api.saveWeeklyPlan).mockRejectedValueOnce(new Error('offline'));
  await press('תכנן את השבוע'); await screen.findByText('לא הצלחנו להתחיל את התכנון. אפשר לנסות שוב.');
  expect(screen.queryByLabelText('תכנון שבועי שמור')).toBeNull(); expect(stored.size).toBe(0);
  await press('תכנן את השבוע'); await screen.findByText('שלב 1 מתוך 4'); expect(stored.size).toBe(1);
});


it('recovers a committed start whose response was lost from authoritative server state', async () => {
  await mount(); await screen.findByLabelText('תכנן את השבוע');
  jest.mocked(api.saveWeeklyPlan).mockImplementationOnce(async ({ weekStart }) => {
    stored.set(weekStart, planAt(1, 'in_progress', weekStart)); throw new Error('response lost');
  });
  await press('תכנן את השבוע'); await screen.findByLabelText('המשך תכנון');
  expect(entry().queryByText('לא הצלחנו להתחיל את התכנון. אפשר לנסות שוב.')).toBeNull();
  await press('המשך תכנון'); await screen.findByText('שלב 1 מתוך 4');
  expect(api.saveWeeklyPlan).toHaveBeenCalledTimes(1); expect(stored.size).toBe(1);
});


it('returns from Focus review to the same selected week without creating Tasks or changing saved progress', async () => {
  stored.set(future, { ...planAt(3, 'in_progress', future), focuses: [makeFocus('Future direction', future)] });
  await mount(); await press('שבוע הבא'); await press('המשך תכנון');
  expect(session().getByText('מיקודים לשבוע · לא משימות')).toBeTruthy();
  expect(session().getByText('Future direction')).toBeTruthy();
  await press('חזרה לשבוע ליצירת משימה');
  await screen.findByLabelText('יצירת משימה בהשראת המיקוד: Future direction');
  expect(stored.get(future)?.weekPlan).toMatchObject({ resumeStep: 3, status: 'in_progress' });
  expect(api.getWeeklyFocuses).toHaveBeenLastCalledWith(future);
  expect(taskApi.createTask).not.toHaveBeenCalled();
});
