import type { SupabaseClient } from '@supabase/supabase-js';

export const commitmentLifeAreas = [
  'work',
  'family',
  'home',
  'health',
  'personal',
  'projects',
] as const;

export type CommitmentLifeArea = typeof commitmentLifeAreas[number];

export type CommitmentRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  life_area: CommitmentLifeArea | null;
  created_at: string;
  updated_at: string;
};

export type Commitment = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  lifeArea: CommitmentLifeArea | null;
  createdAt: string;
  updatedAt: string;
};

export type CommitmentListFilters = {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type CreateCommitmentInput = {
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  lifeArea: CommitmentLifeArea | null;
};

export type UpdateCommitmentInput = Partial<CreateCommitmentInput>;

export type CommitmentServiceContract = {
  list(filters: CommitmentListFilters): Promise<Commitment[]>;
  create(input: CreateCommitmentInput): Promise<Commitment>;
  update(id: string, input: UpdateCommitmentInput): Promise<Commitment>;
  delete(id: string): Promise<Commitment>;
};

export type CommitmentServiceFactory = (
  client: SupabaseClient,
  userId: string,
) => CommitmentServiceContract;
