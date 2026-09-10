import { fireEvent, render, screen, userEvent, waitFor, within } from '@testing-library/react-native';
import { notifyManager } from '@tanstack/react-query';

import * as commitmentApi from '@/features/commitments/commitment.api';
import { useState } from 'react';

import { InboxScreen } from '@/features/inbox/inbox-screen';
import * as planningApi from '@/features/planning/planning.api';
import type { DailyPlan, WeeklyFocus } from '@/features/planning/planning.types';
import * as settingsApi from '@/features/settings/settings.api';
import * as taskApi from '@/features/tasks/task.api';
import { addDaysToDateKey, currentWeekStart, localDateKey } from '@/features/tasks/task-dates';
import { CreateTaskInput, Task, TaskListFilters, UpdateTaskInput } from '@/features/tasks/task.types';
import { TodayScreen } from '@/features/today/today-screen';
import { WeekScreen } from '@/features/week/week-screen';

import { TestProviders } from '../test-utils/test-providers';

jest.mock('@/features/settings/settings.api', () => ({ getSettings: jest.fn(), putSettings: jest.fn() }));

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

const listTasksMock = jest.mocked(taskApi.listTasks);
const createTaskMock = jest.mocked(taskApi.createTask);
const updateTaskMock = jest.mocked(taskApi.updateTask);
const cancelTaskMock = jest.mocked(taskApi.cancelTask);
const getDailyPlanMock = jest.mocked(planningApi.getDailyPlan);
const getWeeklyFocusesMock = jest.mocked(planningApi.getWeeklyFocuses);
const putDailyPlanMock = jest.mocked(planningApi.putDailyPlan);
const replaceWeeklyFocusesMock = jest.mocked(planningApi.replaceWeeklyFocuses);
const listCommitmentsMock = jest.mocked(commitmentApi.listCommitments);

let tasks: Task[];
let nextId: number;
let dailyPlan: DailyPlan | null;
let focuses: WeeklyFocus[];

beforeAll(() => {
  notifyManager.setScheduler((callback) => callback());
});

afterAll(() => {
  notifyManager.setScheduler((callback) => setTimeout(callback, 0));
});

function makeTask(input: CreateTaskInput, id = `server-task-${nextId++}`): Task {
  const planning = input.planning;
  return {
    completedAt: null,
    createdAt: new Date().toISOString(),
    description: input.description ?? null,
    dueDate: input.dueDate ?? null,
    estimatedMinutes: input.estimatedMinutes ?? null,
    id,
    plannedDate: planning?.type === 'day' ? planning.plannedDate : null,
    position: input.position ?? 0,
    priority: input.priority ?? 'normal',
    status: 'open',
    title: input.title,
    updatedAt: new Date().toISOString(),
    weekPlanId: planning?.type === 'week' ? `week:${planning.weekStart}` : null,
  };
}

function applyUpdate(task: Task, input: UpdateTaskInput) {
  if (input.status === 'in_progress') {
    tasks = tasks.map((item) => item.status === 'in_progress' ? { ...item, status: 'open' } : item);
  }
  return {
    ...task,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.estimatedMinutes !== undefined ? { estimatedMinutes: input.estimatedMinutes } : {}),
    ...(input.status ? {
      completedAt: input.status === 'completed' ? new Date().toISOString() : null,
      status: input.status,
    } : {}),
    ...(input.planning?.type === 'inbox' ? {
      completedAt: null,
      plannedDate: null,
      status: 'open' as const,
      weekPlanId: null,
    } : {}),
    ...(input.planning?.type === 'week' ? {
      completedAt: null,
      plannedDate: null,
      status: 'open' as const,
      weekPlanId: `week:${input.planning.weekStart}`,
    } : {}),
    ...(input.planning?.type === 'day' ? {
      completedAt: null,
      plannedDate: input.planning.plannedDate,
      status: 'open' as const,
      weekPlanId: null,
    } : {}),
    updatedAt: new Date().toISOString(),
  } satisfies Task;
}

