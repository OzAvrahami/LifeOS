import { useState } from 'react';
import { Text, View } from 'react-native';

import { colors, typography } from '@/theme/tokens';

import { verifyApiIdentity } from './auth-api';
import {
  AuthFormError,
  AuthHeading,
  AuthLink,
  AuthPrimaryButton,
  AuthScreen,
  AuthTextField,
  PasswordField,
} from './auth.components';
import { authErrorMessage } from './auth-errors';
import { createAuthCallbackUrl } from './auth-navigation';
import { useAuth } from './auth-provider';
import { AuthFormPreviewState } from './auth.types';
import { validateSignUp } from './auth-validation';

export function SignUpScreen({
  initialState = 'normal',
  onAuthenticated,
  onBack,
  onSignIn,
  onVerificationRequired,
  verifyIdentity = verifyApiIdentity,
}: {
  initialState?: AuthFormPreviewState;
  onAuthenticated: () => void;
  onBack: () => void;
  onSignIn: () => void;
  onVerificationRequired: (email: string) => void;
  verifyIdentity?: typeof verifyApiIdentity;
}) {
  const { signOut, signUp } = useAuth();
  const previewValidation = initialState === 'validation';
  const [name, setName] = useState(previewValidation ? 'עוז אברהמי' : '');
  const [email, setEmail] = useState(previewValidation ? 'name@example.com' : '');
  const [password, setPassword] = useState(previewValidation ? 'password1' : '');
  const [confirmation, setConfirmation] = useState(previewValidation ? 'other' : '');
  const [error, setError] = useState<string | undefined>(previewValidation ? 'הסיסמאות אינן תואמות' : undefined);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    const validationError = validateSignUp(name, email, password, confirmation);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    setIsLoading(true);
    try {
      const session = await signUp({
        email: email.trim(),
        emailRedirectTo: createAuthCallbackUrl('signup'),
        name: name.trim(),
        password,
      });
      if (!session) {
        onVerificationRequired(email.trim());
        return;
      }
      await verifyIdentity(session.user.id);
      onAuthenticated();
    } catch (caughtError) {
      await signOut().catch(() => undefined);
      setError(authErrorMessage(caughtError, 'sign-up'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen onBack={onBack} contentStyle={{ paddingBottom: 28 }}>
      <AuthHeading subtitle="כמה פרטים ואפשר להתחיל" title="יצירת חשבון" />
      <View style={{ gap: 14, paddingTop: 22 }}>
        {error && !error.includes('תואמות') ? <AuthFormError message={error} /> : null}
        <AuthTextField editable={!isLoading} label="שם" onChangeText={setName} returnKeyType="next" textContentType="name" value={name} />
        <AuthTextField autoCapitalize="none" autoComplete="email" editable={!isLoading} keyboardType="email-address" label="אימייל" onChangeText={setEmail} placeholder="name@example.com" returnKeyType="next" textContentType="username" value={email} />
        <PasswordField autoCapitalize="none" autoComplete="new-password" editable={!isLoading} label="סיסמה" onChangeText={setPassword} returnKeyType="next" textContentType="newPassword" value={password} />
        <Text style={{ color: colors.textFaint, fontFamily: typography.family.regular, fontSize: 12, marginTop: -7, textAlign: 'right', writingDirection: 'rtl' }}>לפחות 8 תווים</Text>
        <PasswordField autoCapitalize="none" autoComplete="new-password" editable={!isLoading} error={error === 'הסיסמאות אינן תואמות' ? error : undefined} label="אימות סיסמה" onChangeText={setConfirmation} onSubmitEditing={submit} returnKeyType="done" textContentType="newPassword" value={confirmation} />
      </View>
      <View style={{ paddingTop: 20 }}>
        <AuthPrimaryButton isLoading={isLoading} loadingLabel="יוצר חשבון…" onPress={submit} title="יצירת חשבון" />
      </View>
      <View style={{ alignItems: 'center', flex: 1, flexDirection: 'row-reverse', gap: 5, justifyContent: 'center', minHeight: 72 }}>
        <Text style={{ color: colors.textMuted, fontFamily: typography.family.regular, fontSize: 15 }}>כבר יש חשבון?</Text>
        <AuthLink onPress={onSignIn} title="התחברות" />
      </View>
    </AuthScreen>
  );
}
