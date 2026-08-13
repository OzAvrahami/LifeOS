import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, use, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { supabase } from '@/lib/supabase/client';

import { AuthContextValue, SignInCredentials, SignUpCredentials } from './auth.types';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  client = supabase,
}: PropsWithChildren<{ client?: SupabaseClient }>) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
      if (event === 'SIGNED_OUT') setIsRecovery(false);
      setIsLoading(false);
    });

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        setSession(error ? null : data.session);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    if (AppState.currentState === 'active') {
      client.auth.startAutoRefresh();
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        client.auth.startAutoRefresh();
      } else {
        client.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.remove();
      client.auth.stopAutoRefresh();
    };
  }, [client]);

  const beginRecovery = useCallback(() => setIsRecovery(true), []);
  const clearRecovery = useCallback(() => setIsRecovery(false), []);
  const requestPasswordReset = useCallback(
    async (email: string, redirectTo: string) => {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
    },
    [client],
  );
  const resendVerification = useCallback(
    async (email: string, emailRedirectTo: string) => {
      const { error } = await client.auth.resend({
        email,
        options: { emailRedirectTo },
        type: 'signup',
      });
      if (error) throw error;
    },
    [client],
  );
  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      const { data, error } = await client.auth.signInWithPassword(credentials);
      if (error) throw error;
      const authenticatedSession = data.session ?? (await client.auth.getSession()).data.session;
      if (!authenticatedSession) throw new Error('Supabase did not return a session');
      return authenticatedSession;
    },
    [client],
  );
  const signOut = useCallback(async () => {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    setIsRecovery(false);
  }, [client]);
  const signUp = useCallback(
    async ({ email, emailRedirectTo, name, password }: SignUpCredentials) => {
      const { data, error } = await client.auth.signUp({
        email,
        options: {
          data: { name },
          emailRedirectTo,
        },
        password,
      });
      if (error) throw error;
      return data.session;
    },
    [client],
  );
  const updatePassword = useCallback(
    async (password: string) => {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
    },
    [client],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      beginRecovery,
      clearRecovery,
      isLoading,
      isRecovery,
      requestPasswordReset,
      resendVerification,
      session,
      signIn,
      signOut,
      signUp,
      updatePassword,
      user: session?.user ?? null,
    }),
    [
      beginRecovery,
      clearRecovery,
      isLoading,
      isRecovery,
      requestPasswordReset,
      resendVerification,
      session,
      signIn,
      signOut,
      signUp,
      updatePassword,
    ],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
