import { apiRequest } from '@/lib/api/client';

import type {
  Commitment,
  CommitmentListFilters,
  CreateCommitmentInput,
  UpdateCommitmentInput,
} from './commitment.types';

async function commitmentRequest<T>(path: string, options: RequestInit = {}, expectedUserId?: string) {
  return apiRequest<T>(path, { ...options, auth: 'required', ...(expectedUserId ? { expectedUserId } : {}) });
}

function queryString(filters: CommitmentListFilters) {
  const parameters = new URLSearchParams();
  if (filters.id) parameters.set('id', filters.id);
  if (filters.reminders) parameters.set('reminders', 'true');
  if (filters.date) parameters.set('date', filters.date);
  if (filters.dateFrom) parameters.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) parameters.set('dateTo', filters.dateTo);
  const query = parameters.toString();
  return query ? `?${query}` : '';
}

export async function listCommitments(filters: CommitmentListFilters = {}, expectedUserId?: string) {
  const response = await commitmentRequest<{ commitments: Commitment[] }>(
    `/commitments${queryString(filters)}`, {}, expectedUserId,
  );
  return response.commitments;
}

export async function createCommitment(input: CreateCommitmentInput, expectedUserId?: string) {
  const response = await commitmentRequest<{ commitment: Commitment }>('/commitments', {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  }, expectedUserId);
  return response.commitment;
}

export async function updateCommitment({ id, input }: { id: string; input: UpdateCommitmentInput }, expectedUserId?: string) {
  const response = await commitmentRequest<{ commitment: Commitment }>(
    `/commitments/${encodeURIComponent(id)}`,
    {
      body: JSON.stringify(input),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    }, expectedUserId,
  );
  return response.commitment;
}

export async function deleteCommitment(id: string, expectedUserId?: string) {
  const response = await commitmentRequest<{ commitment: Commitment }>(
    `/commitments/${encodeURIComponent(id)}`,
    { method: 'DELETE' }, expectedUserId,
  );
  return response.commitment;
}
