import { Task } from '@/features/tasks/task.types';

export type WeekDayTasks = {
  plannedMinutes: number;
  tasks: Task[];
};

export function tasksByPlannedDate(tasks: Task[], dateKeys: string[]) {
  const days = new Map<string, WeekDayTasks>(
    dateKeys.map((dateKey) => [dateKey, { plannedMinutes: 0, tasks: [] }]),
  );

  for (const task of tasks) {
    if (task.status !== 'open' && task.status !== 'in_progress') continue;
    if (!task.plannedDate) continue;
    const day = days.get(task.plannedDate);
    if (!day) continue;
    day.tasks.push(task);
    day.plannedMinutes += task.estimatedMinutes ?? 0;
  }

  return days;
}
