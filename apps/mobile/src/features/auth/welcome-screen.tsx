import { Text, View } from 'react-native';

import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { AuthPrimaryButton, AuthScreen, AuthSecondaryButton } from './auth.components';
import { V2Notice } from '@/components/v2';

export function WelcomeScreen({ onSignIn, onSignUp, sessionExpired = false }: { onSignIn: () => void; onSignUp: () => void; sessionExpired?: boolean }) {
  const { colors } = useTheme();
  return (
    <AuthScreen contentStyle={{ paddingHorizontal: 32 }}>
      {sessionExpired ? <V2Notice title="צריך להתחבר מחדש כדי להמשיך. המידע שלך נשמר בחשבון." /> : null}
      <View style={{ alignItems: 'center', flex: 1, gap: 20, justifyContent: 'center' }}>
        <View style={{
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 22,
          height: 70,
          justifyContent: 'center',
          width: 70,
        }}>
          <Text style={{ color: colors.onAccent, fontFamily: typography.family.extraBold, fontSize: 48, transform: [{ rotate: '-7deg' }] }}>L</Text>
        </View>
        <Text accessibilityRole="header" selectable style={{ color: colors.text, fontFamily: typography.family.extraBold, fontSize: 42 }}>LifeOS</Text>
        <Text selectable style={{ color: colors.textMuted, fontFamily: typography.family.regular, fontSize: 18, lineHeight: 28, maxWidth: 280, textAlign: 'center', writingDirection: 'rtl' }}>
          סדר ברור ליום ולשבוע שלך. להתחיל בפשטות, ולראות מה חשוב עכשיו.
        </Text>
      </View>
      <View style={{ gap: 12 }}>
        <AuthPrimaryButton onPress={onSignIn} title="התחברות" />
        <AuthSecondaryButton onPress={onSignUp} title="הרשמה" />
        <Text selectable style={{ color: colors.textFaint, fontFamily: typography.family.regular, fontSize: 13, lineHeight: 20, paddingTop: 8, textAlign: 'center', writingDirection: 'rtl' }}>
          החשבון שלך נפרד מחיבור ליומן. אפשר להתחיל גם בלי לחבר יומן.
        </Text>
      </View>
    </AuthScreen>
  );
}
