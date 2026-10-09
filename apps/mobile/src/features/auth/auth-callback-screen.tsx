import * as Linking from 'expo-linking';
import { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
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
  const { beginRecovery, session, isLoading, isRecovery } = useAuth();
  const [completed, setCompleted] = useState<{ userId: string; intent: 'signup' | 'recovery' } | null>(null);
  const handledUrl = useRef<string | undefined>(undefined);
  const isMounted = useRef(true);
  const handlers = useRef({ onConfirmed, onExpired, onRecovery });

  useEffect(() => {
    handlers.current = { onConfirmed, onExpired, onRecovery };
  }, [onConfirmed, onExpired, onRecovery]);

  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

  // SDK callbacks return before React has necessarily hydrated the new session.
  // Wait for the route guard to admit this account before navigating away.
  useEffect(() => {
    if (!completed || isLoading || session?.user.id !== completed.userId) return;
    if (completed.intent === 'recovery') {
      if (isRecovery) handlers.current.onRecovery();
    } else if (!isRecovery) handlers.current.onConfirmed();
  }, [completed, isLoading, isRecovery, session?.user.id]);

  useEffect(() => {
    const handle = async () => {
      let url: string | null = null;
      try {
        url = await resolveUrl(linkingUrl);
        if (!url) throw new Error('Missing callback');
        if (url === handledUrl.current) return;
        handledUrl.current = url;
        const result = await processAuthCallback(client, url);
        clearSensitiveParameters(url);
        if (!isMounted.current) return;
        if (result.intent === 'recovery') {
          await beginRecovery(result.session);
          if (isMounted.current) setCompleted({ userId: result.session.user.id, intent: result.intent });
          return;
        }

        if (isMounted.current) setCompleted({ userId: result.session.user.id, intent: result.intent });
      } catch {
        if (url) { try { clearSensitiveParameters(url); } catch { /* Invalid URL has no safe path to reuse. */ } }
        if (isMounted.current) handlers.current.onExpired();
      }
    };

    void handle();
  }, [beginRecovery, clearSensitiveParameters, client, linkingUrl, resolveUrl]);

  return <AuthLoadingScreen label="מאמת את הקישור…" />;
}
