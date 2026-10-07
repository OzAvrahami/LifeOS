import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { notifyManager } from '@tanstack/react-query';
import * as api from '@/features/planning/daily-planning.api';
import * as planningApi from '@/features/planning/planning.api';
import * as commitmentApi from '@/features/commitments/commitment.api';
import * as settingsApi from '@/features/settings/settings.api';
import * as taskApi from '@/features/tasks/task.api';
import { TodayScreen } from '@/features/today/today-screen';
import { apiRequest, ApiError } from '@/lib/api/client';
import { DailyPlanningEntry } from '@/features/planning/daily-planning-view';
import { DailyPlanningSession } from '@/features/planning/daily-planning-session';
import { dailyMembership } from '@/features/planning/daily-planning-model';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import type { Task } from '@/features/tasks/task.types';
import { TestProviders } from '../test-utils/test-providers';

jest.mock('@/features/planning/daily-planning.api');
jest.mock('@/features/planning/planning.api');
jest.mock('@/features/commitments/commitment.api');
jest.mock('@/features/settings/settings.api');
jest.mock('@/features/tasks/task.api');
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual('react-native');
  return function Picker(props: object) { return <View {...props} />; };
});
jest.mock('@/lib/api/client', () => ({ ...jest.requireActual('@/lib/api/client'), apiRequest: jest.fn() }));
const date = '2026-10-07';
const stamp = '2026-10-07T08:00:00Z';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
let stored: Map<string, api.DailyPlanningPlan>;
let tasks: (Task & { previouslySelected?: boolean })[];
const key = (user: string, day: string) => `${user}:${day}`;
const task = (id: string, extra: Partial<Task> = {}): Task => ({ id, title: id, status: 'open', plannedDate: null, weekPlanId: null,
  dueDate: null, reminderAt: null, priority: 'normal', estimatedMinutes: null, position: 0, description: null,
  completedAt: null, createdAt: stamp, updatedAt: stamp, ...extra });
const initial = (step = 1): api.DailyPlanningPlan => ({ id: 'plan', date, status: 'in_progress', resumeStep: step,
  completedAt: null, revision: 1, selectedTaskIds: [] });
function Host({ user = 'A', day = date }: { user?: string; day?: string }) {
  const [open, setOpen] = useState(false);
  return <TaskQueryScopeProvider userId={user}>
    <DailyPlanningEntry key={`${user}:${day}`} date={day} onOpen={() => setOpen(true)} />
    {open ? <DailyPlanningSession key={user} context={{ date: day, userId: user, timezone: 'Asia/Jerusalem', weekStartDay: 1, dayStartTime: '08:00', dayEndTime: '18:00' }} onClose={() => setOpen(false)} /> : null}
  </TaskQueryScopeProvider>;
}
const mount = () => render(<TestProviders><Host /></TestProviders>);
const press = async (label: string) => {
  await waitFor(() => expect(screen.getByLabelText(label).props.accessibilityState?.disabled).not.toBe(true));
  await fireEvent.press(screen.getByLabelText(label));
};
beforeAll(() => notifyManager.setScheduler(callback => callback()));
afterAll(() => notifyManager.setScheduler(callback => setTimeout(callback, 0)));
beforeEach(() => {
  jest.clearAllMocks(); stored = new Map(); tasks = [];
  jest.mocked(api.getDailyPlanning).mockImplementation(async (user, day) => clone(stored.get(key(user, day)) ?? null));
  jest.mocked(api.getDailyPlanningTasks).mockImplementation(async () => clone(tasks));
  jest.mocked(planningApi.getWeeklyFocuses).mockResolvedValue([]);
  jest.mocked(commitmentApi.listCommitments).mockResolvedValue([]);
  jest.mocked(planningApi.getDailyPlan).mockResolvedValue(null);
  jest.mocked(taskApi.listTasks).mockResolvedValue([]);
  jest.mocked(settingsApi.getSettings).mockResolvedValue({ persisted: true, timezone: 'Asia/Jerusalem', weekStartDay: 1, defaultDailyCapacityMinutes: 360 });
  jest.mocked(api.saveDailyPlanning).mockImplementation(async (user, day, input) => {
    const plan = clone(stored.get(key(user, day)) ?? { ...initial(), date: day, revision: 0 });
    if (plan.revision !== input.revision) throw new ApiError('Conflict', 409);
    if (input.action === 'save') { plan.resumeStep = input.step!; plan.selectedTaskIds = input.selectedTaskIds!; }
    if (input.action === 'complete') { plan.status = 'completed'; plan.completedAt = stamp; }
    if (input.action === 'edit') { plan.status = 'in_progress'; plan.resumeStep = 2; }
    plan.revision++; stored.set(key(user, day), clone(plan)); return plan;
  });
  jest.mocked(apiRequest).mockImplementation(async (path, options) => {
    const input = JSON.parse(String(options?.body));
    if (path === '/tasks') { const created = task('Captured', { title: input.title }); tasks.push(created); return { task: created }; }
    const old = tasks.find(t => path === `/tasks/${t.id}`)!;
    Object.assign(old, input.status ? { status: input.status } : { plannedDate: input.planning.type === 'inbox' ? null : input.planning.plannedDate });
    return { task: clone(old) };
  });
});

