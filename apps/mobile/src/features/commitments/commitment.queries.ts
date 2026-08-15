import { QueryClient, QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTaskQueryScope } from '@/features/tasks/task-query-scope';

import {
  createCommitment,
  deleteCommitment,
  listCommitments,
  updateCommitment,
} from './commitment.api';
import type { Commitment, CommitmentListFilters } from './commitment.types';

export const COMMITMENT_STALE_TIME_MS = 30_000;

function normalizedFilters(filters: CommitmentListFilters) {
  return {
    date: filters.date ?? null,
    dateFrom: filters.dateFrom ?? null,
    dateTo: filters.dateTo ?? null,
  };
}

type NormalizedCommitmentFilters = ReturnType<typeof normalizedFilters>;

export const commitmentKeys = {
  all: ['commitments'] as const,
  user: (userId: string) => [...commitmentKeys.all, userId] as const,
  list: (userId: string, filters: CommitmentListFilters) =>
    [...commitmentKeys.user(userId), 'list', normalizedFilters(filters)] as const,
};

export function useCommitments(filters: CommitmentListFilters, enabled = true) {
  const userId = useTaskQueryScope();
  return useQuery({
    enabled,
    queryFn: () => listCommitments(filters),
    queryKey: commitmentKeys.list(userId, filters),
    refetchOnWindowFocus: false,
    staleTime: COMMITMENT_STALE_TIME_MS,
  });
}

function filtersFromKey(queryKey: QueryKey, userId: string) {
  if (
    queryKey[0] !== 'commitments'
    || queryKey[1] !== userId
    || queryKey[2] !== 'list'
    || typeof queryKey[3] !== 'object'
    || queryKey[3] === null
  ) return null;
  return queryKey[3] as NormalizedCommitmentFilters;
}

function belongs(commitment: Commitment, filters: NormalizedCommitmentFilters) {
  if (filters.date && commitment.date !== filters.date) return false;
  if (filters.dateFrom && commitment.date < filters.dateFrom) return false;
  if (filters.dateTo && commitment.date > filters.dateTo) return false;
  return true;
}

function ordered(items: Commitment[]) {
  return [...items].sort((left, right) => left.date.localeCompare(right.date)
    || left.startTime.localeCompare(right.startTime)
    || left.createdAt.localeCompare(right.createdAt));
}

function upsert(items: Commitment[], commitment: Commitment) {
  return ordered([...items.filter((item) => item.id !== commitment.id), commitment]);
}

export function synchronizeCommitmentCaches(
  queryClient: QueryClient,
  userId: string,
  commitment: Commitment,
  action: 'upsert' | 'delete',
) {
  const queries = queryClient.getQueryCache().findAll({ queryKey: commitmentKeys.user(userId) });
  for (const query of queries) {
    const filters = filtersFromKey(query.queryKey, userId);
    const current = query.state.data;
    if (!filters || !Array.isArray(current)) continue;
    const items = current as Commitment[];
    const next = action === 'upsert' && belongs(commitment, filters)
      ? upsert(items, commitment)
      : items.filter((item) => item.id !== commitment.id);
    queryClient.setQueryData(query.queryKey, next);
  }
}

export function useCreateCommitment() {
  const queryClient = useQueryClient();
  const userId = useTaskQueryScope();
  return useMutation({
    mutationFn: createCommitment,
    onSuccess: (commitment) => synchronizeCommitmentCaches(
      queryClient,
      userId,
      commitment,
      'upsert',
    ),
  });
}

export function useUpdateCommitment() {
  const queryClient = useQueryClient();
  const userId = useTaskQueryScope();
  return useMutation({
    mutationFn: updateCommitment,
    onSuccess: (commitment) => synchronizeCommitmentCaches(
      queryClient,
      userId,
      commitment,
      'upsert',
    ),
  });
}

export function useDeleteCommitment() {
  const queryClient = useQueryClient();
  const userId = useTaskQueryScope();
  return useMutation({
    mutationFn: deleteCommitment,
    onSuccess: (commitment) => synchronizeCommitmentCaches(
      queryClient,
      userId,
      commitment,
      'delete',
    ),
  });
}
