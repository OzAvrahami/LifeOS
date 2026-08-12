import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { MobileShell } from '@/components/mobile-shell';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { colors, spacing, typography } from '@/theme/tokens';

import { ActiveState } from './active-state';
import { OverloadedState } from './overloaded-state';
import { PartiallyCompletedState } from './partially-completed-state';
import {
  Commitments,
  FocusCard,
  SectionLabel,
  TaskList,
  TodayHeader,
  TodaySuggestion,
} from './today.components';
import { normalTodayFixture } from './today.fixture';
import { TodayDemoState } from './today.types';
import { UnplannedState } from './unplanned-state';

export function TodayScreen({ initialState = 'normal' }: { initialState?: TodayDemoState }) {
  const [todayState, setTodayState] = useState<TodayDemoState>(initialState);
  const [captureOpen, setCaptureOpen] = useState(false);

  let content;

  switch (todayState) {
    case 'unplanned':
      content = <UnplannedState />;
      break;
    case 'active':
      content = (
        <ActiveState
          onFinish={() => setTodayState('partially_completed')}
          onStop={() => setTodayState('normal')}
        />
      );
      break;
    case 'overloaded':
      content = <OverloadedState />;
      break;
    case 'partially_completed':
      content = <PartiallyCompletedState onStart={() => setTodayState('active')} />;
      break;
    default:
      content = <NormalTodayContent onStart={() => setTodayState('active')} />;
  }

  return (
    <>
      <MobileShell onQuickCapture={() => setCaptureOpen(true)}>{content}</MobileShell>
      <QuickCaptureSheet onClose={() => setCaptureOpen(false)} visible={captureOpen} />
    </>
  );
}

function NormalTodayContent({ onStart }: { onStart: () => void }) {
  const today = normalTodayFixture;

  return (
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
      <FocusCard onStart={onStart} task={today.focus} />

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
