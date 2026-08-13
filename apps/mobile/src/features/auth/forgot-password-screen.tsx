import { useState } from 'react';
import { View } from 'react-native';

import { authErrorMessage } from './auth-errors';
import { createAuthCallbackUrl } from './auth-navigation';
import { useAuth } from './auth-provider';
import {
  AuthFormError,
  AuthHeading,
  AuthLink,
  AuthPrimaryButton,
  AuthScreen,
  AuthSecondaryButton,
  AuthStateIcon,
  AuthStateView,
  AuthTextField,
} from './auth.components';
import { ForgotPasswordPreviewState } from './auth.types';
import { isValidEmail } from './auth-validation';

export function ForgotPasswordScreen({
  initialState = 'form',
  onBack,
  onSignIn,
}: {
  initialState?: ForgotPasswordPreviewState;
  onBack: () => void;
  onSignIn: () => void;
}) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<ForgotPasswordPreviewState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    if (!isValidEmail(email)) {
      setError('כתובת מייל לא תקינה');
      return;
    }
    setIsLoading(true);
    setError(undefined);
    try {
      await requestPasswordReset(email.trim(), createAuthCallbackUrl('recovery'));
      setState('sent');
    } catch (caughtError) {
      setError(authErrorMessage(caughtError, 'reset'));
    } finally {
      setIsLoading(false);
    }
  };

  if (state === 'sent') {
    return (
      <AuthScreen onBack={onBack}>
        <AuthStateView
          actions={
            <>
              <AuthSecondaryButton disabled={isLoading} onPress={submit} title={isLoading ? 'שולח…' : 'שליחה מחדש'} />
              <AuthLink onPress={onSignIn} title="חזרה להתחברות" />
            </>
          }
          icon={<AuthStateIcon name="checkmark" />}
          subtitle="אם הכתובת קיימת אצלנו, שלחנו קישור לאיפוס הסיסמה. כדאי לבדוק גם בתיקיית הספאם."
          title="הקישור נשלח"
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen onBack={onBack}>
      <AuthHeading subtitle="נשלח אליך קישור לאיפוס. הזינו את המייל של החשבון." title="איפוס סיסמה" />
      <View style={{ gap: 18, paddingTop: 28 }}>
        {error ? <AuthFormError message={error} /> : null}
        <AuthTextField autoCapitalize="none" autoComplete="email" editable={!isLoading} keyboardType="email-address" label="אימייל" onChangeText={setEmail} onSubmitEditing={submit} placeholder="name@example.com" returnKeyType="send" textContentType="username" value={email} />
        <AuthPrimaryButton isLoading={isLoading} loadingLabel="שולח…" onPress={submit} title="שליחת קישור לאיפוס" />
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-end', minHeight: 120 }}>
        <AuthLink onPress={onSignIn} title="חזרה להתחברות" />
      </View>
    </AuthScreen>
  );
}
