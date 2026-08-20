import { act, render, screen, userEvent } from '@testing-library/react-native';
import { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { PropsWithChildren } from 'react';
import { Pressable, Text } from 'react-native';

import { isAuthDevRouteAvailable } from '@/features/auth/auth-dev-availability';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { createApiClient } from '@/lib/api/client';

jest.mock('@/lib/supabase/client', () => ({
  supabase: { auth: { getSession: jest.fn() } },
}));

const testUser = {
  email: 'person@example.com',
  id: 'user-123',
} as User;

const testSession = {
  access_token: 'test-access-token',
  expires_in: 3600,
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  user: testUser,
} as Session;

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

function createMockSupabaseClient(initialSession: Session | null) {
  let listener: AuthListener | undefined;
  const unsubscribe = jest.fn();
  const auth = {
    getSession: jest.fn().mockResolvedValue({
      data: { session: initialSession },
      error: null,
    }),
    onAuthStateChange: jest.fn((nextListener: AuthListener) => {
      listener = nextListener;
      return { data: { subscription: { unsubscribe } } };
    }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockImplementation(async () => {
      listener?.('SIGNED_OUT', null);
      return { error: null };
    }),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
  };

  return {
    auth,
    client: { auth } as unknown as SupabaseClient,
    emit: (event: AuthChangeEvent, session: Session | null) => listener?.(event, session),
    unsubscribe,
  };
}

function AuthProbe() {
  const { isLoading, session, signOut, user } = useAuth();

  if (isLoading) return <Text>loading</Text>;
  if (!session) return <Text>signed out</Text>;

  return (
    <>
      <Text>signed in: {user?.email}</Text>
      <Pressable accessibilityRole="button" onPress={signOut}>
        <Text>sign out</Text>
      </Pressable>
    </>
  );
}

function TestAuthProvider({
  children,
  client,
}: PropsWithChildren<{ client: SupabaseClient }>) {
  return <AuthProvider client={client}>{children}</AuthProvider>;
}

describe('mobile Auth infrastructure', () => {
  it('does not let a stale bootstrap result overwrite a newer signed-in session', async () => {
    let resolveSession: ((value: unknown) => void) | undefined;
    const mock = createMockSupabaseClient(null);
    mock.auth.getSession.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );

    await render(
      <TestAuthProvider client={mock.client}>
        <AuthProbe />
      </TestAuthProvider>,
    );

    expect(screen.getByText('loading')).toBeTruthy();

    await act(async () => {
      mock.emit('SIGNED_IN', testSession);
    });
    expect(screen.getByText('signed in: person@example.com')).toBeTruthy();

    await act(async () => {
      resolveSession?.({ data: { session: null }, error: null });
    });

    expect(screen.getByText('signed in: person@example.com')).toBeTruthy();
  });

  it('starts in loading state and restores the persisted session', async () => {
    let resolveSession: ((value: unknown) => void) | undefined;
    const mock = createMockSupabaseClient(null);
    mock.auth.getSession.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );

    const view = await render(
      <TestAuthProvider client={mock.client}>
        <AuthProbe />
      </TestAuthProvider>,
    );

    expect(screen.getByText('loading')).toBeTruthy();

    await act(async () => {
      resolveSession?.({ data: { session: testSession }, error: null });
    });

    expect(screen.getByText('signed in: person@example.com')).toBeTruthy();
    await view.unmount();
    expect(mock.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('synchronizes auth-state events and signs out through Supabase', async () => {
    const user = userEvent.setup();
    const mock = createMockSupabaseClient(null);
    await render(
      <TestAuthProvider client={mock.client}>
        <AuthProbe />
      </TestAuthProvider>,
    );

    expect(await screen.findByText('signed out')).toBeTruthy();

    await act(async () => {
      mock.emit('SIGNED_IN', testSession);
    });
    expect(screen.getByText('signed in: person@example.com')).toBeTruthy();

    await user.press(screen.getByRole('button', { name: 'sign out' }));
    expect(mock.auth.signOut).toHaveBeenCalledTimes(1);
    expect(screen.getByText('signed out')).toBeTruthy();
  });

  it('injects the current access token and omits Authorization when signed out', async () => {
    const fetchImplementation = jest.fn().mockResolvedValue({
      json: async () => ({ ok: true }),
      ok: true,
      status: 200,
    });
    const getAccessToken = jest
      .fn<Promise<string | null>, []>()
      .mockResolvedValueOnce('current-token')
      .mockResolvedValueOnce(null);
    const request = createApiClient({
      baseUrl: 'http://api.example.test',
      fetchImplementation,
      getAccessToken,
    });

    await request('/auth/me');
    await request('/health');

    const authenticatedHeaders = fetchImplementation.mock.calls[0][1].headers as Headers;
    const signedOutHeaders = fetchImplementation.mock.calls[1][1].headers as Headers;
    expect(authenticatedHeaders.get('Authorization')).toBe('Bearer current-token');
    expect(signedOutHeaders.has('Authorization')).toBe(false);
    expect(getAccessToken).toHaveBeenCalledTimes(2);
  });

  it('does not issue an Auth-required request while signed out', async () => {
    const fetchImplementation = jest.fn();
    const request = createApiClient({
      baseUrl: 'http://api.example.test',
      fetchImplementation,
      getAccessToken: async () => null,
    });

    await expect(request('/auth/me', { auth: 'required' })).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it('keeps the technical Auth route disabled outside development', () => {
    expect(isAuthDevRouteAvailable(true)).toBe(true);
    expect(isAuthDevRouteAvailable(false)).toBe(false);
  });
});
