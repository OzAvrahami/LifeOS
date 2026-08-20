import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MobileShell } from '@/components/mobile-shell';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { CommitmentEditor } from '@/features/commitments/commitment-editor';
import { formatMinutes, plannedMinutes, workloadState } from '@/features/commitments/commitment.metrics';
import {
  useCommitments,
  useCreateCommitment,
  useDeleteCommitment,
  useUpdateCommitment,
} from '@/features/commitments/commitment.queries';
import type { Commitment as ServerCommitment, CreateCommitmentInput } from '@/features/commitments/commitment.types';
import { useDailyPlan, usePutDailyPlan } from '@/features/planning/planning.queries';
import { useEffectiveSettings } from '@/features/settings/settings.queries';
import { useDemoTasks } from '@/features/tasks/demo-task-provider';
import { hebrewDateLabel, localDateKey } from '@/features/tasks/task-dates';
import { TaskQueryNotice } from '@/features/tasks/task-query-notice';
import { useTasks, useUpdateTask } from '@/features/tasks/task.queries';
import { TaskSource } from '@/features/tasks/task.types';
import { useTaskCapture } from '@/features/tasks/use-task-capture';
import { colors, spacing, typography } from '@/theme/tokens';

import { ActiveState } from './active-state';
import { OverloadedState } from './overloaded-state';
import { PartiallyCompletedState } from './partially-completed-state';
import {
  CommitmentSectionHeader,
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
  onNavigateMore,
  onNavigateWeek,
  taskSource = 'preview',
}: {
  initialState?: TodayDemoState;
  movedInboxTask?: { id: string; title: string };
  movedTaskId?: string;
  onNavigateInbox?: () => void;
  onNavigateMore?: () => void;
  onNavigateWeek?: () => void;
  taskSource?: TaskSource;
}) {
  const [todayState, setTodayState] = useState<TodayDemoState>(initialState);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [commitmentEditorOpen, setCommitmentEditorOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<ServerCommitment | null>(null);
  const demo = useDemoTasks();
  const serverTasks = taskSource === 'server';
  const { effective: settings, query: settingsQuery } = useEffectiveSettings(serverTasks);
  const todayDate = localDateKey(undefined, settings.timezone);
  const todayQuery = useTasks({ plannedDate: todayDate }, serverTasks);
  const commitmentQuery = useCommitments({ date: todayDate }, serverTasks);
  const dailyPlanQuery = useDailyPlan(todayDate, serverTasks);
  const dailyPlanMutation = usePutDailyPlan();
  const updateMutation = useUpdateTask();
  const createCommitmentMutation = useCreateCommitment();
  const updateCommitmentMutation = useUpdateCommitment();
  const deleteCommitmentMutation = useDeleteCommitment();
  const { captureTask } = useTaskCapture(taskSource);
  const [operationError, setOperationError] = useState(false);
  const integrated = serverTasks || initialState === 'normal';
  const isHydrating = serverTasks && (
    todayQuery.isPending
    || commitmentQuery.isPending
    || dailyPlanQuery.isPending
    || settingsQuery.isPending
  );
  const sourceTasks = serverTasks ? (todayQuery.data ?? []) : demo.todayTasks;
  const activeTask = sourceTasks.find((task) => task.status === 'in_progress');
  const openTodayTasks = sourceTasks.filter((task) => task.status === 'open');
  const completedTodayTasks = sourceTasks.filter((task) => task.status === 'completed');
  const serverCommitments = serverTasks ? commitmentQuery.data ?? [] : [];
  const presentedCommitments = serverCommitments.map((commitment) => ({
    id: commitment.id,
    lifeArea: commitment.lifeArea ?? 'personal' as const,
    time: commitment.startTime,
    title: commitment.title,
  }));
  const availableMinutes = dailyPlanQuery.data?.availableMinutes
    ?? settings.defaultDailyCapacityMinutes;
  const combinedPlannedMinutes = plannedMinutes(sourceTasks, serverCommitments);
  const serverWorkload = workloadState(combinedPlannedMinutes, availableMinutes);

  const openNewCommitment = () => {
    setEditingCommitment(null);
    setCommitmentEditorOpen(true);
  };

  const openExistingCommitment = (id: string) => {
    const commitment = serverCommitments.find((item) => item.id === id);
    if (!commitment) return;
    setEditingCommitment(commitment);
    setCommitmentEditorOpen(true);
  };

  const saveCommitment = async (input: CreateCommitmentInput) => {
    if (editingCommitment) {
      await updateCommitmentMutation.mutateAsync({ id: editingCommitment.id, input });
    } else {
      await createCommitmentMutation.mutateAsync(input);
    }
  };

  const selectDailyFocus = async (taskId: string) => {
    if (!serverTasks) return;
    setOperationError(false);
    try {
      await dailyPlanMutation.mutateAsync({
        date: todayDate,
        input: {
          availableMinutes: dailyPlanQuery.data?.availableMinutes ?? null,
          focusTaskId: dailyPlanQuery.data?.focusTaskId === taskId ? null : taskId,
        },
      });
    } catch {
      setOperationError(true);
    }
  };

  const updateStatus = async (taskId: string, status: 'open' | 'in_progress' | 'completed') => {
    if (!serverTasks) {
      if (status === 'in_progress') demo.startTask(taskId);
      if (status === 'open') demo.stopTask(taskId);
      if (status === 'completed') demo.completeTask(taskId);
      return;
    }
    setOperationError(false);
    try {
      await updateMutation.mutateAsync({ id: taskId, input: { status } });
    } catch {
      setOperationError(true);
    }
  };

  let content;

  if (integrated) {
    const activeTodayTask = activeTask ? toPresentedTodayTask(activeTask) : undefined;
    const openTasks = openTodayTasks.map(toPresentedTodayTask);
    const completedTasks = completedTodayTasks.map(toPresentedTodayTask);

    if (activeTodayTask) {
      content = (
        <ActiveState
          commitment={serverTasks ? presentedCommitments[0] ?? null : undefined}
          laterTasks={openTasks}
          dateLabel={serverTasks ? hebrewDateLabel(undefined, settings.timezone) : undefined}
          onFinish={() => void updateStatus(activeTodayTask.id, 'completed')}
          onStartTask={(taskId) => void updateStatus(taskId, 'in_progress')}
          onStop={() => void updateStatus(activeTodayTask.id, 'open')}
          task={activeTodayTask}
        />
      );
    } else if (completedTasks.length > 0) {
      const nextTask = openTasks[0] ?? null;
      content = (
        <PartiallyCompletedState
          completedTasks={completedTasks}
          dateLabel={serverTasks ? hebrewDateLabel(undefined, settings.timezone) : undefined}
          nextTask={nextTask}
          openTasks={openTasks}
          onStart={() => nextTask && void updateStatus(nextTask.id, 'in_progress')}
        />
      );
    } else {
      const legacyTask = movedInboxTask && !openTasks.some((task) => task.id === movedInboxTask.id)
        ? { ...movedInboxTask, durationMinutes: 0, lifeArea: 'work' as const }
        : undefined;
      const tasks = legacyTask ? [legacyTask, ...openTasks] : openTasks;
      const focusTask = serverTasks
        ? tasks.find((task) => task.id === dailyPlanQuery.data?.focusTaskId)
        : tasks.find((task) => task.id === normalTodayFixture.focus.id) ?? tasks[0];
      content = (
        <NormalTodayContent
          focusTask={focusTask}
          focusedTaskId={serverTasks ? dailyPlanQuery.data?.focusTaskId ?? undefined : undefined}
          dateLabel={serverTasks ? hebrewDateLabel(undefined, settings.timezone) : undefined}
          movedTaskId={movedTaskId ?? movedInboxTask?.id}
          onStartFocus={() => focusTask && void updateStatus(focusTask.id, 'in_progress')}
          onStartTask={(taskId) => void updateStatus(taskId, 'in_progress')}
          onToggleFocus={serverTasks ? (taskId) => void selectDailyFocus(taskId) : undefined}
          commitments={serverTasks ? presentedCommitments : undefined}
          onAddCommitment={serverTasks ? openNewCommitment : undefined}
          onEditCommitment={serverTasks ? openExistingCommitment : undefined}
          serverAvailableTime={serverTasks ? formatMinutes(availableMinutes) : undefined}
          serverCommitmentCount={serverTasks ? serverCommitments.length : undefined}
          serverTaskCount={serverTasks ? sourceTasks.length : undefined}
          serverPlannedTime={serverTasks ? formatMinutes(combinedPlannedMinutes) : undefined}
          serverWorkload={serverTasks ? serverWorkload : undefined}
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
        onNavigateMore={onNavigateMore}
        onNavigateWeek={onNavigateWeek}
        onQuickCapture={() => setCaptureOpen(true)}
      >
        <TaskQueryNotice
          error={serverTasks && (todayQuery.isError || commitmentQuery.isError || dailyPlanQuery.isError || settingsQuery.isError || operationError)}
          loading={isHydrating}
          onRetry={() => void Promise.all([todayQuery.refetch(), commitmentQuery.refetch(), dailyPlanQuery.refetch(), settingsQuery.refetch()])}
        />
        {isHydrating ? null : content}
      </MobileShell>
      <QuickCaptureSheet
        onClose={() => setCaptureOpen(false)}
        onSave={captureTask}
        visible={captureOpen}
      />
      {serverTasks && commitmentEditorOpen ? (
        <CommitmentEditor
          commitment={editingCommitment}
          initialDate={todayDate}
          onClose={() => setCommitmentEditorOpen(false)}
          onDelete={async (id) => { await deleteCommitmentMutation.mutateAsync(id); }}
          onSave={saveCommitment}
          visible
        />
      ) : null}
    </>
  );
}

function NormalTodayContent({
  commitments,
  dateLabel,
  focusTask,
  focusedTaskId,
  movedTaskId,
  onAddCommitment,
  onEditCommitment,
  onStartFocus,
  onStartTask,
  onToggleFocus,
  serverAvailableTime,
  serverCommitmentCount,
  serverPlannedTime,
  serverTaskCount,
  serverWorkload,
  tasks,
}: {
  commitments?: typeof normalTodayFixture.commitments;
  dateLabel?: string;
  focusTask?: TodayTask;
  focusedTaskId?: string;
  movedTaskId?: string;
  onAddCommitment?: () => void;
  onEditCommitment?: (id: string) => void;
  onStartFocus: () => void;
  onStartTask?: (taskId: string) => void;
  onToggleFocus?: (taskId: string) => void;
  serverAvailableTime?: string;
  serverCommitmentCount?: number;
  serverPlannedTime?: string;
  serverTaskCount?: number;
  serverWorkload?: string;
  tasks: TodayTask[];
}) {
  const today = normalTodayFixture;
  const showTransition = Boolean(movedTaskId && tasks.some((task) => task.id === movedTaskId));
  const taskCount = serverTaskCount
    ?? today.summary.taskCount + Math.max(0, tasks.length - normalTodayFixture.tasks.length);

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
          availableTime={serverAvailableTime}
          commitmentCount={serverCommitmentCount ?? today.summary.commitmentCount}
          dateLabel={dateLabel ?? today.dateLabel}
          greeting={today.greeting}
          plannedTime={serverPlannedTime ?? today.summary.plannedTime}
          taskCount={taskCount}
          workload={serverWorkload ?? today.summary.workload}
        />
        {focusTask ? <FocusCard onStart={onStartFocus} task={focusTask} /> : null}

        {onAddCommitment ? <CommitmentSectionHeader onAdd={onAddCommitment} /> : <SectionLabel>התחייבויות</SectionLabel>}
        <Commitments items={commitments ?? today.commitments} onPress={onEditCommitment} />

        <SectionLabel>המשימות שלי</SectionLabel>
        <TaskList
          focusedTaskId={focusedTaskId}
          newTaskId={movedTaskId}
          onStartTask={onStartTask}
          onToggleFocus={onToggleFocus}
          tasks={tasks}
        />
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

function toPresentedTodayTask(task: {
  estimatedMinutes?: number | null;
  id: string;
  lifeArea?: TodayTask['lifeArea'];
  title: string;
}): TodayTask {
  return {
    durationMinutes: task.estimatedMinutes ?? 0,
    id: task.id,
    lifeArea: task.lifeArea ?? 'work',
    title: task.title,
  };
}
