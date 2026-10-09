import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createApp } from '../src/app.js';
import { createPlanningRouter } from '../src/features/planning/planning.routes.js';
import { DailyPlanningService, parseDailyPlanning } from '../src/features/planning/daily-planning.js';
import { PlanningApiError } from '../src/features/planning/planning.validation.js';
import { createRequireAuth } from '../src/middleware/auth.middleware.js';

const operationId = '99999999-9999-4999-8999-999999999999';
const taskId = '11111111-1111-4111-8111-111111111111';
describe('Daily Planning HTTP boundary', () => {
  const calls: unknown[] = [];
  const auth = createRequireAuth({ verifyToken: async token => token === 'valid' ? { id: 'caller' } as User : null,
    createUserClient: () => ({}) as SupabaseClient });
  const app = createApp({ planning: createPlanningRouter(auth, undefined, (_client, userId) => ({
    get: async date => { calls.push({ userId, date }); return null; },
    tasks: async date => { calls.push({ userId, date }); return []; },
    save: async (date, input) => { calls.push({ userId, date, input }); throw new PlanningApiError(409, 'Changed'); },
  })) });
  it('authenticates every lifecycle/candidate route before reading or writing', async () => {
    for (const path of ['/daily-plans/2026-10-07/planning', '/daily-plans/2026-10-07/tasks', '/daily-plans/2026-10-07/flow', '/week-plans/2026-10-04/days']) {
      await request(app).get(path).expect(401);
    }
    await request(app).put('/daily-plans/2026-10-07/planning').send({ action: 'start', revision: 0, operationId }).expect(401);
    await request(app).put('/daily-plans/2026-10-07/flow').send({ action: 'propose', revision: 0, operationId }).expect(401);
  });
  it('binds explicit dates and verified caller identity and exposes conflicts', async () => {
    const response = await request(app).get('/daily-plans/2026-10-07/planning').set('Authorization', 'Bearer valid').expect(200);
    assert.deepEqual(response.body, { plan: null });
    assert.deepEqual(calls.at(-1), { userId: 'caller', date: '2026-10-07' });
    await request(app).put('/daily-plans/2026-10-07/planning').set('Authorization', 'Bearer valid')
      .send({ action: 'start', revision: 0, operationId }).expect(409);
    await request(app).get('/daily-plans/2026-02-30/tasks').set('Authorization', 'Bearer valid').expect(400);
  });
  it('rejects client ownership, invalid revision/operation IDs and invalid selections before service calls', () => {
    for (const extra of [{ userId: 'foreign' }, { revision: -1 }, { revision: 1.1 }, { revision: 2147483647 },
      { operationId: 'bad' }, { step: 2 }, { selectedTaskIds: [] }, { action: 'reset' }]) {
      assert.throws(() => parseDailyPlanning({ action: 'start', revision: 0, operationId, ...extra }), PlanningApiError);
    }
    for (const ids of [[taskId, taskId], [null], ['bad'], Array.from({ length: 501 }, () => taskId)]) {
      assert.throws(() => parseDailyPlanning({ action: 'save', revision: 1, operationId, step: 2, selectedTaskIds: ids }), PlanningApiError);
    }
    assert.deepEqual(parseDailyPlanning({ action: 'save', revision: 1, operationId, step: 2, selectedTaskIds: [] }),
      { action: 'save', revision: 1, operationId, step: 2, selectedTaskIds: [] });
  });
});
describe('Daily Planning database adapter', () => {
  it('sends lifecycle and ordered selections in one caller RPC and maps only public fields', async () => {
    let seen: unknown;
    const client = { rpc: async (name: string, values: unknown) => {
      seen = { name, values };
      return { data: { id: 'plan', date: '2026-10-07', planning_status: 'in_progress', planning_step: 2,
        planning_revision: 2, selected_task_ids: [taskId], planning_completed_at: null, user_id: 'private', planning_operation: {} }, error: null };
    } } as unknown as SupabaseClient;
    const result = await new DailyPlanningService(client, 'caller').save('2026-10-07',
      { action: 'save', revision: 1, operationId, step: 2, selectedTaskIds: [taskId] });
    assert.deepEqual(seen, { name: 'save_daily_planning', values: { p_date: '2026-10-07', p_action: 'save', p_revision: 1,
      p_operation_id: operationId, p_step: 2, p_selected_task_ids: [taskId] } });
    assert.deepEqual(result, { id: 'plan', date: '2026-10-07', status: 'in_progress', resumeStep: 2,
      revision: 2, selectedTaskIds: [taskId], completedAt: null });
  });
  for (const [code, status] of [['40001', 409], ['55000', 409], ['23514', 400], ['PGRST202', 503], ['unknown', 500]] as const) {
    it(`maps ${code} without leaking database details`, async () => {
      const client = { rpc: async () => ({ error: { code, message: 'private content' } }) } as unknown as SupabaseClient;
      await assert.rejects(new DailyPlanningService(client, 'caller').save('2026-10-07', { action: 'start', revision: 0, operationId }),
        (error: unknown) => error instanceof PlanningApiError && error.statusCode === status && !error.message.includes('private content'));
    });
  }
});
