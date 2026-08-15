import { CaptureDestination } from '@/features/capture/quick-capture-sheet';
import { useEffectiveSettings } from '@/features/settings/settings.queries';

import { useDemoTasks } from './demo-task-provider';
import { currentWeekStart, localDateKey } from './task-dates';
import { useCreateTask } from './task.queries';
import { TaskSource } from './task.types';

export function useTaskCapture(source: TaskSource) {
  const demo = useDemoTasks();
  const createMutation = useCreateTask();
  const { effective: settings } = useEffectiveSettings(source === 'server');

  const captureTask = async (title: string, destination: CaptureDestination) => {
    if (destination === 'day') return;
    if (source === 'preview') {
      demo.captureTask(title, destination);
      return;
    }
    await createMutation.mutateAsync({
      title,
      ...(destination === 'today'
        ? { planning: { plannedDate: localDateKey(undefined, settings.timezone), type: 'day' as const } }
        : destination === 'week'
          ? { planning: { type: 'week' as const, weekStart: currentWeekStart(undefined, settings) } }
          : {}),
    });
  };

  return { captureTask, createMutation };
}
