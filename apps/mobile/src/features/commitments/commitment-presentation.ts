import type { Commitment } from './commitment.types';

export function commitmentTimeLabel(item: Commitment) {
  const source = item.calendarSource;
  // endDate is the last overlapping day; an exclusive midnight still displays
  // its actual next-day endpoint rather than "23:00–00:00" on the same date.
  const endpointDate = source?.endAt ? new Intl.DateTimeFormat('en-CA', { timeZone: source.displayTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(source.endAt)) : item.endDate;
  const range = endpointDate && endpointDate !== item.date ? `${item.date}–${endpointDate} · ` : '';
  if (item.calendarSource?.allDay) return `${range}כל היום`;
  if (range) return `${item.date} ${item.startTime} – ${endpointDate} ${item.endTime}`;
  if (source?.startAt && source.endAt && item.endTime && item.startTime && item.endTime <= item.startTime) {
    const format = new Intl.DateTimeFormat('he-IL', { timeZone: source.displayTimeZone, hour: '2-digit', minute: '2-digit', timeZoneName: 'shortOffset', hourCycle: 'h23' });
    return `${format.format(new Date(source.startAt))} – ${format.format(new Date(source.endAt))}`;
  }
  return item.endTime ? `${item.startTime}–${item.endTime}` : `${item.startTime} · ללא שעת סיום`;
}
export function commitmentSourceLabel(item: Commitment) {
  return item.calendarSource ? `Google · ${item.calendarSource.calendarName}` : 'LifeOS';
}
