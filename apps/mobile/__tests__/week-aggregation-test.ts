import { Task } from '@/features/tasks/task.types';
import { tasksByPlannedDate } from '@/features/week/week-aggregation';

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    completedAt: null,
    createdAt: '2026-08-23T08:00:00.000Z',
    description: null,
    dueDate: null,
    estimatedMinutes: 30,
    id,
    plannedDate: '2026-08-23',
    position: 0,
    priority: 'normal',
    status: 'open',
    title: id,
    updatedAt: '2026-08-23T08:00:00.000Z',
    weekPlanId: null,
    ...overrides,
  };
}

describe('Week Task aggregation', () => {
  it('groups active Tasks only by exact plannedDate and sums explicit durations', () => {
    const days = tasksByPlannedDate([
      task('open', { estimatedMinutes: 45 }),
      task('no-duration', { estimatedMinutes: null }),
      task('active', { estimatedMinutes: 20, status: 'in_progress' }),
      task('tomorrow', { estimatedMinutes: 15, plannedDate: '2026-08-24' }),
      task('completed', { completedAt: '2026-08-23T09:00:00.000Z', estimatedMinutes: 90, status: 'completed' }),
      task('cancelled', { estimatedMinutes: 120, status: 'cancelled' }),
      task('due-only', { dueDate: '2026-08-23', plannedDate: null }),
      task('outside', { plannedDate: '2026-08-30' }),
    ], ['2026-08-23', '2026-08-24']);

    expect(days.get('2026-08-23')?.tasks.map(({ id }) => id)).toEqual([
      'open', 'no-duration', 'active',
    ]);
    expect(days.get('2026-08-23')).toEqual(expect.objectContaining({ plannedMinutes: 65 }));
    expect(days.get('2026-08-24')?.tasks.map(({ id }) => id)).toEqual(['tomorrow']);
    expect(days.get('2026-08-24')?.plannedMinutes).toBe(15);
  });

  it('recomputes the affected days after a date move or duration change', () => {
    const dates = ['2026-08-23', '2026-08-24'];
    const original = task('moving', { estimatedMinutes: 30 });
    const before = tasksByPlannedDate([original], dates);
    expect(before.get('2026-08-23')).toEqual(expect.objectContaining({ plannedMinutes: 30 }));
    expect(before.get('2026-08-24')?.tasks).toHaveLength(0);

    const movedAndResized = { ...original, estimatedMinutes: 75, plannedDate: '2026-08-24' };
    const after = tasksByPlannedDate([movedAndResized], dates);
    expect(after.get('2026-08-23')?.tasks).toHaveLength(0);
    expect(after.get('2026-08-24')).toEqual(expect.objectContaining({ plannedMinutes: 75 }));
  });
});
