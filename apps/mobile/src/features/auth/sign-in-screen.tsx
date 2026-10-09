import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { isIdentityRejection, verifyApiIdentity } from './auth-api';
import { authErrorMessage } from './auth-errors';
import {
  AuthFormError,
  AuthHeading,
  AuthLink,
  AuthPrimaryButton,
  AuthScreen,
  AuthTextField,
  PasswordField,
} from './auth.components';
import { useAuth } from './auth-provider';
import { AuthFormPreviewState } from './auth.types';
import { validateSignIn } from './auth-validation';

export function SignInScreen({
  initialState = 'normal',
  onAuthenticated,
  onBack,
  onForgotPassword,
  onSignUp,
  onVerificationRequired,
  verifyIdentity = verifyApiIdentity,
}: {
  initialState?: AuthFormPreviewState;
  onAuthenticated: () => void;
  onBack: () => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
  onVerificationRequired?: (email: string) => void;
  verifyIdentity?: typeof verifyApiIdentity;
}) {
  const { colors } = useTheme();
  const { signIn, signOut, finishAuthentication, session, isRecovery } = useAuth();
  const [authenticatedId, setAuthenticatedId] = useState<string>();
  useEffect(() => {
    if (authenticatedId && session?.user.id === authenticatedId && !isRecovery) {
      onAuthenticated();
      finishAuthentication();
    }
  }, [authenticatedId, session?.user.id, isRecovery, onAuthenticated, finishAuthentication]);
  const [email, setEmail] = useState(initialState === 'error' ? 'name@example.com' : '');
  const [password, setPassword] = useState(initialState === 'error' ? 'wrong' : '');
  const [error, setError] = useState<string | undefined>(
    initialState === 'error' ? 'אימייל או סיסמה שגויים' : undefined,
  );
  const [isLoading, setIsLoading] = useState(false);

  const submitting = useRef(false);
  const submit = async () => {
    if (submitting.current) return;
    const validationError = validateSignIn(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    submitting.current = true;
    setIsLoading(true);
    let waitingForGuard = false;
    try {
      const session = await signIn({ email: email.trim(), password });
      try { await verifyIdentity(session.user.id); }
      catch (identityError) {
        if (isIdentityRejection(identityError)) { await signOut(); throw identityError; }
        // A transport outage does not invalidate a provider-authenticated session.
        // Product queries retain their own retry/error states and ownership checks.
      }
      setPassword('');
      waitingForGuard = true;
      setAuthenticatedId(session.user.id);
    } catch (caughtError) {

      setError(authErrorMessage(caughtError, 'sign-in'));
    } finally {
      if (!waitingForGuard) finishAuthentication();
      submitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen onBack={onBack}>
      <AuthHeading subtitle="טוב לראות אותך שוב" title="התחברות" />
      <View style={{ gap: 16, paddingTop: error ? 20 : 30 }}>
        {error ? <AuthFormError message={error} /> : null}
        {error === 'צריך לאמת את כתובת המייל לפני ההתחברות.' && onVerificationRequired ? <AuthLink title="שליחת מייל אימות מחדש" onPress={() => onVerificationRequired(email.trim())} /> : null}
        <AuthTextField
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
          keyboardType="email-address"
          onChangeText={setEmail}
          onSubmitEditing={() => undefined}
          placeholder="name@example.com"
          returnKeyType="next"
          textContentType="username"
          value={email}
          label="אימייל"
        />
        <PasswordField
          autoCapitalize="none"
          autoComplete="current-password"
          editable={!isLoading}
          label="סיסמה"
          onChangeText={setPassword}
          onSubmitEditing={submit}
          returnKeyType="done"
          textContentType="password"
          value={password}
        />
        <View style={{ alignItems: 'flex-end' }}>
          <AuthLink onPress={onForgotPassword} title="שכחתי סיסמה" />
        </View>
      </View>
      <View style={{ paddingTop: 26 }}>
        <AuthPrimaryButton isLoading={isLoading} loadingLabel="מתחבר…" onPress={submit} title="התחברות" />
      </View>
      <View style={{ alignItems: 'center', flex: 1, flexDirection: 'row-reverse', gap: 5, justifyContent: 'center', minHeight: 90 }}>
        <Text style={{ color: colors.textMuted, fontFamily: typography.family.regular, fontSize: 15 }}>עדיין אין חשבון?</Text>
        <AuthLink onPress={onSignUp} title="הרשמה" />
      </View>
    </AuthScreen>
  );
}
