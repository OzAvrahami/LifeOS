import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import type {
  DailyPlan,
  DailyPlanInput,
  DailyPlanRow,
  PlanningServiceContract,
  WeeklyFocus,
  WeeklyFocusRow,
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

function dataError(error: PostgrestError): never {
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
