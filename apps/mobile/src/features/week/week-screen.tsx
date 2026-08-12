import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MobileShell } from '@/components/mobile-shell';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { colors, radius, spacing, typography } from '@/theme/tokens';

import {
  UnscheduledWeekTasks,
  WeekDayRow,
  WeekHeader,
  WeeklyFocusCard,
  WeekOverloadNotice,
  WeekSectionLabel,
} from './week.components';
import {
  normalWeekDays,
  overloadedDayTasks,
  overloadedWeekDays,
  unplannedWeekCommitments,
  unscheduledWeekTasks,
  weeklyFocuses,
} from './week.fixture';
import { WeekPlanningFlow } from './week-planning-flow';
import { WeekDemoState } from './week.types';

export function WeekScreen({
  initialState = 'normal',
  onNavigateInbox,
  onNavigateToday,
}: {
  initialState?: WeekDemoState;
  onNavigateInbox?: () => void;
  onNavigateToday?: () => void;
}) {
  const [weekState, setWeekState] = useState<WeekDemoState>(initialState);
  const [planningInitialStep, setPlanningInitialStep] = useState(initialState === 'planning' ? 2 : 0);
  const [captureOpen, setCaptureOpen] = useState(false);

  if (weekState === 'planning') {
    return <WeekPlanningFlow initialStep={planningInitialStep} onDone={() => setWeekState('normal')} />;
  }

  return (
    <>
      <MobileShell
        onNavigateInbox={onNavigateInbox}
        onNavigateToday={onNavigateToday}
        onQuickCapture={() => setCaptureOpen(true)}
        selected="week"
      >
        {weekState === 'unplanned' ? (
          <UnplannedWeek onPlan={() => { setPlanningInitialStep(0); setWeekState('planning'); }} />
        ) : weekState === 'overloaded' ? (
          <OverloadedWeek />
        ) : (
          <NormalWeek />
        )}
      </MobileShell>
      <QuickCaptureSheet onClose={() => setCaptureOpen(false)} visible={captureOpen} />
    </>
  );
}

function NormalWeek() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WeekHeader />
      <WeeklyFocusCard focuses={weeklyFocuses} />
      <WeekSectionLabel>השבוע שלך</WeekSectionLabel>
      <View accessibilityLabel="סקירת שבעת ימי השבוע" style={styles.days}>
        {normalWeekDays.map((day) => <WeekDayRow day={day} key={day.id} />)}
      </View>
      <WeekSectionLabel>לתכנן השבוע</WeekSectionLabel>
      <UnscheduledWeekTasks tasks={unscheduledWeekTasks} />
    </ScrollView>
  );
}

function OverloadedWeek() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WeekHeader showLabel={false} />
      <WeekOverloadNotice />
      <WeekSectionLabel>השבוע שלך</WeekSectionLabel>
      <View accessibilityLabel="סקירת שבעת ימי השבוע" style={styles.overloadedDays}>
        {overloadedWeekDays.map((day) => (
          <WeekDayRow day={day} expanded={day.id === 'mon'} key={day.id}>
            {day.id === 'mon' ? (
              <View accessibilityLabel="משימות יום שני" style={styles.overloadedTasks}>
                {overloadedDayTasks.map((task) => (
                  <View key={task.id} style={styles.overloadedTask}>
                    <Text style={styles.overloadedTaskTitle}>{task.title}</Text>
                    <Text style={styles.overloadedTaskDuration}>{task.durationMinutes} דק׳</Text>
                    <Pressable accessibilityRole="button"><Text style={styles.moveTask}>← הזז</Text></Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </WeekDayRow>
        ))}
      </View>
    </ScrollView>
  );
}

function UnplannedWeek({ onPlan }: { onPlan: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.unplannedContent} showsVerticalScrollIndicator={false}>
      <WeekHeader />
      <View accessibilityLabel="שבוע לא מתוכנן" style={styles.openWeek}>
        <View style={styles.calendarIcon}>
          <Ionicons color={colors.accent} name="calendar-clear-outline" size={42} />
        </View>
        <Text style={styles.openTitle}>השבוע שלך עדיין פתוח</Text>
        <Text style={styles.openMessage}>
          בוא נחליט מה באמת חשוב שיקרה השבוע — כמה מיקודים, לא רשימה אינסופית.
        </Text>
        <Pressable accessibilityRole="button" onPress={onPlan} style={styles.planButton}>
          <Text style={styles.planButtonText}>תכנן את השבוע</Text>
        </Pressable>
      </View>
      <View>
        <Text style={styles.fixedLabel}>כבר קבוע השבוע</Text>
        <View accessibilityLabel="כבר קבוע השבוע" style={styles.commitments}>
          {unplannedWeekCommitments.map((item, index) => (
            <View key={item.id} style={[styles.commitmentRow, index === 0 && styles.divider]}>
              <Text style={styles.commitmentDay}>{item.weekday}</Text>
              <Text style={styles.commitmentTitle}>{item.title}</Text>
              <Text style={styles.commitmentTime}>{item.time}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, paddingHorizontal: 22, paddingTop: spacing.xs },
  days: { gap: spacing.xxs },
  overloadedDays: { gap: 7 },
  overloadedTasks: { gap: spacing.xxs, marginTop: 10 },
  overloadedTask: { alignItems: 'center', flexDirection: 'row-reverse', gap: 10, minHeight: 24 },
  overloadedTaskTitle: { color: colors.text, flex: 1, fontFamily: typography.family.regular, fontSize: typography.size.meta, textAlign: 'right', writingDirection: 'rtl' },
  overloadedTaskDuration: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: 12, writingDirection: 'rtl' },
  moveTask: { color: colors.accent, fontFamily: typography.family.bold, fontSize: 12, writingDirection: 'rtl' },
  unplannedContent: { flexGrow: 1, paddingBottom: spacing.xl, paddingHorizontal: 22, paddingTop: spacing.xs },
  openWeek: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 365 },
  calendarIcon: { alignItems: 'center', backgroundColor: colors.accentWeak, borderRadius: 48, height: 96, justifyContent: 'center', width: 96 },
  openTitle: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 24, marginTop: spacing.md, textAlign: 'center', writingDirection: 'rtl' },
  openMessage: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: typography.size.button, lineHeight: 24, marginTop: spacing.xs, maxWidth: 280, textAlign: 'center', writingDirection: 'rtl' },
  planButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.accent, borderRadius: 15, height: 52, justifyContent: 'center', marginTop: spacing.lg },
  planButtonText: { color: colors.white, fontFamily: typography.family.bold, fontSize: typography.size.button, writingDirection: 'rtl' },
  fixedLabel: { color: colors.textSubtle, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.5, marginBottom: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
  commitments: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs },
  commitmentRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 14, minHeight: 46 },
  divider: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
  commitmentDay: { color: colors.textSubtle, fontFamily: typography.family.bold, fontSize: typography.size.label, writingDirection: 'rtl' },
  commitmentTitle: { color: colors.text, flex: 1, fontFamily: typography.family.regular, fontSize: typography.size.meta, textAlign: 'right', writingDirection: 'rtl' },
  commitmentTime: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, writingDirection: 'ltr' },
});
