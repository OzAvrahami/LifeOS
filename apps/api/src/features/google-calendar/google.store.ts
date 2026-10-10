import { createClient } from '@supabase/supabase-js';
import type { GoogleConfig } from './google.config.js';
import { GoogleError, type GoogleState, type GoogleStore } from './google.types.js';
export function googleStore(config: GoogleConfig): GoogleStore {
  const client = createClient(config.supabaseUrl, config.serviceKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return { async command(userId, action, payload = {}) {
    const { data, error } = await client.rpc('google_calendar_command', { p_user_id: userId, p_action: action, p_payload: payload });
    if (error) throw new GoogleError(['22023','40001'].includes(error.code) ? 409 : 503,
      error.code === '40001' ? 'stale_integration' : error.code === '22023' ? 'invalid_attempt' : 'integration_storage_unavailable');
    return data as GoogleState;
  } };
}
