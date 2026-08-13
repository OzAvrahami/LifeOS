import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import {
  CreateTaskInput,
  Task,
  TaskListFilters,
  TaskPlanningInput,
  TaskRow,
  TaskServiceContract,
  TaskStore,
  UpdateTaskInput,
} from './task.types.js';
import { TaskApiError } from './task.validation.js';

function mapTask(row: TaskRow): Task {
  return {
    completedAt: row.completed_at,
    createdAt: row.created_at,
    description: row.description,
    dueDate: row.due_date,
    estimatedMinutes: row.estimated_minutes,
    id: row.id,
    plannedDate: row.planned_date,
    position: row.position,
    priority: row.priority,
    status: row.status,
    title: row.title,
    updatedAt: row.updated_at,
    weekPlanId: row.week_plan_id,
  };
}

function dataError(error: PostgrestError): never {
  if (error.code === 'P0002') throw new TaskApiError(404, 'Task not found');
  if (error.code === 'P0001' || error.code === '23505') {
    throw new TaskApiError(409, 'Task state conflict');
  }
  if (['22P02', '23503', '23514'].includes(error.code)) {
    throw new TaskApiError(400, 'Invalid task input');
  }
  throw new TaskApiError(500, 'Task operation failed');
}

export class SupabaseTaskStore implements TaskStore {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async findWeekPlan(weekStart: string) {
    const { data, error } = await this.client
      .from('week_plans')
      .select('id')
      .eq('user_id', this.userId)
      .eq('week_start', weekStart)
      .maybeSingle();
    if (error) dataError(error);
    return (data as { id: string } | null)?.id ?? null;
  }

  async ensureWeekPlan(weekStart: string) {
    const { data, error } = await this.client
      .from('week_plans')
      .upsert(
        { user_id: this.userId, week_start: weekStart },
        { onConflict: 'user_id,week_start' },
      )
      .select('id')
      .single();
    if (error) dataError(error);
    return (data as { id: string }).id;
  }

  async list(filters: TaskListFilters & { weekPlanId?: string | null }) {
    let query = this.client.from('tasks').select('*').eq('user_id', this.userId);
    if (filters.status) query = query.eq('status', filters.status);
    else query = query.neq('status', 'cancelled');
    if (filters.plannedDate) query = query.eq('planned_date', filters.plannedDate);
    if (filters.weekPlanId) query = query.eq('week_plan_id', filters.weekPlanId);
    if (filters.placement === 'inbox') {
      query = query.eq('status', 'open').is('planned_date', null).is('week_plan_id', null);
    }
    const { data, error } = await query.order('position').order('created_at');
    if (error) dataError(error);
    return (data ?? []) as TaskRow[];
  }

  async create(values: Record<string, unknown>) {
    const { data, error } = await this.client
      .from('tasks')
      .insert({ ...values, user_id: this.userId })
      .select('*')
      .single();
    if (error) dataError(error);
    return data as TaskRow;
  }

  async update(id: string, values: Record<string, unknown>) {
    const { data, error } = await this.client
      .from('tasks')
      .update(values)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select('*')
      .maybeSingle();
    if (error) dataError(error);
    return data as TaskRow | null;
  }

  async start(id: string) {
    const { data, error } = await this.client
      .rpc('start_task', { p_task_id: id })
      .single();
    if (error) dataError(error);
    return data as TaskRow;
  }

  cancel(id: string) {
    return this.update(id, { completed_at: null, status: 'cancelled' });
  }
}

async function planningValues(store: TaskStore, planning: TaskPlanningInput | undefined) {
  if (!planning || planning.type === 'inbox') {
    return { planned_date: null, week_plan_id: null };
  }
  if (planning.type === 'day') {
    return { planned_date: planning.plannedDate, week_plan_id: null };
  }
  return {
    planned_date: null,
    week_plan_id: await store.ensureWeekPlan(planning.weekStart),
  };
}

export class TaskService implements TaskServiceContract {
  constructor(private readonly store: TaskStore) {}

  async list(filters: TaskListFilters) {
    if (filters.weekStart) {
      const weekPlanId = await this.store.findWeekPlan(filters.weekStart);
      if (!weekPlanId) return [];
      return (await this.store.list({ ...filters, weekPlanId })).map(mapTask);
    }
    return (await this.store.list(filters)).map(mapTask);
  }

  async create(input: CreateTaskInput) {
    const values: Record<string, unknown> = {
      ...(await planningValues(this.store, input.planning)),
      title: input.title,
    };
    if (input.description !== undefined) values.description = input.description;
    if (input.estimatedMinutes !== undefined) values.estimated_minutes = input.estimatedMinutes;
    if (input.priority !== undefined) values.priority = input.priority;
    if (input.dueDate !== undefined) values.due_date = input.dueDate;
    if (input.position !== undefined) values.position = input.position;
    return mapTask(await this.store.create(values));
  }

  async update(id: string, input: UpdateTaskInput) {
    if (input.status === 'in_progress') return mapTask(await this.store.start(id));

    const values: Record<string, unknown> = {};
    if (input.title !== undefined) values.title = input.title;
    if (input.description !== undefined) values.description = input.description;
    if (input.estimatedMinutes !== undefined) values.estimated_minutes = input.estimatedMinutes;
    if (input.priority !== undefined) values.priority = input.priority;
    if (input.dueDate !== undefined) values.due_date = input.dueDate;
    if (input.position !== undefined) values.position = input.position;
    if (input.planning) {
      Object.assign(values, await planningValues(this.store, input.planning), {
        completed_at: null,
        status: 'open',
      });
    }
    if (input.status) {
      values.status = input.status;
      values.completed_at = input.status === 'completed' ? new Date().toISOString() : null;
    }

    const row = await this.store.update(id, values);
    if (!row) throw new TaskApiError(404, 'Task not found');
    return mapTask(row);
  }

  async cancel(id: string) {
    const row = await this.store.cancel(id);
    if (!row) throw new TaskApiError(404, 'Task not found');
    return mapTask(row);
  }
}

export function createTaskService(client: SupabaseClient, userId: string) {
  return new TaskService(new SupabaseTaskStore(client, userId));
}
