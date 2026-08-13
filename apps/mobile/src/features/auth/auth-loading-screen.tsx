import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, typography } from '@/theme/tokens';

export function AuthLoadingScreen({ label = 'טוען…' }: { label?: string }) {
  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <View style={{ alignItems: 'center', flex: 1, gap: 16, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', backgroundColor: colors.accent, borderRadius: 18, height: 58, justifyContent: 'center', width: 58 }}>
          <View style={{ borderColor: colors.white, borderRadius: 12, borderWidth: 3.5, height: 22, width: 22 }} />
        </View>
        <ActivityIndicator accessibilityLabel={label} color={colors.accent} />
        <Text style={{ color: colors.textMuted, fontFamily: typography.family.medium, fontSize: 14, writingDirection: 'rtl' }}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}
