export type GoogleCalendar = { id: string; summary: string; timeZone: string; accessRole: string; selected?: boolean };
export type GoogleEvent = { id: string; status?: string; summary?: string; description?: string; location?: string; etag?: string; iCalUID?: string;
  recurringEventId?: string; originalStartTime?: { date?: string; dateTime?: string; timeZone?: string };
  start?: { date?: string; dateTime?: string; timeZone?: string }; end?: { date?: string; dateTime?: string; timeZone?: string };
  transparency?: string; organizer?: { self?: boolean }; guestsCanModify?: boolean };
export type CalendarSource = { provider: 'google'; accountId: string; calendarId: string; calendarName: string; eventId: string;
  accessRole: string; readOnly: true; allDay: boolean; timeZone: string; displayTimeZone: string;
  startAt: string | null; endAt: string | null; endDateExclusive: string | null; recurringEventId: string | null;
  originalStartTime: GoogleEvent['originalStartTime'] | null; iCalUID: string | null; etag: string | null;
  transparency: 'opaque' | 'transparent'; organizerSelf: boolean; guestsCanModify: boolean };
export type ImportedEvent = { title: string; description: string | null; location: string | null; date: string; endDate: string;
  startTime: string | null; endTime: string | null; source: CalendarSource };
export type Attempt = { id: string; stateHash: string; proofHash: string; verifier: string; returnUri: string; expiresAt: string; stage: string;
  credential?: string; accountId?: string; email?: string };
export type GoogleState = { userId?: string; status: 'disconnected' | 'connected' | 'failed' | 'reconnect_required'; revision: number;
  accountId?: string; email?: string; credential?: string; calendars: GoogleCalendar[]; attempt?: Attempt;
  lock?: { id: string; expiresAt: string }; lastSyncAt?: string; imported?: number };
export interface GoogleStore { command(userId: string | null, action: string, payload?: Record<string, unknown>): Promise<GoogleState> }
export class GoogleError extends Error {
  constructor(public statusCode: number, public code: string) { super(code); }
}
