export type WeekDemoState = 'normal' | 'unplanned' | 'overloaded' | 'planning';

export type WeekWorkload = 'פנוי' | 'מאוזן' | 'עמוס' | 'עמוס מדי';

export type WeekDay = {
  id: string;
  weekday: string;
  date: number;
  taskCount: number;
  plannedTime: string;
  workload: WeekWorkload;
  commitmentTime?: string;
  isPast?: boolean;
  isToday?: boolean;
};

export type WeeklyFocus = { id: string; title: string };

export type UnscheduledWeekTask = { id: string; title: string; durationMinutes: number };

export type WeekCommitment = { id: string; weekday: string; title: string; time: string };

const demoStates: readonly WeekDemoState[] = ['normal', 'unplanned', 'overloaded', 'planning'];

export function isWeekDemoState(value: string | undefined): value is WeekDemoState {
  return demoStates.some((state) => state === value);
}
