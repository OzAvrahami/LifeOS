export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'normal' | 'important';

export type Task = {
  reminderAt?: string | null;
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

export type TaskListFilters = {
  id?: string;
  reminders?: boolean;
  status?: TaskStatus;
  plannedDate?: string;
  plannedDateFrom?: string;
  plannedDateTo?: string;
  weekStart?: string;
  placement?: 'inbox';
};

export type CreateTaskInput = {
  reminderAt?: string | null;
  title: string;
  description?: string | null;
  estimatedMinutes?: number | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  position?: number;
  planning?: TaskPlanningInput;
};

export type UpdateTaskInput = Omit<CreateTaskInput, 'title'> & {
  title?: string;
  status?: TaskStatus;
};

export type TaskSource = 'preview' | 'server';
