import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

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
  const { colors } = useTheme();
  const { clearRecovery, isRecovery, signOut, updatePassword } = useAuth();
  const [state, setState] = useState<ResetPasswordPreviewState>(initialState);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const submitting = useRef(false);
  const submit = async () => {
    if (submitting.current) return;
    const validationError = passwordUpdated ? undefined : validatePasswordReset(password, confirmation);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!passwordUpdated && !isRecovery && initialState === 'form') {
      setState('expired');
      return;
    }

    submitting.current = true;
    setIsLoading(true);
    setError(undefined);
    try {
      if (!passwordUpdated) {
        await updatePassword(password);
        setPasswordUpdated(true);
        setPassword(''); setConfirmation('');
      }
      await signOut();
      clearRecovery();
      setState('success');
    } catch (caughtError) {
      const message = authErrorMessage(caughtError, 'update');
      if (message.includes('לא בתוקף')) setState('expired');
      else setError(message);
    } finally {
      submitting.current = false;
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

  if (passwordUpdated) return <AuthScreen><AuthStateView icon={<AuthStateIcon name="checkmark" />}
    title="הסיסמה עודכנה" subtitle="נותר לסיים את היציאה מהחשבון לפני התחברות מחדש."
    actions={<>{error ? <AuthFormError message="היציאה לא הושלמה. אפשר לנסות שוב בלי לשנות את הסיסמה פעם נוספת." /> : null}<AuthPrimaryButton isLoading={isLoading} title="סיום ויציאה" onPress={submit} /></>} /></AuthScreen>;

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
          subtitle="הקישור פג, כבר נוצל או אינו תקין. אפשר לבקש קישור חדש ולנסות שוב."
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
        <Text style={{ color: colors.textFaint, fontFamily: typography.family.regular, fontSize: 12, marginTop: -9, textAlign: 'right', writingDirection: 'rtl' }}>מומלץ לבחור סיסמה ארוכה וייחודית. דרישות נוספות יוצגו בעת השמירה.</Text>
        <PasswordField autoCapitalize="none" autoComplete="new-password" editable={!isLoading} error={error === 'הסיסמאות אינן תואמות' ? error : undefined} label="אימות סיסמה" onChangeText={setConfirmation} onSubmitEditing={submit} returnKeyType="done" textContentType="newPassword" value={confirmation} />
        <AuthPrimaryButton isLoading={isLoading} loadingLabel="שומר…" onPress={submit} title="שמירת סיסמה חדשה" />
      </View>
    </AuthScreen>
  );
}
