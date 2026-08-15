import type { SupabaseClient } from '@supabase/supabase-js';

export type DailyPlanRow = {
  id: string;
  user_id: string;
  date: string;
  focus_task_id: string | null;
  available_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type DailyPlan = {
  id: string;
  date: string;
  focusTaskId: string | null;
  availableMinutes: number | null;
  createdAt: string;
  updatedAt: string;
};

export type DailyPlanInput = {
  focusTaskId: string | null;
  availableMinutes: number | null;
};

export type WeeklyFocusRow = {
  id: string;
  week_plan_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type WeeklyFocus = {
  id: string;
  weekPlanId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type PlanningServiceContract = {
  getDailyPlan(date: string): Promise<DailyPlan | null>;
  putDailyPlan(date: string, input: DailyPlanInput): Promise<DailyPlan | null>;
  getWeeklyFocuses(weekStart: string): Promise<WeeklyFocus[]>;
  replaceWeeklyFocuses(weekStart: string, titles: string[]): Promise<WeeklyFocus[]>;
};

export type PlanningServiceFactory = (
  client: SupabaseClient,
  userId: string,
) => PlanningServiceContract;
