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

export type WeeklyFocus = {
  id: string;
  weekPlanId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

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
