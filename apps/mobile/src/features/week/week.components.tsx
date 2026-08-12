import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { weekDateRange } from './week.fixture';
import { UnscheduledWeekTask, WeekDay, WeeklyFocus, WeekWorkload } from './week.types';

const workloadColors: Record<WeekWorkload, { background: string; text: string }> = {
  פנוי: { background: '#E7F0EA', text: '#4E7C6A' },
  מאוזן: { background: colors.accentWeak, text: colors.accentText },
  עמוס: { background: '#F3EAD3', text: '#95701F' },
  'עמוס מדי': { background: colors.warningBadge, text: '#A8502F' },
};

export function WeekHeader({ showLabel = true }: { showLabel?: boolean }) {
  const [numericRange, ...hebrewDateParts] = weekDateRange.split(' ');

  return (
    <View>
      {showLabel ? <Text style={styles.eyebrow}>השבוע</Text> : null}
      <Text style={styles.dateRange}>
        <Text style={styles.numericRange}>{numericRange}</Text>
        {` ${hebrewDateParts.join(' ')}`}
      </Text>
    </View>
  );
}

export function WeeklyFocusCard({ focuses }: { focuses: WeeklyFocus[] }) {
  return (
    <View accessibilityLabel="המיקוד השבועי" style={styles.focusCard}>
      <View style={styles.focusHeading}>
        <Text style={styles.focusLabel}>המיקוד השבועי</Text>
        <Pressable accessibilityRole="button"><Text style={styles.edit}>עריכה</Text></Pressable>
      </View>
      <View style={styles.focusList}>
        {focuses.map((focus, index) => (
          <View key={focus.id} style={styles.focusRow}>
            <View style={styles.focusNumber}><Text style={styles.focusNumberText}>{index + 1}</Text></View>
            <Text style={styles.focusTitle}>{focus.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function WeekSectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function WorkloadBadge({ workload }: { workload: WeekWorkload }) {
  const palette = workloadColors[workload];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>{workload}</Text>
    </View>
  );
}

export function WeekDayRow({ children, day, expanded = false }: { children?: React.ReactNode; day: WeekDay; expanded?: boolean }) {
  return (
    <View
      accessibilityLabel={`יום ${day.weekday}`}
      accessibilityState={{ selected: day.isToday ?? false }}
      style={[
        styles.dayRow,
        day.isToday && styles.todayRow,
        expanded && styles.overloadedRow,
      ]}
    >
      <View style={styles.dayMainRow}>
        <View style={styles.dayIdentity}>
          <Text style={[styles.weekday, day.isPast && styles.pastText, day.isToday && styles.todayText]}>
            {day.isToday ? 'היום' : day.weekday}
          </Text>
          <Text style={[styles.dayDate, day.isPast && styles.pastDate, day.isToday && styles.todayText]}>{day.date}</Text>
        </View>
        <Text style={[styles.daySummary, day.isPast && styles.pastSummary]}>
          {day.taskCount} {day.taskCount === 1 ? 'משימה' : 'משימות'} · {day.plannedTime}
        </Text>
        {day.commitmentTime ? (
          <View style={styles.commitmentHint}>
            <Ionicons color={colors.textFaint} name="time-outline" size={11} />
            <Text style={styles.commitmentTime}>{day.commitmentTime}</Text>
          </View>
        ) : null}
        <WorkloadBadge workload={day.workload} />
      </View>
      {children}
    </View>
  );
}

export function UnscheduledWeekTasks({
  onMoveToToday,
  tasks,
}: {
  onMoveToToday?: (taskId: string) => void;
  tasks: UnscheduledWeekTask[];
}) {
  const [choosingTaskId, setChoosingTaskId] = useState<string | null>(null);
  const visibleTasks = tasks.slice(0, 2);
  const hiddenTaskCount = tasks.length - visibleTasks.length;
  return (
    <View accessibilityLabel="לתכנן השבוע" style={styles.unscheduledCard}>
      {visibleTasks.map((task) => (
        <View key={task.id} style={styles.unscheduledRow}>
          <Text style={styles.unscheduledTitle}>{task.title}</Text>
          <Text style={styles.duration}>{task.durationMinutes} דק׳</Text>
          {choosingTaskId === task.id ? (
            <View style={styles.dayChoices}>
              <Pressable
                accessibilityLabel={`שבץ להיום: ${task.title}`}
                accessibilityRole="button"
                onPress={() => onMoveToToday?.(task.id)}
                style={styles.todayChoice}
              >
                <Text style={styles.todayChoiceText}>היום</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`בטל שיבוץ: ${task.title}`}
                accessibilityRole="button"
                onPress={() => setChoosingTaskId(null)}
                style={styles.cancelChoice}
              >
                <Ionicons color={colors.textFaint} name="close" size={16} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityLabel={`בחר יום עבור ${task.title}`}
              accessibilityRole="button"
              onPress={() => setChoosingTaskId(task.id)}
              style={styles.chooseDay}
            >
              <Text style={styles.chooseDayText}>בחר יום</Text>
            </Pressable>
          )}
        </View>
      ))}
      {hiddenTaskCount > 0 ? (
        <Pressable accessibilityRole="button" style={styles.moreTask}>
          <Text style={styles.moreTaskText}>
            עוד {hiddenTaskCount === 1 ? 'משימה אחת' : `${hiddenTaskCount} משימות`} · {tasks[2].title} ←
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function WeekOverloadNotice() {
  return (
    <View accessibilityLabel="אזהרת עומס שבועית" style={styles.notice}>
      <Text style={styles.noticeTitle}>יום שני עמוס משמעותית.</Text>
      <Text style={styles.noticeBody}>
        מתוכננות 5 שעות מול יום עבודה רגיל. אפשר להזיז משימה או שתיים לימים פנויים יותר.
      </Text>
      <Pressable accessibilityRole="button" style={styles.noticeButton}>
        <Text style={styles.noticeButtonText}>לאזן את יום שני</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.body, textAlign: 'right', writingDirection: 'rtl' },
  dateRange: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: typography.size.display, lineHeight: 36, marginTop: 2, textAlign: 'right', writingDirection: 'rtl' },
  numericRange: { writingDirection: 'ltr' },
  focusCard: { backgroundColor: colors.accentWeak, borderRadius: radius.lg, marginTop: 10, paddingHorizontal: 13, paddingVertical: 10 },
  focusHeading: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 7 },
  focusLabel: { color: colors.accent, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.5, writingDirection: 'rtl' },
  edit: { color: colors.accent, fontFamily: typography.family.bold, fontSize: typography.size.label, writingDirection: 'rtl' },
  focusList: { gap: 7 },
  focusRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 11 },
  focusNumber: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 7, height: 24, justifyContent: 'center', width: 24 },
  focusNumberText: { color: colors.white, fontFamily: typography.family.extraBold, fontSize: typography.size.label, writingDirection: 'ltr' },
  focusTitle: { color: colors.text, flex: 1, fontFamily: typography.family.semibold, fontSize: 16, textAlign: 'right', writingDirection: 'rtl' },
  sectionLabel: { color: colors.textSubtle, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.5, marginBottom: 6, marginTop: spacing.sm, textAlign: 'right', writingDirection: 'rtl' },
  dayRow: { backgroundColor: colors.surface, borderRadius: 11, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  todayRow: { backgroundColor: colors.accentWeak, borderColor: colors.accent, borderWidth: 1.5 },
  overloadedRow: { borderColor: '#E3B79F', borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 11 },
  dayMainRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 10 },
  dayIdentity: { alignItems: 'baseline', flexDirection: 'row-reverse', gap: 5, width: 58 },
  weekday: { color: colors.textSubtle, fontFamily: typography.family.bold, fontSize: 12, writingDirection: 'rtl' },
  dayDate: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 15, writingDirection: 'ltr' },
  pastText: { color: '#B0AA9E' },
  pastDate: { color: colors.textSubtle },
  todayText: { color: colors.accent },
  daySummary: { color: colors.textMuted, flex: 1, fontFamily: typography.family.regular, fontSize: 12, textAlign: 'right', writingDirection: 'rtl' },
  pastSummary: { color: '#B8B2A6' },
  commitmentHint: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  commitmentTime: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: 11, writingDirection: 'ltr' },
  badge: { borderRadius: radius.round, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontFamily: typography.family.bold, fontSize: 11, writingDirection: 'rtl' },
  unscheduledCard: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 4 },
  unscheduledRow: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', gap: spacing.sm, minHeight: 47 },
  unscheduledTitle: { color: colors.text, flex: 1, fontFamily: typography.family.medium, fontSize: typography.size.body, textAlign: 'right', writingDirection: 'rtl' },
  duration: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, writingDirection: 'rtl' },
  chooseDay: { backgroundColor: colors.accentWeak, borderRadius: 9, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  chooseDayText: { color: colors.accent, fontFamily: typography.family.bold, fontSize: typography.size.label, writingDirection: 'rtl' },
  dayChoices: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.xxs },
  todayChoice: { backgroundColor: colors.accent, borderRadius: 9, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  todayChoiceText: { color: colors.white, fontFamily: typography.family.bold, fontSize: typography.size.label, writingDirection: 'rtl' },
  cancelChoice: { alignItems: 'center', height: 30, justifyContent: 'center', width: 26 },
  moreTask: { minHeight: 35, justifyContent: 'center' },
  moreTaskText: { color: colors.accent, fontFamily: typography.family.bold, fontSize: typography.size.label, textAlign: 'right', writingDirection: 'rtl' },
  notice: { backgroundColor: colors.warningSurface, borderRadius: radius.lg, marginTop: spacing.md, padding: spacing.md },
  noticeTitle: { color: colors.warningText, fontFamily: typography.family.bold, fontSize: typography.size.button, textAlign: 'right', writingDirection: 'rtl' },
  noticeBody: { color: colors.warningMuted, fontFamily: typography.family.regular, fontSize: typography.size.meta, lineHeight: 21, marginTop: 5, textAlign: 'right', writingDirection: 'rtl' },
  noticeButton: { alignItems: 'center', backgroundColor: colors.warningAction, borderRadius: 13, height: 46, justifyContent: 'center', marginTop: spacing.sm },
  noticeButtonText: { color: colors.white, fontFamily: typography.family.bold, fontSize: typography.size.body, writingDirection: 'rtl' },
});
