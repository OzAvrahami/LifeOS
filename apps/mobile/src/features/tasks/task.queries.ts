import { QueryClient, QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelTask, createTask, listTasks, updateTask } from './task.api';
import { useTaskQueryScope } from './task-query-scope';
import { Task, TaskListFilters, TaskPlanningInput } from './task.types';

export const TASK_STALE_TIME_MS = 30_000;

function normalizedFilters(filters: TaskListFilters) {
  return {
    placement: filters.placement ?? null,
    plannedDate: filters.plannedDate ?? null,
    status: filters.status ?? null,
    weekStart: filters.weekStart ?? null,
  };
}

export const taskKeys = {
  all: ['tasks'] as const,
  user: (userId: string) => [...taskKeys.all, userId] as const,
  list: (userId: string, filters: TaskListFilters) =>
    [...taskKeys.user(userId), 'list', normalizedFilters(filters)] as const,
};

export function useTasks(filters: TaskListFilters, enabled = true) {
  const userId = useTaskQueryScope();
  return useQuery({
    enabled,
    queryFn: () => listTasks(filters),
    queryKey: taskKeys.list(userId, filters),
    refetchOnWindowFocus: false,
    staleTime: TASK_STALE_TIME_MS,
  });
}

type NormalizedTaskFilters = ReturnType<typeof normalizedFilters>;

type TaskCacheSyncOptions = {
  activeHandoff?: boolean;
  ensurePlanning?: TaskPlanningInput;
};

function filtersFromTaskKey(queryKey: QueryKey, userId: string) {
  if (
    queryKey[0] !== 'tasks'
    || queryKey[1] !== userId
    || queryKey[2] !== 'list'
    || typeof queryKey[3] !== 'object'
    || queryKey[3] === null
  ) return null;
  return queryKey[3] as NormalizedTaskFilters;
}

function orderedTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) =>
    left.position - right.position || left.createdAt.localeCompare(right.createdAt));
}

function upsertTask(tasks: Task[], task: Task) {
  return orderedTasks([...tasks.filter((item) => item.id !== task.id), task]);
}

function taskBelongsInList(
  task: Task,
  filters: NormalizedTaskFilters,
  wasPresent: boolean,
  planning: TaskPlanningInput | undefined,
) {
  if (filters.status ? task.status !== filters.status : task.status === 'cancelled') return false;
  if (filters.placement === 'inbox') {
    return task.status === 'open' && task.plannedDate === null && task.weekPlanId === null;
  }
  if (filters.plannedDate) return task.plannedDate === filters.plannedDate;
  if (filters.weekStart) {
    if (planning?.type === 'week') return planning.weekStart === filters.weekStart;
    if (planning) return false;
    return wasPresent && task.weekPlanId !== null && task.plannedDate === null;
  }
  return true;
}

function ensurePlacementCache(
  queryClient: QueryClient,
  userId: string,
  task: Task,
  planning: TaskPlanningInput,
) {
  const filters: TaskListFilters = planning.type === 'inbox'
    ? { placement: 'inbox' }
    : planning.type === 'week'
      ? { weekStart: planning.weekStart }
      : { plannedDate: planning.plannedDate };
  const key = taskKeys.list(userId, filters);
  queryClient.setQueryData<Task[]>(key, (current = []) => upsertTask(current, task));
}

export function synchronizeTaskCaches(
  queryClient: QueryClient,
  userId: string,
  task: Task,
  { activeHandoff = false, ensurePlanning }: TaskCacheSyncOptions = {},
) {
  const queries = queryClient.getQueryCache().findAll({ queryKey: taskKeys.user(userId) });

  for (const query of queries) {
    const filters = filtersFromTaskKey(query.queryKey, userId);
    const current = query.state.data;
    if (!filters || !Array.isArray(current)) continue;

    let next = current as Task[];
    if (activeHandoff) {
      next = next.map((item) =>
        item.id !== task.id && item.status === 'in_progress'
          ? { ...item, completedAt: null, status: 'open' }
          : item);
    }

    const wasPresent = next.some((item) => item.id === task.id);
    next = taskBelongsInList(task, filters, wasPresent, ensurePlanning)
      ? upsertTask(next, task)
      : next.filter((item) => item.id !== task.id);
    queryClient.setQueryData(query.queryKey, next);
  }

  if (ensurePlanning && task.status !== 'cancelled') {
    ensurePlacementCache(queryClient, userId, task, ensurePlanning);
  }
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const userId = useTaskQueryScope();
  return useMutation({
    mutationFn: createTask,
    onSuccess: (task, input) => synchronizeTaskCaches(queryClient, userId, task, {
      ensurePlanning: input.planning ?? { type: 'inbox' },
    }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const userId = useTaskQueryScope();
  return useMutation({
    mutationFn: updateTask,
    onSuccess: (task, variables) => synchronizeTaskCaches(queryClient, userId, task, {
      activeHandoff: variables.input.status === 'in_progress',
      ensurePlanning: variables.input.planning,
    }),
  });
}

export function useCancelTask() {
  const queryClient = useQueryClient();
  const userId = useTaskQueryScope();
  return useMutation({
    mutationFn: cancelTask,
    onSuccess: (task) => synchronizeTaskCaches(queryClient, userId, task),
  });
}
