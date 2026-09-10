import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { notifyManager } from '@tanstack/react-query';

import * as commitmentApi from '@/features/commitments/commitment.api';
import type { Commitment } from '@/features/commitments/commitment.types';
import * as planningApi from '@/features/planning/planning.api';
import * as settingsApi from '@/features/settings/settings.api';
import * as taskApi from '@/features/tasks/task.api';
import type { Task } from '@/features/tasks/task.types';
import { WeekScreen } from '@/features/week/week-screen';

import { TestProviders } from '../test-utils/test-providers';

jest.mock('@react-native-community/datetimepicker', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return (props: { accessibilityLabel?: string }) => React.createElement(View, { ...props, accessibilityLabel: props.accessibilityLabel ?? 'nativecalendar' });
});
jest.mock('@/features/tasks/task.api', () => ({ listTasks: jest.fn(), createTask: jest.fn(), updateTask: jest.fn(), cancelTask: jest.fn() }));
jest.mock('@/features/commitments/commitment.api', () => ({ listCommitments: jest.fn(), createCommitment: jest.fn(), updateCommitment: jest.fn(), deleteCommitment: jest.fn() }));
jest.mock('@/features/planning/planning.api', () => ({ getWeeklyFocuses: jest.fn(), replaceWeeklyFocuses: jest.fn() }));
jest.mock('@/features/settings/settings.api', () => ({ getSettings: jest.fn(), putSettings: jest.fn() }));

const stamp = '2026-12-31T10:00:00Z';
function task(id: string, extra: Partial<Task> = {}): Task {
  return { id, title: id, description: 'preserved', plannedDate: '2026-12-31', dueDate: '2027-02-01', weekPlanId: null,
    estimatedMinutes: 45, status: 'open', priority: 'normal', position: 0, completedAt: null, createdAt: stamp, updatedAt: stamp, ...extra };
}
function commitment(id: string, extra: Partial<Commitment> = {}): Commitment {
  return { id, title: id, date: '2026-12-31', startTime: '09:00', endTime: null, description: null, lifeArea: null, createdAt: stamp, updatedAt: stamp, ...extra };
}
let tasks: Task[];
let commitments: Commitment[];
const press = async (label: string) => fireEvent.press(await screen.findByLabelText(label));
const row = (date: string) => within(screen.getByLabelText(`פתח יום ${date}`));
const open = async (date = '2026-12-31') => press(`פתח יום ${date}`);
const mount = () => render(<TestProviders><WeekScreen taskSource="server" /></TestProviders>);

