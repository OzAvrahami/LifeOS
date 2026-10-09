import 'react-native-url-polyfill/auto';

import { createClient, processLock } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { nativeSessionStorage } from './session-storage';

function requirePublicEnvironmentValue(name: string, value: string | undefined) {
  if (!value?.trim()) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

const supabaseUrl = requirePublicEnvironmentValue(
  'EXPO_PUBLIC_SUPABASE_URL',
  process.env.EXPO_PUBLIC_SUPABASE_URL,
);
const supabasePublishableKey = requirePublicEnvironmentValue(
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(Platform.OS === 'web' ? {} : { storage: nativeSessionStorage }),
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: processLock,
    persistSession: true,
  },
});
