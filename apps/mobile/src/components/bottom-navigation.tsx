import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/theme/tokens';

type NavigationItem = {
  id: 'today' | 'week' | 'capture' | 'inbox' | 'more';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  ltr?: boolean;
};

const navigationItems: NavigationItem[] = [
  { id: 'today', label: 'היום', icon: 'radio-button-on-outline' },
  { id: 'week', label: 'שבוע', icon: 'calendar-clear-outline' },
  { id: 'capture', label: '', icon: 'add' },
  { id: 'inbox', label: 'Inbox', icon: 'file-tray-outline', ltr: true },
  { id: 'more', label: 'עוד', icon: 'ellipsis-horizontal' },
];

export function BottomNavigation({
  onNavigateToday,
  onNavigateWeek,
  onQuickCapture,
  selected,
}: {
  onNavigateToday?: () => void;
  onNavigateWeek?: () => void;
  onQuickCapture?: () => void;
  selected: 'today' | 'week';
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityLabel="ניווט ראשי"
      style={[styles.container, { height: 62 + insets.bottom, paddingBottom: insets.bottom }]}
    >
      <View style={styles.items}>
        {navigationItems.map((item, index) =>
          item.id === 'capture' ? (
            <Pressable
              accessibilityLabel="הוספה מהירה"
              accessibilityRole="button"
              key="capture"
              onPress={onQuickCapture}
              style={styles.captureSlot}
            >
              <View style={styles.captureButton}>
                <Ionicons color={colors.white} name="add" size={30} />
              </View>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: item.id === selected }}
              key={item.label}
              onPress={item.id === 'today' ? onNavigateToday : item.id === 'week' ? onNavigateWeek : undefined}
              style={styles.navigationItem}
            >
              <Ionicons
                color={item.id === selected ? colors.accent : '#A8A296'}
                name={item.icon}
                size={24}
              />
              <Text
                style={[
                  styles.navigationLabel,
                  item.id === selected && styles.navigationLabelSelected,
                  item.ltr && styles.ltrLabel,
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
    height: 62,
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
    borderRadius: 27,
    elevation: 5,
    height: 54,
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: colors.accent,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 9,
    width: 54,
  },
});
