import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

import { BottomNavigation } from './bottom-navigation';

export function MobileShell({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { flex: 1 },
});
