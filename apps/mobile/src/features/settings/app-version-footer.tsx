import Constants from 'expo-constants';
import { Platform, StyleSheet, Text } from 'react-native';

import { v2Typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

export function AppVersionFooter() {
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? 'לא זמינה';
  // This value comes from the installed binary's Info.plist, unlike expoConfig.ios.
  const buildNumber = Platform.OS === 'ios' ? Constants.platform?.ios?.buildNumber : null;
  const versionLabel = Platform.OS === 'web' ? 'גרסת דפדפן' : __DEV__ ? 'גרסת פיתוח' : 'גרסה';

  return (
    <Text style={[styles.footer, { color: colors.textMuted }]}>
      {`${versionLabel} ${version} · ${buildNumber ? `בנייה ${buildNumber}` : 'מספר בנייה לא זמין'}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  footer: {
    fontFamily: v2Typography.family.regular,
    fontSize: 11,
    lineHeight: 17.6,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
