import type { SupabaseClient } from '@supabase/supabase-js';
import { mapTask } from '../tasks/task.service.js';
import type { Task, TaskRow } from '../tasks/task.types.js';
import { parseTaskId } from '../tasks/task.validation.js';
import { PlanningApiError } from './planning.validation.js';

export type DailyPlanningInput = {
  action: 'start' | 'save' | 'complete' | 'edit'; revision: number; operationId: string;
  step?: number; selectedTaskIds?: string[];
};
export type DailyPlanningRow = {
  id: string; date: string; planning_status: 'not_started' | 'in_progress' | 'completed';
  planning_step: number; planning_completed_at: string | null; planning_revision: number;
  selected_task_ids: string[];
};
export function parseDailyPlanning(value: unknown): DailyPlanningInput {
  const invalid = (): never => { throw new PlanningApiError(400, 'Invalid daily planning input'); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const body = value as Record<string, unknown>;
  const save = body.action === 'save';
  const keys = new Set(['action', 'revision', 'operationId', ...(save ? ['step', 'selectedTaskIds'] : [])]);
  if (Object.keys(body).some(k => !keys.has(k)) || !['start', 'save', 'complete', 'edit'].includes(String(body.action))
    || !Number.isSafeInteger(body.revision) || (body.revision as number) < 0 || (body.revision as number) > 2147483646
    || typeof body.operationId !== 'string') return invalid();
  try {
    parseTaskId(body.operationId);
    if (save) {
      if (!Number.isInteger(body.step) || (body.step as number) < 1 || (body.step as number) > 3
        || !Array.isArray(body.selectedTaskIds) || body.selectedTaskIds.length > 500
        || new Set(body.selectedTaskIds).size !== body.selectedTaskIds.length) return invalid();
      body.selectedTaskIds.forEach(id => { if (typeof id !== 'string') invalid(); parseTaskId(id as string); });
    }
  } catch { return invalid(); }
  return body as DailyPlanningInput;
}
function dataError(error: { code?: string }): never {
  if (['42703', '42883', 'PGRST202', 'PGRST204'].includes(error.code ?? '')) throw new PlanningApiError(503, 'Daily planning requires a database update');
  if (error.code === '40001' || error.code === '55000') throw new PlanningApiError(409, 'Daily plan changed; reload before editing');
  if (['22023', '23514', '42501', '22P02'].includes(error.code ?? '')) throw new PlanningApiError(400, 'Invalid daily planning input');
  throw new PlanningApiError(500, 'Daily planning operation failed');
}
function mapPlan(row: DailyPlanningRow | null) {
  return row ? { id: row.id, date: row.date, status: row.planning_status, resumeStep: row.planning_step,
    completedAt: row.planning_completed_at, revision: row.planning_revision, selectedTaskIds: row.selected_task_ids } : null;
}
export class DailyPlanningService {
  constructor(private readonly client: SupabaseClient, private readonly userId: string) {}
  async get(date: string) {
    const { data, error } = await this.client.from('daily_plans')
      .select('id,date,planning_status,planning_step,planning_completed_at,planning_revision,selected_task_ids')
      .eq('user_id', this.userId).eq('date', date).maybeSingle();
    if (error) dataError(error);
    return mapPlan(data as DailyPlanningRow | null);
  }
  async save(date: string, input: DailyPlanningInput) {
    const { data, error } = await this.client.rpc('save_daily_planning', { p_date: date, p_action: input.action,
      p_revision: input.revision, p_operation_id: input.operationId, p_step: input.step ?? null,
      p_selected_task_ids: input.selectedTaskIds ?? null });
    if (error) dataError(error);
    return mapPlan(data as DailyPlanningRow);
  }
  async tasks(date: string) {
    const plan = await this.get(date);
    const ids = plan?.selectedTaskIds ?? [];
    const previous = await this.client.from('daily_plans').select('selected_task_ids')
      .eq('user_id', this.userId).lt('date', date).neq('planning_status', 'not_started')
      .order('date', { ascending: false }).limit(1).maybeSingle();
    if (previous.error) dataError(previous.error);
    const previousIds = new Set<string>(previous.data?.selected_task_ids ?? []);
    const tasks: (Task & { previouslySelected: boolean })[] = [];
    const mapCandidate = (row: TaskRow) => ({ ...mapTask(row), previouslySelected: previousIds.has(row.id) });
    // Complete, caller-scoped candidate snapshot, including selected inactive rows.
    // Page deterministically rather than silently accepting PostgREST's row cap.
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await this.client.from('tasks').select('*').eq('user_id', this.userId)
        .or(`status.in.(open,in_progress),planned_date.eq.${date}`)
        .order('id').range(offset, offset + 499);
      if (error) dataError(error);
      tasks.push(...((data ?? []) as TaskRow[]).map(mapCandidate));
      if (!data || data.length < 500) break;
    }
    const present = new Set(tasks.map(task => task.id));
    const missing = ids.filter(id => !present.has(id));
    // Bound URL size even for a large saved plan; preserve inactive selections.
    for (let offset = 0; offset < missing.length; offset += 100) {
      const { data, error } = await this.client.from('tasks').select('*').eq('user_id', this.userId)
        .in('id', missing.slice(offset, offset + 100));
      if (error) dataError(error);
      tasks.push(...((data ?? []) as TaskRow[]).map(mapCandidate));
    }
    return tasks;
  }
}
