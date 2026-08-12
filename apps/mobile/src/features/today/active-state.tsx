import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { activeTodayFixture } from './today.fixture';
import { TodayTask } from './today.types';

export function ActiveState({
  laterTasks,
  onFinish,
  onStartTask,
  onStop,
  task,
}: {
  laterTasks?: TodayTask[];
  onFinish: () => void;
  onStartTask?: (taskId: string) => void;
  onStop: () => void;
  task?: TodayTask;
}) {
  const today = activeTodayFixture;
  const activeTask = task ?? today.task;
  const remainingTasks = laterTasks ?? today.laterTasks;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.date}>{today.dateLabel}</Text>
      <Text style={styles.summary}>משימה אחת פעילה עכשיו</Text>

      <View accessibilityLabel="פעיל עכשיו" style={styles.activeCard}>
        <View style={styles.activeLabelRow}>
          <View style={styles.activeDot} />
          <Text style={styles.activeLabel}>פעיל עכשיו</Text>
        </View>
        <Text style={styles.title}>{activeTask.title}</Text>
        <Text style={styles.meta}>הערכה: כ־{activeTask.durationMinutes} דקות · עבודה</Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onFinish} style={styles.finishButton}>
            <Text style={styles.finishText}>סיום</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onStop} style={styles.stopButton}>
            <Text style={styles.stopText}>עצירה</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionLabel}>בהמשך היום</Text>
      <View accessibilityLabel="בהמשך היום" style={styles.taskList}>
        {remainingTasks.map((laterTask, index) => (
          <Pressable
            accessibilityLabel={`התחל משימה: ${laterTask.title}`}
            accessibilityRole="button"
            key={laterTask.id}
            onPress={() => onStartTask?.(laterTask.id)}
            style={[styles.taskRow, index === 0 && styles.divider]}
          >
            <View style={styles.checkbox} />
            <Text style={styles.taskTitle}>{laterTask.title}</Text>
            <Text style={styles.duration}>{laterTask.durationMinutes} דק׳</Text>
          </Pressable>
        ))}
      </View>

      <View accessibilityLabel="התחייבות קרובה" style={styles.commitment}>
        <Text style={styles.time}>{today.commitment.time}</Text>
        <Text style={styles.commitmentTitle}>{today.commitment.title}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, paddingHorizontal: 22, paddingTop: spacing.xs },
  date: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: typography.size.display, lineHeight: 36, textAlign: 'right', writingDirection: 'rtl' },
  summary: { color: colors.textMuted, fontFamily: typography.family.medium, fontSize: typography.size.label, marginTop: 10, textAlign: 'right', writingDirection: 'rtl' },
  activeCard: { backgroundColor: colors.accent, borderRadius: 24, marginTop: spacing.lg, padding: spacing.xl },
  activeLabelRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.xs },
  activeDot: { backgroundColor: colors.white, borderRadius: 5, height: 9, width: 9 },
  activeLabel: { color: colors.white, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.7 },
  title: { color: colors.white, fontFamily: typography.family.bold, fontSize: 23, lineHeight: 31, marginTop: spacing.md, textAlign: 'right', writingDirection: 'rtl' },
  meta: { color: '#E1F2F0', fontFamily: typography.family.regular, fontSize: typography.size.meta, marginTop: 5, textAlign: 'right', writingDirection: 'rtl' },
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg },
  finishButton: { alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, flex: 1, height: 48, justifyContent: 'center' },
  finishText: { color: colors.accentText, fontFamily: typography.family.bold, fontSize: typography.size.button },
  stopButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.55)', borderRadius: radius.md, borderWidth: 1, height: 48, justifyContent: 'center', paddingHorizontal: spacing.xl },
  stopText: { color: colors.white, fontFamily: typography.family.bold, fontSize: typography.size.button },
  sectionLabel: { color: colors.textSubtle, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.5, marginBottom: spacing.xxs, marginTop: 24, textAlign: 'right', writingDirection: 'rtl' },
  taskList: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  taskRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.sm, minHeight: 54 },
  divider: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
  checkbox: { borderColor: '#C9C3B5', borderRadius: 11, borderWidth: 1.75, height: 22, width: 22 },
  taskTitle: { color: colors.text, flex: 1, fontFamily: typography.family.medium, fontSize: typography.size.body, textAlign: 'right', writingDirection: 'rtl' },
  duration: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, writingDirection: 'rtl' },
  commitment: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, flexDirection: 'row-reverse', gap: spacing.md, marginTop: spacing.md, minHeight: 50, paddingHorizontal: spacing.md },
  time: { color: colors.textSoft, fontFamily: typography.family.bold, fontSize: typography.size.meta, writingDirection: 'ltr' },
  commitmentTitle: { color: colors.textMuted, flex: 1, fontFamily: typography.family.regular, fontSize: typography.size.meta, textAlign: 'right', writingDirection: 'rtl' },
});
