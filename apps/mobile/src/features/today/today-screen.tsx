import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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

export function TodayScreen({
  initialState = 'normal',
  movedInboxTask,
  onNavigateInbox,
  onNavigateWeek,
}: {
  initialState?: TodayDemoState;
  movedInboxTask?: { id: string; title: string };
  onNavigateInbox?: () => void;
  onNavigateWeek?: () => void;
}) {
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
      content = (
        <NormalTodayContent movedInboxTask={movedInboxTask} onStart={() => setTodayState('active')} />
      );
  }

  return (
    <>
      <MobileShell
        onNavigateInbox={onNavigateInbox}
        onNavigateWeek={onNavigateWeek}
        onQuickCapture={() => setCaptureOpen(true)}
      >
        {content}
      </MobileShell>
      <QuickCaptureSheet onClose={() => setCaptureOpen(false)} visible={captureOpen} />
    </>
  );
}

function NormalTodayContent({
  movedInboxTask,
  onStart,
}: {
  movedInboxTask?: { id: string; title: string };
  onStart: () => void;
}) {
  const today = normalTodayFixture;
  const tasks = movedInboxTask
    ? [{ ...movedInboxTask, durationMinutes: 0, lifeArea: 'work' as const }, ...today.tasks]
    : today.tasks;

  return (
    <View style={styles.normalContainer}>
      {movedInboxTask ? (
        <View accessibilityLabel="אישור מעבר מ-Inbox להיום" style={styles.transitionToast}>
          <View style={styles.transitionCheck}>
            <Ionicons color={colors.white} name="checkmark" size={13} />
          </View>
          <Text style={styles.transitionText}>נוסף להיום מה־Inbox · אותה משימה</Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.content, movedInboxTask && styles.contentWithToast]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <TodayHeader
          commitmentCount={today.summary.commitmentCount}
          dateLabel={today.dateLabel}
          greeting={today.greeting}
          plannedTime={today.summary.plannedTime}
          taskCount={today.summary.taskCount + (movedInboxTask ? 1 : 0)}
          workload={today.summary.workload}
        />
        <FocusCard onStart={onStart} task={today.focus} />

        <SectionLabel>התחייבויות</SectionLabel>
        <Commitments items={today.commitments} />

        <SectionLabel>המשימות שלי</SectionLabel>
        <TaskList newTaskId={movedInboxTask?.id} tasks={tasks} />
        <Pressable accessibilityRole="button" style={styles.addTaskButton}>
          <Text style={styles.addTaskText}>+ הוסף משימה</Text>
        </Pressable>

        <SectionLabel>אפשר להוסיף להיום</SectionLabel>
        <TodaySuggestion title={today.suggestion} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  normalContainer: { flex: 1 },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: 22,
    paddingTop: spacing.xs,
  },
  contentWithToast: { paddingTop: 64 },
  transitionToast: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    gap: 10,
    left: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    position: 'absolute',
    right: 22,
    top: 10,
    zIndex: 2,
  },
  transitionCheck: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  transitionText: {
    color: colors.background,
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.meta,
    textAlign: 'right',
    writingDirection: 'rtl',
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
