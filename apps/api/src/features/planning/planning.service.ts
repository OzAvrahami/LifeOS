import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import type {
  DailyPlan,
  DailyPlanInput,
  DailyPlanRow,
  PlanningServiceContract,
  WeeklyFocus,
  WeeklyFocusRow,
  WeeklyPlanRow,
  WeeklyPlan,
  WeeklyPlanningInput,
} from './planning.types.js';
import { PlanningApiError } from './planning.validation.js';

function mapDailyPlan(row: DailyPlanRow): DailyPlan {
  return {
    availableMinutes: row.available_minutes,
    createdAt: row.created_at,
    date: row.date,
    focusTaskId: row.focus_task_id,
    id: row.id,
    updatedAt: row.updated_at,
  };
}

function mapWeeklyFocus(row: WeeklyFocusRow): WeeklyFocus {
  return {
    createdAt: row.created_at,
    id: row.id,
    position: row.position,
    title: row.title,
    updatedAt: row.updated_at,
    weekPlanId: row.week_plan_id,
  };
}

function dataError(error: PostgrestError, weeklyLifecycle = false): never {
  if (weeklyLifecycle && ['42703', '42883', 'PGRST202', 'PGRST204'].includes(error.code)) throw new PlanningApiError(503, 'Weekly planning requires a database update');
  if (error.code === '55000') throw new PlanningApiError(409, 'Complete preceding planning steps first');
  if (error.code === '22023') throw new PlanningApiError(400, 'Invalid weekly planning input');
  if (error.code === '23505') throw new PlanningApiError(409, 'Planning state conflict');
  if (['22P02', '23503', '23514', '42501', 'P0001'].includes(error.code)) {
    throw new PlanningApiError(400, 'Invalid planning input');
  }
  throw new PlanningApiError(500, 'Planning operation failed');
}

export class SupabasePlanningService implements PlanningServiceContract {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async getWeeklyPlan(weekStart: string) {
    const { data, error } = await this.client.from('week_plans')
      .select('id,week_start,planning_status,planning_step,planning_completed_at,created_at,updated_at,weekly_focuses(*)')
      .eq('user_id', this.userId).eq('week_start', weekStart).maybeSingle();
    if (error) dataError(error, true);
    const row = data as WeeklyPlanRow | null;
    return { weekPlan: row ? mapWeeklyPlan(row) : null,
      focuses: (row?.weekly_focuses ?? []).map(mapWeeklyFocus).sort((a, b) => a.position - b.position) };
  }

  async saveWeeklyPlan(weekStart: string, input: WeeklyPlanningInput) {
    const { data, error } = await this.client.rpc('save_weekly_planning', {
      p_week_start: weekStart, p_action: input.action,
      p_step: input.action === 'save' ? input.step : null,
      p_advance: input.action === 'save' ? input.advance : false,
      p_titles: input.action === 'save' ? input.titles ?? null : null,
    });
    if (error) dataError(error, true);
    const result = data as { week_plan: WeeklyPlanRow; focuses: WeeklyFocusRow[] };
    return { weekPlan: mapWeeklyPlan(result.week_plan), focuses: result.focuses.map(mapWeeklyFocus) };
  }

  async getDailyPlan(date: string) {
    const { data, error } = await this.client
      .from('daily_plans')
      .select('*')
      .eq('user_id', this.userId)
      .eq('date', date)
      .maybeSingle();
    if (error) dataError(error);
    return data ? mapDailyPlan(data as DailyPlanRow) : null;
  }

  async putDailyPlan(date: string, input: DailyPlanInput) {
    if (input.focusTaskId) {
      const { data: task, error: taskError } = await this.client
        .from('tasks')
        .select('id')
        .eq('id', input.focusTaskId)
        .eq('user_id', this.userId)
        .eq('planned_date', date)
        .in('status', ['open', 'in_progress'])
        .maybeSingle();
      if (taskError) dataError(taskError);
      if (!task) throw new PlanningApiError(400, 'Focus Task must be active and planned for this day');
    }

    if (input.focusTaskId === null && input.availableMinutes === null) {
      const { error } = await this.client
        .from('daily_plans')
        .delete()
        .eq('user_id', this.userId)
        .eq('date', date);
      if (error) dataError(error);
      return null;
    }

    const { data, error } = await this.client
      .from('daily_plans')
      .upsert(
        {
          available_minutes: input.availableMinutes,
          date,
          focus_task_id: input.focusTaskId,
          user_id: this.userId,
        },
        { onConflict: 'user_id,date' },
      )
      .select('*')
      .single();
    if (error) dataError(error);
    return mapDailyPlan(data as DailyPlanRow);
  }

  async getWeeklyFocuses(weekStart: string) {
    const { data, error } = await this.client
      .from('weekly_focuses')
      .select('*, week_plans!inner(week_start)')
      .eq('week_plans.week_start', weekStart)
      .order('position');
    if (error) dataError(error);
    return ((data ?? []) as WeeklyFocusRow[]).map(mapWeeklyFocus);
  }

  async replaceWeeklyFocuses(weekStart: string, titles: string[]) {
    const { data, error } = await this.client.rpc('replace_weekly_focuses', {
      p_titles: titles,
      p_week_start: weekStart,
    });
    if (error) dataError(error);
    return ((data ?? []) as WeeklyFocusRow[]).map(mapWeeklyFocus);
  }
}

export function createPlanningService(client: SupabaseClient, userId: string) {
  return new SupabasePlanningService(client, userId);
}

function mapWeeklyPlan(row: WeeklyPlanRow): WeeklyPlan {
  return { id: row.id, weekStart: row.week_start, status: row.planning_status,
    resumeStep: row.planning_step, completedAt: row.planning_completed_at,
    createdAt: row.created_at, updatedAt: row.updated_at };
}
