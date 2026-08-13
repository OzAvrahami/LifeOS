import * as Linking from 'expo-linking';
import { useRef, useState } from 'react';
import { Text } from 'react-native';

import { colors, typography } from '@/theme/tokens';

import { authErrorMessage } from './auth-errors';
import { createAuthCallbackUrl } from './auth-navigation';
import { useAuth } from './auth-provider';
import {
  AuthFormError,
  AuthLink,
  AuthPrimaryButton,
  AuthScreen,
  AuthSecondaryButton,
  AuthStateIcon,
  AuthStateView,
} from './auth.components';

export function VerifyEmailScreen({
  email,
  onBack,
  onSignIn,
}: {
  email: string;
  onBack: () => void;
  onSignIn: () => void;
}) {
  const { resendVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const lastSentAt = useRef(0);

  const resend = async () => {
    if (!email || isResending || Date.now() - lastSentAt.current < 5000) return;
    setIsResending(true);
    setMessage(undefined);
    setError(undefined);
    try {
      await resendVerification(email, createAuthCallbackUrl('signup'));
      lastSentAt.current = Date.now();
      setMessage('מייל אימות חדש נשלח.');
    } catch (caughtError) {
      setError(authErrorMessage(caughtError, 'resend'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthScreen onBack={onBack}>
      <AuthStateView
        icon={<AuthStateIcon name="mail-outline" />}
        title="החשבון כמעט מוכן"
        subtitle={
          <Text selectable style={{ color: colors.textMuted, fontFamily: typography.family.regular, fontSize: 16, lineHeight: 26, maxWidth: 300, textAlign: 'center', writingDirection: 'rtl' }}>
            שלחנו מייל אימות אל{`\n`}
            <Text style={{ color: colors.text, fontFamily: typography.family.bold, writingDirection: 'ltr' }}>{email || 'name@example.com'}</Text>
            {`\n`}צריך ללחוץ על הקישור במייל כדי להמשיך.
          </Text>
        }
        actions={
          <>
            {error ? <AuthFormError message={error} /> : null}
            {message ? <Text accessibilityRole="alert" selectable style={{ color: colors.accentText, fontFamily: typography.family.semibold, textAlign: 'center' }}>{message}</Text> : null}
            <AuthPrimaryButton onPress={() => void Linking.openURL('mailto:')} title="פתחו את המייל" />
            <AuthSecondaryButton disabled={isResending} onPress={resend} title={isResending ? 'שולח…' : 'שליחה מחדש'} />
            <AuthLink onPress={onSignIn} title="חזרה להתחברות" />
          </>
        }
      />
    </AuthScreen>
  );
}
