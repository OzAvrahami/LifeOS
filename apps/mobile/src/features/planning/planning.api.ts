import { apiRequest } from '@/lib/api/client';

import type { DailyPlan, DailyPlanInput, WeeklyFocus, WeeklyPlanningInput, WeeklyPlanningState } from './planning.types';

async function planningRequest<T>(path: string, options: RequestInit = {}, expectedUserId?: string) {
  return apiRequest<T>(path, { ...options, auth: 'required', ...(expectedUserId ? { expectedUserId } : {}) });
}

export async function getDailyPlan(date: string, expectedUserId?: string) {
  const response = await planningRequest<{ dailyPlan: DailyPlan | null }>(
    `/daily-plans/${encodeURIComponent(date)}`, {}, expectedUserId,
  );
  return response.dailyPlan;
}

export async function putDailyPlan({ date, input }: { date: string; input: DailyPlanInput }, expectedUserId?: string) {
  const response = await planningRequest<{ dailyPlan: DailyPlan | null }>(
    `/daily-plans/${encodeURIComponent(date)}`,
    {
      body: JSON.stringify(input),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    }, expectedUserId,
  );
  return response.dailyPlan;
}

export async function getWeeklyFocuses(weekStart: string, expectedUserId?: string) {
  const response = await planningRequest<{ focuses: WeeklyFocus[] }>(
    `/week-plans/${encodeURIComponent(weekStart)}/focuses`, {}, expectedUserId,
  );
  return response.focuses;
}

export async function replaceWeeklyFocuses({
  titles,
  weekStart,
}: {
  titles: string[];
  weekStart: string;
}, expectedUserId?: string) {
  const response = await planningRequest<{ focuses: WeeklyFocus[] }>(
    `/week-plans/${encodeURIComponent(weekStart)}/focuses`,
    {
      body: JSON.stringify({ titles }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    }, expectedUserId,
  );
  return response.focuses;
}

export function getWeeklyPlan(weekStart: string, expectedUserId?: string) {
  return planningRequest<WeeklyPlanningState>(`/week-plans/${encodeURIComponent(weekStart)}`, {}, expectedUserId);
}

export function saveWeeklyPlan({ weekStart, input }: { weekStart: string; input: WeeklyPlanningInput }, expectedUserId?: string) {
  return planningRequest<WeeklyPlanningState>(`/week-plans/${encodeURIComponent(weekStart)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }, expectedUserId);
}
