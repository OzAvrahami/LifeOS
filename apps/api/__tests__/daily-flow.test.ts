import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import { proposeDay, parseFlowCommand, presentFlow, type FlowContext } from '../src/features/planning/daily-flow.js';
import type { TaskRow } from '../src/features/tasks/task.types.js';
const date = '2026-10-09';
function task(id: string, extra: Partial<TaskRow> = {}): TaskRow {
  return { id, user_id: 'a', title: id, description: null, status: 'open', estimated_minutes: null,
    priority: 'normal', due_date: null, planned_date: null, week_plan_id: null, position: 0,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', completed_at: null, ...extra };
}
function context(tasks: TaskRow[]): FlowContext {
  return { tasks, plan: null, history: [], weeks: [], snapshot: 'a'.repeat(32), today: date, timezone: 'Asia/Jerusalem' };
}
describe('bounded-v1 daily proposals', () => {
  it('ranks actual date, due date, carry-over, explicit importance, then ordered backlog', () => {
    const c = context([task('backlog'), task('important', { priority: 'important' }), task('carry'),
      task('due', { due_date: date }), task('dated', { planned_date: date }), task('extra')]);
    c.history = [{ date: '2026-10-03', ids: ['carry'], revision: 1 }];
    const p = proposeDay(c, date);
    assert.deepEqual(p.ids, ['dated', 'due', 'carry', 'important', 'backlog']);
    assert.deepEqual(p.reasons.carry, { kind: 'carry', origin: '2026-10-03' });
    assert.equal(p.reasons.due?.kind, 'due');
    assert.deepEqual(proposeDay({ ...c, tasks: [...c.tasks].reverse() }, date), p);
  });
  it('caps unfinished suggestions at two across missed days and records the latest origin', () => {
    const c = context([task('a'), task('b'), task('c'), task('new')]);
    c.history = [{ date: '2026-10-01', ids: ['a', 'b', 'c'], revision: 1 }, { date: '2026-10-07', ids: ['b'], revision: 2 }];
    const p = proposeDay(c, date);
    assert.deepEqual(p.ids, ['b', 'a', 'new']); assert.equal(p.reasons.b?.origin, '2026-10-07');
    assert.equal(c.tasks.find(t => t.id === 'c')?.status, 'open');
  });
  it('excludes cancelled, completed, missing, future dates and future week deferrals even if overdue', () => {
    const c = context([task('done', { status: 'completed' }), task('cancelled', { status: 'cancelled' }),
      task('future', { planned_date: '2026-10-10', due_date: '2026-10-01' }), task('later-week', { week_plan_id: 'w' }), task('active', { status: 'in_progress' })]);
    c.weeks = [{ id: 'w', weekStart: '2026-10-11' }]; c.history = [{ date: '2026-10-01', ids: ['missing', 'future'], revision: 1 }];
    assert.deepEqual(proposeDay(c, date).ids, ['active']);
  });
  it('retains an approved weekly selection/order and only proposes bounded additions without mutating it', () => {
    const c = context([task('new'), task('approved')]);
    c.plan = { id: 'p', date, planning_status: 'completed', planning_revision: 4, selected_task_ids: ['approved'],
      flow_state: { proposal: null, source: 'weekly', summary: null } };
    const before = structuredClone(c);
    assert.deepEqual(proposeDay(c, date).ids, ['approved', 'new']);
    assert.deepEqual(c, before); assert.equal(presentFlow(c).plan?.source, 'weekly');
  });
  it('supports empty days and does not infer rank from durations or calendar capacity', () => {
    assert.deepEqual(proposeDay(context([]), date).ids, []);
    const c = context([task('a', { estimated_minutes: 9999 }), task('b', { estimated_minutes: 1 })]);
    assert.deepEqual(proposeDay(c, date).ids, ['a', 'b']);
  });
  it('preserves a pre-V2 saved manual draft on first proposal without treating it as approved', () => {
    const c = context([task('old-selection'), task('other'), task('deferred', { planned_date: '2026-11-01' }), task('finished', { status: 'completed' })]);
    c.plan = { id: 'p', date, planning_status: 'in_progress', planning_revision: 3, selected_task_ids: ['old-selection', 'deferred', 'finished'], flow_state: null };
    assert.equal(proposeDay(c, date).ids[0], 'old-selection');
    assert.ok(!proposeDay(c, date).ids.includes('deferred'));
    assert.ok(!proposeDay(c, date).ids.includes('finished'));
    assert.equal(presentFlow(c).plan?.approved, false);
    assert.deepEqual(presentFlow(c).plan?.ids, []);
  });
  it('allows zero selections and rejects malformed, duplicate, foreign-field and oversized commands', () => {
    const input = { action: 'approve', operationId: randomUUID(), revision: 2, snapshot: 'a'.repeat(32), ids: [], source: 'weekly' };
    assert.deepEqual(parseFlowCommand(input), input);
    const id = randomUUID();
    for (const extra of [{ ids: [id, id] }, { ids: ['bad'] }, { userId: 'someone' }, { revision: -1 },
      { snapshot: 'bad' }, { source: 'guess' }, { proposal: {} }, { operationId: 'bad' }]) {
      assert.throws(() => parseFlowCommand({ ...input, ...extra }));
    }
    assert.throws(() => parseFlowCommand({ action: 'summarize', operationId: randomUUID(), revision: 1, note: 'x'.repeat(1001) }));
  });
});
