import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api/client';
import { recoveryStorage } from '@/lib/supabase/session-storage';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { commitmentKeys } from '@/features/commitments/commitment.queries';
import type { Commitment } from '@/features/commitments/commitment.types';

export type GoogleConnection = {
  configured: boolean; status: 'unavailable' | 'disconnected' | 'connected' | 'failed' | 'reconnect_required';
  revision: number; email?: string | null; lastSyncAt?: string | null; importing?: boolean;
  window?: { from: string; to: string };
  calendars: { id: string; summary: string; timeZone: string; accessRole: string; selected?: boolean }[];
};
export type GoogleAttempt = { id: string; proof: string };
const attemptKey = (user: string) => `google-calendar-attempt-${user}`;
export const googleAttemptStorage = {
  async read(user: string): Promise<GoogleAttempt | null> {
    const raw = await recoveryStorage.getItem(attemptKey(user));
    if (!raw) return null;
    const value = JSON.parse(raw) as GoogleAttempt;
    return typeof value.id === 'string' && typeof value.proof === 'string' ? value : null;
  },
  save: (user: string, attempt: GoogleAttempt) => recoveryStorage.setItem(attemptKey(user), JSON.stringify(attempt)),
  clear: (user: string) => recoveryStorage.removeItem(attemptKey(user)),
};
export function googleRequest<T>(user: string, path = '', method = 'GET', body?: unknown) {
  return apiRequest<T>(`/integrations/google${path}`, { auth: 'required', expectedUserId: user, method,
    ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }) });
}
export function useGoogleCalendar() {
  const user = useTaskQueryScope(); const client = useQueryClient();
  const key = ['google-calendar', user];
  const query = useQuery({ queryKey: key, queryFn: () => googleRequest<GoogleConnection>(user), staleTime: 0 });
  const accept = (state: GoogleConnection) => {
    client.setQueryData(key, state);
    // A confirmed disconnect/deselection hides cached imports immediately, even
    // if the subsequent refresh is offline. Keep every local-only commitment.
    if (state.configured) {
      const selected = new Set(state.calendars.filter(c => c.selected).map(c => c.id));
      client.setQueriesData<Commitment[]>({ queryKey: commitmentKeys.user(user) }, items => items?.filter(item =>
        !item.calendarSource || (state.status !== 'disconnected' && selected.has(item.calendarSource.calendarId))));
    }
  };
  const refresh = async () => {
    await Promise.all([client.invalidateQueries({ queryKey: key }), client.invalidateQueries({ queryKey: commitmentKeys.user(user) })]);
  };
  return { user, query, refresh, accept };
}
