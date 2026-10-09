import type { Task } from '@/features/tasks/task.types';
import { apiRequest } from '@/lib/api/client';

export type ProposalReason = { kind: 'planned' | 'due' | 'carry' | 'important' | 'backlog'; origin: string | null };
export type DailyProposal = { ids: string[]; reasons: Record<string, ProposalReason>; snapshot: string; rule: 'bounded-v1' };
export type FlowPlan = { id: string; date: string; approved: boolean; revision: number; ids: string[];
  proposal: DailyProposal | null; source: 'daily' | 'weekly' | 'legacy' | null; summary: { note: string; savedAt: string } | null };
export type DailyFlow = { plan: FlowPlan | null; tasks: Task[]; snapshot: string; today: string; timezone: string };
export type FlowCommand = { action: 'propose' | 'save-draft' | 'approve' | 'edit' | 'discard' | 'summarize';
  operationId: string; revision: number; snapshot?: string; ids?: string[]; source?: 'daily' | 'weekly'; note?: string };
export const getDailyFlow = (userId: string, date: string, signal?: AbortSignal) =>
  apiRequest<DailyFlow>(`/daily-plans/${date}/flow`, { auth: 'required', expectedUserId: userId, signal });
export const initializeDailyFlow = (userId: string, date: string, signal?: AbortSignal) =>
  apiRequest<DailyFlow>(`/daily-plans/${date}/initialize`, { method: 'POST', auth: 'required', expectedUserId: userId, signal });
export const saveDailyFlow = (userId: string, date: string, input: FlowCommand) =>
  apiRequest<DailyFlow>(`/daily-plans/${date}/flow`, { auth: 'required', expectedUserId: userId, method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
export const getWeekDays = (userId: string, weekStart: string, signal?: AbortSignal) =>
  apiRequest<{ days: FlowPlan[]; tasks: Task[] }>(`/week-plans/${weekStart}/days`, { auth: 'required', expectedUserId: userId, signal });

// The same selector supplies Today and Week. Never clone a task or mutate its date.
export function approvedDayTasks(plan: FlowPlan, tasks: Task[]) {
  const byId = new Map(tasks.map(task => [task.id, task]));
  return plan.ids.flatMap(id => {
    const task = byId.get(id);
    return task && task.status !== 'cancelled' ? [task] : [];
  });
}
export function proposalReasonText(reason?: ProposalReason) {
  if (!reason) return 'בחירה שלך';
  const reasons = { planned: 'שובצה לתאריך הזה', due: 'תאריך היעד הגיע', carry: 'נותרה פתוחה מתכנון קודם', important: 'סומנה כחשובה', backlog: 'משימה פתוחה, לפי סדר הרשימה' };
  return `${reasons[reason.kind]}${reason.origin ? ` · נשארה מ־${reason.origin}` : ''}`;
}
