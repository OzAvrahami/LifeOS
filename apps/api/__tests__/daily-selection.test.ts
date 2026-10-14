import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { it } from 'node:test';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { Router } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { DailyFlowService, parseFlowCommand, type FlowContext } from '../src/features/planning/daily-flow.js';
import { createPlanningRouter } from '../src/features/planning/planning.routes.js';
import { createRequireAuth } from '../src/middleware/auth.middleware.js';

const date = '2026-10-14';
const id = randomUUID();
const context: FlowContext = { today: date, timezone: 'Asia/Jerusalem', snapshot: 'b'.repeat(32), tasks: [], history: [], weeks: [],
  plan: { id, date, planning_status: 'in_progress', planning_revision: 2, selected_task_ids: [],
    flow_state: { source: null, summary: null, proposal: { ids: [], reasons: {}, snapshot: 'a'.repeat(32), rule: 'bounded-v1' } } } };

it('accepts explicit selection commands without snapshots while keeping generation validation', () => {
  for (const action of ['approve', 'save-draft', 'edit']) {
    const input = { action, ids: [], revision: 2, operationId: randomUUID(), ...(action === 'approve' ? { source: 'daily' } : {}) };
    assert.deepEqual(parseFlowCommand(input), input);
    assert.deepEqual(parseFlowCommand({ ...input, snapshot: 'a'.repeat(32) }), { ...input, snapshot: 'a'.repeat(32) });
    assert.throws(() => parseFlowCommand({ ...input, snapshot: 'bad' }));
  }
  assert.throws(() => parseFlowCommand({ action: 'propose', revision: 2, operationId: randomUUID() }));
});

it('initialization preserves stale choices; each selection action forwards unchanged to the authoritative RPC', async () => {
  const calls: { name: string; args: unknown }[] = [];
  const client = { rpc: async (name: string, args: unknown) => { calls.push({ name, args }); return { data: context, error: null }; } } as unknown as SupabaseClient;
  const service = new DailyFlowService(client);
  const loaded = await service.initialize(date);
  assert.notEqual(loaded.snapshot, loaded.plan!.proposal!.snapshot);
  assert.deepEqual(calls.map(c => c.name), ['daily_flow_context']);
  for (const action of ['approve', 'save-draft', 'edit'] as const) {
    const input = { action, ids: [], revision: 2, operationId: randomUUID(), snapshot: 'a'.repeat(32), ...(action === 'approve' ? { source: 'daily' as const } : {}) };
    await service.save(date, input);
    assert.deepEqual(calls.at(-1), { name: 'save_daily_flow', args: { p_date: date, p_command: input } });
  }
});

for (const [sqlCode, message, status, code] of [
  ['23514', 'Invalid selection', 422, 'selection_unavailable'],
  ['55000', 'Plan changed; review again', 409, 'daily_plan_conflict'],
  ['55000', 'Historical plans cannot be rewritten', 409, 'historical_plan_read_only'],
] as const) it(`returns a safe ${code} recovery code through the authenticated API`, async () => {
  const client = { rpc: async () => ({ data: null, error: { code: sqlCode, message } }) } as unknown as SupabaseClient;
  const auth = createRequireAuth({ createUserClient: () => client, verifyToken: async () => ({ id } as User) });
  const app = createApp({ auth: Router(), tasks: Router(), planning: createPlanningRouter(auth) });
  const input = { action: 'approve', ids: [], revision: 2, operationId: randomUUID(), source: 'daily' };
  await request(app).put(`/daily-plans/${date}/flow`).send(input).expect(401);
  const result = await request(app).put(`/daily-plans/${date}/flow`).set('Authorization', 'Bearer test-session').send(input).expect(status);
  assert.equal(result.body.code, code);
  assert.deepEqual(Object.keys(result.body).sort(), ['code', 'error']);
});
