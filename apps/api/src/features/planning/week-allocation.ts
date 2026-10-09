import type { SupabaseClient } from '@supabase/supabase-js';
import { parseTaskId } from '../tasks/task.validation.js';
import { DailyFlowService } from './daily-flow.js';
import { parsePlanningDate, PlanningApiError } from './planning.validation.js';

export type WeekAllocation = { operationId: string; days: { date: string; revision: number; snapshot: string; ids: string[] }[] };
export function parseWeekAllocation(value: unknown): WeekAllocation {
  const invalid = (): never => { throw new PlanningApiError(400, 'Invalid weekly allocation'); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some(key => !['operationId', 'days'].includes(key))
    || typeof body.operationId !== 'string' || !Array.isArray(body.days) || !body.days.length || body.days.length > 7) return invalid();
  try {
    parseTaskId(body.operationId);
    const days = body.days.map((item: unknown) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return invalid();
      const day = item as Record<string, unknown>;
      if (Object.keys(day).some(key => !['date', 'revision', 'snapshot', 'ids'].includes(key))
        || typeof day.date !== 'string' || !Number.isSafeInteger(day.revision) || Number(day.revision) < 0 || Number(day.revision) > 2147483646
        || typeof day.snapshot !== 'string' || !/^[a-f0-9]{32}$/.test(day.snapshot)
        || !Array.isArray(day.ids) || day.ids.length > 500 || new Set(day.ids).size !== day.ids.length) return invalid();
      const ids = day.ids.map(id => typeof id === 'string' ? parseTaskId(id) : invalid());
      return { date: parsePlanningDate(day.date, 'date'), revision: Number(day.revision), snapshot: day.snapshot, ids };
    });
    if (new Set(days.map(day => day.date)).size !== days.length) return invalid();
    return { operationId: body.operationId, days };
  } catch { return invalid(); }
}
export async function saveWeekAllocation(client: SupabaseClient, weekStart: string, command: WeekAllocation) {
  const { error } = await client.rpc('save_week_allocation', { p_week_start: weekStart, p_command: command });
  if (error) {
    if (['55000', '40001', '40P01', '23505'].includes(error.code)) throw new PlanningApiError(409, 'Allocation changed; review again');
    if (['22023', '22P02', '23514', '23503', '22007', '22008'].includes(error.code)) throw new PlanningApiError(400, 'Invalid allocation');
    throw new PlanningApiError(500, 'Weekly allocation failed');
  }
  return new DailyFlowService(client).week(weekStart);
}
export async function taskPlanMemberships(client: SupabaseClient, date: string) {
  const days: { date: string; selected_task_ids: string[] }[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('daily_plans').select('date,selected_task_ids')
      .eq('planning_status', 'completed').gte('date', date).order('date').range(offset, offset + 499);
    if (error) throw new PlanningApiError(500, 'Task memberships unavailable');
    days.push(...(data ?? []));
    if (!data || data.length < 500) return { days: days.map(day => ({ date: day.date, ids: day.selected_task_ids })) };
  }
}
