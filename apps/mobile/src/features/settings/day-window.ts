export type DayWindowKind = 'unset' | 'incomplete' | 'equal' | 'same-day' | 'overnight';

const clockTimePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function dayWindowKind(start: string | null, end: string | null): DayWindowKind {
  if (start === null && end === null) return 'unset';
  if (start === null || end === null || !clockTimePattern.test(start) || !clockTimePattern.test(end)) {
    return 'incomplete';
  }
  if (start === end) return 'equal';
  return end < start ? 'overnight' : 'same-day';
}

export function dayWindowError(start: string | null, end: string | null) {
  const kind = dayWindowKind(start, end);
  if (kind === 'incomplete') return 'יש לבחור גם שעת התחלה וגם שעת סיום.';
  if (kind === 'equal') return 'שעת ההתחלה ושעת הסיום חייבות להיות שונות.';
  return null;
}