it('starts, saves selection independent of scheduling, resumes after remount, confirms, reviews without writes and explicitly edits the same plan', async () => {
  tasks = [task('Inbox', { priority: 'important', dueDate: '2026-10-10', reminderAt: stamp }), task('Dated', { plannedDate: date })];
  const original = clone(tasks);
  let view = await mount(); await press('תכנון היום'); await screen.findByText(/שלב 1 מתוך 3/);
  await press('שמירה והמשך'); await press('בחר לתכנון: Inbox');
  expect(stored.get(key('A', date))?.selectedTaskIds).toEqual(['Inbox']);
  expect(tasks).toEqual(original); expect(apiRequest).not.toHaveBeenCalled();
  await press('סגירת התכנון וחזרה להיום'); await view.unmount(); view = await mount();
  await press('המשך התכנון'); await screen.findByText(/שלב 2 מתוך 3/);
  await press('השלב הקודם'); await screen.findByText(/שלב 1 מתוך 3/);
  await press('שמירה והמשך'); await press('שמירה והמשך');
  await screen.findByText('1 בחירות מפורשות · 1 משימות מתוארכות נוספות');
  await press('אישור התכנון והתחלת היום'); await screen.findByText('סקירת התכנון שהושלם');
  const completed = clone(stored.get(key('A', date))!);
  await press('סגירת התכנון וחזרה להיום'); const writes = jest.mocked(api.saveDailyPlanning).mock.calls.length;
  await press('סקירת התכנון להיום'); expect(api.saveDailyPlanning).toHaveBeenCalledTimes(writes);
  await press('עריכת התכנון היומי'); await screen.findByText(/שלב 2 מתוך 3/);
  expect(stored.get(key('A', date))).toMatchObject({ id: completed.id, completedAt: stamp, selectedTaskIds: ['Inbox'] });
  await press('הסר מהבחירה: Inbox'); expect(tasks).toEqual(original);
  await view.unmount();
});

it('distinguishes an intentionally empty completed plan from not started and restores it from a fresh provider', async () => {
  stored.set(key('A', date), initial(3)); let view = await mount(); await press('המשך התכנון');
  await press('אישור התכנון והתחלת היום'); await screen.findByText('סקירת התכנון שהושלם');
  await view.unmount(); view = await mount(); await press('סקירת התכנון להיום');
  await screen.findByText('לא נבחרו משימות. אפשר לאשר את היום גם כך.');
  expect(screen.queryByLabelText('תכנון היום')).toBeNull(); await view.unmount();
});

it('keeps a failed command for an identical retry, prevents duplicate presses and never reports a failed completion', async () => {
  stored.set(key('A', date), initial(3)); await mount(); await press('המשך התכנון');
  let reject!: (reason: Error) => void;
  jest.mocked(api.saveDailyPlanning).mockImplementationOnce(() => new Promise((_, no) => { reject = no; }));
  await press('אישור התכנון והתחלת היום');
  await fireEvent.press(screen.getByLabelText('אישור התכנון והתחלת היום'));
  expect(api.saveDailyPlanning).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('offline')));
  expect(screen.queryByText('סקירת התכנון שהושלם')).toBeNull();
  const failed = clone(jest.mocked(api.saveDailyPlanning).mock.calls[0]);
  await press('נסה שוב שמירת תכנון'); await screen.findByText('סקירת התכנון שהושלם');
  expect(jest.mocked(api.saveDailyPlanning).mock.calls[1]).toEqual(failed);
});

it('requires explicit reload/review after a concurrent edit instead of replaying stale selections', async () => {
  stored.set(key('A', date), initial(2)); tasks = [task('Candidate')]; await mount(); await press('המשך התכנון');
  stored.set(key('A', date), { ...initial(2), revision: 2 });
  await press('בחר לתכנון: Candidate'); await screen.findByText(/התכנון השתנה במקום אחר/);
  expect(screen.queryByLabelText('נסה שוב שמירת תכנון')).toBeNull();
  await press('ויתור על הבקשה וטעינת התכנון העדכני');
  await waitFor(() => expect(screen.getByLabelText('בחר לתכנון: Candidate').props.accessibilityState.disabled).toBe(false));
  expect(stored.get(key('A', date))?.selectedTaskIds).toEqual([]);
  await press('בחר לתכנון: Candidate'); expect(stored.get(key('A', date))?.selectedTaskIds).toEqual(['Candidate']);
});