beforeAll(() => notifyManager.setScheduler(callback => callback()));
afterAll(() => notifyManager.setScheduler(callback => setTimeout(callback, 0)));
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: new Date(stamp), doNotFake: ['hrtime','nextTick','performance','queueMicrotask','requestAnimationFrame','cancelAnimationFrame','requestIdleCallback','cancelIdleCallback','setImmediate','clearImmediate','setInterval','clearInterval','setTimeout','clearTimeout'] });
  tasks = []; commitments = [];
  jest.mocked(settingsApi.getSettings).mockResolvedValue({ persisted: true, timezone: 'Asia/Jerusalem', weekStartDay: 0, defaultDailyCapacityMinutes: 360, dayWindowSupported: true, dayStartTime: null, dayEndTime: null });
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters = {}) => tasks.filter(t => t.status !== 'cancelled' && (filters.weekStart
    ? t.weekPlanId === filters.weekStart && !t.plannedDate
    : t.plannedDate !== null && t.plannedDate >= filters.plannedDateFrom! && t.plannedDate <= filters.plannedDateTo!)));
  jest.mocked(commitmentApi.listCommitments).mockImplementation(async (filters = {}) => commitments.filter(c => c.date >= filters.dateFrom! && c.date <= filters.dateTo!));
  jest.mocked(planningApi.getWeeklyFocuses).mockResolvedValue([]);
  jest.mocked(planningApi.replaceWeeklyFocuses).mockResolvedValue([]);
  jest.mocked(taskApi.updateTask).mockImplementation(async ({ id, input }) => {
    const original = tasks.find(t => t.id === id)!;
    const { planning, ...fields } = input;
    const updated = { ...original, ...fields, ...(planning?.type === 'day' ? { plannedDate: planning.plannedDate, weekPlanId: null } : {}) };
    tasks = tasks.map(t => t.id === id ? updated : t); return updated;
  });
  jest.mocked(taskApi.cancelTask).mockImplementation(async id => { const item = { ...tasks.find(t => t.id === id)!, status: 'cancelled' as const }; tasks = tasks.filter(t => t.id !== id); return item; });
  jest.mocked(taskApi.createTask).mockImplementation(async input => { const item = task(`created-${tasks.length}`, { title: input.title, estimatedMinutes: null, weekPlanId: input.planning?.type === 'week' ? input.planning.weekStart : null, plannedDate: input.planning?.type === 'day' ? input.planning.plannedDate : null }); tasks.push(item); return item; });
  jest.mocked(commitmentApi.updateCommitment).mockImplementation(async ({ id, input }) => { const item = { ...commitments.find(c => c.id === id)!, ...input }; commitments = commitments.map(c => c.id === id ? item : c); return item; });
  jest.mocked(commitmentApi.deleteCommitment).mockImplementation(async id => { const item = commitments.find(c => c.id === id)!; commitments = commitments.filter(c => c.id !== id); return item; });
});
afterEach(() => jest.useRealTimers());

it('changes every server query and all seven dates for previous/next/current week without fixtures', async () => {
  tasks = [task('current'), task('future', { plannedDate: '2027-01-04' })];
  await mount(); await screen.findByText('current · 0:45 משוער');
  expect(row('2026-12-31').getByText('היום')).toBeTruthy();
  await press('שבוע הבא');
  await screen.findByText('future · 0:45 משוער');
  expect(taskApi.listTasks).toHaveBeenCalledWith({ plannedDateFrom: '2027-01-03', plannedDateTo: '2027-01-09' });
  expect(taskApi.listTasks).toHaveBeenCalledWith({ weekStart: '2027-01-03' });
  expect(commitmentApi.listCommitments).toHaveBeenCalledWith({ dateFrom: '2027-01-03', dateTo: '2027-01-09' });
  expect(planningApi.getWeeklyFocuses).toHaveBeenCalledWith('2027-01-03');
  expect(screen.getByLabelText('טווח השבוע המוצג').props.children).toContain('2027');
  expect(screen.queryByLabelText('פתח יום 2026-12-31')).toBeNull();
  expect(screen.queryByText('current · 0:45 משוער')).toBeNull();
  expect(screen.queryByText('לסיים את אפיון LifeOS')).toBeNull();
  expect(within(screen.getByLabelText('סקירת שבעת ימי השבוע')).getAllByRole('button').map(r => r.props.accessibilityLabel)).toEqual(
    ['03','04','05','06','07','08','09'].map(d => `פתח יום 2027-01-${d}`));
  await press('שבוע קודם'); await screen.findByLabelText('פתח יום 2026-12-31');
  await press('שבוע קודם'); await screen.findByLabelText('פתח יום 2026-12-20');
  await press('השבוע הזה'); await screen.findByLabelText('פתח יום 2026-12-31');
  expect(screen.getByLabelText('השבוע הזה').props.accessibilityState.disabled).toBe(true);
});

it('uses Monday boundaries after settings hydration and retains them while browsing', async () => {
  jest.mocked(settingsApi.getSettings).mockResolvedValue({ persisted: true, timezone: 'Asia/Jerusalem', weekStartDay: 1, defaultDailyCapacityMinutes: 360 });
  await mount(); await screen.findByLabelText('פתח יום 2026-12-28');
  await press('שבוע הבא'); await screen.findByLabelText('פתח יום 2027-01-04');
  expect(taskApi.listTasks).toHaveBeenLastCalledWith({ weekStart: '2027-01-04' });
  expect(commitmentApi.listCommitments).toHaveBeenLastCalledWith({ dateFrom: '2027-01-04', dateTo: '2027-01-10' });
});