function installFakeTaskApi() {
  listTasksMock.mockImplementation(async (filters: TaskListFilters = {}) => tasks.filter((task) => {
    if (task.status === 'cancelled') return false;
    if (filters.placement === 'inbox') {
      return task.status === 'open' && task.plannedDate === null && task.weekPlanId === null;
    }
    if (filters.plannedDate) return task.plannedDate === filters.plannedDate;
    if (filters.plannedDateFrom && filters.plannedDateTo) {
      return task.plannedDate !== null
        && task.plannedDate >= filters.plannedDateFrom
        && task.plannedDate <= filters.plannedDateTo;
    }
    if (filters.weekStart) return task.weekPlanId === `week:${filters.weekStart}`;
    if (filters.status) return task.status === filters.status;
    return true;
  }));
  createTaskMock.mockImplementation(async (input) => {
    const task = makeTask(input);
    tasks = [...tasks, task];
    return task;
  });
  updateTaskMock.mockImplementation(async ({ id, input }) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) throw new Error('not found');
    const updated = applyUpdate(task, input);
    tasks = tasks.map((item) => item.id === id ? updated : item);
    return updated;
  });
  cancelTaskMock.mockImplementation(async (id) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) throw new Error('not found');
    const cancelled = { ...task, completedAt: null, status: 'cancelled' as const };
    tasks = tasks.map((item) => item.id === id ? cancelled : item);
    return cancelled;
  });
}

function installFakePlanningApi() {
  getDailyPlanMock.mockImplementation(async () => dailyPlan);
  putDailyPlanMock.mockImplementation(async ({ date, input }) => {
    dailyPlan = input.focusTaskId === null && input.availableMinutes === null ? null : {
      availableMinutes: input.availableMinutes,
      createdAt: dailyPlan?.createdAt ?? new Date().toISOString(),
      date,
      focusTaskId: input.focusTaskId,
      id: dailyPlan?.id ?? 'daily-plan-1',
      updatedAt: new Date().toISOString(),
    };
    return dailyPlan;
  });
  getWeeklyFocusesMock.mockImplementation(async () => focuses);
  replaceWeeklyFocusesMock.mockImplementation(async ({ titles }) => {
    focuses = titles.map((title, position) => ({
      createdAt: new Date().toISOString(),
      id: `focus-${position}`,
      position,
      title,
      updatedAt: new Date().toISOString(),
      weekPlanId: 'week-plan-1',
    }));
    return focuses;
  });
}

type Route = 'today' | 'week' | 'inbox';

function ServerFlowHarness({ initialRoute = 'today' }: { initialRoute?: Route }) {
  const [route, setRoute] = useState<Route>(initialRoute);
  const [movedTaskId, setMovedTaskId] = useState<string>();
  if (route === 'today') {
    return (
      <TodayScreen
        movedTaskId={movedTaskId}
        onNavigateInbox={() => setRoute('inbox')}
        onNavigateWeek={() => setRoute('week')}
        taskSource="server"
      />
    );
  }
  if (route === 'week') {
    return (
      <WeekScreen
        onNavigateInbox={() => setRoute('inbox')}
        onNavigateToday={() => setRoute('today')}
        taskSource="server"
      />
    );
  }
  return (
    <InboxScreen
      onMoveToToday={(task) => {
        setMovedTaskId(task.id);
        setRoute('today');
      }}
      onNavigateToday={() => setRoute('today')}
      onNavigateWeek={() => setRoute('week')}
      taskSource="server"
    />
  );
}

function renderFlow(initialRoute: Route = 'today') {
  return render(
    <TestProviders>
      <ServerFlowHarness initialRoute={initialRoute} />
    </TestProviders>,
  );
}

async function capture(title: string, destination?: 'היום' | 'השבוע') {
  const user = userEvent.setup();
  await user.press(screen.getByLabelText('הוספה מהירה'));
  const sheet = screen.getByLabelText('חלונית הוספה מהירה');
  await user.type(within(sheet).getByLabelText('כותרת'), title);
  if (destination) await user.press(within(sheet).getByText(destination));
  await user.press(within(sheet).getByText('שמירה'));
  await waitFor(() => expect(screen.queryByLabelText('חלונית הוספה מהירה')).toBeNull());
}

beforeEach(() => {
  tasks = [];
  nextId = 1;
  dailyPlan = null;
  focuses = [];
  jest.clearAllMocks();
  installFakeTaskApi();
  installFakePlanningApi();
  listCommitmentsMock.mockResolvedValue([]);
  jest.mocked(settingsApi.getSettings).mockResolvedValue({ persisted: true, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, weekStartDay: 0, defaultDailyCapacityMinutes: 360, dayWindowSupported: true, dayStartTime: null, dayEndTime: null });
});

