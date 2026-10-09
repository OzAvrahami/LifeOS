import { apiRequest } from '@/lib/api/client';

import {
  CreateTaskInput,
  Task,
  TaskListFilters,
  UpdateTaskInput,
} from './task.types';

async function taskRequest<T>(path: string, options: RequestInit, expectedUserId?: string) {
  return apiRequest<T>(path, { ...options, auth: 'required', ...(expectedUserId ? { expectedUserId } : {}) });
}

function taskQuery(filters: TaskListFilters) {
  const query = new URLSearchParams();
  if (filters.id) query.set('id', filters.id);
  if (filters.reminders) query.set('reminders', 'true');
  if (filters.status) query.set('status', filters.status);
  if (filters.plannedDate) query.set('plannedDate', filters.plannedDate);
  if (filters.plannedDateFrom) query.set('plannedDateFrom', filters.plannedDateFrom);
  if (filters.plannedDateTo) query.set('plannedDateTo', filters.plannedDateTo);
  if (filters.weekStart) query.set('weekStart', filters.weekStart);
  if (filters.placement) query.set('placement', filters.placement);
  const value = query.toString();
  return value ? `/tasks?${value}` : '/tasks';
}

export async function listTasks(filters: TaskListFilters = {}, expectedUserId?: string) {
  const response = await taskRequest<{ tasks: Task[] }>(taskQuery(filters), {}, expectedUserId);
  return response.tasks;
}

export async function createTask(input: CreateTaskInput, expectedUserId?: string) {
  const { creationId, ...body } = input;
  const response = await taskRequest<{ task: Task }>('/tasks', {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(creationId ? { 'Idempotency-Key': creationId } : {}) },
    method: 'POST',
  }, expectedUserId);
  return response.task;
}

export async function updateTask({ id, input }: { id: string; input: UpdateTaskInput }, expectedUserId?: string) {
  const response = await taskRequest<{ task: Task }>(`/tasks/${id}`, {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  }, expectedUserId);
  return response.task;
}

export async function cancelTask(id: string, expectedUserId?: string) {
  const response = await taskRequest<{ task: Task }>(`/tasks/${id}`, {
    method: 'DELETE',
  }, expectedUserId);
  return response.task;
}
