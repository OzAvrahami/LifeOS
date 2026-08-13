import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const supabaseAuthOptions = {
  autoRefreshToken: false,
  detectSessionInUrl: false,
  persistSession: false,
} as const;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured');
  }

  return { publishableKey, url };
}

export async function verifyAccessToken(accessToken: string): Promise<User | null> {
  const { publishableKey, url } = getSupabaseConfig();
  const supabase = createClient(url, publishableKey, { auth: supabaseAuthOptions });
  const { data, error } = await supabase.auth.getUser(accessToken);

  return error ? null : data.user;
}

export function createUserSupabaseClient(accessToken: string): SupabaseClient {
  const { publishableKey, url } = getSupabaseConfig();

  return createClient(url, publishableKey, {
    accessToken: async () => accessToken,
    auth: supabaseAuthOptions,
  });
}