describe('persistent server Task experience', () => {
  it('renders production Week summaries from active date-planned Tasks, not fixtures or focuses', async () => {
    const firstDate = currentWeekStart();
    const secondDate = addDaysToDateKey(firstDate, 1);
    tasks = [
      makeTask({ estimatedMinutes: 45, planning: { plannedDate: firstDate, type: 'day' }, title: 'Open' }, 'open'),
      makeTask({ planning: { plannedDate: firstDate, type: 'day' }, title: 'No duration' }, 'no-duration'),
      { ...makeTask({ estimatedMinutes: 20, planning: { plannedDate: firstDate, type: 'day' }, title: 'Active' }, 'active'), status: 'in_progress' },
      { ...makeTask({ estimatedMinutes: 90, planning: { plannedDate: firstDate, type: 'day' }, title: 'Done' }, 'done'), completedAt: new Date().toISOString(), status: 'completed' },
      makeTask({ estimatedMinutes: 15, planning: { plannedDate: secondDate, type: 'day' }, title: 'Tomorrow' }, 'tomorrow'),
    ];
    focuses = [{
      createdAt: new Date().toISOString(), id: 'focus-1', position: 0,
      title: 'Focus is not a Task', updatedAt: new Date().toISOString(), weekPlanId: 'week-plan-1',
    }];

    await renderFlow('week');

    expect(await screen.findByText('3 משימות · 1:05 זמן משימות מתוכנן')).toBeTruthy();
    expect(screen.getByText('1 משימה · 0:15 זמן משימות מתוכנן')).toBeTruthy();
    expect(screen.getAllByText('0 משימות · 0:00 זמן משימות מתוכנן')).toHaveLength(5);
    expect(screen.getByText('Focus is not a Task')).toBeTruthy();
    expect(screen.queryByText('5 משימות · 4:30 זמן משימות מתוכנן')).toBeNull();
    expect(screen.queryByText('פנוי')).toBeNull();
    expect(screen.queryByText('מאוזן')).toBeNull();
    expect(screen.queryByText('עמוס')).toBeNull();
    expect(listTasksMock).toHaveBeenCalledWith({
      plannedDateFrom: firstDate,
      plannedDateTo: addDaysToDateKey(firstDate, 6),
    });
  });

  it('moves one stable Task through Capture → Inbox → Week → Today → Active → Done', async () => {
    const user = userEvent.setup();
    const title = 'משימת API מלאה';
    await renderFlow();

    await capture(title);
    const stableId = tasks[0].id;
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toEqual(expect.objectContaining({ plannedDate: null, status: 'open', weekPlanId: null }));

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('Inbox'));
    expect(await screen.findByText(title)).toBeTruthy();
    await user.press(screen.getByLabelText(`פתח פעולות עבור ${title}`));
    await user.press(within(screen.getByLabelText('מה צריך לקרות עם זה')).getByText('השבוע'));
    await waitFor(() => expect(tasks[0].weekPlanId).not.toBeNull());
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(stableId);

    await user.press(screen.getByLabelText('סגור פעולות Inbox'));
    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('שבוע'));
    expect(await screen.findByText(title)).toBeTruthy();
    await user.press(screen.getByLabelText(`בחר יום עבור ${title}`));
    await user.press(screen.getByLabelText(`שבץ להיום: ${title}`));
    await waitFor(() => expect(tasks[0].plannedDate).toBe(localDateKey()));
    expect(tasks[0]).toEqual(expect.objectContaining({ id: stableId, weekPlanId: null }));

    await user.press(screen.getByLabelText(`התחל משימה: ${title}`));
    await waitFor(() => expect(tasks[0].status).toBe('in_progress'));
    expect(await screen.findByLabelText('פעיל עכשיו')).toBeTruthy();
    await user.press(screen.getByText('עצירה'));
    await waitFor(() => expect(tasks[0].status).toBe('open'));
    expect(tasks[0].plannedDate).toBe(localDateKey());

    await user.press(screen.getByLabelText(`התחל משימה: ${title}`));
    await user.press(await screen.findByText('סיום'));
    await waitFor(() => expect(tasks[0].status).toBe('completed'));
    expect(within(await screen.findByLabelText('משימות שהושלמו')).getByText(title)).toBeTruthy();
    expect(tasks.filter((task) => task.id === stableId)).toHaveLength(1);
  });

  it('supports direct capture to Today and Week and synchronizes a single active Task', async () => {
    const user = userEvent.setup();
    await renderFlow();
    await capture('ראשונה להיום', 'היום');
    await capture('שנייה להיום', 'היום');
    await capture('ישירה לשבוע', 'השבוע');

    expect(tasks.find((task) => task.title === 'ראשונה להיום')?.plannedDate).toBe(localDateKey());
    expect(tasks.find((task) => task.title === 'ישירה לשבוע')?.weekPlanId).not.toBeNull();

    await user.press(screen.getByLabelText('התחל משימה: ראשונה להיום'));
    await waitFor(() => expect(tasks.find((task) => task.title === 'ראשונה להיום')?.status).toBe('in_progress'));
    await user.press(screen.getByLabelText('התחל משימה: שנייה להיום'));
    await waitFor(() => {
      expect(tasks.find((task) => task.title === 'ראשונה להיום')?.status).toBe('open');
      expect(tasks.find((task) => task.title === 'שנייה להיום')?.status).toBe('in_progress');
    });
    expect(tasks.filter((task) => task.status === 'in_progress')).toHaveLength(1);

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('שבוע'));
    expect(await screen.findByText('ישירה לשבוע')).toBeTruthy();
  });

  it('captures once from the inline Today action, defaults it to Today, and preserves global capture cancellation and Inbox default', async () => {
    const user = userEvent.setup();
    await renderFlow('week');
    expect(await screen.findAllByText('0 משימות · 0:00 זמן משימות מתוכנן')).toHaveLength(7);

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('היום'));
    expect(await screen.findByText('0 משימות')).toBeTruthy();

    await user.press(screen.getByLabelText('הוסף משימה להיום'));
    let sheet = screen.getByLabelText('חלונית הוספה מהירה');
    expect(within(sheet).getByText('היום').parent?.props.accessibilityState).toEqual({ selected: true });
    await user.type(within(sheet).getByLabelText('כותרת'), 'לא ליצור בביטול');
    await user.press(screen.getByLabelText('סגור הוספה מהירה'));
    expect(createTaskMock).not.toHaveBeenCalled();
    expect(tasks).toHaveLength(0);

    await user.press(screen.getByLabelText('הוספה מהירה'));
    sheet = screen.getByLabelText('חלונית הוספה מהירה');
    expect(within(sheet).getByText('Inbox').parent?.props.accessibilityState).toEqual({ selected: true });
    await user.press(screen.getByLabelText('סגור הוספה מהירה'));

    await user.press(screen.getByLabelText('הוסף משימה להיום'));
    sheet = screen.getByLabelText('חלונית הוספה מהירה');
    expect(within(sheet).getByText('היום').parent?.props.accessibilityState).toEqual({ selected: true });
    await user.type(within(sheet).getByLabelText('כותרת'), 'נוצרה מהיום');
    await user.press(within(sheet).getByText('שמירה'));

    expect(await screen.findByText('נוצרה מהיום')).toBeTruthy();
    expect(createTaskMock).toHaveBeenCalledTimes(1);
    expect(createTaskMock.mock.calls[0]?.[0]).toEqual({
      planning: { plannedDate: localDateKey(), type: 'day' },
      title: 'נוצרה מהיום',
    });
    expect(tasks).toHaveLength(1);

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('שבוע'));
    expect(await screen.findByText('1 משימה · 0:00 זמן משימות מתוכנן')).toBeTruthy();
  });

  it('expands all week-planned Tasks and schedules a previously hidden Task without creating or duplicating it', async () => {
    const user = userEvent.setup();
    const weekStart = currentWeekStart();
    tasks = [
      makeTask({ planning: { type: 'week', weekStart }, title: 'ראשונה בתכנון' }, 'week-first'),
      makeTask({ planning: { type: 'week', weekStart }, title: 'שנייה בתכנון' }, 'week-second'),
      makeTask({ planning: { type: 'week', weekStart }, title: 'שלישית בתכנון' }, 'week-third'),
      makeTask({ planning: { type: 'week', weekStart }, title: 'רביעית שהוסתרה' }, 'week-fourth'),
    ];
    await renderFlow('week');

    let section = await screen.findByLabelText('לתכנן השבוע');
    expect(within(section).getAllByLabelText(/^בחר יום עבור /)).toHaveLength(2);
    expect(within(section).queryByText('רביעית שהוסתרה')).toBeNull();
    await user.press(within(section).getByLabelText('הצג 2 משימות נוספות'));
    expect(within(section).getAllByLabelText(/^בחר יום עבור /)).toHaveLength(4);
    expect(within(section).getByText('רביעית שהוסתרה')).toBeTruthy();

    await user.press(within(section).getByLabelText('בחר יום עבור רביעית שהוסתרה'));
    await user.press(within(section).getByLabelText('שבץ להיום: רביעית שהוסתרה'));
    await waitFor(() => expect(tasks.find((task) => task.id === 'week-fourth')?.plannedDate).toBe(localDateKey()));
    expect(tasks).toHaveLength(4);
    expect(new Set(tasks.map((task) => task.id)).size).toBe(4);
    expect(createTaskMock).not.toHaveBeenCalled();
    expect(updateTaskMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('רביעית שהוסתרה')).toBeTruthy();

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('שבוע'));
    section = await screen.findByLabelText('לתכנן השבוע');
    expect(within(section).queryByText('רביעית שהוסתרה')).toBeNull();
    expect(within(section).getAllByLabelText(/^בחר יום עבור /)).toHaveLength(2);
    expect(within(section).getByLabelText('הצג משימה נוספת')).toBeTruthy();
    expect(await screen.findByText('1 משימה · 0:00 זמן משימות מתוכנן')).toBeTruthy();
  });

  it('moves Inbox directly to Today and cancels without deleting the persisted identity', async () => {
    const user = userEvent.setup();
    const direct = makeTask({ title: 'ישירה מהאינבוקס' });
    const cancelled = makeTask({ title: 'לבטל מהאינבוקס' });
    tasks = [direct, cancelled];
    await renderFlow('inbox');

    expect(await screen.findByText(direct.title)).toBeTruthy();
    await user.press(screen.getByLabelText(`פתח פעולות עבור ${direct.title}`));
    await user.press(within(screen.getByLabelText('מה צריך לקרות עם זה')).getByText('היום'));
    expect(await screen.findByText('נוסף להיום מה־Inbox · אותה משימה')).toBeTruthy();
    expect(tasks.find((task) => task.id === direct.id)).toEqual(expect.objectContaining({
      id: direct.id,
      plannedDate: localDateKey(),
    }));

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('Inbox'));
    await user.press(screen.getByLabelText(`פתח פעולות עבור ${cancelled.title}`));
    await user.press(within(screen.getByLabelText('מה צריך לקרות עם זה')).getByText('מחיקה'));
    await waitFor(() => expect(tasks.find((task) => task.id === cancelled.id)?.status).toBe('cancelled'));
    expect(tasks.find((task) => task.id === cancelled.id)).toBeTruthy();
    expect(screen.queryByText(cancelled.title)).toBeNull();
  });

  it('keeps the typed Quick Capture title when the API fails', async () => {
    createTaskMock.mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();
    await renderFlow();
    await user.press(screen.getByLabelText('הוספה מהירה'));
    const sheet = screen.getByLabelText('חלונית הוספה מהירה');
    await user.type(within(sheet).getByLabelText('כותרת'), 'לא לאבד אותי');
    await user.press(within(sheet).getByText('שמירה'));

    expect(await within(sheet).findByText('לא הצלחנו לשמור. אפשר לנסות שוב.')).toBeTruthy();
    expect(within(sheet).getByDisplayValue('לא לאבד אותי')).toBeTruthy();
    expect(tasks).toHaveLength(0);
  });

  it('renders the restrained Task loading error and offers a retry', async () => {
    listTasksMock.mockRejectedValueOnce(new Error('offline'));
    await renderFlow('inbox');

    expect(await screen.findByText('לא הצלחנו לטעון את המשימות · נסו שוב')).toBeTruthy();
  });

});