it('reviews previous selected unscheduled work deliberately and keeps return-to-Inbox/complete separate from selection', async () => {
  stored.set(key('A', date), initial()); tasks = [{ ...task('Prior'), previouslySelected: true }, task('Overdue', { plannedDate: '2026-10-06' })];
  await mount(); await press('המשך התכנון'); await press('בחר לתכנון: Prior');
  expect(apiRequest).not.toHaveBeenCalled(); await press('החזר ל־Inbox: Overdue');
  await waitFor(() => expect(tasks[1]?.plannedDate).toBeNull());
  expect(stored.get(key('A', date))?.selectedTaskIds).toEqual(['Prior']);
  await press('סמן שהושלמה: Prior'); await waitFor(() => expect(tasks[0]?.status).toBe('completed'));
  expect(stored.get(key('A', date))?.selectedTaskIds).toEqual(['Prior']);
  expect(apiRequest).toHaveBeenLastCalledWith('/tasks/Prior', expect.objectContaining({ expectedUserId: 'A', body: JSON.stringify({ status: 'completed' }) }));
});

it('opens Focus-inspired capture blank in Inbox, cancels without writes and creates only after Save without selecting or linking it', async () => {
  stored.set(key('A', date), initial(2));
  jest.mocked(planningApi.getWeeklyFocuses).mockResolvedValue([{ id: 'focus', weekPlanId: 'week', title: 'Direction', position: 0, createdAt: stamp, updatedAt: stamp }]);
  await mount(); await press('המשך התכנון'); await press('יצירת משימה בהשראת: Direction');
  expect(screen.getByLabelText('כותרת').props.value).toBe('');
  expect(screen.getByText('Inbox').parent?.props.accessibilityState?.selected).toBe(true);
  expect(screen.queryByLabelText('חשיבות')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('כותרת'), 'Cancelled'); await press('סגור הוספה מהירה');
  expect(apiRequest).not.toHaveBeenCalled();
  await press('יצירת משימה בהשראת: Direction'); await fireEvent.changeText(screen.getByLabelText('כותרת'), 'Saved');
  await fireEvent.press(screen.getByText('שמירה')); await screen.findByLabelText('בחר לתכנון: Saved');
  expect(apiRequest).toHaveBeenCalledWith('/tasks', expect.objectContaining({ expectedUserId: 'A', body: JSON.stringify({ title: 'Saved', planning: { type: 'inbox' } }) }));
  expect(stored.get(key('A', date))?.selectedTaskIds).toEqual([]);
  expect(planningApi.getWeeklyFocuses).toHaveBeenCalledWith('2026-10-05');
});

it('blocks progress on partial load failure and retries the explicit date, without treating it as empty', async () => {
  stored.set(key('A', date), initial()); jest.mocked(api.getDailyPlanningTasks).mockRejectedValueOnce(new Error('offline'));
  await mount(); await press('המשך התכנון'); await screen.findByLabelText('נסה שוב טעינת התכנון');
  expect(screen.queryByLabelText('שמירה והמשך')).toBeNull();
  await press('נסה שוב טעינת התכנון'); await screen.findByLabelText('שמירה והמשך');
  expect(api.getDailyPlanningTasks).toHaveBeenLastCalledWith('A', date, expect.anything());
});

it('retries capture with the same UUID and frozen draft after an interrupted save', async () => {
  stored.set(key('A', date), initial(2)); await mount(); await press('המשך התכנון'); await press('הוסף משימה במהלך התכנון');
  await fireEvent.changeText(screen.getByLabelText('כותרת'), 'Retry capture');
  jest.mocked(apiRequest).mockRejectedValueOnce(new Error('response lost'));
  await fireEvent.press(screen.getByText('שמירה')); await screen.findByText('לא הצלחנו לשמור. אפשר לנסות שוב.');
  const first = jest.mocked(apiRequest).mock.calls[0];
  expect(screen.getByLabelText('כותרת').props.editable).toBe(false);
  await fireEvent.press(screen.getByText('שמירה')); await screen.findByLabelText('בחר לתכנון: Retry capture');
  expect(jest.mocked(apiRequest).mock.calls[1]).toEqual(first);
  expect(first?.[1]?.headers).toMatchObject({ 'Idempotency-Key': expect.stringMatching(/^[a-f0-9-]{36}$/) });
});

it('does not open a late start response after the entry account/date is replaced', async () => {
  let resolve!: (plan: api.DailyPlanningPlan) => void;
  jest.mocked(api.saveDailyPlanning).mockImplementationOnce(() => new Promise(yes => { resolve = yes; }));
  const view = await render(<TestProviders><Host /></TestProviders>); await press('תכנון היום');
  await view.rerender(<TestProviders><Host user="B" day="2026-10-08" /></TestProviders>);
  await act(async () => resolve(initial()));
  await screen.findByLabelText('תכנון היום'); expect(screen.queryByLabelText('תכנון יומי שמור')).toBeNull();
  expect(api.getDailyPlanning).toHaveBeenCalledWith('B', '2026-10-08', expect.anything());
});

