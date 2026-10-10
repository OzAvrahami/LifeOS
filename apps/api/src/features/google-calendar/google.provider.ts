import { createHash } from 'node:crypto';
import { googleScopes, type GoogleConfig } from './google.config.js';
import { GoogleError, type GoogleCalendar, type GoogleEvent } from './google.types.js';
export interface GoogleProvider {
  authorize(state: string, verifier: string): string;
  exchange(code: string, verifier: string): Promise<{ refreshToken: string; accountId: string; email: string }>;
  refresh(refreshToken: string): Promise<string>;
  calendars(access: string): Promise<GoogleCalendar[]>;
  events(access: string, calendar: string, from: string, to: string): Promise<GoogleEvent[]>;
}
// Provider origin and paths are fixed; caller-supplied calendars are encoded path segments.
// No event mutation method exists in this slice.
export class HttpGoogleProvider implements GoogleProvider {
  constructor(private config: GoogleConfig, private fetcher: typeof fetch = fetch) {}
  authorize(state: string, verifier: string) {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({ client_id: this.config.clientId, redirect_uri: this.config.redirectUri, response_type: 'code',
      scope: googleScopes.join(' '), state, access_type: 'offline', prompt: 'consent select_account',
      code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url') }).toString();
    return url.href;
  }
  private async json<T>(url: string, init: RequestInit) {
    let response: Response;
    try { response = await this.fetcher(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(12_000) }); }
    catch { throw new GoogleError(502, 'provider_unavailable'); }
    if (!response.ok) {
      // Never forward/log provider bodies (which may include credentials or event data).
      if (response.status === 401 || (url.includes('/token') && response.status === 400)) throw new GoogleError(409, 'reconnect_required');
      throw new GoogleError(502, response.status === 403 ? 'calendar_permission_denied' : 'provider_unavailable');
    }
    try { return await response.json() as T; } catch { throw new GoogleError(502, 'invalid_provider_response'); }
  }
  private token(parameters: Record<string, string>) {
    return this.json<{ access_token: string; refresh_token?: string; scope?: string }>('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...parameters, client_id: this.config.clientId, client_secret: this.config.clientSecret }).toString(),
    });
  }
  async exchange(code: string, verifier: string) {
    const tokens = await this.token({ code, code_verifier: verifier, redirect_uri: this.config.redirectUri, grant_type: 'authorization_code' });
    const scopes = new Set(tokens.scope?.split(' ') ?? []);
    if (!tokens.access_token || !tokens.refresh_token || googleScopes.slice(2).some(scope => !scopes.has(scope))) throw new GoogleError(409, 'consent_required');
    const identity = await this.json<{ sub: string; email?: string }>('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!identity.sub || typeof identity.sub !== 'string') throw new GoogleError(502, 'invalid_provider_response');
    return { refreshToken: tokens.refresh_token, accountId: identity.sub, email: identity.email ?? '' };
  }
  async refresh(refreshToken: string) {
    const result = await this.token({ refresh_token: refreshToken, grant_type: 'refresh_token' });
    if (!result.access_token) throw new GoogleError(409, 'reconnect_required');
    return result.access_token;
  }
  private async pages<T>(url: URL, access: string): Promise<T[]> {
    const deadline = Date.now() + 60_000;
    const rows: T[] = []; const seen = new Set<string>();
    for (let page = 0; page < 20; page++) {
      if (Date.now() > deadline) throw new GoogleError(502, 'provider_timeout');
      const result = await this.json<{ items?: T[]; nextPageToken?: string }>(url.href, { headers: { Authorization: `Bearer ${access}` } });
      if (result.items !== undefined && !Array.isArray(result.items)) throw new GoogleError(502, 'invalid_provider_response');
      rows.push(...(result.items ?? []));
      if (rows.length > 10000) throw new GoogleError(422, 'import_limit');
      if (!result.nextPageToken) return rows;
      if (seen.has(result.nextPageToken)) throw new GoogleError(502, 'invalid_provider_response');
      seen.add(result.nextPageToken); url.searchParams.set('pageToken', result.nextPageToken);
    }
    throw new GoogleError(422, 'import_limit');
  }
  async calendars(access: string) {
    const rows = await this.pages<GoogleCalendar>(new URL('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250&showHidden=true'), access);
    return rows.map(row => {
      if (!row.id || !row.summary || !row.timeZone || !['freeBusyReader','reader','writer','owner'].includes(row.accessRole)) throw new GoogleError(502, 'invalid_provider_response');
      return { id: row.id, summary: row.summary, timeZone: row.timeZone, accessRole: row.accessRole };
    });
  }
  events(access: string, calendar: string, from: string, to: string) {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar)}/events`);
    url.search = new URLSearchParams({ timeMin: from, timeMax: to, singleEvents: 'true', showDeleted: 'true', maxResults: '2500' }).toString();
    return this.pages<GoogleEvent>(url, access);
  }
}
