import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

import { BottomNavigation } from './bottom-navigation';

export function MobileShell({
  children,
  onQuickCapture,
}: PropsWithChildren<{ onQuickCapture?: () => void }>) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
      <BottomNavigation onQuickCapture={onQuickCapture} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { flex: 1 },
});
