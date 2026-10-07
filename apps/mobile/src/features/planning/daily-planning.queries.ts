import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { getDailyPlanning, getDailyPlanningTasks, saveDailyPlanning, type DailyPlanningInput, type DailyPlanningPlan } from './daily-planning.api';

export const dailyPlanningKeys = {
  user: (userId: string) => ['daily-planning', userId] as const,
  plan: (userId: string, date: string) => ['daily-planning', userId, date, 'plan'] as const,
  tasks: (userId: string, date: string) => ['daily-planning', userId, date, 'tasks'] as const,
};
export function useDailyPlanning(date: string, enabled = true) {
  const userId = useTaskQueryScope();
  const client = useQueryClient();
  const scope = useRef(userId);
  useEffect(() => { scope.current = userId; }, [userId]);
  const key = dailyPlanningKeys.plan(userId, date);
  const query = useQuery({ queryKey: key, enabled, queryFn: ({ signal }) => getDailyPlanning(userId, date, signal),
    staleTime: 0, refetchOnMount: 'always' });
  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void client.invalidateQueries({ queryKey: dailyPlanningKeys.user(userId) });
    });
    return () => subscription.remove();
  }, [client, enabled, userId]);
  const save = async (input: DailyPlanningInput) => {
    const plan = await saveDailyPlanning(userId, date, input);
    if (scope.current !== userId) return plan;
    await client.cancelQueries({ queryKey: key, exact: true });
    client.setQueryData<DailyPlanningPlan | null>(key, current =>
      current && current.revision > plan.revision ? current : plan);
    void client.invalidateQueries({ queryKey: dailyPlanningKeys.tasks(userId, date) });
    return plan;
  };
  return { query, save, userId };
}
export function useDailyPlanningTasks(date: string, enabled = true) {
  const userId = useTaskQueryScope();
  return useQuery({ queryKey: dailyPlanningKeys.tasks(userId, date), enabled,
    queryFn: ({ signal }) => getDailyPlanningTasks(userId, date, signal), staleTime: 0,
    refetchOnMount: 'always' });
}
