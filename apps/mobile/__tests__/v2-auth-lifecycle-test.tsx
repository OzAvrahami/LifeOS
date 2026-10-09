import { act, render, screen } from '@testing-library/react-native';
import type { Session, SupabaseClient, AuthChangeEvent } from '@supabase/supabase-js';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { saveRecoverySession, isRecoverySession } from '@/features/auth/recovery-state';
import { processAuthCallback } from '@/features/auth/auth-callback';
import { validateSignUp, validatePasswordReset } from '@/features/auth/auth-validation';
import { rememberAuthDestination, consumeAuthDestination } from '@/features/auth/auth-destination';
import { needsOnboarding, newAccountMetadata } from '@/features/auth/onboarding-state';

jest.mock('@/lib/supabase/session-storage', () => ({ recoveryStorage: require('@react-native-async-storage/async-storage') }));
const session = { user: { id: 'A', last_sign_in_at: '2026-10-08T12:00:00Z' }, access_token: 'synthetic', refresh_token: 'synthetic' } as Session;
let value: ReturnType<typeof useAuth>;
function Probe() { value = useAuth(); return <Text>{value.isLoading ? 'loading' : value.session ? value.isRecovery ? 'recovery' : 'product' : 'signed out'}</Text>; }
function client(initial: Session | null) {
  let listener: (event: AuthChangeEvent, session: Session | null) => void;
  const auth = {
    getSession: jest.fn(async () => ({ data: { session: initial }, error: null })),
    onAuthStateChange: jest.fn(callback => { listener = callback; return { data: { subscription: { unsubscribe: jest.fn() } } }; }),
    startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn(),
    updateUser: jest.fn(async () => ({ error: null })),
    signOut: jest.fn(async () => { listener('SIGNED_OUT', null); return { error: null }; }),
    resetPasswordForEmail: jest.fn(), exchangeCodeForSession: jest.fn(), verifyOtp: jest.fn(), setSession: jest.fn(),
  };
  return { auth, client: { auth } as unknown as SupabaseClient, emit: (event: AuthChangeEvent, next: Session | null) => listener(event, next) };
}
beforeEach(async () => { await saveRecoverySession(null); consumeAuthDestination(); });
it('restores recovery restriction after restart and keeps refreshed tokens in the same recovery flow', async () => {
  await saveRecoverySession(session);
  const mock = client(session);
  const view = await render(<AuthProvider client={mock.client}><Probe /></AuthProvider>);
  expect(await screen.findByText('recovery')).toBeTruthy();
  await act(async () => mock.emit('TOKEN_REFRESHED', { ...session, access_token: 'rotated' }));
  expect(screen.getByText('recovery')).toBeTruthy();
  await view.unmount();
  await render(<AuthProvider client={mock.client}><Probe /></AuthProvider>);
  expect(await screen.findByText('recovery')).toBeTruthy();
});
it('does not apply a recovery marker to another account or a new login session', async () => {
  await saveRecoverySession(session);
  expect(await isRecoverySession({ ...session, user: { ...session.user, id: 'B' } })).toBe(false);
  expect(await isRecoverySession({ ...session, user: { ...session.user, last_sign_in_at: 'later' } })).toBe(false);
});
it('ignores late onboarding completion after the account has changed', async () => {
  const initial = { ...session, user: { ...session.user, user_metadata: { ...newAccountMetadata } } };
  const mock = client(initial);
  let resolve: (value: unknown) => void = () => {};
  mock.auth.updateUser.mockImplementationOnce(() => new Promise(done => { resolve = done; }) as never);
  await render(<AuthProvider client={mock.client}><Probe /></AuthProvider>);
  await screen.findByText('product');
  let completion: Promise<void>;
  await act(async () => { completion = value.completeOnboarding(); });
  await act(async () => mock.emit('SIGNED_IN', { ...initial, user: { ...initial.user, id: 'B' } }));
  await act(async () => {
    resolve({ data: { user: { ...initial.user, user_metadata: { ...newAccountMetadata, lifeos_onboarding_completed_at: 'saved' } } }, error: null });
    await expect(completion!).rejects.toThrow('Account changed');
  });
  expect(value.user?.id).toBe('B'); expect(needsOnboarding(value.user)).toBe(true);
});
it('rejects password updates outside a provider-verified recovery flow', async () => {
  const mock = client(session);
  await render(<AuthProvider client={mock.client}><Probe /></AuthProvider>);
  await screen.findByText('product');
  await expect(value.updatePassword('synthetic')).rejects.toMatchObject({ code: 'session_not_found' });
  expect(mock.auth.updateUser).not.toHaveBeenCalled();
});
it('distinguishes session expiry from explicit local logout and clears recovery state', async () => {
  const mock = client(session);
  await render(<AuthProvider client={mock.client}><Probe /></AuthProvider>);
  await screen.findByText('product');
  await act(async () => mock.emit('SIGNED_OUT', null));
  expect(value.sessionExpired).toBe(true);
  await act(async () => mock.emit('PASSWORD_RECOVERY', session));
  await act(async () => { await value.signOut(); });
  expect(value.sessionExpired).toBe(false);
  expect(mock.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(await isRecoverySession(session)).toBe(false);
});
it('uses the same neutral recovery outcome for an unknown email while preserving rate-limit errors', async () => {
  const mock = client(null);
  await render(<AuthProvider client={mock.client}><Probe /></AuthProvider>);
  await screen.findByText('signed out');
  mock.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: { code: 'user_not_found' } });
  await expect(value.requestPasswordReset('synthetic@example.test', 'lifeos://auth/callback')).resolves.toBeUndefined();
  mock.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: { code: 'over_email_send_rate_limit' } });
  await expect(value.requestPasswordReset('synthetic@example.test', 'lifeos://auth/callback')).rejects.toMatchObject({ code: 'over_email_send_rate_limit' });
});
it.each([
  'lifeos://auth/callback?intent=signup',
  'lifeos://wrong?code=synthetic',
  'lifeos://auth/callback?code=one&code=two',
  'lifeos://auth/callback?code=one#code=two',
  'lifeos://auth/callback?code=one&token_hash=two&type=signup',
  'lifeos://auth/callback#access_token=one',
  'lifeos://auth/callback?token_hash=one&type=invite',
])('rejects unproven or ambiguous callback: %s', async url => {
  const mock = client(session);
  await expect(processAuthCallback(mock.client, url)).rejects.toThrow();
  expect(mock.auth.getSession).not.toHaveBeenCalled();
  expect(mock.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  expect(mock.auth.setSession).not.toHaveBeenCalled();
  expect(mock.auth.signOut).not.toHaveBeenCalled();
});
it('honors the SDK recovery code result and surfaces used-link rejection', async () => {
  const mock = client(null);
  mock.auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { session, redirectType: 'recovery' }, error: null });
  expect((await processAuthCallback(mock.client, 'lifeos://auth/callback?code=synthetic')).intent).toBe('recovery');
  mock.auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('used') });
  await expect(processAuthCallback(mock.client, 'lifeos://auth/callback?code=synthetic')).rejects.toThrow('used');
});
it('allows optional name and defers password strength to the provider while requiring matching nonempty input', () => {
  expect(validateSignUp('', 'person@example.test', '123456', '123456')).toBeUndefined();
  expect(validatePasswordReset('123456', '123456')).toBeUndefined();
  expect(validatePasswordReset('', '')).toBeTruthy();
  expect(validatePasswordReset('abc', 'def')).toBeTruthy();
});
it('resumes only a known internal destination once, without accepting external URLs', () => {
  rememberAuthDestination('/task', 'task-123');
  rememberAuthDestination('https://example.test/steal');
  expect(consumeAuthDestination()).toBe('/task?id=task-123');
  expect(consumeAuthDestination()).toBe('/');
});
