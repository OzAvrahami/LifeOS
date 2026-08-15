import type { Commitment } from './commitment.types';

export type WorkloadState = 'פנוי' | 'מאוזן' | 'עמוס' | 'עמוס מדי';

function timeMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours! * 60 + minutes!;
}

export function commitmentDurationMinutes(commitment: Pick<Commitment, 'startTime' | 'endTime'>) {
  return commitment.endTime
    ? Math.max(0, timeMinutes(commitment.endTime) - timeMinutes(commitment.startTime))
    : 0;
}

export function plannedMinutes(
  tasks: { estimatedMinutes?: number | null }[],
  commitments: Pick<Commitment, 'startTime' | 'endTime'>[],
) {
  return tasks.reduce((total, task) => total + (task.estimatedMinutes ?? 0), 0)
    + commitments.reduce((total, commitment) => total + commitmentDurationMinutes(commitment), 0);
}

export function workloadState(planned: number, available: number): WorkloadState {
  if (available === 0) return planned === 0 ? 'פנוי' : 'עמוס מדי';
  const ratio = planned / available;
  if (ratio <= 0.5) return 'פנוי';
  if (ratio <= 0.8) return 'מאוזן';
  if (ratio <= 1) return 'עמוס';
  return 'עמוס מדי';
}

export function formatMinutes(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}
