import { normalInboxItems } from '@/features/inbox/inbox.fixture';
import { normalTodayFixture } from '@/features/today/today.fixture';
import { unscheduledWeekTasks } from '@/features/week/week.fixture';

import { DemoTask, DemoTaskState } from './demo-task.types';

export const DEMO_TODAY = '2026-08-08';
export const DEMO_CURRENT_WEEK_PLAN_ID = 'week-2026-08-02';

const inboxTasks: DemoTask[] = normalInboxItems.map((task, position) => ({
  ...task,
  completedAt: null,
  plannedDate: null,
  position,
  status: 'open',
  weekPlanId: null,
}));

const weekTasks: DemoTask[] = unscheduledWeekTasks.map((task, position) => ({
  compactCreatedLabel: 'השבוע',
  completedAt: null,
  createdLabel: 'נוסף לתכנון השבוע',
  estimatedMinutes: task.durationMinutes,
  id: `week-${task.id}`,
  plannedDate: null,
  position,
  status: 'open',
  title: task.title,
  weekPlanId: DEMO_CURRENT_WEEK_PLAN_ID,
}));

const todayTasks: DemoTask[] = normalTodayFixture.tasks.map((task, position) => ({
  compactCreatedLabel: 'היום',
  completedAt: null,
  createdLabel: 'מתוכנן להיום',
  estimatedMinutes: task.durationMinutes,
  id: position === 0 ? normalTodayFixture.focus.id : `today-${task.id}`,
  lifeArea: task.lifeArea,
  plannedDate: DEMO_TODAY,
  position,
  status: 'open',
  title: task.title,
  weekPlanId: null,
}));

export const initialDemoTaskState: DemoTaskState = {
  nextTaskSequence: 1,
  tasks: [...inboxTasks, ...weekTasks, ...todayTasks],
};
