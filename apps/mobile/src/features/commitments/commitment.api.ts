import { apiRequest } from '@/lib/api/client';

import type {
  Commitment,
  CommitmentListFilters,
  CreateCommitmentInput,
  UpdateCommitmentInput,
} from './commitment.types';

async function commitmentRequest<T>(path: string, options: RequestInit = {}) {
  return apiRequest<T>(path, { ...options, auth: 'required' });
}

function queryString(filters: CommitmentListFilters) {
  const parameters = new URLSearchParams();
  if (filters.date) parameters.set('date', filters.date);
  if (filters.dateFrom) parameters.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) parameters.set('dateTo', filters.dateTo);
  const query = parameters.toString();
  return query ? `?${query}` : '';
}

export async function listCommitments(filters: CommitmentListFilters = {}) {
  const response = await commitmentRequest<{ commitments: Commitment[] }>(
    `/commitments${queryString(filters)}`,
  );
  return response.commitments;
}

export async function createCommitment(input: CreateCommitmentInput) {
  const response = await commitmentRequest<{ commitment: Commitment }>('/commitments', {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return response.commitment;
}

export async function updateCommitment({ id, input }: { id: string; input: UpdateCommitmentInput }) {
  const response = await commitmentRequest<{ commitment: Commitment }>(
    `/commitments/${encodeURIComponent(id)}`,
    {
      body: JSON.stringify(input),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    },
  );
  return response.commitment;
}

export async function deleteCommitment(id: string) {
  const response = await commitmentRequest<{ commitment: Commitment }>(
    `/commitments/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
  return response.commitment;
}