it('uses the account timezone for Today near a UTC date boundary', async () => {
  jest.setSystemTime(new Date('2026-12-31T23:30:00Z'));
  await mount(); await screen.findByLabelText('פתח יום 2027-01-01');
  expect(row('2027-01-01').getByText('היום')).toBeTruthy();
  expect(screen.getByLabelText('פתח יום 2026-12-31').props.accessibilityState.selected).toBe(false);
});

it('loads and saves Weekly Focus for the browsed week and returns to that week', async () => {
  await mount(); await screen.findByLabelText('פתח יום 2026-12-31');
  await press('שבוע הבא'); await screen.findByLabelText('פתח יום 2027-01-03');
  await fireEvent.press(await screen.findByText('הוסף מיקודים'));
  expect(screen.queryByLabelText('תצוגת פיתוח: תכנון השבוע')).toBeNull();
  await fireEvent.press(screen.getByText('שמירת מיקודים'));
  await screen.findByLabelText('פתח יום 2027-01-03');
  expect(jest.mocked(planningApi.replaceWeeklyFocuses).mock.calls[0]?.[0]).toEqual({ weekStart: '2027-01-03', titles: [] });
});

it.each(['tasks', 'commitments', 'both', 'neither'])('shows complete %s day content and agrees with active summaries', async kind => {
  if (kind === 'tasks' || kind === 'both') tasks = [task('estimated'), task('unknown', { estimatedMinutes: null }), task('active', { status: 'in_progress', estimatedMinutes: 30 }), task('completed', { status: 'completed' }), task('cancelled', { status: 'cancelled' }), task('unscheduled', { plannedDate: null })];
  if (kind === 'commitments' || kind === 'both') commitments = [commitment('late', { startTime: '16:00' }), commitment('early', { startTime: '08:00', endTime: '08:30' }), commitment('middle', { startTime: '12:00' })];
  jest.mocked(planningApi.getWeeklyFocuses).mockResolvedValue([{ id: 'focus', title: 'direction', position: 0, weekPlanId: 'plan', createdAt: stamp, updatedAt: stamp }]);
  await mount(); await screen.findByLabelText('פתח יום 2026-12-31');
  const count = tasks.length ? 3 : 0;
  const summary = `${count} משימות · ${count ? '1:15' : '0:00'} זמן משימות מתוכנן`;
  expect(row('2026-12-31').getByText(summary)).toBeTruthy();
  if (commitments.length) expect(row('2026-12-31').getByText('ועוד 1 התחייבויות')).toBeTruthy();
  await open();
  const day = within(screen.getByLabelText('תוכן היום'));
  expect(day.getByText(summary)).toBeTruthy();
  expect(day.queryByText('direction')).toBeNull();
  expect(day.queryByText('cancelled')).toBeNull();
  expect(day.queryByText('unscheduled')).toBeNull();
  if (count) {
    expect(day.getAllByLabelText(/^פתח משימה:/).map(n => n.props.accessibilityLabel)).toEqual(['estimated','unknown','active','completed'].map(t => `פתח משימה: ${t}`));
    expect(day.getByText('ללא הערכת זמן')).toBeTruthy();
    expect(day.getByLabelText('משימות שהושלמו')).toBeTruthy();
  } else expect(day.getByText('אין משימות פעילות ליום הזה')).toBeTruthy();
  if (commitments.length) {
    expect(day.getAllByLabelText(/^פתח התחייבות:/).map(n => n.props.accessibilityLabel)).toEqual(['early','middle','late'].map(t => `פתח התחייבות: ${t}`));
    expect(day.getByText('08:00–08:30')).toBeTruthy();
    expect(day.getByText('16:00 · ללא שעת סיום')).toBeTruthy();
  } else expect(day.getByText('אין התחייבויות ליום הזה')).toBeTruthy();
});

