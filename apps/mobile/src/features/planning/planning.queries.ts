import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTaskQueryScope } from '@/features/tasks/task-query-scope';

import {
  getDailyPlan,
  getWeeklyFocuses,
  putDailyPlan,
  replaceWeeklyFocuses,
} from './planning.api';
import type { DailyPlan, WeeklyFocus } from './planning.types';

export const PLANNING_STALE_TIME_MS = 30_000;

export const planningKeys = {
  all: ['planning'] as const,
  dailyPlan: (userId: string, date: string) =>
    [...planningKeys.all, userId, 'daily-plan', date] as const,
  weeklyFocuses: (userId: string, weekStart: string) =>
    [...planningKeys.all, userId, 'weekly-focuses', weekStart] as const,
};

export function useDailyPlan(date: string, enabled = true) {
  const userId = useTaskQueryScope();
  return useQuery({
    enabled,
    queryFn: () => getDailyPlan(date),
    queryKey: planningKeys.dailyPlan(userId, date),
    refetchOnWindowFocus: false,
    staleTime: PLANNING_STALE_TIME_MS,
  });
}

export function usePutDailyPlan() {
  const queryClient = useQueryClient();
  const userId = useTaskQueryScope();
  return useMutation({
    mutationFn: putDailyPlan,
    onSuccess: (dailyPlan, variables) => {
      queryClient.setQueryData<DailyPlan | null>(
        planningKeys.dailyPlan(userId, variables.date),
        dailyPlan,
      );
    },
  });
}

export function useWeeklyFocuses(weekStart: string, enabled = true) {
  const userId = useTaskQueryScope();
  return useQuery({
    enabled,
    queryFn: () => getWeeklyFocuses(weekStart),
    queryKey: planningKeys.weeklyFocuses(userId, weekStart),
    refetchOnWindowFocus: false,
    staleTime: PLANNING_STALE_TIME_MS,
  });
}

export function useReplaceWeeklyFocuses() {
  const queryClient = useQueryClient();
  const userId = useTaskQueryScope();
  return useMutation({
    mutationFn: replaceWeeklyFocuses,
    onSuccess: (focuses, variables) => {
      queryClient.setQueryData<WeeklyFocus[]>(
        planningKeys.weeklyFocuses(userId, variables.weekStart),
        focuses,
      );
    },
  });
}
