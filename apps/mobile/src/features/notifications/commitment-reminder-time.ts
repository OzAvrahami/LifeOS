import type { Commitment } from '@/features/commitments/commitment.types';

export function validReminderLead(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 1440;
}

// Commitments are device-local calendar dates/wall-clock times, not UTC values.
// Recompute on each reconciliation so a timezone change changes the instant.
// Reject DST gaps instead of inventing a different displayed start; ambiguous
// fall-back times use JavaScript's earlier occurrence, as the Task editor does.
export function commitmentReminderInstant(commitment: Pick<Commitment, 'date' | 'startTime' | 'reminderMinutesBefore'>): number | null {
  const { date, startTime, reminderMinutesBefore: lead } = commitment;
  if (lead == null || !validReminderLead(lead) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = startTime.split(':').map(Number);
  const start = new Date(year!, month! - 1, day!, hour!, minute!, 0, 0);
  if (start.getFullYear() !== year || start.getMonth() !== month! - 1 || start.getDate() !== day || start.getHours() !== hour || start.getMinutes() !== minute) return null;
  return start.getTime() - lead * 60_000;
}
