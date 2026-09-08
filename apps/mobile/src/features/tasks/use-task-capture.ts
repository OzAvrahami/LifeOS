import type { TaskCapturePlacement } from './task-capture.types';
import { useEffectiveSettings } from '@/features/settings/settings.queries';

import { DEMO_TODAY } from './demo-task.fixture';
import { useDemoTasks } from './demo-task-provider';
import { currentWeekStart, isPlanningDate, localDateKey } from './task-dates';
import { useCreateTask } from './task.queries';
import { TaskSource } from './task.types';

export function useTaskCapture(source: TaskSource) {
  const demo = useDemoTasks();
  const createMutation = useCreateTask();
  const { effective: settings } = useEffectiveSettings(source === 'server');

  const captureTask = async (title: string, placement: TaskCapturePlacement) => {
    const { destination } = placement;
    if (destination === 'day' && !isPlanningDate(placement.plannedDate)) throw new Error('Choose a valid planning date');
    if (source === 'preview') {
      demo.captureTask(title, placement);
      return;
    }
    await createMutation.mutateAsync({
      title,
      ...(destination === 'day'
        ? { planning: { type: 'day' as const, plannedDate: placement.plannedDate } }
        : destination === 'today'
        ? { planning: { plannedDate: localDateKey(undefined, settings.timezone), type: 'day' as const } }
        : destination === 'week'
          ? { planning: { type: 'week' as const, weekStart: currentWeekStart(undefined, settings) } }
          : {}),
    });
  };

  return { captureTask, createMutation, defaultDate: source === 'preview' ? DEMO_TODAY : localDateKey(undefined, settings.timezone) };
}
