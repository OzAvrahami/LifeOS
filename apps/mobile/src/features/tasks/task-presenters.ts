import { InboxTask } from '@/features/inbox/inbox.types';
import { TodayTask } from '@/features/today/today.types';
import { UnscheduledWeekTask } from '@/features/week/week.types';

import { Task } from './task.types';

function sameLocalDay(value: Date, reference: Date) {
  return value.getFullYear() === reference.getFullYear()
    && value.getMonth() === reference.getMonth()
    && value.getDate() === reference.getDate();
}

export function toInboxTask(task: Task, now = new Date()): InboxTask {
  const created = new Date(task.createdAt);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameLocalDay(created, now)) {
    const time = new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
    }).format(created);
    return {
      compactCreatedLabel: 'היום',
      createdLabel: `נוסף היום · ${time}`,
      id: task.id,
      title: task.title,
    };
  }
  if (sameLocalDay(created, yesterday)) {
    return {
      compactCreatedLabel: 'אתמול',
      createdLabel: 'נוסף אתמול',
      id: task.id,
      title: task.title,
    };
  }
  return {
    compactCreatedLabel: new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(created),
    createdLabel: `נוסף ב־${new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(created)}`,
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
