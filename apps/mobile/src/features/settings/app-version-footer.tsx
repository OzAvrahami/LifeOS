import Constants from 'expo-constants';
import { Platform, StyleSheet, Text } from 'react-native';

import { colors, typography } from '@/theme/tokens';

export function AppVersionFooter() {
  const version = Constants.expoConfig?.version ?? 'לא זמינה';
  // This value comes from the installed binary's Info.plist, unlike expoConfig.ios.
  const buildNumber = Platform.OS === 'ios' ? Constants.platform?.ios?.buildNumber : null;
  const versionLabel = Platform.OS === 'web' ? 'גרסת דפדפן' : __DEV__ ? 'גרסת פיתוח' : 'גרסה';

  return (
    <Text style={styles.footer}>
      {`${versionLabel} ${version} · ${buildNumber ? `בנייה ${buildNumber}` : 'מספר בנייה לא זמין'}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  footer: {
    color: colors.textSubtle,
    fontFamily: typography.family.regular,
    fontSize: typography.size.meta,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
