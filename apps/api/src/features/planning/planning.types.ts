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
  getWeeklyPlan(weekStart: string): Promise<WeeklyPlanningState>;
  saveWeeklyPlan(weekStart: string, input: WeeklyPlanningInput): Promise<WeeklyPlanningState>;
  getDailyPlan(date: string): Promise<DailyPlan | null>;
  putDailyPlan(date: string, input: DailyPlanInput): Promise<DailyPlan | null>;
  getWeeklyFocuses(weekStart: string): Promise<WeeklyFocus[]>;
  replaceWeeklyFocuses(weekStart: string, titles: string[]): Promise<WeeklyFocus[]>;
};

export type PlanningServiceFactory = (
  client: SupabaseClient,
  userId: string,
) => PlanningServiceContract;

export type WeeklyPlan = {
  id: string;
  weekStart: string;
  status: 'not_started' | 'in_progress' | 'completed';
  resumeStep: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyPlanningState = { weekPlan: WeeklyPlan | null; focuses: WeeklyFocus[] };
export type WeeklyPlanningInput =
  | { action: 'start' | 'complete' }
  | { action: 'save'; step: number; advance: boolean; titles?: string[] };

export type WeeklyPlanRow = {
  id: string; week_start: string; planning_status: WeeklyPlan['status'];
  planning_step: number; planning_completed_at: string | null;
  created_at: string; updated_at: string; weekly_focuses?: WeeklyFocusRow[];
};
