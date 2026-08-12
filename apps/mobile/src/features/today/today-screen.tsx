import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MobileShell } from '@/components/mobile-shell';
import {
  CaptureDestination,
  QuickCaptureSheet,
} from '@/features/capture/quick-capture-sheet';
import { useDemoTasks } from '@/features/tasks/demo-task-provider';
import { DemoTask } from '@/features/tasks/demo-task.types';
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
import { TodayDemoState, TodayTask } from './today.types';
import { UnplannedState } from './unplanned-state';

export function TodayScreen({
  initialState = 'normal',
  movedInboxTask,
  movedTaskId,
  onNavigateInbox,
  onNavigateWeek,
}: {
  initialState?: TodayDemoState;
  movedInboxTask?: { id: string; title: string };
  movedTaskId?: string;
  onNavigateInbox?: () => void;
  onNavigateWeek?: () => void;
}) {
  const [todayState, setTodayState] = useState<TodayDemoState>(initialState);
  const [captureOpen, setCaptureOpen] = useState(false);
  const {
    activeTask,
    captureTask,
    completeTask,
    completedTodayTasks,
    openTodayTasks,
    startTask,
    stopTask,
    todayTasks,
  } = useDemoTasks();
  const integrated = initialState === 'normal';

  let content;

  if (integrated) {
    const activeTodayTask = activeTask && todayTasks.some((task) => task.id === activeTask.id)
      ? toTodayTask(activeTask)
      : undefined;
    const openTasks = openTodayTasks.map(toTodayTask);
    const completedTasks = completedTodayTasks.map(toTodayTask);

    if (activeTodayTask) {
      content = (
        <ActiveState
          laterTasks={openTasks}
          onFinish={() => completeTask(activeTodayTask.id)}
          onStartTask={startTask}
          onStop={() => stopTask(activeTodayTask.id)}
          task={activeTodayTask}
        />
      );
    } else if (completedTasks.length > 0) {
      const nextTask = openTasks[0] ?? null;
      content = (
        <PartiallyCompletedState
          completedTasks={completedTasks}
          nextTask={nextTask}
          openTasks={openTasks}
          onStart={() => nextTask && startTask(nextTask.id)}
        />
      );
    } else {
      const legacyTask = movedInboxTask && !openTasks.some((task) => task.id === movedInboxTask.id)
        ? { ...movedInboxTask, durationMinutes: 0, lifeArea: 'work' as const }
        : undefined;
      const tasks = legacyTask ? [legacyTask, ...openTasks] : openTasks;
      const focusTask = tasks.find((task) => task.id === normalTodayFixture.focus.id) ?? tasks[0];
      content = (
        <NormalTodayContent
          focusTask={focusTask}
          movedTaskId={movedTaskId ?? movedInboxTask?.id}
          onStartFocus={() => focusTask && startTask(focusTask.id)}
          onStartTask={startTask}
          tasks={tasks}
        />
      );
    }
  } else {
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
          <NormalTodayContent
            focusTask={normalTodayFixture.focus}
            onStartFocus={() => setTodayState('active')}
            tasks={normalTodayFixture.tasks}
          />
        );
    }
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
      <QuickCaptureSheet
        onClose={() => setCaptureOpen(false)}
        onSave={(title, destination) => handleQuickCapture(title, destination, captureTask)}
        visible={captureOpen}
      />
    </>
  );
}

function NormalTodayContent({
  focusTask,
  movedTaskId,
  onStartFocus,
  onStartTask,
  tasks,
}: {
  focusTask?: TodayTask;
  movedTaskId?: string;
  onStartFocus: () => void;
  onStartTask?: (taskId: string) => void;
  tasks: TodayTask[];
}) {
  const today = normalTodayFixture;
  const showTransition = Boolean(movedTaskId && tasks.some((task) => task.id === movedTaskId));
  const taskCount = today.summary.taskCount + Math.max(0, tasks.length - normalTodayFixture.tasks.length);

  return (
    <View style={styles.normalContainer}>
      {showTransition ? (
        <View accessibilityLabel="אישור מעבר מ-Inbox להיום" style={styles.transitionToast}>
          <View style={styles.transitionCheck}>
            <Ionicons color={colors.white} name="checkmark" size={13} />
          </View>
          <Text style={styles.transitionText}>נוסף להיום מה־Inbox · אותה משימה</Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.content, showTransition && styles.contentWithToast]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <TodayHeader
          commitmentCount={today.summary.commitmentCount}
          dateLabel={today.dateLabel}
          greeting={today.greeting}
          plannedTime={today.summary.plannedTime}
          taskCount={taskCount}
          workload={today.summary.workload}
        />
        {focusTask ? <FocusCard onStart={onStartFocus} task={focusTask} /> : null}

        <SectionLabel>התחייבויות</SectionLabel>
        <Commitments items={today.commitments} />

        <SectionLabel>המשימות שלי</SectionLabel>
        <TaskList newTaskId={movedTaskId} onStartTask={onStartTask} tasks={tasks} />
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

function toTodayTask(task: DemoTask): TodayTask {
  return {
    durationMinutes: task.estimatedMinutes ?? 0,
    id: task.id,
    lifeArea: task.lifeArea ?? 'work',
    title: task.title,
  };
}

function handleQuickCapture(
  title: string,
  destination: CaptureDestination,
  captureTask: (title: string, destination: 'inbox' | 'today' | 'week') => void,
) {
  if (destination !== 'day') captureTask(title, destination);
}
