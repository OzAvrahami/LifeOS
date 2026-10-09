import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/theme/theme-provider';
import { V2Brand } from './v2';

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
  selected?: 'today' | 'week' | 'inbox' | 'more' | 'calendar';
}>) {
  const { colors: theme } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
        <V2Brand />
        <Pressable accessibilityRole="button" accessibilityLabel="עוד והגדרות" onPress={onNavigateMore ?? (() => router.navigate('/more'))} style={({ pressed }) => ({ minWidth: 44, minHeight: 44, borderRadius: 22, backgroundColor: theme.accentWeak, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}><Ionicons name="settings-outline" size={22} color={theme.accent} /></Pressable>
      </View>
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
