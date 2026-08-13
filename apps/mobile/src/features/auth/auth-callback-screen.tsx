import * as Linking from 'expo-linking';
import { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase/client';

import { processAuthCallback, sanitizedAuthCallbackPath } from './auth-callback';
import { AuthLoadingScreen } from './auth-loading-screen';
import { useAuth } from './auth-provider';

function currentWebUrl() {
  return Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : null;
}

async function resolveCallbackUrl(linkingUrl: string | null) {
  return currentWebUrl() ?? linkingUrl ?? Linking.getInitialURL();
}

function clearSensitiveWebCallbackParameters(url: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  window.history.replaceState(window.history.state, '', sanitizedAuthCallbackPath(url));
}

export function AuthCallbackScreen({
  onConfirmed,
  onExpired,
  onRecovery,
  client = supabase,
  clearSensitiveParameters = clearSensitiveWebCallbackParameters,
  resolveUrl = resolveCallbackUrl,
}: {
  onConfirmed: () => void;
  onExpired: () => void;
  onRecovery: () => void;
  client?: SupabaseClient;
  clearSensitiveParameters?: (url: string) => void;
  resolveUrl?: (linkingUrl: string | null) => Promise<string | null>;
}) {
  const linkingUrl = Linking.useURL();
  const { beginRecovery, signOut } = useAuth();
  const handledUrl = useRef<string | undefined>(undefined);
  const isMounted = useRef(true);
  const handlers = useRef({ onConfirmed, onExpired, onRecovery });

  useEffect(() => {
    handlers.current = { onConfirmed, onExpired, onRecovery };
  }, [onConfirmed, onExpired, onRecovery]);

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  useEffect(() => {
    const handle = async () => {
      const url = await resolveUrl(linkingUrl);
      if (!url || url === handledUrl.current) return;
      handledUrl.current = url;
      try {
        const result = await processAuthCallback(client, url);
        clearSensitiveParameters(url);
        if (!isMounted.current) return;
        if (result.intent === 'recovery') {
          beginRecovery();
          handlers.current.onRecovery();
          return;
        }

        await signOut();
        if (isMounted.current) handlers.current.onConfirmed();
      } catch {
        clearSensitiveParameters(url);
        await signOut().catch(() => undefined);
        if (isMounted.current) handlers.current.onExpired();
      }
    };

    void handle();
  }, [beginRecovery, clearSensitiveParameters, client, linkingUrl, resolveUrl, signOut]);

  return <AuthLoadingScreen label="מאמת את הקישור…" />;
}
