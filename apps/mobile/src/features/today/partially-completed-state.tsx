import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { partiallyCompletedTodayFixture } from './today.fixture';

export function PartiallyCompletedState({ onStart }: { onStart: () => void }) {
  const today = partiallyCompletedTodayFixture;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.date}>{today.dateLabel}</Text>
      <View accessibilityLabel="התקדמות היום" style={styles.progressRow}>
        <View style={styles.dots}>
          <View style={styles.doneDot} />
          <View style={styles.doneDot} />
          <View style={styles.openDot} />
        </View>
        <Text style={styles.progressText}>2 הושלמו · 1 נשארה</Text>
      </View>
      <Text style={styles.progressNote}>נשארה משימה אחת מתוכננת להיום.</Text>

      <View accessibilityLabel="הבא בתור" style={styles.nextCard}>
        <Text style={styles.nextLabel}>הבא בתור</Text>
        <Text style={styles.nextTitle}>{today.nextTask.title}</Text>
        <Text style={styles.nextMeta}>כ־{today.nextTask.durationMinutes} דקות · בית</Text>
        <Pressable accessibilityRole="button" onPress={onStart} style={styles.startButton}>
          <Text style={styles.startText}>התחלה</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>פתוח</Text>
      <View accessibilityLabel="משימות פתוחות" style={styles.openTasks}>
        <View style={styles.taskRow}>
          <View style={styles.checkbox} />
          <Text style={styles.taskTitle}>{today.nextTask.title}</Text>
          <Text style={styles.duration}>{today.nextTask.durationMinutes} דק׳</Text>
        </View>
      </View>

      <View style={styles.completedHeading}>
        <Text style={styles.sectionLabelInline}>הושלמו היום</Text>
        <View style={styles.count}><Text style={styles.countText}>2</Text></View>
      </View>
      <View accessibilityLabel="משימות שהושלמו" style={styles.completedTasks}>
        {today.completedTasks.map((task, index) => (
          <View key={task.id} style={[styles.taskRow, index === 0 && styles.divider]}>
            <View style={styles.checkIcon}>
              <Ionicons color={colors.white} name="checkmark" size={14} />
            </View>
            <Text style={styles.completedTitle}>{task.title}</Text>
            <Text style={styles.completedDuration}>{task.durationMinutes} דק׳</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, paddingHorizontal: 22, paddingTop: spacing.xs },
  date: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: typography.size.display, lineHeight: 36, textAlign: 'right', writingDirection: 'rtl' },
  progressRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.sm, marginTop: 14 },
  dots: { flexDirection: 'row-reverse', gap: 5 },
  doneDot: { backgroundColor: colors.accent, borderRadius: 5, height: 9, width: 9 },
  openDot: { backgroundColor: '#D5CFC2', borderRadius: 5, height: 9, width: 9 },
  progressText: { color: colors.textSoft, fontFamily: typography.family.bold, fontSize: typography.size.body, writingDirection: 'rtl' },
  progressNote: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: typography.size.label, marginTop: 4, textAlign: 'right', writingDirection: 'rtl' },
  nextCard: { backgroundColor: colors.accentWeak, borderRadius: radius.xl, marginTop: spacing.lg, padding: 17 },
  nextLabel: { color: colors.accent, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.6, textAlign: 'right', writingDirection: 'rtl' },
  nextTitle: { color: colors.text, fontFamily: typography.family.bold, fontSize: typography.size.title, lineHeight: 27, marginTop: 10, textAlign: 'right', writingDirection: 'rtl' },
  nextMeta: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: typography.size.meta, marginTop: 5, textAlign: 'right', writingDirection: 'rtl' },
  startButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, height: 46, justifyContent: 'center', marginTop: 14 },
  startText: { color: colors.white, fontFamily: typography.family.bold, fontSize: typography.size.button },
  sectionLabel: { color: colors.textSubtle, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.5, marginBottom: spacing.xxs, marginTop: 22, textAlign: 'right', writingDirection: 'rtl' },
  openTasks: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  taskRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.sm, minHeight: 54 },
  checkbox: { borderColor: '#C9C3B5', borderRadius: 11, borderWidth: 1.75, height: 22, width: 22 },
  taskTitle: { color: colors.text, flex: 1, fontFamily: typography.family.medium, fontSize: typography.size.body, textAlign: 'right', writingDirection: 'rtl' },
  duration: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, writingDirection: 'rtl' },
  completedHeading: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.xs, marginBottom: spacing.xxs, marginTop: 22 },
  sectionLabelInline: { color: colors.textSubtle, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.5, writingDirection: 'rtl' },
  count: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.round, justifyContent: 'center', minHeight: 22, minWidth: 22 },
  countText: { color: colors.textMuted, fontFamily: typography.family.bold, fontSize: 12 },
  completedTasks: { backgroundColor: colors.completedSurface, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  divider: { borderBottomColor: '#E5DFD3', borderBottomWidth: StyleSheet.hairlineWidth },
  checkIcon: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 11, height: 22, justifyContent: 'center', width: 22 },
  completedTitle: { color: colors.textFaint, flex: 1, fontFamily: typography.family.medium, fontSize: typography.size.body, textAlign: 'right', textDecorationLine: 'line-through', writingDirection: 'rtl' },
  completedDuration: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, writingDirection: 'rtl' },
});
