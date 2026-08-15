import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { Commitment, LifeArea, TodayTask } from './today.types';

const lifeAreaColor: Record<LifeArea, string> = {
  work: colors.lifeArea.work,
  family: colors.lifeArea.family,
  home: colors.lifeArea.home,
};

export function TodayHeader({
  commitmentCount,
  dateLabel,
  greeting,
  plannedTime,
  taskCount,
  workload,
}: {
  commitmentCount: number;
  dateLabel: string;
  greeting: string;
  plannedTime: string;
  taskCount: number;
  workload: string;
}) {
  return (
    <View accessibilityLabel="סיכום היום" style={styles.header}>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.date}>{dateLabel}</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItems}>
          <Text style={styles.summaryText}>{taskCount} משימות</Text>
          <Text style={styles.summaryDivider}>·</Text>
          <Text style={styles.summaryText}>{commitmentCount} פגישות</Text>
          <Text style={styles.summaryDivider}>·</Text>
          <Text style={styles.summaryText}>
            <Text style={styles.ltr}>{plannedTime}</Text> שעות
          </Text>
        </View>
        <WorkloadBadge label={workload} />
      </View>
    </View>
  );
}

export function WorkloadBadge({ label }: { label: string }) {
  return (
    <View accessibilityLabel={`עומס היום: ${label}`} style={styles.workloadBadge}>
      <Text style={styles.workloadText}>{label}</Text>
    </View>
  );
}

