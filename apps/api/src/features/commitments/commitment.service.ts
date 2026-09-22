import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import type {
  Commitment,
  CommitmentListFilters,
  CommitmentRow,
  CommitmentServiceContract,
  CreateCommitmentInput,
  UpdateCommitmentInput,
} from './commitment.types.js';
import { CommitmentApiError, validateCommitmentTimeRange } from './commitment.validation.js';

function normalizedTime(value: string) {
  return value.slice(0, 5);
}

function mapCommitment(row: CommitmentRow): Commitment {
  return {
    reminderMinutesBefore: row.reminder_minutes_before ?? null,
    createdAt: row.created_at,
    date: row.date,
    description: row.description,
    endTime: row.end_time ? normalizedTime(row.end_time) : null,
    id: row.id,
    lifeArea: row.life_area,
    startTime: normalizedTime(row.start_time),
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function dataError(error: PostgrestError): never {
  if (['22P02', '23503', '23514', '42501'].includes(error.code)) {
    throw new CommitmentApiError(400, 'Invalid Commitment input');
  }
  throw new CommitmentApiError(500, 'Commitment operation failed');
}

function databaseValues(input: UpdateCommitmentInput) {
  return {
    ...('reminderMinutesBefore' in input ? { reminder_minutes_before: input.reminderMinutesBefore } : {}),
    ...('date' in input ? { date: input.date } : {}),
    ...('description' in input ? { description: input.description } : {}),
    ...('endTime' in input ? { end_time: input.endTime } : {}),
    ...('lifeArea' in input ? { life_area: input.lifeArea } : {}),
    ...('startTime' in input ? { start_time: input.startTime } : {}),
    ...('title' in input ? { title: input.title } : {}),
  };
}

export class SupabaseCommitmentService implements CommitmentServiceContract {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async list(filters: CommitmentListFilters) {
    const rows: CommitmentRow[] = [];
    // Explicit ranges avoid the PostgREST 1,000-row cap. Stable ID tie-breaker
    // prevents equal date/time records from changing page membership.
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      let query = this.client.from('commitments').select('*').eq('user_id', this.userId);
      if (filters.id) query = query.eq('id', filters.id);
      if (filters.reminders) query = query.not('reminder_minutes_before', 'is', null);
      if (filters.date) query = query.eq('date', filters.date);
      if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('date', filters.dateTo);
      const { data, error } = await query.order('date').order('start_time').order('id').range(offset, offset + pageSize - 1);
      if (error) dataError(error);
      const page = (data ?? []) as CommitmentRow[];
      rows.push(...page);
      if (page.length < pageSize) return rows.map(mapCommitment);
    }
  }

  async create(input: CreateCommitmentInput) {
    const { data, error } = await this.client
      .from('commitments')
      .insert({ ...databaseValues(input), user_id: this.userId })
      .select('*')
      .single();
    if (error) dataError(error);
    return mapCommitment(data as CommitmentRow);
  }

  async update(id: string, input: UpdateCommitmentInput) {
    const { data: existing, error: findError } = await this.client
      .from('commitments')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .maybeSingle();
    if (findError) dataError(findError);
    if (!existing) throw new CommitmentApiError(404, 'Commitment not found');
    const current = existing as CommitmentRow;
    validateCommitmentTimeRange(
      input.startTime ?? normalizedTime(current.start_time),
      input.endTime === undefined
        ? current.end_time ? normalizedTime(current.end_time) : null
        : input.endTime,
    );

    const { data, error } = await this.client
      .from('commitments')
      .update(databaseValues(input))
      .eq('id', id)
      .eq('user_id', this.userId)
      .select('*')
      .maybeSingle();
    if (error) dataError(error);
    if (!data) throw new CommitmentApiError(404, 'Commitment not found');
    return mapCommitment(data as CommitmentRow);
  }

  async delete(id: string) {
    const { data, error } = await this.client
      .from('commitments')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId)
      .select('*')
      .maybeSingle();
    if (error) dataError(error);
    if (!data) throw new CommitmentApiError(404, 'Commitment not found');
    return mapCommitment(data as CommitmentRow);
  }
}

export function createCommitmentService(client: SupabaseClient, userId: string) {
  return new SupabaseCommitmentService(client, userId);
}
