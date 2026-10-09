import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { supabase } from '@/lib/supabase/client';

import { AuthContextValue, SignInCredentials, SignUpCredentials } from './auth.types';
import { isRecoverySession, saveRecoverySession } from './recovery-state';

const AuthContext = createContext<AuthContextValue | null>(null);
const sessionIdentity = (value: Session) => `${value.user.id}:${value.user.last_sign_in_at ?? ''}`;

export function AuthProvider({
  children,
  client = supabase,
}: PropsWithChildren<{ client?: SupabaseClient }>) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const signingOut = useRef(false);
  const finishAuthentication = useCallback(() => setIsAuthenticating(false), []);
  const sessionRef = useRef<Session | null>(null);
  const recoveryIdentity = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let hasReceivedAuthEvent = false;
    let generation = 0;
    const applySession = async (nextSession: Session | null, recoveryEvent = false) => {
      const current = ++generation;
      sessionRef.current = nextSession;
      const recovery = recoveryEvent || await isRecoverySession(nextSession).catch(() => false);
      if (!isMounted || current !== generation) return;
      setIsRecovery(recovery || !!nextSession && recoveryIdentity.current === sessionIdentity(nextSession));
      setSession(nextSession);
      setIsLoading(false);
    };
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT' && sessionRef.current && !signingOut.current) setSessionExpired(true);
      if (nextSession) setSessionExpired(false);
      hasReceivedAuthEvent = true;
      if (event === 'PASSWORD_RECOVERY') void saveRecoverySession(nextSession).catch(() => undefined);
      if (event === 'SIGNED_OUT') void saveRecoverySession(null).catch(() => undefined);
      void applySession(nextSession, event === 'PASSWORD_RECOVERY');
    });

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted || hasReceivedAuthEvent) return;
        void applySession(error ? null : data.session);
      })
      .catch(() => {
        if (!isMounted || hasReceivedAuthEvent) return;
        void applySession(null);
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

  const beginRecovery = useCallback(async (verifiedSession?: Session) => {
    const current = verifiedSession ?? sessionRef.current;
    if (!current) throw new Error('Recovery requires a verified session');
    recoveryIdentity.current = sessionIdentity(current);
    setIsRecovery(true);
    await saveRecoverySession(current);
  }, []);
  const clearRecovery = useCallback(() => { recoveryIdentity.current = null; setIsRecovery(false); void saveRecoverySession(null).catch(() => undefined); }, []);
  const requestPasswordReset = useCallback(
    async (email: string, redirectTo: string) => {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      // Match the neutral success response for provider account-existence errors.
      if (error && !['user_not_found', 'email_not_found'].includes(error.code ?? '')) throw error;
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
      setIsAuthenticating(true);
      const { data, error } = await client.auth.signInWithPassword(credentials);
      if (error) throw error;
      const authenticatedSession = data.session;
      if (!authenticatedSession) throw new Error('Supabase did not return a session');
      await saveRecoverySession(null);
      recoveryIdentity.current = null;
      setIsRecovery(false);
      return authenticatedSession;
    },
    [client],
  );
  const signOut = useCallback(async () => {
    signingOut.current = true;
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      await saveRecoverySession(null);
      sessionRef.current = null;
      recoveryIdentity.current = null;
      setSession(null);
      setIsRecovery(false);
      setSessionExpired(false);
    } finally { signingOut.current = false; }
  }, [client]);
  const signUp = useCallback(
    async ({ email, emailRedirectTo, name, password }: SignUpCredentials) => {
      setIsAuthenticating(true);
      const { data, error } = await client.auth.signUp({
        email,
        options: {
          data: name ? { name } : {},
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
      const recovering = sessionRef.current;
      if (!recovering || !await isRecoverySession(recovering)
        || sessionRef.current?.user.id !== recovering.user.id
        || sessionRef.current?.user.last_sign_in_at !== recovering.user.last_sign_in_at) {
        throw Object.assign(new Error('Recovery session required'), { code: 'session_not_found' });
      }
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
      isAuthenticating,
      sessionExpired,
      finishAuthentication,
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
      isAuthenticating,
      sessionExpired,
      finishAuthentication,
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
