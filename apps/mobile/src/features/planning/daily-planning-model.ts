import type { Task } from '@/features/tasks/task.types';

export function dailyMembership(date: string, selectedIds: string[], tasks: Task[]) {
  const byId = new Map(tasks.map(task => [task.id, task]));
  const selected = selectedIds.flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
  const selectedSet = new Set(selectedIds);
  const dated = tasks.filter(task => task.plannedDate === date && task.status !== 'cancelled' && !selectedSet.has(task.id));
  const union = [...selected.filter(t => t.status !== 'cancelled'), ...dated];
  const active = union.filter(t => t.status === 'open' || t.status === 'in_progress');
  return { selected, dated, union, active,
    unavailable: selectedIds.filter(id => !byId.has(id)),
    knownMinutes: active.reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0),
    unknownCount: active.filter(task => task.estimatedMinutes === null).length,
  };
}

// Operation correlation only, never a credential. Keep this ID unchanged on retry.
export function newPlanningOperationId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 3) | 8).toString(16);
  });
}
