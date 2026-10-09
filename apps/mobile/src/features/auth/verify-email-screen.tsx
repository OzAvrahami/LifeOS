import * as Linking from 'expo-linking';
import { useRef, useState } from 'react';
import { Text } from 'react-native';

import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

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
  const { colors } = useTheme();
  const { resendVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const lastSentAt = useRef(0);

  const resend = async () => {
    if (!email || isResending) return;
    if (Date.now() - lastSentAt.current < 60_000) {
      setError('יש להמתין דקה בין בקשות שליחה.');
      return;
    }
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
            <Text style={{ color: colors.text, fontFamily: typography.family.bold, writingDirection: 'ltr' }}>{email || 'הכתובת שהזנת בהרשמה'}</Text>
            {`\n`}צריך ללחוץ על הקישור במייל כדי להמשיך.
          </Text>
        }
        actions={
          <>
            {error ? <AuthFormError message={error} /> : null}
            {message ? <Text accessibilityRole="alert" selectable style={{ color: colors.accentText, fontFamily: typography.family.semibold, textAlign: 'center' }}>{message}</Text> : null}
            <AuthPrimaryButton onPress={() => void Linking.openURL('mailto:').catch(() => setError('לא ניתן לפתוח את אפליקציית המייל. אפשר לפתוח אותה ידנית.'))} title="פתחו את המייל" />
            <AuthSecondaryButton disabled={isResending || !email} onPress={resend} title={isResending ? 'שולח…' : 'שליחה מחדש'} />
            <AuthLink onPress={onSignIn} title="חזרה להתחברות" />
          </>
        }
      />
    </AuthScreen>
  );
}
