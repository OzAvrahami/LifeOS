import { apiRequest } from '@/lib/api/client';
import type { FlowPlan } from './daily-flow.api';
import type { Task } from '@/features/tasks/task.types';

export type WeekAllocation = { operationId: string; days: { date: string; revision: number; snapshot: string; ids: string[] }[] };
export type TaskMemberships = { days: { date: string; ids: string[] }[] };
export const saveWeekAllocation = (userId: string, weekStart: string, command: WeekAllocation) =>
  apiRequest<{ days: FlowPlan[]; tasks: Task[] }>(`/week-plans/${weekStart}/allocation`, {
    auth: 'required', expectedUserId: userId, method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(command),
  });
export const getTaskMemberships = (userId: string, date: string, signal?: AbortSignal) =>
  apiRequest<TaskMemberships>(`/task-plan-memberships/${date}`, { auth: 'required', expectedUserId: userId, signal });