export function FocusCard({ task, onStart }: { task: TodayTask; onStart?: () => void }) {
  return (
    <View accessibilityLabel="עכשיו" style={styles.focusCard}>
      <View style={styles.focusLabelRow}>
        <View style={styles.focusDot} />
        <Text style={styles.focusLabel}>עכשיו</Text>
      </View>
      <Text style={styles.focusTitle}>{task.title}</Text>
      <Text style={styles.focusMeta}>כ־{task.durationMinutes} דקות · עבודה</Text>
      <Pressable accessibilityRole="button" onPress={onStart} style={styles.startButton}>
        <Text style={styles.startButtonText}>התחלה</Text>
      </Pressable>
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Commitments({ items }: { items: Commitment[] }) {
  return (
    <View accessibilityLabel="התחייבויות" style={styles.timeline}>
      <View style={styles.timelineLine} />
      {items.map((item) => (
        <View key={item.id} style={styles.commitmentRow}>
          <View style={[styles.timelineDot, { backgroundColor: lifeAreaColor[item.lifeArea] }]} />
          <Text style={styles.commitmentTime}>{item.time}</Text>
          <Text style={styles.commitmentTitle}>{item.title}</Text>
        </View>
      ))}
    </View>
  );
}

export function TaskList({
  focusedTaskId,
  newTaskId,
  onStartTask,
  onToggleFocus,
  tasks,
}: {
  focusedTaskId?: string;
  newTaskId?: string;
  onStartTask?: (taskId: string) => void;
  onToggleFocus?: (taskId: string) => void;
  tasks: TodayTask[];
}) {
  const longPressedTaskIds = useRef(new Set<string>()).current;
  return (
    <View accessibilityLabel="המשימות שלי" style={styles.taskList}>
      {tasks.map((task, index) => (
        <Pressable
          accessibilityLabel={`התחל משימה: ${task.title}`}
          accessibilityHint={onToggleFocus ? 'לחיצה ארוכה בוחרת או מסירה מיקוד יומי' : undefined}
          accessibilityRole="button"
          accessibilityState={{ selected: task.id === focusedTaskId }}
          key={task.id}
          onLongPress={() => {
            longPressedTaskIds.add(task.id);
            onToggleFocus?.(task.id);
          }}
          onPress={() => {
            if (longPressedTaskIds.delete(task.id)) return;
            onStartTask?.(task.id);
          }}
          onPressIn={() => longPressedTaskIds.delete(task.id)}
          style={[
            styles.taskRow,
            task.id === newTaskId && styles.newTaskRow,
            index < tasks.length - 1 && styles.taskDivider,
          ]}
        >
          <View style={styles.checkbox} />
          <Text style={styles.taskTitle}>{task.title}</Text>
          {task.id === newTaskId ? (
            <Text style={styles.newTaskBadge}>חדש</Text>
          ) : (
            <>
              <View style={[styles.lifeAreaDot, { backgroundColor: lifeAreaColor[task.lifeArea] }]} />
              <Text style={styles.taskDuration}>{task.durationMinutes} דק׳</Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

export function TodaySuggestion({ title }: { title: string }) {
  return (
    <View accessibilityLabel="אפשר להוסיף להיום" style={styles.suggestion}>
      <Text style={styles.suggestionText}>{title}</Text>
      <View style={styles.suggestionButton}>
        <Ionicons color={colors.accent} name="add" size={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {},
  greeting: {
    color: colors.textSubtle,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.body,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  date: {
    color: colors.text,
    fontFamily: typography.family.extraBold,
    fontSize: typography.size.display,
    lineHeight: 36,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  summaryItems: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.xs },
  summaryText: {
    color: colors.textMuted,
    fontFamily: typography.family.medium,
    fontSize: typography.size.label,
    writingDirection: 'rtl',
  },
  summaryDivider: { color: '#CFC8BA', fontSize: typography.size.label },
  ltr: { writingDirection: 'ltr' },
  workloadBadge: {
    backgroundColor: colors.accentWeak,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  workloadText: {
    color: colors.accentText,
    fontFamily: typography.family.bold,
    fontSize: typography.size.label,
  },
  focusCard: {
    backgroundColor: colors.accentWeak,
    borderRadius: radius.xl,
    marginTop: spacing.md,
    padding: 17,
  },
  focusLabelRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.xs },
  focusDot: { backgroundColor: colors.accent, borderRadius: 5, height: 9, width: 9 },
  focusLabel: {
    color: colors.accent,
    fontFamily: typography.family.extraBold,
    fontSize: typography.size.label,
    letterSpacing: 0.7,
  },
  focusTitle: {
    color: colors.text,
    fontFamily: typography.family.bold,
    fontSize: typography.size.title,
    lineHeight: 27,
    marginTop: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  focusMeta: {
    color: colors.textMuted,
    fontFamily: typography.family.regular,
    fontSize: typography.size.meta,
    marginTop: 5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    marginTop: 14,
  },
  startButtonText: {
    color: colors.white,
    fontFamily: typography.family.bold,
    fontSize: typography.size.button,
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontFamily: typography.family.extraBold,
    fontSize: typography.size.label,
    letterSpacing: 0.5,
    marginBottom: spacing.xxs,
    marginTop: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  timeline: { paddingRight: spacing.md, position: 'relative' },
  timelineLine: {
    backgroundColor: '#E7E1D5',
    bottom: 8,
    position: 'absolute',
    right: 4,
    top: 8,
    width: 2,
  },
  commitmentRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 14,
    minHeight: 38,
    paddingVertical: 9,
  },
  timelineDot: {
    borderColor: colors.background,
    borderRadius: 5,
    borderWidth: 2,
    height: 9,
    position: 'absolute',
    right: -16,
    width: 9,
  },
  commitmentTime: {
    color: colors.textSoft,
    fontFamily: typography.family.bold,
    fontSize: typography.size.meta,
    minWidth: 38,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  commitmentTitle: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.body,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  taskList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
  taskRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: 13,
  },
  newTaskRow: { backgroundColor: colors.accentWeak, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  newTaskBadge: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    color: colors.accent,
    fontFamily: typography.family.bold,
    fontSize: 11,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    writingDirection: 'rtl',
  },
  taskDivider: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
  checkbox: { borderColor: '#C9C3B5', borderRadius: 11, borderWidth: 1.75, height: 22, width: 22 },
  taskTitle: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: typography.size.body,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  lifeAreaDot: { borderRadius: 4, height: 8, width: 8 },
  taskDuration: {
    color: colors.textFaint,
    fontFamily: typography.family.regular,
    fontSize: typography.size.label,
    minWidth: 42,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  suggestion: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
  },
  suggestionText: {
    color: '#5A574D',
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.meta,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  suggestionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
});
