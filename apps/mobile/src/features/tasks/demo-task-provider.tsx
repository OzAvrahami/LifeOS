import { createContext, PropsWithChildren, use, useMemo, useReducer } from 'react';

import {
  DEMO_CURRENT_WEEK_PLAN_ID,
  DEMO_TODAY,
  initialDemoTaskState,
} from './demo-task.fixture';
import {
  DemoCaptureDestination,
  DemoTask,
  DemoTaskAction,
  DemoTaskState,
} from './demo-task.types';

type DemoTaskContextValue = {
  tasks: DemoTask[];
  inboxTasks: DemoTask[];
  weekTasks: DemoTask[];
  todayTasks: DemoTask[];
  activeTask: DemoTask | undefined;
  openTodayTasks: DemoTask[];
  completedTodayTasks: DemoTask[];
  captureTask: (title: string, destination: DemoCaptureDestination) => void;
  moveTaskToInbox: (taskId: string) => void;
  moveTaskToWeek: (taskId: string) => void;
  moveTaskToToday: (taskId: string) => void;
  scheduleTask: (taskId: string, plannedDate: string) => void;
  cancelTask: (taskId: string) => void;
  updateTaskTitle: (taskId: string, title: string) => void;
  startTask: (taskId: string) => void;
  stopTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
};

const DemoTaskContext = createContext<DemoTaskContextValue | null>(null);

function updateTask(
  state: DemoTaskState,
  taskId: string,
  update: (task: DemoTask) => DemoTask,
): DemoTaskState {
  return {
    ...state,
    tasks: state.tasks.map((task) => (task.id === taskId ? update(task) : task)),
  };
}

export function demoTaskReducer(state: DemoTaskState, action: DemoTaskAction): DemoTaskState {
  switch (action.type) {
    case 'capture': {
      const task: DemoTask = {
        compactCreatedLabel: 'עכשיו',
        completedAt: null,
        createdLabel: 'נוסף עכשיו',
        id: `local-task-${state.nextTaskSequence}`,
        plannedDate: action.destination === 'today' ? DEMO_TODAY : null,
        position: -state.nextTaskSequence,
        status: 'open',
        title: action.title,
        weekPlanId:
          action.destination === 'week' ? DEMO_CURRENT_WEEK_PLAN_ID : null,
      };

      return {
        nextTaskSequence: state.nextTaskSequence + 1,
        tasks: [task, ...state.tasks],
      };
    }
    case 'move_to_inbox':
      return updateTask(state, action.taskId, (task) => ({
        ...task,
        plannedDate: null,
        status: task.status === 'cancelled' ? 'open' : task.status,
        weekPlanId: null,
      }));
    case 'move_to_week':
      return updateTask(state, action.taskId, (task) => ({
        ...task,
        plannedDate: null,
        status: 'open',
        weekPlanId: DEMO_CURRENT_WEEK_PLAN_ID,
      }));
    case 'move_to_today':
      return updateTask(state, action.taskId, (task) => ({
        ...task,
        plannedDate: DEMO_TODAY,
        status: 'open',
        weekPlanId: null,
      }));
    case 'schedule':
      return updateTask(state, action.taskId, (task) => ({
        ...task,
        plannedDate: action.plannedDate,
        status: 'open',
        weekPlanId: null,
      }));
    case 'cancel':
      return updateTask(state, action.taskId, (task) => ({
        ...task,
        status: 'cancelled',
      }));
    case 'edit_title':
      return updateTask(state, action.taskId, (task) => ({ ...task, title: action.title }));
    case 'start':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id === action.taskId) return { ...task, status: 'in_progress' };
          if (task.status === 'in_progress') return { ...task, status: 'open' };
          return task;
        }),
      };
    case 'stop':
      return updateTask(state, action.taskId, (task) => ({ ...task, status: 'open' }));
    case 'complete':
      return updateTask(state, action.taskId, (task) => ({
        ...task,
        completedAt: '2026-08-08T12:00:00+03:00',
        status: 'completed',
      }));
  }
}

export function DemoTaskProvider({
  children,
  initialState = initialDemoTaskState,
}: PropsWithChildren<{ initialState?: DemoTaskState }>) {
  const [state, dispatch] = useReducer(demoTaskReducer, initialState);

  const value = useMemo<DemoTaskContextValue>(() => {
    const activeTask = state.tasks.find((task) => task.status === 'in_progress');
    const inboxTasks = state.tasks.filter(
      (task) =>
        task.status === 'open' && task.plannedDate === null && task.weekPlanId === null,
    );
    const weekTasks = state.tasks.filter(
      (task) =>
        task.status === 'open' &&
        task.plannedDate === null &&
        task.weekPlanId === DEMO_CURRENT_WEEK_PLAN_ID,
    );
    const todayTasks = state.tasks.filter((task) => task.plannedDate === DEMO_TODAY);
    const openTodayTasks = todayTasks.filter((task) => task.status === 'open');
    const completedTodayTasks = todayTasks.filter((task) => task.status === 'completed');

    return {
      activeTask,
      cancelTask: (taskId) => dispatch({ taskId, type: 'cancel' }),
      captureTask: (title, destination) => dispatch({ destination, title, type: 'capture' }),
      completeTask: (taskId) => dispatch({ taskId, type: 'complete' }),
      completedTodayTasks,
      inboxTasks,
      moveTaskToInbox: (taskId) => dispatch({ taskId, type: 'move_to_inbox' }),
      moveTaskToToday: (taskId) => dispatch({ taskId, type: 'move_to_today' }),
      moveTaskToWeek: (taskId) => dispatch({ taskId, type: 'move_to_week' }),
      openTodayTasks,
      scheduleTask: (taskId, plannedDate) =>
        dispatch({ plannedDate, taskId, type: 'schedule' }),
      startTask: (taskId) => dispatch({ taskId, type: 'start' }),
      stopTask: (taskId) => dispatch({ taskId, type: 'stop' }),
      tasks: state.tasks,
      todayTasks,
      updateTaskTitle: (taskId, title) => dispatch({ taskId, title, type: 'edit_title' }),
      weekTasks,
    };
  }, [state]);

  return <DemoTaskContext value={value}>{children}</DemoTaskContext>;
}

export function useDemoTasks() {
  const context = use(DemoTaskContext);
  if (!context) throw new Error('useDemoTasks must be used within DemoTaskProvider');
  return context;
}