it('navigates days across year/month/week boundaries, retains week on return, and returns to Today', async () => {
  await mount(); await open();
  await press('יום הבא'); expect(screen.getByLabelText('התאריך המוצג').props.children).toContain('2027');
  await press('יום הבא'); await press('יום הבא');
  await waitFor(() => expect(taskApi.listTasks).toHaveBeenCalledWith({ plannedDateFrom: '2027-01-03', plannedDateTo: '2027-01-09' }));
  await press('חזרה לשבוע'); await screen.findByLabelText('פתח יום 2027-01-03');
  await open('2027-01-03'); await press('יום קודם');
  await waitFor(() => expect(screen.getByLabelText('התאריך המוצג').props.children).toContain('2 בינואר 2027'));
  await press('חזרה להיום'); expect(screen.getByLabelText('התאריך המוצג').props.children).toContain('31 בדצמבר 2026');
});

it('defaults day capture to the selected date and updates its summary without navigation reset', async () => {
  await mount(); await open('2027-01-01'); await press('הוסף משימה ליום הזה');
  expect(screen.getByLabelText('תאריך המשימה').props.children).toBe('2027-01-01');
  await fireEvent.changeText(screen.getByLabelText('כותרת'), 'captured');
  await fireEvent.press(screen.getByText('שמירה'));
  await screen.findByLabelText('פתח משימה: captured');
  expect(jest.mocked(taskApi.createTask).mock.calls[0]?.[0]).toEqual({ title: 'captured', planning: { type: 'day', plannedDate: '2027-01-01' } });
  await press('חזרה לשבוע'); expect(row('2027-01-01').getByText('1 משימה · 0:00 זמן משימות מתוכנן')).toBeTruthy();
});

it('moves a Task across week/year boundaries with source/destination freshness and preserves other fields', async () => {
  tasks = [task('moving')]; await mount(); await screen.findByLabelText('פתח יום 2026-12-31');
  await press('שבוע הבא'); await screen.findByLabelText('פתח יום 2027-01-04');
  await press('שבוע קודם'); await open();
  await press('פתח משימה: moving'); await press('שינוי תאריך המשימה');
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2027, 0, 4, 12));
  await press('אישור תאריך');
  await screen.findByLabelText('תוכן היום');
  expect(screen.queryByLabelText('פתח משימה: moving')).toBeNull();
  expect(jest.mocked(taskApi.updateTask).mock.calls[0]?.[0]).toEqual({ id: 'moving', input: { planning: { type: 'day', plannedDate: '2027-01-04' } } });
  expect(tasks[0]).toMatchObject({ description: 'preserved', dueDate: '2027-02-01', status: 'open', estimatedMinutes: 45 });
  await press('חזרה לשבוע'); expect(row('2026-12-31').getByText('0 משימות · 0:00 זמן משימות מתוכנן')).toBeTruthy();
  await press('שבוע הבא'); await screen.findByText('moving · 0:45 משוער');
  await open('2027-01-04'); expect(screen.getAllByLabelText('פתח משימה: moving')).toHaveLength(1);
});

it('supports title editing, completion, reopening and confirmed deletion without stale active totals', async () => {
  tasks = [task('editable')]; await mount(); await open(); await press('פתח משימה: editable');
  await press('עריכת כותרת'); await fireEvent.changeText(screen.getByLabelText('עריכת כותרת משימה'), 'edited');
  await fireEvent.press(screen.getByText('שמירה')); await press('פתח משימה: edited');
  expect(jest.mocked(taskApi.updateTask).mock.calls[0]?.[0]).toEqual({ id: 'editable', input: { title: 'edited' } });
  await press('סימון כהושלמה'); await screen.findByLabelText('משימות שהושלמו');
  expect(screen.getByText('0 משימות · 0:00 זמן משימות מתוכנן')).toBeTruthy();
  await press('פתח משימה: edited'); await press('פתיחה מחדש'); await screen.findByText('1 משימה · 0:45 זמן משימות מתוכנן');
  await press('פתח משימה: edited'); await press('מחיקת משימה'); await press('ביטול מחיקת משימה');
  expect(taskApi.cancelTask).not.toHaveBeenCalled();
  await press('מחיקת משימה'); await press('אישור מחיקת משימה'); await screen.findByText('אין משימות פעילות ליום הזה');
});

