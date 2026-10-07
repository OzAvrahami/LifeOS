import { apiRequest } from '@/lib/api/client';
import type { Task } from '@/features/tasks/task.types';

export type DailyPlanningPlan = {
  id: string; date: string; status: 'not_started' | 'in_progress' | 'completed';
  resumeStep: number; completedAt: string | null; revision: number; selectedTaskIds: string[];
};
export type DailyPlanningInput = {
  action: 'start' | 'save' | 'complete' | 'edit'; revision: number; operationId: string;
  step?: number; selectedTaskIds?: string[];
};
export async function getDailyPlanning(userId: string, date: string, signal?: AbortSignal) {
  return (await apiRequest<{ plan: DailyPlanningPlan | null }>(`/daily-plans/${date}/planning`,
    { auth: 'required', expectedUserId: userId, signal })).plan;
}
export async function saveDailyPlanning(userId: string, date: string, input: DailyPlanningInput) {
  return (await apiRequest<{ plan: DailyPlanningPlan }>(`/daily-plans/${date}/planning`, {
    auth: 'required', expectedUserId: userId, method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  })).plan;
}
export async function getDailyPlanningTasks(userId: string, date: string, signal?: AbortSignal) {
  return (await apiRequest<{ tasks: (Task & { previouslySelected?: boolean })[] }>(`/daily-plans/${date}/tasks`,
    { auth: 'required', expectedUserId: userId, signal })).tasks;
}
