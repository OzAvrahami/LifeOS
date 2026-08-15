import { InboxTask } from '@/features/inbox/inbox.types';
import { TodayTask } from '@/features/today/today.types';
import { UnscheduledWeekTask } from '@/features/week/week.types';

import { Task } from './task.types';
import { addDaysToDateKey, localDateKey } from './task-dates';

export function toInboxTask(task: Task, now = new Date(), timeZone?: string): InboxTask {
  const created = new Date(task.createdAt);
  const todayKey = localDateKey(now, timeZone);
  const createdKey = localDateKey(created, timeZone);
  if (createdKey === todayKey) {
    const time = new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      timeZone,
    }).format(created);
    return {
      compactCreatedLabel: 'היום',
      createdLabel: `נוסף היום · ${time}`,
      id: task.id,
      title: task.title,
    };
  }
  if (createdKey === addDaysToDateKey(todayKey, -1)) {
    return {
      compactCreatedLabel: 'אתמול',
      createdLabel: 'נוסף אתמול',
      id: task.id,
      title: task.title,
    };
  }
  return {
    compactCreatedLabel: new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', timeZone }).format(created),
    createdLabel: `נוסף ב־${new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', timeZone }).format(created)}`,
    id: task.id,
    title: task.title,
  };
}

export function toTodayTask(task: Task): TodayTask {
  return {
    durationMinutes: task.estimatedMinutes ?? 0,
    id: task.id,
    lifeArea: 'work',
    title: task.title,
  };
}

export function toWeekTask(task: Task): UnscheduledWeekTask {
  return {
    durationMinutes: task.estimatedMinutes ?? 0,
    id: task.id,
    title: task.title,
  };
}
