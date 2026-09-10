const pad = (value: number) => String(value).padStart(2, '0');

export type PlanningDateContext = { timeZone?: string; timezone?: string; weekStartDay?: number };

function partsInTimezone(date: Date, timeZone?: string) {
  if (!timeZone) {
    return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() };
  }
  const values = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(values.find((part) => part.type === type)?.value);
  return { day: value('day'), month: value('month'), year: value('year') };
}

export function localDateKey(date = new Date(), timeZone?: string) {
  const parts = partsInTimezone(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const result = new Date(Date.UTC(year!, month! - 1, day! + days, 12));
  return `${result.getUTCFullYear()}-${pad(result.getUTCMonth() + 1)}-${pad(result.getUTCDate())}`;
}

export function weekdayForDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!, 12)).getUTCDay();
}

export function currentWeekStart(date = new Date(), context: PlanningDateContext = {}) {
  const today = localDateKey(date, context.timezone ?? context.timeZone);
  return weekStartForDateKey(today, context.weekStartDay);
}

export function currentWeekDateKeys(date = new Date(), context: PlanningDateContext = {}) {
  const start = currentWeekStart(date, context);
  return Array.from({ length: 7 }, (_, index) => addDaysToDateKey(start, index));
}

export function currentWeekDates(date = new Date(), context: PlanningDateContext = {}) {
  return currentWeekDateKeys(date, context).map((key) => {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year!, month! - 1, day!, 12);
  });
}

function formatDateKey(dateKey: string, options: Intl.DateTimeFormatOptions) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('he-IL', { ...options, timeZone: 'UTC' })
    .format(new Date(Date.UTC(year!, month! - 1, day!, 12)));
}

export function hebrewWeekRange(date = new Date(), context: PlanningDateContext = {}) {
  const days = currentWeekDateKeys(date, context);
  const first = days[0]!;
  const last = days[6]!;
  const firstDay = Number(first.slice(8));
  const lastDay = Number(last.slice(8));
  const firstMonth = formatDateKey(first, { month: 'long' });
  const lastMonth = formatDateKey(last, { month: 'long' });
  return first.slice(0, 7) === last.slice(0, 7)
    ? `${firstDay}–${lastDay} ${lastMonth}`
    : `${firstDay} ${firstMonth}–${lastDay} ${lastMonth}`;
}

export function hebrewDateLabel(date = new Date(), timeZone?: string) {
  return formatDateKey(localDateKey(date, timeZone), {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
}

// Match the API's YYYY-MM-DD calendar validation; never parse date-only input as UTC.
export function isPlanningDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1
    && date.getUTCDate() === day;
}

export function planningDateToLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year!, month! - 1, day!);
  date.setHours(12, 0, 0, 0);
  return date;
}

// Calendar arithmetic stays on date keys; account timezone only determines today's key.
export function weekStartForDateKey(dateKey: string, weekStartDay = 0) {
  return addDaysToDateKey(dateKey, -((weekdayForDateKey(dateKey) - weekStartDay + 7) % 7));
}

export function weekDateKeys(start: string) {
  return Array.from({ length: 7 }, (_, index) => addDaysToDateKey(start, index));
}

export function hebrewPlanningDate(dateKey: string) {
  return formatDateKey(dateKey, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function hebrewSelectedWeekRange(start: string) {
  const end = addDaysToDateKey(start, 6);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return `${formatDateKey(start, options)} – ${formatDateKey(end, options)}`;
}
