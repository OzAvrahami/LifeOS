import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

export function WeekNavigation({ label, kind, current, onPrevious, onNext, onCurrent }: {
  label: string;
  kind: 'week' | 'day';
  current: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
}) {
  const noun = kind === 'week' ? 'שבוע' : 'יום';
  const currentLabel = kind === 'week' ? 'השבוע הזה' : 'חזרה להיום';
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" accessibilityLabel={kind === 'week' ? 'טווח השבוע המוצג' : 'התאריך המוצג'} style={styles.title}>{label}</Text>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${noun} קודם`} onPress={onPrevious} style={styles.button}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
          <Text style={styles.text}>{noun} קודם</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={currentLabel} accessibilityState={{ disabled: current }}
          disabled={current} onPress={onCurrent} style={styles.button}>
          <Text style={[styles.text, current && styles.current]}>{current ? kind === 'week' ? 'השבוע הזה' : 'היום' : currentLabel}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${noun} הבא`} onPress={onNext} style={styles.button}>
          <Text style={styles.text}>{noun} הבא</Text>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  title: { color: colors.text, fontFamily: typography.family.bold, fontSize: 22, textAlign: 'right', writingDirection: 'rtl' },
  controls: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs },
  button: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', minHeight: 48, minWidth: 48, paddingHorizontal: spacing.xs, borderRadius: radius.md, backgroundColor: colors.surface },
  text: { color: colors.text, fontFamily: typography.family.semibold, fontSize: 14, writingDirection: 'rtl' },
  current: { color: colors.textSubtle },
});