it('moves an existing Inbox item to a distant calendar date only after confirmation, retaining all unrelated fields', async () => {
  const original = makeTask({ title: 'calendar move', description: 'retain description', dueDate: '2027-06-01', estimatedMinutes: 45, priority: 'important' });
  tasks = [original];
  await renderFlow('inbox');
  await fireEvent.press(await screen.findByLabelText('פתח פעולות עבור calendar move'));
  await fireEvent.press(screen.getByText('לבחור יום'));
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2027, 0, 2, 12));
  await fireEvent.press(screen.getByLabelText('ביטול בחירת תאריך'));
  expect(updateTaskMock).not.toHaveBeenCalled();
  expect(tasks).toEqual([original]);
  await fireEvent.press(screen.getByText('לבחור יום'));
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2027, 0, 2, 12));
  updateTaskMock.mockRejectedValueOnce(new Error('offline'));
  await fireEvent.press(screen.getByLabelText('אישור תאריך'));
  await waitFor(() => expect(screen.getByText('לא הצלחנו לעדכן. אפשר לנסות שוב או לבטל.')).toBeTruthy());
  expect(tasks).toEqual([original]);
  expect(screen.getByLabelText('תאריך בבחירה').props.children).toBe('2027-01-02');
  await fireEvent.press(screen.getByLabelText('אישור תאריך'));
  await waitFor(() => expect(screen.queryByLabelText('מה צריך לקרות עם זה')).toBeNull());
  expect(updateTaskMock.mock.calls[1]?.[0]).toEqual({ id: original.id, input: { planning: { type: 'day', plannedDate: '2027-01-02' } } });
  expect(tasks).toEqual([{ ...original, plannedDate: '2027-01-02', updatedAt: tasks[0].updatedAt }]);
  expect(screen.queryByLabelText('פריט Inbox: calendar move')).toBeNull();
  expect(createTaskMock).not.toHaveBeenCalled();
  expect(cancelTaskMock).not.toHaveBeenCalled();
});

