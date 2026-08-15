import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

import { BottomNavigation } from './bottom-navigation';

export function MobileShell({
  children,
  onNavigateInbox,
  onNavigateMore,
  onNavigateToday,
  onNavigateWeek,
  onQuickCapture,
  selected = 'today',
}: PropsWithChildren<{
  onNavigateInbox?: () => void;
  onNavigateMore?: () => void;
  onNavigateToday?: () => void;
  onNavigateWeek?: () => void;
  onQuickCapture?: () => void;
  selected?: 'today' | 'week' | 'inbox' | 'more';
}>) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
      <BottomNavigation
        onNavigateInbox={onNavigateInbox}
        onNavigateMore={onNavigateMore}
        onNavigateToday={onNavigateToday}
        onNavigateWeek={onNavigateWeek}
        onQuickCapture={onQuickCapture}
        selected={selected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { flex: 1 },
});
