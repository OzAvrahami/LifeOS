import { useState } from 'react';
import { Text, View } from 'react-native';

import { colors, typography } from '@/theme/tokens';

import { authErrorMessage } from './auth-errors';
import { useAuth } from './auth-provider';
import {
  AuthFormError,
  AuthHeading,
  AuthLink,
  AuthPrimaryButton,
  AuthScreen,
  AuthStateIcon,
  AuthStateView,
  PasswordField,
} from './auth.components';
import { ResetPasswordPreviewState } from './auth.types';
import { validatePasswordReset } from './auth-validation';

export function ResetPasswordScreen({
  initialState = 'form',
  onRequestNewLink,
  onSignIn,
}: {
  initialState?: ResetPasswordPreviewState;
  onRequestNewLink: () => void;
  onSignIn: () => void;
}) {
  const { clearRecovery, isRecovery, signOut, updatePassword } = useAuth();
  const [state, setState] = useState<ResetPasswordPreviewState>(initialState);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    const validationError = validatePasswordReset(password, confirmation);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!isRecovery && initialState === 'form') {
      setState('expired');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    try {
      await updatePassword(password);
      await signOut();
      clearRecovery();
      setState('success');
    } catch (caughtError) {
      const message = authErrorMessage(caughtError, 'update');
      if (message.includes('לא בתוקף')) setState('expired');
      else setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (state === 'success') {
    return (
      <AuthScreen>
        <AuthStateView
          actions={<AuthPrimaryButton onPress={onSignIn} title="התחברות" />}
          icon={<AuthStateIcon name="checkmark" tone="solid" />}
          subtitle="אפשר להתחבר עכשיו עם הסיסמה החדשה."
          title="הסיסמה עודכנה"
        />
      </AuthScreen>
    );
  }

  if (state === 'expired') {
    return (
      <AuthScreen>
        <AuthStateView
          actions={
            <>
              <AuthPrimaryButton onPress={onRequestNewLink} title="בקשת קישור חדש" />
              <AuthLink onPress={onSignIn} title="חזרה להתחברות" />
            </>
          }
          icon={<AuthStateIcon name="time-outline" tone="danger" />}
          subtitle="קישורי איפוס תקפים ל־60 דקות. אפשר לבקש קישור חדש ולנסות שוב."
          title="הקישור כבר לא בתוקף"
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <AuthHeading subtitle="בחרו סיסמה חדשה לחשבון." title="סיסמה חדשה" />
      <View style={{ gap: 16, paddingTop: 28 }}>
        {error && !error.includes('תואמות') ? <AuthFormError message={error} /> : null}
        <PasswordField autoCapitalize="none" autoComplete="new-password" editable={!isLoading} label="סיסמה חדשה" onChangeText={setPassword} returnKeyType="next" textContentType="newPassword" value={password} />
        <Text style={{ color: colors.textFaint, fontFamily: typography.family.regular, fontSize: 12, marginTop: -9, textAlign: 'right', writingDirection: 'rtl' }}>לפחות 8 תווים</Text>
        <PasswordField autoCapitalize="none" autoComplete="new-password" editable={!isLoading} error={error === 'הסיסמאות אינן תואמות' ? error : undefined} label="אימות סיסמה" onChangeText={setConfirmation} onSubmitEditing={submit} returnKeyType="done" textContentType="newPassword" value={confirmation} />
        <AuthPrimaryButton isLoading={isLoading} loadingLabel="שומר…" onPress={submit} title="שמירת סיסמה חדשה" />
      </View>
    </AuthScreen>
  );
}
