import type { TaskStatus } from '@/features/tasks/task.types';

type EstimatedTask = {
  estimatedMinutes: number | null;
  status: TaskStatus;
};

export function summarizePlannedTaskTime(tasks: EstimatedTask[]) {
  return tasks.reduce((summary, task) => {
    if (task.status === 'cancelled') return summary;
    if (task.estimatedMinutes === null) {
      summary.unknownEstimateCount += 1;
    } else {
      summary.knownMinutes += task.estimatedMinutes;
    }
    return summary;
  }, { knownMinutes: 0, unknownEstimateCount: 0 });
}

export function formatTaskMinutesHebrew(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourPart = hours === 1 ? 'שעה' : hours === 2 ? 'שעתיים' : `${hours} שעות`;
  const minutePart = remainder === 1 ? 'דקה' : remainder === 2 ? 'שתי דקות' : `${remainder} דקות`;

  if (hours === 0) return minutePart;
  if (remainder === 0) return hourPart;
  return `${hourPart} ו־${minutePart}`;
}

export function unknownEstimateLabel(count: number) {
  if (count === 0) return null;
  return count === 1 ? 'למשימה אחת אין הערכת זמן' : `ל־${count} משימות אין הערכת זמן`;
}
