import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabasePlanningService } from '../src/features/planning/planning.service.js';
import { PlanningApiError } from '../src/features/planning/planning.validation.js';

const row = { id: 'stable-plan', week_start: '2026-09-21', planning_status: 'in_progress', planning_step: 3,
  planning_completed_at: null, created_at: 'created', updated_at: 'updated' };
const focus = { id: 'focus', week_plan_id: row.id, title: 'Real focus', position: 0, created_at: 'created', updated_at: 'updated' };

describe('Weekly Planning Supabase adapter', () => {
  it('reads one explicit owner/week snapshot with lifecycle columns and ordered focuses', async () => {
    const filters: unknown[] = [];
    const chain = {
      select: (columns: string) => { assert.match(columns, /planning_status,planning_step,planning_completed_at/); return chain; },
      eq: (...args: unknown[]) => { filters.push(args); return chain; },
      maybeSingle: async () => ({ data: { ...row, weekly_focuses: [{ ...focus, id: 'later', position: 1 }, focus] }, error: null }),
    };
    const client = { from: (table: string) => { assert.equal(table, 'week_plans'); return chain; } } as unknown as SupabaseClient;
    const result = await new SupabasePlanningService(client, 'owner').getWeeklyPlan('2026-09-21');
    assert.deepEqual(filters, [['user_id','owner'], ['week_start','2026-09-21']]);
    assert.equal(result.weekPlan?.resumeStep, 3);
    assert.deepEqual(result.focuses.map(f => f.id), ['focus','later']);
  });

  it('sends focus/progress in one RPC and maps its authoritative owner snapshot', async () => {
    const client = { rpc: async (name: string, args: unknown) => {
      assert.equal(name, 'save_weekly_planning');
      assert.deepEqual(args, { p_week_start: '2026-09-21', p_action: 'save', p_step: 3, p_advance: true, p_titles: ['Real focus'] });
      return { data: { week_plan: { ...row, planning_step: 4 }, focuses: [focus] }, error: null };
    } } as unknown as SupabaseClient;
    const result = await new SupabasePlanningService(client, 'owner').saveWeeklyPlan('2026-09-21', { action: 'save', step: 3, advance: true, titles: ['Real focus'] });
    assert.equal(result.weekPlan.id, row.id); assert.equal(result.weekPlan.resumeStep, 4);
    assert.equal(result.focuses[0]?.weekPlanId, row.id);
  });

  for (const [code, status] of [['55000',409], ['22023',400], ['P0001',400], ['23514',400], ['PGRST202',503], ['42703',503], ['XX000',500]] as const) {
    it(`reports database error ${code} as ${status} without leaking provider details`, async () => {
      const client = { rpc: async () => ({ data: null, error: { code, message: 'private provider details' } }) } as unknown as SupabaseClient;
      await assert.rejects(new SupabasePlanningService(client, 'owner').saveWeeklyPlan('2026-09-21', { action: 'start' }), (error: unknown) => {
        assert.ok(error instanceof PlanningApiError); assert.equal(error.statusCode, status);
        assert.doesNotMatch(error.responseMessage, /private provider/); return true;
      });
    });
  }
});
