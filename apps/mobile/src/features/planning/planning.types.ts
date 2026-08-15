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
