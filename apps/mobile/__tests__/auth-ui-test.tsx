import { act, render, screen, userEvent } from '@testing-library/react-native';
import { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { PropsWithChildren, ReactElement, useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { processAuthCallback, sanitizedAuthCallbackPath } from '@/features/auth/auth-callback';
import { AuthCallbackScreen } from '@/features/auth/auth-callback-screen';
import { getAuthGateState } from '@/features/auth/auth-gate';
import { AuthProvider } from '@/features/auth/auth-provider';
import { ForgotPasswordScreen } from '@/features/auth/forgot-password-screen';
import { ResetPasswordScreen } from '@/features/auth/reset-password-screen';
import { SignInScreen } from '@/features/auth/sign-in-screen';
import { SignUpScreen } from '@/features/auth/sign-up-screen';
import { VerifyEmailScreen } from '@/features/auth/verify-email-screen';
import { WelcomeScreen } from '@/features/auth/welcome-screen';

jest.mock('@/lib/supabase/client', () => ({
  supabase: { auth: { getSession: jest.fn() } },
}));

jest.mock('@/features/auth/auth-navigation', () => ({
  createAuthCallbackUrl: (intent: string) => `lifeos://auth/callback?intent=${intent}`,
}));

const testUser = { email: 'person@example.com', id: 'user-123' } as User;
const testSession = {
  access_token: 'hidden-access-token',
  expires_in: 3600,
  refresh_token: 'hidden-refresh-token',
  token_type: 'bearer',
  user: testUser,
} as Session;

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

function createAuthClient({ session = null }: { session?: Session | null } = {}) {
  let listener: AuthListener | undefined;
  const auth = {
    exchangeCodeForSession: jest.fn(),
    getSession: jest.fn().mockResolvedValue({ data: { session }, error: null }),
    onAuthStateChange: jest.fn((callback: AuthListener) => {
      listener = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    }),
    resend: jest.fn().mockResolvedValue({ data: {}, error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
    setSession: jest.fn(),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { session: testSession, user: testUser }, error: null }),
    signOut: jest.fn().mockImplementation(async () => {
      listener?.('SIGNED_OUT', null);
      return { error: null };
    }),
    signUp: jest.fn().mockResolvedValue({ data: { session: null, user: testUser }, error: null }),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
    updateUser: jest.fn().mockResolvedValue({ data: { user: testUser }, error: null }),
    verifyOtp: jest.fn(),
  };
  return {
    auth,
    client: { auth } as unknown as SupabaseClient,
    emit: (event: AuthChangeEvent, nextSession: Session | null) => listener?.(event, nextSession),
  };
}

const initialMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

function Providers({ children, client }: PropsWithChildren<{ client: SupabaseClient }>) {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <AuthProvider client={client}>{children}</AuthProvider>
    </SafeAreaProvider>
  );
}

async function renderAuth(element: ReactElement, mock = createAuthClient()) {
  const view = await render(<Providers client={mock.client}>{element}</Providers>);
  await act(async () => undefined);
  return { mock, view };
}

function CallbackFlowHarness({
  clearSensitiveParameters,
  client,
  url,
}: {
  clearSensitiveParameters: (url: string) => void;
  client: SupabaseClient;
  url: string;
}) {
  const [destination, setDestination] = useState<'callback' | 'reset-password' | 'sign-in'>('callback');

  if (destination === 'sign-in') return <Text>Sign In destination</Text>;
  if (destination === 'reset-password') return <Text>Reset Password destination</Text>;

  return (
    <AuthCallbackScreen
      clearSensitiveParameters={clearSensitiveParameters}
      client={client}
      onConfirmed={() => setDestination('sign-in')}
      onExpired={() => setDestination('sign-in')}
      onRecovery={() => setDestination('reset-password')}
      resolveUrl={async () => url}
    />
  );
}

describe('production Auth UI', () => {
  it('navigates from Welcome to sign in or sign up', async () => {
    const user = userEvent.setup();
    const onSignIn = jest.fn();
    const onSignUp = jest.fn();
    await render(<WelcomeScreen onSignIn={onSignIn} onSignUp={onSignUp} />);

    await user.press(screen.getByRole('button', { name: 'התחברות' }));
    await user.press(screen.getByRole('button', { name: 'הרשמה' }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onSignUp).toHaveBeenCalledTimes(1);
  });

  it('validates Sign In before calling Supabase', async () => {
    const user = userEvent.setup();
    const { mock } = await renderAuth(
      <SignInScreen onAuthenticated={jest.fn()} onBack={jest.fn()} onForgotPassword={jest.fn()} onSignUp={jest.fn()} />,
    );
    await user.press(screen.getByRole('button', { name: 'התחברות' }));
    expect(screen.getByText('צריך למלא אימייל וסיסמה.')).toBeTruthy();
    expect(mock.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('signs in, verifies /auth/me, and enters the product without rendering tokens', async () => {
    const user = userEvent.setup();
    const verifyIdentity = jest.fn().mockResolvedValue({ id: testUser.id, email: testUser.email });
    const onAuthenticated = jest.fn();
    await renderAuth(
      <SignInScreen onAuthenticated={onAuthenticated} onBack={jest.fn()} onForgotPassword={jest.fn()} onSignUp={jest.fn()} verifyIdentity={verifyIdentity} />,
    );

    await user.type(screen.getByLabelText('אימייל'), 'person@example.com');
    await user.type(screen.getByLabelText('סיסמה'), 'password1');
    await user.press(screen.getByRole('button', { name: 'התחברות' }));

    expect(verifyIdentity).toHaveBeenCalledWith('user-123');
    expect(onAuthenticated).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('hidden-access-token')).toBeNull();
    expect(screen.queryByText('hidden-refresh-token')).toBeNull();
  });

  it('maps invalid credentials to the approved calm error', async () => {
    const user = userEvent.setup();
    const mock = createAuthClient();
    mock.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    await renderAuth(
      <SignInScreen onAuthenticated={jest.fn()} onBack={jest.fn()} onForgotPassword={jest.fn()} onSignUp={jest.fn()} />,
      mock,
    );
    await user.type(screen.getByLabelText('אימייל'), 'person@example.com');
    await user.type(screen.getByLabelText('סיסמה'), 'wrong-pass');
    await user.press(screen.getByRole('button', { name: 'התחברות' }));
    expect(screen.getByText('אימייל או סיסמה שגויים')).toBeTruthy();
  });

  it('validates Sign Up fields and password confirmation', async () => {
    const user = userEvent.setup();
    const { mock } = await renderAuth(
      <SignUpScreen onAuthenticated={jest.fn()} onBack={jest.fn()} onSignIn={jest.fn()} onVerificationRequired={jest.fn()} />,
    );
    await user.type(screen.getByLabelText('שם'), 'עוז');
    await user.type(screen.getByLabelText('אימייל'), 'person@example.com');
    await user.type(screen.getByLabelText('סיסמה'), 'password1');
    await user.type(screen.getByLabelText('אימות סיסמה'), 'password2');
    await user.press(screen.getByRole('button', { name: 'יצירת חשבון' }));
    expect(screen.getByText('הסיסמאות אינן תואמות')).toBeTruthy();
    expect(mock.auth.signUp).not.toHaveBeenCalled();
  });

  it('routes confirmed-required signup to Verify Email with safe name metadata', async () => {
    const user = userEvent.setup();
    const onVerificationRequired = jest.fn();
    const { mock } = await renderAuth(
      <SignUpScreen onAuthenticated={jest.fn()} onBack={jest.fn()} onSignIn={jest.fn()} onVerificationRequired={onVerificationRequired} />,
    );
    await user.type(screen.getByLabelText('שם'), 'עוז');
    await user.type(screen.getByLabelText('אימייל'), 'person@example.com');
    await user.type(screen.getByLabelText('סיסמה'), 'password1');
    await user.type(screen.getByLabelText('אימות סיסמה'), 'password1');
    await user.press(screen.getByRole('button', { name: 'יצירת חשבון' }));

    expect(onVerificationRequired).toHaveBeenCalledWith('person@example.com');
    expect(mock.auth.signUp.mock.calls[0][0].options.data).toEqual({ name: 'עוז' });
  });

  it('accepts an immediate signup session and verifies the Node API', async () => {
    const user = userEvent.setup();
    const mock = createAuthClient();
    mock.auth.signUp.mockResolvedValueOnce({ data: { session: testSession, user: testUser }, error: null });
    const verifyIdentity = jest.fn().mockResolvedValue({ id: testUser.id });
    const onAuthenticated = jest.fn();
    await renderAuth(
      <SignUpScreen onAuthenticated={onAuthenticated} onBack={jest.fn()} onSignIn={jest.fn()} onVerificationRequired={jest.fn()} verifyIdentity={verifyIdentity} />,
      mock,
    );
    await user.type(screen.getByLabelText('שם'), 'עוז');
    await user.type(screen.getByLabelText('אימייל'), 'person@example.com');
    await user.type(screen.getByLabelText('סיסמה'), 'password1');
    await user.type(screen.getByLabelText('אימות סיסמה'), 'password1');
    await user.press(screen.getByRole('button', { name: 'יצירת חשבון' }));
    expect(verifyIdentity).toHaveBeenCalledWith('user-123');
    expect(onAuthenticated).toHaveBeenCalledTimes(1);
  });

  it('maps an existing-account signup error safely', async () => {
    const user = userEvent.setup();
    const mock = createAuthClient();
    mock.auth.signUp.mockResolvedValueOnce({ data: { session: null, user: null }, error: { code: 'user_already_exists' } });
    await renderAuth(
      <SignUpScreen initialState="validation" onAuthenticated={jest.fn()} onBack={jest.fn()} onSignIn={jest.fn()} onVerificationRequired={jest.fn()} />,
      mock,
    );
    await user.clear(screen.getByLabelText('אימות סיסמה'));
    await user.type(screen.getByLabelText('אימות סיסמה'), 'password1');
    await user.press(screen.getByRole('button', { name: 'יצירת חשבון' }));
    expect(screen.getByText('כבר קיים חשבון עם כתובת המייל הזו.')).toBeTruthy();
  });

  it('resends verification and returns to sign in', async () => {
    const user = userEvent.setup();
    const onSignIn = jest.fn();
    const { mock } = await renderAuth(<VerifyEmailScreen email="person@example.com" onBack={jest.fn()} onSignIn={onSignIn} />);
    await user.press(screen.getByRole('button', { name: 'שליחה מחדש' }));
    expect(mock.auth.resend).toHaveBeenCalledWith(expect.objectContaining({ email: 'person@example.com', type: 'signup' }));
    expect(screen.getByText('מייל אימות חדש נשלח.')).toBeTruthy();
    await user.press(screen.getByRole('button', { name: 'חזרה להתחברות' }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('requests a privacy-preserving password reset and shows the sent state', async () => {
    const user = userEvent.setup();
    const { mock } = await renderAuth(<ForgotPasswordScreen onBack={jest.fn()} onSignIn={jest.fn()} />);
    await user.type(screen.getByLabelText('אימייל'), 'person@example.com');
    await user.press(screen.getByRole('button', { name: 'שליחת קישור לאיפוס' }));
    expect(mock.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
    expect(screen.getByText('הקישור נשלח')).toBeTruthy();
    expect(screen.getByText(/אם הכתובת קיימת אצלנו/)).toBeTruthy();
  });

  it('validates and updates a password only in recovery mode, then signs out', async () => {
    const user = userEvent.setup();
    const mock = createAuthClient({ session: testSession });
    await renderAuth(<ResetPasswordScreen onRequestNewLink={jest.fn()} onSignIn={jest.fn()} />, mock);
    await act(async () => mock.emit('PASSWORD_RECOVERY', testSession));
    await user.type(screen.getByLabelText('סיסמה חדשה'), 'new-pass-1');
    await user.type(screen.getByLabelText('אימות סיסמה'), 'new-pass-1');
    await user.press(screen.getByRole('button', { name: 'שמירת סיסמה חדשה' }));
    expect(mock.auth.updateUser).toHaveBeenCalledWith({ password: 'new-pass-1' });
    expect(mock.auth.signOut).toHaveBeenCalledTimes(1);
    expect(screen.getByText('הסיסמה עודכנה')).toBeTruthy();
  });

  it('renders password mismatch and expired-link recovery actions', async () => {
    const user = userEvent.setup();
    await renderAuth(<ResetPasswordScreen onRequestNewLink={jest.fn()} onSignIn={jest.fn()} />);
    await user.type(screen.getByLabelText('סיסמה חדשה'), 'new-pass-1');
    await user.type(screen.getByLabelText('אימות סיסמה'), 'different');
    await user.press(screen.getByRole('button', { name: 'שמירת סיסמה חדשה' }));
    expect(screen.getByText('הסיסמאות אינן תואמות')).toBeTruthy();

    await renderAuth(<ResetPasswordScreen initialState="expired" onRequestNewLink={jest.fn()} onSignIn={jest.fn()} />);
    expect(screen.getByText('הקישור כבר לא בתוקף')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'בקשת קישור חדש' })).toBeTruthy();
  });
});

describe('Auth callbacks and gate', () => {
  it('completes the real Web signup fragment callback, clears it, signs out, and reaches Sign In', async () => {
    const callbackUrl = 'http://localhost:8081/auth/callback?intent=signup#access_token=mock-access&refresh_token=mock-refresh&expires_in=3600&token_type=bearer';
    const mock = createAuthClient();
    const clearSensitiveParameters = jest.fn();
    mock.auth.setSession.mockImplementationOnce(async () => {
      mock.emit('SIGNED_IN', testSession);
      return { data: { session: testSession, user: testUser }, error: null };
    });

    await renderAuth(
      <CallbackFlowHarness
        clearSensitiveParameters={clearSensitiveParameters}
        client={mock.client}
        url={callbackUrl}
      />,
      mock,
    );

    expect(await screen.findByText('Sign In destination')).toBeTruthy();
    expect(mock.auth.setSession).toHaveBeenCalledWith({
      access_token: 'mock-access',
      refresh_token: 'mock-refresh',
    });
    expect(mock.auth.signOut).toHaveBeenCalledTimes(1);
    expect(clearSensitiveParameters).toHaveBeenCalledWith(callbackUrl);
    expect(screen.queryByText('מאמת את הקישור…')).toBeNull();
    expect(screen.queryByText('mock-access')).toBeNull();
    expect(screen.queryByText('mock-refresh')).toBeNull();
  });

  it('establishes a real Web recovery fragment session and reaches Reset Password without signing out', async () => {
    const callbackUrl = 'http://localhost:8081/auth/callback?intent=recovery#access_token=mock-access&refresh_token=mock-refresh&type=recovery';
    const mock = createAuthClient();
    const clearSensitiveParameters = jest.fn();
    mock.auth.setSession.mockImplementationOnce(async () => {
      mock.emit('SIGNED_IN', testSession);
      return { data: { session: testSession, user: testUser }, error: null };
    });

    await renderAuth(
      <CallbackFlowHarness
        clearSensitiveParameters={clearSensitiveParameters}
        client={mock.client}
        url={callbackUrl}
      />,
      mock,
    );

    expect(await screen.findByText('Reset Password destination')).toBeTruthy();
    expect(mock.auth.setSession).toHaveBeenCalledWith({
      access_token: 'mock-access',
      refresh_token: 'mock-refresh',
    });
    expect(mock.auth.signOut).not.toHaveBeenCalled();
    expect(clearSensitiveParameters).toHaveBeenCalledWith(callbackUrl);
    expect(screen.queryByText('מאמת את הקישור…')).toBeNull();
  });

  it('removes callback credentials from the browser-visible path while preserving intent', () => {
    expect(
      sanitizedAuthCallbackPath(
        'http://localhost:8081/auth/callback?intent=signup#access_token=mock-access&refresh_token=mock-refresh&expires_in=3600&token_type=bearer',
      ),
    ).toBe('/auth/callback?intent=signup');
  });

  it('handles authorization-code, token-hash, and recovery fragment callbacks through Supabase', async () => {
    const codeClient = createAuthClient();
    codeClient.auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { session: testSession }, error: null });
    await expect(processAuthCallback(codeClient.client, 'lifeos://auth/callback?intent=signup&code=opaque-code')).resolves.toEqual({ intent: 'signup', session: testSession });

    const hashClient = createAuthClient();
    hashClient.auth.verifyOtp.mockResolvedValueOnce({ data: { session: testSession, user: testUser }, error: null });
    await expect(processAuthCallback(hashClient.client, 'lifeos://auth/callback?intent=signup&token_hash=opaque-hash&type=signup')).resolves.toEqual({ intent: 'signup', session: testSession });

    const recoveryClient = createAuthClient();
    recoveryClient.auth.setSession.mockResolvedValueOnce({ data: { session: testSession, user: testUser }, error: null });
    await expect(processAuthCallback(recoveryClient.client, 'lifeos://auth/callback?intent=recovery#access_token=opaque-access&refresh_token=opaque-refresh&type=recovery')).resolves.toEqual({ intent: 'recovery', session: testSession });
    expect(recoveryClient.auth.setSession).toHaveBeenCalledWith({
      access_token: 'opaque-access',
      refresh_token: 'opaque-refresh',
    });
  });

  it('rejects invalid callbacks without decoding or rendering token values', async () => {
    const mock = createAuthClient();
    await expect(processAuthCallback(mock.client, 'lifeos://auth/callback?error_code=otp_expired')).rejects.toThrow();
    await expect(processAuthCallback(mock.client, 'http://localhost:8081/auth/callback?intent=signup#error=access_denied&error_code=otp_expired&error_description=expired')).rejects.toThrow();
    expect(mock.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(mock.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('gates product routes while signed out or loading and preserves development previews', () => {
    expect(getAuthGateState({ hasSession: false, isDevelopmentPreview: false, isLoading: false, isRecovery: false })).toEqual({
      productAvailable: false,
      publicAuthAvailable: true,
      showLoading: false,
    });
    expect(getAuthGateState({ hasSession: true, isDevelopmentPreview: false, isLoading: false, isRecovery: false }).productAvailable).toBe(true);
    expect(getAuthGateState({ hasSession: false, isDevelopmentPreview: false, isLoading: true, isRecovery: false }).showLoading).toBe(true);
    expect(getAuthGateState({ hasSession: false, isDevelopmentPreview: true, isLoading: true, isRecovery: false })).toEqual({
      productAvailable: true,
      publicAuthAvailable: true,
      showLoading: false,
    });
    expect(getAuthGateState({ hasSession: true, isDevelopmentPreview: false, isLoading: false, isRecovery: true }).productAvailable).toBe(false);
  });
});
