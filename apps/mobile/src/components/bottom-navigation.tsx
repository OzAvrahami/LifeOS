import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/theme/tokens';

type NavigationItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  ltr?: boolean;
};

const navigationItems: NavigationItem[] = [
  { label: 'היום', icon: 'radio-button-on-outline', selected: true },
  { label: 'שבוע', icon: 'calendar-clear-outline' },
  { label: '', icon: 'add' },
  { label: 'Inbox', icon: 'file-tray-outline', ltr: true },
  { label: 'עוד', icon: 'ellipsis-horizontal' },
];

export function BottomNavigation({ onQuickCapture }: { onQuickCapture?: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityLabel="ניווט ראשי"
      style={[styles.container, { height: 62 + insets.bottom, paddingBottom: insets.bottom }]}
    >
      <View style={styles.items}>
        {navigationItems.map((item, index) =>
          index === 2 ? (
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
              accessibilityState={{ selected: item.selected ?? false }}
              key={item.label}
              style={styles.navigationItem}
            >
              <Ionicons
                color={item.selected ? colors.accent : '#A8A296'}
                name={item.icon}
                size={24}
              />
              <Text
                style={[
                  styles.navigationLabel,
                  item.selected && styles.navigationLabelSelected,
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
