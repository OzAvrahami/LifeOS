import { Text, View } from 'react-native';

import { colors, typography } from '@/theme/tokens';

import { AuthPrimaryButton, AuthScreen, AuthSecondaryButton } from './auth.components';

export function WelcomeScreen({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  return (
    <AuthScreen contentStyle={{ paddingHorizontal: 32 }}>
      <View style={{ alignItems: 'center', flex: 1, gap: 20, justifyContent: 'center' }}>
        <View style={{
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 22,
          height: 70,
          justifyContent: 'center',
          width: 70,
        }}>
          <View style={{ borderColor: colors.white, borderRadius: 16, borderWidth: 4.5, height: 27, width: 27 }} />
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
          בהמשך יש הסכמה לתנאי השימוש ולפרטיות
        </Text>
      </View>
    </AuthScreen>
  );
}
