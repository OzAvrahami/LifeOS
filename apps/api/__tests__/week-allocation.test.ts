import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import { parseWeekAllocation } from '../src/features/planning/week-allocation.js';
import { parseCreateTask, parseUpdateTask } from '../src/features/tasks/task.validation.js';

describe('V2 weekly allocation and task content', () => {
  const day = { date: '2026-10-09', revision: 0, snapshot: 'a'.repeat(32), ids: [randomUUID()] };
  it('accepts ordered selections and explicitly empty days', () => {
    const command = { operationId: randomUUID(), days: [day, { ...day, date: '2026-10-10', ids: [] }] };
    assert.deepEqual(parseWeekAllocation(command), command);
  });
  it('rejects malformed, duplicate, oversized and owner-controlled fields', () => {
    for (const days of [[], Array(8).fill(day), [day, day], [{ ...day, ids: [day.ids[0], day.ids[0]] }],
      [{ ...day, revision: -1 }], [{ ...day, snapshot: 'bad' }], [{ ...day, date: '2026-02-30' }],
      [{ ...day, ids: ['bad'] }], [{ ...day, userId: randomUUID() }]]) {
      assert.throws(() => parseWeekAllocation({ operationId: randomUUID(), days }));
    }
    assert.throws(() => parseWeekAllocation({ operationId: randomUUID(), days: [day], userId: randomUUID() }));
  });
  it('trims only the title and preserves meaningful multilingual multiline description bytes', () => {
    const description = ' עברית / English\n  Keep punctuation!\n';
    assert.deepEqual(parseCreateTask({ title: ' title ', description }), { title: 'title', description });
    assert.deepEqual(parseUpdateTask({ title: ' new ' }), { title: 'new' });
    assert.deepEqual(parseUpdateTask({ description }), { description });
  });
  it('normalizes intentional empty/whitespace descriptions to null and agrees on length limits', () => {
    for (const description of ['', ' \n\t ', null]) assert.deepEqual(parseUpdateTask({ description }), { description: null });
    assert.equal(parseCreateTask({ title: 'x'.repeat(500), description: 'x'.repeat(10000) }).description?.length, 10000);
    assert.throws(() => parseCreateTask({ title: 'x'.repeat(501) }));
    assert.throws(() => parseCreateTask({ title: 'x', description: 'x'.repeat(10001) }));
  });
});
