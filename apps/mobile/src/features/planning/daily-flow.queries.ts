import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { getDailyFlow, getWeekDays, saveDailyFlow, type DailyFlow, type FlowCommand } from './daily-flow.api';

export function useDailyFlow(date: string, enabled = true) {
  const userId = useTaskQueryScope(); const client = useQueryClient();
  const scope = useRef<string | null>(userId);
  useEffect(() => { scope.current = userId; return () => { scope.current = null; }; }, [userId]);
  const key = ['daily-flow', userId, date];
  const query = useQuery({ queryKey: key, enabled, queryFn: ({ signal }) => getDailyFlow(userId, date, signal), staleTime: 0, refetchOnMount: 'always' });
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', state => { if (state === 'active') void client.invalidateQueries({ queryKey: ['daily-flow', userId] }); });
    return () => sub.remove();
  }, [client, enabled, userId]);
  const save = async (input: FlowCommand) => {
    const result = await saveDailyFlow(userId, date, input);
    if (scope.current !== userId) return result;
    await client.cancelQueries({ queryKey: key, exact: true });
    if (scope.current !== userId) return result;
    client.setQueryData<DailyFlow>(key, current => (current?.plan?.revision ?? 0) > (result.plan?.revision ?? 0) ? current : result);
    void client.invalidateQueries({ queryKey: ['week-days', userId] });
    void client.invalidateQueries({ queryKey: ['daily-planning', userId] });
    return result;
  };
  return { query, save, userId };
}
export function useWeekDays(weekStart: string, enabled = true) {
  const userId = useTaskQueryScope();
  return useQuery({ queryKey: ['week-days', userId, weekStart], enabled,
    queryFn: ({ signal }) => getWeekDays(userId, weekStart, signal), staleTime: 0, refetchOnMount: 'always' });
}
