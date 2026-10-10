import { parseCommitmentDate } from '../commitments/commitment.validation.js';
import { GoogleError, type GoogleCalendar, type GoogleEvent, type ImportedEvent } from './google.types.js';
function dateKey(instant: number, zone: string) { return new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instant)); }
function timeKey(instant: number, zone: string) { return new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(instant)); }
function instant(value: string | undefined) {
  if (!value || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) throw new GoogleError(502, 'invalid_event_time');
  parseCommitmentDate(value.slice(0,10)); return Date.parse(value);
}
export function importWindow(now = new Date()) {
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return { from: new Date(midnight - 30 * 86400000).toISOString(), to: new Date(midnight + 180 * 86400000).toISOString() };
}
export function normalizeGoogleEvent(event: GoogleEvent, calendar: GoogleCalendar, accountId: string, displayTimeZone: string): ImportedEvent | null {
  if (!event.id || typeof event.id !== 'string') throw new GoogleError(502, 'invalid_provider_response');
  if (event.status === 'cancelled') return null;
  const title = event.summary?.trim() || 'אירוע ללא כותרת';
  const location = event.location?.trim() || null;
  if (title.length > 500 || (location?.length ?? 0) > 2000 || (event.description?.length ?? 0) > 200000) throw new GoogleError(422, 'unsupported_event_size');
  const allDay = Boolean(event.start?.date);
  let date: string; let endDate: string; let startTime: string | null = null; let endTime: string | null = null;
  let startAt: string | null = null; let endAt: string | null = null;
  if (allDay) {
    date = parseCommitmentDate(event.start?.date); const exclusive = parseCommitmentDate(event.end?.date);
    if (exclusive <= date || event.start?.dateTime || event.end?.dateTime) throw new GoogleError(502, 'invalid_event_time');
    endDate = new Date(Date.parse(`${exclusive}T00:00:00Z`) - 86400000).toISOString().slice(0,10);
  } else {
    const start = instant(event.start?.dateTime); const end = instant(event.end?.dateTime);
    if (end <= start || event.end?.date) throw new GoogleError(502, 'invalid_event_time');
    date = dateKey(start, displayTimeZone); endDate = dateKey(end - 1, displayTimeZone);
    startTime = timeKey(start, displayTimeZone); endTime = timeKey(end, displayTimeZone);
    startAt = event.start!.dateTime!; endAt = event.end!.dateTime!;
  }
  const timeZone = event.start?.timeZone ?? calendar.timeZone;
  try { new Intl.DateTimeFormat('en', { timeZone }).format(); } catch { throw new GoogleError(502, 'invalid_event_time'); }
  return { title, description: event.description ?? null, location, date, endDate, startTime, endTime,
    source: { provider: 'google', accountId, calendarId: calendar.id, calendarName: calendar.summary, eventId: event.id,
      accessRole: calendar.accessRole, readOnly: true, allDay, timeZone, displayTimeZone, startAt, endAt,
      endDateExclusive: allDay ? event.end!.date! : null, recurringEventId: event.recurringEventId ?? null,
      originalStartTime: event.originalStartTime ?? null, iCalUID: event.iCalUID ?? null, etag: event.etag ?? null,
      transparency: event.transparency === 'transparent' ? 'transparent' : 'opaque', organizerSelf: event.organizer?.self === true, guestsCanModify: event.guestsCanModify === true } };
}
