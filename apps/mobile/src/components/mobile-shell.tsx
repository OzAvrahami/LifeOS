import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/theme/theme-provider';
import { V2Brand, V2Text } from './v2';
import { V2Icon } from './v2-icon';

import { colors, v2Layout, v2Typography } from '@/theme/tokens';

import { BottomNavigation } from './bottom-navigation';

export function V2Header({ displayName, onSettings }: { displayName?: string; onSettings?: () => void }) {
  const { colors: theme } = useTheme();
  const names = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const avatar = names[0] && Array.from(names[0]).length <= 3 ? names[0] : names.slice(0, 2).map(name => Array.from(name)[0]).join('');
  return <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: v2Layout.chrome.gap, marginBottom: v2Layout.chrome.bottom }}>
    <V2Brand />
    <Pressable accessibilityRole="button" accessibilityLabel="עוד והגדרות" accessibilityHint={displayName?.trim()} hitSlop={4}
      onPress={onSettings ?? (() => router.navigate('/more'))}
      style={({ pressed }) => ({ width: v2Layout.chrome.avatar, height: v2Layout.chrome.avatar, borderRadius: v2Layout.chrome.avatar / 2, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.accentWeak, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      {avatar ? <V2Text style={{ fontSize: 13, lineHeight: 20.15, fontFamily: v2Typography.family.bold, textAlign: 'center' }}>{avatar}</V2Text> : <V2Icon name="user" size={18} color={theme.accent} />}
    </Pressable>
  </View>;
}

export function MobileShell({
  children,
  onNavigateInbox,
  onNavigateMore,
  onNavigateToday,
  onNavigateWeek,
  onQuickCapture,
  selected = 'today',
  header = true,
}: PropsWithChildren<{
  onNavigateInbox?: () => void;
  onNavigateMore?: () => void;
  onNavigateToday?: () => void;
  onNavigateWeek?: () => void;
  onQuickCapture?: () => void;
  selected?: 'today' | 'week' | 'inbox' | 'more' | 'calendar';
  header?: boolean;
}>) {
  const { colors: theme } = useTheme();
  const { width } = useWindowDimensions();
  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {header ? <View style={{ paddingHorizontal: width <= v2Layout.body.narrowBreakpoint ? v2Layout.body.narrowHorizontal : v2Layout.body.horizontal, paddingTop: v2Layout.body.top }}><V2Header onSettings={onNavigateMore} /></View> : null}
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
