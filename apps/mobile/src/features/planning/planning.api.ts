import { apiRequest } from '@/lib/api/client';

import type { DailyPlan, DailyPlanInput, WeeklyFocus } from './planning.types';

async function planningRequest<T>(path: string, options: RequestInit = {}) {
  return apiRequest<T>(path, { ...options, auth: 'required' });
}

export async function getDailyPlan(date: string) {
  const response = await planningRequest<{ dailyPlan: DailyPlan | null }>(
    `/daily-plans/${encodeURIComponent(date)}`,
  );
  return response.dailyPlan;
}

export async function putDailyPlan({ date, input }: { date: string; input: DailyPlanInput }) {
  const response = await planningRequest<{ dailyPlan: DailyPlan | null }>(
    `/daily-plans/${encodeURIComponent(date)}`,
    {
      body: JSON.stringify(input),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    },
  );
  return response.dailyPlan;
}

export async function getWeeklyFocuses(weekStart: string) {
  const response = await planningRequest<{ focuses: WeeklyFocus[] }>(
    `/week-plans/${encodeURIComponent(weekStart)}/focuses`,
  );
  return response.focuses;
}

export async function replaceWeeklyFocuses({
  titles,
  weekStart,
}: {
  titles: string[];
  weekStart: string;
}) {
  const response = await planningRequest<{ focuses: WeeklyFocus[] }>(
    `/week-plans/${encodeURIComponent(weekStart)}/focuses`,
    {
      body: JSON.stringify({ titles }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    },
  );
  return response.focuses;
}
