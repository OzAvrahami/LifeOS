import { apiRequest } from '@/lib/api/client';

import {
  CreateTaskInput,
  Task,
  TaskListFilters,
  UpdateTaskInput,
} from './task.types';

async function taskRequest<T>(path: string, options: RequestInit) {
  return apiRequest<T>(path, { ...options, auth: 'required' });
}

function taskQuery(filters: TaskListFilters) {
  const query = new URLSearchParams();
  if (filters.status) query.set('status', filters.status);
  if (filters.plannedDate) query.set('plannedDate', filters.plannedDate);
  if (filters.weekStart) query.set('weekStart', filters.weekStart);
  if (filters.placement) query.set('placement', filters.placement);
  const value = query.toString();
  return value ? `/tasks?${value}` : '/tasks';
}

export async function listTasks(filters: TaskListFilters = {}) {
  const response = await taskRequest<{ tasks: Task[] }>(taskQuery(filters), {});
  return response.tasks;
}

export async function createTask(input: CreateTaskInput) {
  const response = await taskRequest<{ task: Task }>('/tasks', {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return response.task;
}

export async function updateTask({ id, input }: { id: string; input: UpdateTaskInput }) {
  const response = await taskRequest<{ task: Task }>(`/tasks/${id}`, {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  });
  return response.task;
}

export async function cancelTask(id: string) {
  const response = await taskRequest<{ task: Task }>(`/tasks/${id}`, {
    method: 'DELETE',
  });
  return response.task;
}
