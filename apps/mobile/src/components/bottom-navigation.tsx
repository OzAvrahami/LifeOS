import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/theme/theme-provider';

import { colors, spacing, typography } from '@/theme/tokens';

type NavigationItem = {
  id: 'today' | 'week' | 'capture' | 'inbox' | 'calendar';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  ltr?: boolean;
};

const navigationItems: NavigationItem[] = [
  { id: 'today', label: 'היום', icon: 'sunny-outline' },
  { id: 'week', label: 'השבוע', icon: 'calendar-clear-outline' },
  { id: 'capture', label: '', icon: 'add' },
  { id: 'inbox', label: 'משימות', icon: 'list-outline' },
  { id: 'calendar', label: 'יומן', icon: 'calendar-outline' },
];

export function BottomNavigation({
  onNavigateInbox,
  onNavigateToday,
  onNavigateWeek,
  onQuickCapture,
  selected,
}: {
  onNavigateInbox?: () => void;
  onNavigateMore?: () => void;
  onNavigateToday?: () => void;
  onNavigateWeek?: () => void;
  onQuickCapture?: () => void;
  selected: 'today' | 'week' | 'inbox' | 'more' | 'calendar';
}) {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useTheme();

  return (
    <View
      accessibilityLabel="ניווט ראשי"
      style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border, minHeight: 70 + insets.bottom, paddingBottom: insets.bottom }]}
    >
      <View style={styles.items}>
        {navigationItems.map((item) =>
          item.id === 'capture' ? (
            <Pressable
              accessibilityLabel="הוספה מהירה"
              accessibilityRole="button"
              key="capture"
              onPress={onQuickCapture}
              style={styles.captureSlot}
            >
              <View style={[styles.captureButton, { backgroundColor: theme.accent }]}>
                <Ionicons color={theme.onAccent} name="add" size={30} />
              </View>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: item.id === selected }}
              key={item.label}
              onPress={
                item.id === 'today'
                  ? onNavigateToday ?? (() => router.navigate('/'))
                  : item.id === 'week'
                    ? onNavigateWeek ?? (() => router.navigate('/week'))
                    : item.id === 'inbox'
                      ? onNavigateInbox ?? (() => router.navigate('/inbox'))
                      : item.id === 'calendar'
                        ? () => router.navigate('/calendar')
                        : undefined
              }
              style={styles.navigationItem}
            >
              <Ionicons
                color={item.id === selected ? theme.accent : theme.textMuted}
                name={item.icon}
                size={24}
              />
              <Text
                style={[
                  styles.navigationLabel,
                  item.id === selected && styles.navigationLabelSelected,
                  item.ltr && styles.ltrLabel,
                  { color: item.id === selected ? theme.accent : theme.textMuted },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopColor: '#ECE7DC',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  items: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    minHeight: 62,
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingTop: 10,
  },
  navigationItem: { alignItems: 'center', flex: 1, gap: spacing.xxs, minHeight: 48 },
  navigationLabel: {
    color: '#A8A296',
    fontFamily: typography.family.semibold,
    fontSize: typography.size.navigation,
    writingDirection: 'rtl',
  },
  navigationLabelSelected: { color: colors.accent, fontFamily: typography.family.bold },
  ltrLabel: { writingDirection: 'ltr' },
  captureSlot: { alignItems: 'center', flex: 1, minHeight: 48 },
  captureButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 15,
    height: 48,
    justifyContent: 'center',
    marginTop: -4,
    width: 48,
  },
});
