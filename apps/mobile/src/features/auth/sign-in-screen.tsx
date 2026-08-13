import { useState } from 'react';
import { Text, View } from 'react-native';

import { colors, typography } from '@/theme/tokens';

import { verifyApiIdentity } from './auth-api';
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
  verifyIdentity = verifyApiIdentity,
}: {
  initialState?: AuthFormPreviewState;
  onAuthenticated: () => void;
  onBack: () => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
  verifyIdentity?: typeof verifyApiIdentity;
}) {
  const { signIn, signOut } = useAuth();
  const [email, setEmail] = useState(initialState === 'error' ? 'name@example.com' : '');
  const [password, setPassword] = useState(initialState === 'error' ? 'wrong' : '');
  const [error, setError] = useState<string | undefined>(
    initialState === 'error' ? 'אימייל או סיסמה שגויים' : undefined,
  );
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    const validationError = validateSignIn(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    setIsLoading(true);
    try {
      const session = await signIn({ email: email.trim(), password });
      await verifyIdentity(session.user.id);
      onAuthenticated();
    } catch (caughtError) {
      await signOut().catch(() => undefined);
      setError(authErrorMessage(caughtError, 'sign-in'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen onBack={onBack}>
      <AuthHeading subtitle="טוב לראות אותך שוב" title="התחברות" />
      <View style={{ gap: 16, paddingTop: error ? 20 : 30 }}>
        {error ? <AuthFormError message={error} /> : null}
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