it('keeps a title draft on failure and cancels a date change without mutation', async () => {
  tasks = [task('retry')]; await mount(); await open(); await press('פתח משימה: retry');
  await press('שינוי תאריך המשימה'); await press('ביטול בחירת תאריך');
  expect(taskApi.updateTask).not.toHaveBeenCalled();
  await press('עריכת כותרת'); await fireEvent.changeText(screen.getByLabelText('עריכת כותרת משימה'), 'draft');
  jest.mocked(taskApi.updateTask).mockRejectedValueOnce(new Error('offline'));
  await fireEvent.press(screen.getByText('שמירה')); await screen.findByText('לא הצלחנו לעדכן. אפשר לנסות שוב.');
  expect(screen.getByLabelText('עריכת כותרת משימה').props.value).toBe('draft');
  await fireEvent.press(screen.getByText('שמירה')); await screen.findByLabelText('פתח משימה: draft');
});

it('moves and deletes a commitment through the existing editor while retaining the inspected date', async () => {
  commitments = [commitment('meeting', { endTime: '10:00' })]; await mount(); await screen.findByLabelText('פתח יום 2026-12-31');
  await press('שבוע הבא'); await screen.findByLabelText('פתח יום 2027-01-04');
  await press('שבוע קודם'); await open();
  await press('פתח התחייבות: meeting'); await press('תאריך התחייבות');
  const picker = screen.getByLabelText('nativecalendar');
  await fireEvent(picker, 'change', { type: 'set' }, new Date(2027, 0, 4, 12));
  await press('שמירת התחייבות'); await screen.findByLabelText('תוכן היום');
  expect(screen.queryByLabelText('פתח התחייבות: meeting')).toBeNull();
  expect(screen.getByLabelText('התאריך המוצג').props.children).toContain('31 בדצמבר 2026');
  await press('חזרה לשבוע'); expect(row('2026-12-31').getByText('0 התחייבויות')).toBeTruthy();
  await press('שבוע הבא'); await screen.findByText('meeting'); await open('2027-01-04');
  await press('פתח התחייבות: meeting'); await fireEvent.press(screen.getByText('מחיקת ההתחייבות')); await fireEvent.press(screen.getByText('מחיקה'));
  await screen.findByText('אין התחייבויות ליום הזה');
  await press('חזרה לשבוע'); expect(row('2027-01-04').getByText('0 התחייבויות')).toBeTruthy();
});

it('never shows the previous week response under a new week during delayed hydration', async () => {
  tasks = [task('old')]; await mount(); await screen.findByText('old · 0:45 משוער');
  let resolve!: (value: Task[]) => void;
  jest.mocked(taskApi.listTasks).mockImplementation((filters = {}) => filters.weekStart ? Promise.resolve([]) : new Promise(r => { resolve = r; }));
  await press('שבוע הבא'); expect(screen.queryByText('old · 0:45 משוער')).toBeNull();
  expect(screen.queryByLabelText('פתח יום 2027-01-03')).toBeNull();
  await act(async () => resolve([])); await screen.findByLabelText('פתח יום 2027-01-03');
});


