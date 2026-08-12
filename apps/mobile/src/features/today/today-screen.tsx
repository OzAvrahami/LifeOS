import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { MobileShell } from '@/components/mobile-shell';
import { colors, spacing, typography } from '@/theme/tokens';

import {
  Commitments,
  FocusCard,
  SectionLabel,
  TaskList,
  TodayHeader,
  TodaySuggestion,
} from './today.components';
import { normalTodayFixture } from './today.fixture';

export function TodayScreen() {
  const today = normalTodayFixture;

  return (
    <MobileShell>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <TodayHeader
          commitmentCount={today.summary.commitmentCount}
          dateLabel={today.dateLabel}
          greeting={today.greeting}
          plannedTime={today.summary.plannedTime}
          taskCount={today.summary.taskCount}
          workload={today.summary.workload}
        />
        <FocusCard task={today.focus} />

        <SectionLabel>התחייבויות</SectionLabel>
        <Commitments items={today.commitments} />

        <SectionLabel>המשימות שלי</SectionLabel>
        <TaskList tasks={today.tasks} />
        <Pressable accessibilityRole="button" style={styles.addTaskButton}>
          <Text style={styles.addTaskText}>+ הוסף משימה</Text>
        </Pressable>

        <SectionLabel>אפשר להוסיף להיום</SectionLabel>
        <TodaySuggestion title={today.suggestion} />
      </ScrollView>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: 22,
    paddingTop: spacing.xs,
  },
  addTaskButton: { alignSelf: 'flex-start', minHeight: 44, paddingVertical: spacing.sm },
  addTaskText: {
    color: colors.accent,
    fontFamily: typography.family.bold,
    fontSize: typography.size.body,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
