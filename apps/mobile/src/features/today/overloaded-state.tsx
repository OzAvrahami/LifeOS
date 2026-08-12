import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { overloadedTodayFixture } from './today.fixture';

export function OverloadedState() {
  const today = overloadedTodayFixture;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>{today.greeting}</Text>
      <Text style={styles.date}>{today.dateLabel}</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summary}>{today.taskCount} משימות · {today.commitmentCount} פגישות</Text>
        <View accessibilityLabel="עומס היום: עמוס מדי" style={styles.badge}>
          <Text style={styles.badgeText}>עמוס מדי</Text>
        </View>
      </View>

      <View accessibilityLabel="אזהרת עומס" style={styles.notice}>
        <Text style={styles.noticeTitle}>נראה שתכננת יותר ממה שניתן להספיק היום.</Text>
        <Text style={styles.noticeBody}>
          זה קורה. אפשר לדחות משימה או שתיים כדי שהיום יישאר מציאותי — בלי לוותר על מה שחשוב.
        </Text>
        <Pressable accessibilityRole="button" style={styles.rebalanceButton}>
          <Text style={styles.rebalanceText}>לשקול מחדש את היום</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>עומס היום</Text>
      <View accessibilityLabel="קיבולת היום" style={styles.capacity}>
        <Text style={styles.capacityText}>
          <Text style={styles.ltr}>{today.plannedTime}</Text> מתוך <Text style={styles.ltr}>{today.availableTime}</Text> שעות
        </Text>
        <View style={styles.track}>
          <View style={styles.fill} />
          <View style={styles.marker} />
        </View>
        <Text style={styles.capacityNote}>הקו מסמן את הזמן הזמין שלך — 6:00 שעות.</Text>
      </View>

      <Text style={styles.sectionLabel}>לפי חשיבות</Text>
      <View accessibilityLabel="משימות שתורמות לעומס" style={styles.tasks}>
        {today.tasks.map((task, index) => (
          <View key={task.id} style={[styles.taskRow, index < today.tasks.length - 1 && styles.divider]}>
            <View style={styles.checkbox} />
            <View style={styles.taskText}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              {'important' in task && task.important ? <Text style={styles.important}>חשוב</Text> : null}
            </View>
            {'deferLabel' in task ? <Text style={styles.defer}>← {task.deferLabel}</Text> : <Text style={styles.duration}>{task.durationMinutes} דק׳</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, paddingHorizontal: 22, paddingTop: spacing.xs },
  greeting: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.body, textAlign: 'right', writingDirection: 'rtl' },
  date: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: typography.size.display, lineHeight: 36, marginTop: 2, textAlign: 'right', writingDirection: 'rtl' },
  summaryRow: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 14 },
  summary: { color: colors.textMuted, fontFamily: typography.family.medium, fontSize: typography.size.label, writingDirection: 'rtl' },
  badge: { backgroundColor: colors.warningBadge, borderRadius: radius.round, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  badgeText: { color: colors.warningText, fontFamily: typography.family.bold, fontSize: typography.size.label },
  notice: { backgroundColor: colors.warningSurface, borderRadius: radius.xl, marginTop: spacing.lg, padding: 18 },
  noticeTitle: { color: colors.warningText, fontFamily: typography.family.extraBold, fontSize: 18, lineHeight: 25, textAlign: 'right', writingDirection: 'rtl' },
  noticeBody: { color: colors.warningMuted, fontFamily: typography.family.regular, fontSize: typography.size.meta, lineHeight: 21, marginTop: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
  rebalanceButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.warningAction, borderRadius: radius.md, height: 46, justifyContent: 'center', marginTop: spacing.md },
  rebalanceText: { color: colors.white, fontFamily: typography.family.bold, fontSize: typography.size.button },
  sectionLabel: { color: colors.textSubtle, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.5, marginBottom: spacing.xxs, marginTop: 22, textAlign: 'right', writingDirection: 'rtl' },
  capacity: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  capacityText: { color: colors.text, fontFamily: typography.family.bold, fontSize: typography.size.body, textAlign: 'right', writingDirection: 'rtl' },
  ltr: { writingDirection: 'ltr' },
  track: { backgroundColor: colors.border, borderRadius: radius.round, height: 9, marginTop: spacing.sm, overflow: 'visible', position: 'relative' },
  fill: { backgroundColor: '#C98A6E', borderRadius: radius.round, height: 9, width: '100%' },
  marker: { backgroundColor: colors.textSoft, height: 17, left: '74%', position: 'absolute', top: -4, width: 2 },
  capacityNote: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, marginTop: spacing.sm, textAlign: 'right', writingDirection: 'rtl' },
  tasks: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  taskRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.sm, minHeight: 58 },
  divider: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
  checkbox: { borderColor: '#C9C3B5', borderRadius: 11, borderWidth: 1.75, height: 22, width: 22 },
  taskText: { flex: 1 },
  taskTitle: { color: colors.text, fontFamily: typography.family.medium, fontSize: typography.size.body, textAlign: 'right', writingDirection: 'rtl' },
  important: { alignSelf: 'flex-end', backgroundColor: colors.warningBadge, borderRadius: radius.round, color: colors.warningText, fontFamily: typography.family.bold, fontSize: 11, marginTop: 3, overflow: 'hidden', paddingHorizontal: spacing.xs, paddingVertical: 2 },
  duration: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, writingDirection: 'rtl' },
  defer: { color: colors.warningAction, fontFamily: typography.family.bold, fontSize: typography.size.label, writingDirection: 'rtl' },
});
