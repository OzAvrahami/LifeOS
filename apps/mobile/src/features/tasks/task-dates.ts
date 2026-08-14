const pad = (value: number) => String(value).padStart(2, '0');

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function currentWeekStart(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return localDateKey(start);
}

export function currentWeekDates(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, index) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

export function hebrewWeekRange(date = new Date()) {
  const days = currentWeekDates(date);
  const first = days[0];
  const last = days[6];
  const month = (value: Date) => new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(value);
  return first.getMonth() === last.getMonth()
    ? `${first.getDate()}–${last.getDate()} ${month(last)}`
    : `${first.getDate()} ${month(first)}–${last.getDate()} ${month(last)}`;
}

export function dateFromApprovedDayChoice(label: string, date = new Date()) {
  const match = label.match(/(\d{1,2})\/(\d{1,2})/);
  if (!match) return localDateKey(date);
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  let year = date.getFullYear();
  if (month < date.getMonth() - 6) year += 1;
  if (month > date.getMonth() + 6) year -= 1;
  return localDateKey(new Date(year, month, day));
}

export function hebrewDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(date);
}
