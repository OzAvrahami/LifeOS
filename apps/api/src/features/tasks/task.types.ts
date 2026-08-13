import { SupabaseClient } from '@supabase/supabase-js';

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'normal' | 'important';

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  estimated_minutes: number | null;
  priority: TaskPriority;
  due_date: string | null;
  planned_date: string | null;
  week_plan_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  estimatedMinutes: number | null;
  priority: TaskPriority;
  dueDate: string | null;
  plannedDate: string | null;
  weekPlanId: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type TaskPlanningInput =
  | { type: 'inbox' }
  | { type: 'week'; weekStart: string }
  | { type: 'day'; plannedDate: string };

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  estimatedMinutes?: number | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  position?: number;
  planning?: TaskPlanningInput;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  estimatedMinutes?: number | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  position?: number;
  planning?: TaskPlanningInput;
  status?: TaskStatus;
};

export type TaskListFilters = {
  status?: TaskStatus;
  plannedDate?: string;
  weekStart?: string;
  placement?: 'inbox';
};

export type TaskStore = {
  cancel(id: string): Promise<TaskRow | null>;
  create(values: Record<string, unknown>): Promise<TaskRow>;
  ensureWeekPlan(weekStart: string): Promise<string>;
  findWeekPlan(weekStart: string): Promise<string | null>;
  list(filters: TaskListFilters & { weekPlanId?: string | null }): Promise<TaskRow[]>;
  start(id: string): Promise<TaskRow>;
  update(id: string, values: Record<string, unknown>): Promise<TaskRow | null>;
};

export type TaskServiceFactory = (client: SupabaseClient, userId: string) => TaskServiceContract;

export type TaskServiceContract = {
  cancel(id: string): Promise<Task>;
  create(input: CreateTaskInput): Promise<Task>;
  list(filters: TaskListFilters): Promise<Task[]>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
};