it('uses the calendar in Inbox processing and Week scheduling without recreating tasks', async () => {
  tasks = [makeTask({ title: 'processing calendar' })];
  const id = tasks[0].id;
  await renderFlow('inbox');
  await screen.findByText('processing calendar');
  await fireEvent.press(screen.getByText('מיין כמה עכשיו'));
  await fireEvent.press(screen.getByText('לבחור יום'));
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2027, 0, 2, 12));
  await fireEvent.press(screen.getByLabelText('ביטול בחירת תאריך'));
  expect(updateTaskMock).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('השבוע'));
  await waitFor(() => expect(screen.queryByLabelText('מיון מהיר')).toBeNull());
  await fireEvent.press(within(screen.getByLabelText('ניווט ראשי')).getByText('שבוע'));
  await fireEvent.press(await screen.findByLabelText('בחר יום עבור processing calendar'));
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2028, 1, 29, 12));
  await fireEvent.press(screen.getByLabelText('אישור תאריך'));
  await waitFor(() => expect(screen.queryByLabelText('בחר יום עבור processing calendar')).toBeNull());
  expect(updateTaskMock.mock.calls[1]?.[0]).toEqual({ id, input: { planning: { type: 'day', plannedDate: '2028-02-29' } } });
  expect(tasks).toHaveLength(1);
  expect(tasks[0]).toEqual(expect.objectContaining({ id, plannedDate: '2028-02-29', weekPlanId: null }));
  expect(createTaskMock).not.toHaveBeenCalled();
  expect(cancelTaskMock).not.toHaveBeenCalled();
});

it('confirms a date directly in Inbox processing and advances only after successful persistence', async () => {
  tasks = [makeTask({ title: 'process date' })];
  const original = tasks[0];
  await renderFlow('inbox');
  await screen.findByText('process date');
  await fireEvent.press(screen.getByText('מיין כמה עכשיו'));
  await fireEvent.press(screen.getByText('לבחור יום'));
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2027, 0, 2, 12));
  updateTaskMock.mockRejectedValueOnce(new Error('offline'));
  await fireEvent.press(screen.getByLabelText('אישור תאריך'));
  await screen.findByText('לא הצלחנו לעדכן. אפשר לנסות שוב או לבטל.');
  expect(screen.getByLabelText('מיון מהיר')).toBeTruthy();
  expect(tasks).toEqual([original]);
  await fireEvent.press(screen.getByLabelText('אישור תאריך'));
  await waitFor(() => expect(screen.queryByLabelText('מיון מהיר')).toBeNull());
  expect(tasks).toEqual([{ ...original, plannedDate: '2027-01-02', updatedAt: tasks[0].updatedAt }]);
  expect(createTaskMock).not.toHaveBeenCalled();
});