it('creates a commitment on the browsed day using the shared editor and exact time', async () => {
  jest.mocked(commitmentApi.createCommitment).mockImplementation(async input => {
    const item = commitment('created-commitment', { ...input, endTime: input.endTime ?? null, description: input.description ?? null, lifeArea: input.lifeArea ?? null });
    commitments.push(item); return item;
  });
  await mount(); await open('2027-01-01'); await press('הוסף התחייבות ליום הזה');
  await fireEvent.changeText(screen.getByLabelText('כותרת התחייבות'), 'new commitment');
  await press('שעת התחלה');
  await fireEvent(screen.getByLabelText('בחירת שעת התחלה'), 'change', { type: 'set' }, new Date(2027, 0, 1, 9, 17));
  await press('אישור שעה'); await press('שמירת התחייבות');
  await screen.findByLabelText('פתח התחייבות: new commitment');
  expect(jest.mocked(commitmentApi.createCommitment).mock.calls[0]?.[0]).toMatchObject({ date: '2027-01-01', startTime: '09:17', endTime: null });
  await press('חזרה לשבוע'); expect(row('2027-01-01').getByText('1 התחייבות')).toBeTruthy();
});

it('cancels task and commitment inspection without changing the selected week/date or records', async () => {
  tasks = [task('next-week', { plannedDate: '2027-01-04' })]; commitments = [commitment('next-meeting', { date: '2027-01-04' })];
  await mount(); await screen.findByLabelText('פתח יום 2026-12-31'); await press('שבוע הבא'); await open('2027-01-04');
  await press('פתח משימה: next-week'); await press('חזרה ליום');
  await press('פתח התחייבות: next-meeting'); await press('סגור עורך התחייבות');
  expect(screen.getByLabelText('התאריך המוצג').props.children).toContain('4 בינואר 2027');
  expect(taskApi.updateTask).not.toHaveBeenCalled(); expect(commitmentApi.updateCommitment).not.toHaveBeenCalled();
  await press('חזרה לשבוע'); expect(screen.getByLabelText('פתח יום 2027-01-04')).toBeTruthy();
});

it('shows query failure without an invented empty day and retries the selected week', async () => {
  jest.mocked(taskApi.listTasks).mockRejectedValueOnce(new Error('offline'));
  await mount(); await waitFor(() => expect(screen.queryByLabelText('פתח יום 2026-12-31')).toBeNull());
  await fireEvent.press(await screen.findByText('לא הצלחנו לטעון את המשימות · נסו שוב'));
  await screen.findByLabelText('פתח יום 2026-12-31');
});

it('keeps global capture in Inbox by default and explicitly places week-only capture in the browsed week', async () => {
  await mount(); await screen.findByLabelText('פתח יום 2026-12-31');
  await press('שבוע הבא'); await screen.findByLabelText('פתח יום 2027-01-03');
  await press('הוספה מהירה');
  let sheet = within(screen.getByLabelText('חלונית הוספה מהירה'));
  expect(sheet.getByText('Inbox').parent?.props.accessibilityState).toEqual({ selected: true });
  await fireEvent.changeText(sheet.getByLabelText('כותרת'), 'inbox capture');
  await fireEvent.press(sheet.getByText('שמירה'));
  await waitFor(() => expect(screen.queryByLabelText('חלונית הוספה מהירה')).toBeNull());
  expect(jest.mocked(taskApi.createTask).mock.calls[0]?.[0]).toEqual({ title: 'inbox capture', planning: { type: 'inbox' } });
  await press('הוספה מהירה');
  sheet = within(screen.getByLabelText('חלונית הוספה מהירה'));
  await fireEvent.changeText(sheet.getByLabelText('כותרת'), 'future week capture');
  await fireEvent.press(sheet.getByText('השבוע המוצג'));
  await fireEvent.press(sheet.getByText('שמירה'));
  await screen.findByLabelText('בחר יום עבור future week capture');
  expect(jest.mocked(taskApi.createTask).mock.calls[1]?.[0]).toEqual({ title: 'future week capture', planning: { type: 'week', weekStart: '2027-01-03' } });
  expect(screen.getByLabelText('פתח יום 2027-01-03')).toBeTruthy();
  expect(screen.queryByText('inbox capture')).toBeNull();
});