it('deduplicates selected and dated Tasks, excludes inactive estimates, discloses unknowns and preserves missing references', () => {
  const result = dailyMembership(date, ['same', 'inbox', 'done', 'cancelled', 'gone'], [
    task('same', { plannedDate: date, estimatedMinutes: 20 }), task('inbox'), task('dated', { plannedDate: date, estimatedMinutes: 10 }),
    task('done', { status: 'completed', estimatedMinutes: 100 }), task('cancelled', { status: 'cancelled', estimatedMinutes: 100 }), task('other', { estimatedMinutes: 100 }),
  ]);
  expect(result.active.map(t => t.id)).toEqual(['same', 'inbox', 'dated']);
  expect(result.knownMinutes).toBe(30); expect(result.unknownCount).toBe(1); expect(result.unavailable).toEqual(['gone']);
  expect(result.dated.map(t => t.id)).toEqual(['dated']);
});

it('defers unfinished work through the existing date picker without changing its selected membership', async () => {
  stored.set(key('A', date), { ...initial(), selectedTaskIds: ['Overdue'] });
  tasks = [task('Overdue', { plannedDate: '2026-10-06', priority: 'important', dueDate: '2026-10-10' })];
  await mount(); await press('המשך התכנון'); await press('דחה לתאריך אחר: Overdue');
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2026, 9, 12, 12));
  await press('אישור תאריך'); await waitFor(() => expect(tasks[0]?.plannedDate).toBe('2026-10-12'));
  expect(stored.get(key('A', date))?.selectedTaskIds).toEqual(['Overdue']);
  expect(apiRequest).toHaveBeenLastCalledWith('/tasks/Overdue', expect.objectContaining({ body: JSON.stringify({ planning: { type: 'day', plannedDate: '2026-10-12' } }) }));
});

it('keeps an open planning session on its explicit date across configured-timezone midnight while Today advances', async () => {
  jest.useFakeTimers({ now: new Date('2026-10-07T20:59:50Z'), doNotFake: ['setTimeout', 'clearTimeout', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'nextTick', 'performance'] });
  try {
    tasks = [task('Midnight')];
    const view = await render(<TestProviders><TaskQueryScopeProvider userId="A"><TodayScreen taskSource="server" /></TaskQueryScopeProvider></TestProviders>);
    await press('תכנון היום'); await press('שמירה והמשך');
    await act(async () => { jest.advanceTimersByTime(30_000); });
    await waitFor(() => expect(api.getDailyPlanning).toHaveBeenCalledWith('A', '2026-10-08', expect.anything()));
    await press('בחר לתכנון: Midnight');
    expect(api.saveDailyPlanning).toHaveBeenLastCalledWith('A', '2026-10-07', expect.objectContaining({ selectedTaskIds: ['Midnight'] }));
    await press('סגירת התכנון וחזרה להיום'); await screen.findByLabelText('תכנון היום');
    expect(stored.get(key('A', '2026-10-08'))).toBeUndefined();
    await view.unmount();
  } finally { jest.useRealTimers(); }
});

it.each(['in_progress', 'completed'] as const)('keeps selected Tasks and all Commitments visible alongside %s dated work, without duplicate membership', async status => {
  jest.useFakeTimers({ now: new Date(stamp), doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'nextTick', 'performance'] });
  try {
    tasks = [task('Selected and dated', { plannedDate: date, estimatedMinutes: 20 }), task('Other dated', { plannedDate: date, status })];
    stored.set(key('A', date), { ...initial(2), selectedTaskIds: ['Selected and dated'] });
    jest.mocked(taskApi.listTasks).mockResolvedValue(tasks);
    jest.mocked(commitmentApi.listCommitments).mockResolvedValue(['First commitment', 'Second commitment'].map((title, index) => ({
      id: `commitment-${index}`, title, date, startTime: `${10 + index}:00`, endTime: null, lifeArea: null, description: null, reminderLeadMinutes: null, createdAt: stamp, updatedAt: stamp,
    })));
    const view = await render(<TestProviders><TaskQueryScopeProvider userId="A"><TodayScreen taskSource="server" /></TaskQueryScopeProvider></TestProviders>);
    await screen.findByLabelText('משימות שנבחרו לתכנון היומי');
    expect(screen.getAllByText('Selected and dated')).toHaveLength(1);
    expect(screen.getAllByText('First commitment')).toHaveLength(1);
    expect(screen.getAllByText('Second commitment')).toHaveLength(1);
    await view.unmount();
  } finally { jest.useRealTimers(); }
});
