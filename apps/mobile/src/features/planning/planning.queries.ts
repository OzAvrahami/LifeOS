import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTaskQueryScope } from '@/features/tasks/task-query-scope';

import {
  getWeeklyPlan,
  saveWeeklyPlan,
  getDailyPlan,
  getWeeklyFocuses,
  putDailyPlan,
  replaceWeeklyFocuses,
} from './planning.api';
import type { DailyPlan, WeeklyFocus, WeeklyPlanningState } from './planning.types';

export const PLANNING_STALE_TIME_MS = 30_000;

export const planningKeys = {
  all: ['planning'] as const,
  weeklyPlan: (userId: string, weekStart: string) =>
    [...planningKeys.all, userId, 'weekly-plan', weekStart] as const,
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
      void queryClient.invalidateQueries({ queryKey: planningKeys.weeklyPlan(userId, variables.weekStart), exact: true });
      queryClient.setQueryData<WeeklyFocus[]>(
        planningKeys.weeklyFocuses(userId, variables.weekStart),
        focuses,
      );
    },
  });
}

export function useWeeklyPlan(weekStart: string, enabled = true) {
  const userId = useTaskQueryScope();
  return useQuery({
    enabled, queryKey: planningKeys.weeklyPlan(userId, weekStart),
    queryFn: () => getWeeklyPlan(weekStart),
    staleTime: PLANNING_STALE_TIME_MS, refetchOnWindowFocus: false,
  });
}

export function useSaveWeeklyPlan() {
  const userId = useTaskQueryScope();
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveWeeklyPlan,
    onSuccess: async (state, { weekStart }) => {
      const planKey = planningKeys.weeklyPlan(userId, weekStart);
      const focusKey = planningKeys.weeklyFocuses(userId, weekStart);
      await Promise.all([client.cancelQueries({ queryKey: planKey, exact: true }), client.cancelQueries({ queryKey: focusKey, exact: true })]);
      client.setQueryData<WeeklyPlanningState>(planKey, state);
      client.setQueryData<WeeklyFocus[]>(focusKey, state.focuses);
    },
    // A response can be lost after the server commits. Re-read on either outcome;
    // never infer success locally, or invalidate a different user's/week's plan.
    onSettled: (_data, _error, { weekStart }) => client.invalidateQueries({
      queryKey: planningKeys.weeklyPlan(userId, weekStart), exact: true,
    }),
  });
}
