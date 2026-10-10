// Only internal, known product destinations survive an authentication redirect.
// This is transient navigation state, never authentication or cached account data.
const destinations = new Set(['/', '/week', '/inbox', '/more', '/settings', '/account', '/calendar', '/task', '/commitment', '/settings/day-window', '/settings/week-start', '/settings/timezone', '/settings/notifications']);
let pending = '/';
export function rememberAuthDestination(path: string, id?: string | string[], calendarReturn?: Record<string, unknown>) {
  if (path === '/settings/google-return') {
    const { attempt, receipt, result } = calendarReturn ?? {};
    if (typeof attempt !== 'string' || !/^[0-9a-f-]{36}$/i.test(attempt) || typeof result !== 'string' || !['ready', 'failed', 'cancelled'].includes(result)) return;
    const query = new URLSearchParams({ attempt, result });
    if (typeof receipt === 'string' && /^[A-Za-z0-9_-]{43}$/.test(receipt)) query.set('receipt', receipt);
    pending = `${path}?${query}`;
    return;
  }
  if (!destinations.has(path)) return;
  pending = path;
  if ((path === '/task' || path === '/commitment') && typeof id === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(id)) pending += `?id=${encodeURIComponent(id)}`;
}
export function consumeAuthDestination() {
  const destination = pending;
  pending = '/';
  return destination;
}
