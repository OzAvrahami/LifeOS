import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { overloadedTodayFixture } from './today.fixture';
import { TaskTimeSummary } from './today.components';

export function OverloadedState() {
  const today = overloadedTodayFixture;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>{today.greeting}</Text>
      <Text style={styles.date}>{today.dateLabel}</Text>
      <Text style={styles.summary}>{today.taskCount} משימות · {today.commitmentCount} התחייבויות</Text>
      <TaskTimeSummary plannedTaskTime={today.plannedTaskTime} />
      <Text style={styles.summaryLimit}>הסיכום כולל הערכות של משימות בלבד; הוא אינו מסיק כמה זמן פנוי נשאר.</Text>

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
  summary: { color: colors.textMuted, fontFamily: typography.family.medium, fontSize: typography.size.label, marginTop: 14, textAlign: 'right', writingDirection: 'rtl' },
  summaryLimit: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, lineHeight: 19, marginTop: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
  sectionLabel: { color: colors.textSubtle, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.5, marginBottom: spacing.xxs, marginTop: 22, textAlign: 'right', writingDirection: 'rtl' },
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
