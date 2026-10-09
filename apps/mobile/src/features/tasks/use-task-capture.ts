import type { TaskCaptureDetails, TaskCapturePlacement } from './task-capture.types';
import { useRef } from 'react';
import type { CreateTaskInput } from './task.types';
import { useEffectiveSettings } from '@/features/settings/settings.queries';

import { DEMO_TODAY } from './demo-task.fixture';
import { useDemoTasks } from './demo-task-provider';
import { currentWeekStart, isPlanningDate, localDateKey } from './task-dates';
import { useCreateTask } from './task.queries';
import { TaskSource } from './task.types';

export function useTaskCapture(source: TaskSource) {
  const demo = useDemoTasks();
  const createMutation = useCreateTask();
  const { effective: settings, query: settingsQuery } = useEffectiveSettings(source === 'server');
  const attempted = useRef<{ id: string; input: CreateTaskInput } | null>(null);

  const captureTask = async (title: string, placement: TaskCapturePlacement, details?: TaskCaptureDetails) => {
    const { destination } = placement;
    if (destination === 'day' && !isPlanningDate(placement.plannedDate)) throw new Error('Choose a valid planning date');
    if (source === 'preview') {
      demo.captureTask(title, placement);
      return;
    }
    if ((destination === 'today' || destination === 'week') && !settingsQuery.data) throw new Error('Account calendar settings are not loaded');
    const input: CreateTaskInput = {
      title,
      ...details,
      ...(destination === 'day'
        ? { planning: { type: 'day' as const, plannedDate: placement.plannedDate } }
        : destination === 'today'
        ? { planning: { plannedDate: localDateKey(undefined, settings.timezone), type: 'day' as const } }
        : destination === 'week'
          ? { planning: { type: 'week' as const, weekStart: currentWeekStart(undefined, settings) } }
          : {}),
    };
    if (details && attempted.current?.id !== details.creationId) attempted.current = { id: details.creationId, input };
    await createMutation.mutateAsync(details ? attempted.current!.input : input);
  };

  return { captureTask, createMutation, defaultDate: source === 'preview' ? DEMO_TODAY : localDateKey(undefined, settings.timezone) };
}
