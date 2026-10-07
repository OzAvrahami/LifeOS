import { TaskDetailScreen } from '@/features/tasks/task-detail-screen';
import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useEffect, useState } from 'react';
import { AppState, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DailyPlanningSession, type DailySessionContext } from '@/features/planning/daily-planning-session';
import { DailyPlanningEntry, DailySelectedTasks } from '@/features/planning/daily-planning-view';
import { useDailyPlanning, useDailyPlanningTasks } from '@/features/planning/daily-planning.queries';
import { dailyMembership } from '@/features/planning/daily-planning-model';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';

import { MobileShell } from '@/components/mobile-shell';
import { QuickCaptureSheet, type CaptureDestination } from '@/features/capture/quick-capture-sheet';
import { CommitmentEditor } from '@/features/commitments/commitment-editor';
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
import { formatTaskMinutesHebrew, summarizePlannedTaskTime } from './today-task-summary';
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
  const [detailsTaskId, setDetailsTaskId] = useState<string | null>(null);
  const userId = useTaskQueryScope();
  const [planningSession, setPlanningSession] = useState<DailySessionContext | null>(null);
  if (planningSession && planningSession.userId !== userId) setPlanningSession(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const refresh = () => tick(value => value + 1);
    const timer = setInterval(refresh, 30_000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  const [todayState, setTodayState] = useState<TodayDemoState>(initialState);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureInitialDestination, setCaptureInitialDestination] = useState<CaptureDestination>('inbox');
  const [commitmentEditorOpen, setCommitmentEditorOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<ServerCommitment | null>(null);
  const demo = useDemoTasks();
  const serverTasks = taskSource === 'server';
  const { effective: settings, query: settingsQuery } = useEffectiveSettings(serverTasks);
  const todayDate = localDateKey(undefined, settings.timezone);
  const dailyPlanning = useDailyPlanning(todayDate, serverTasks);
  const selectedTaskQuery = useDailyPlanningTasks(todayDate, serverTasks && !!dailyPlanning.query.data && dailyPlanning.query.data.status !== 'not_started');
  const selectionReady = !!selectedTaskQuery.data && !!dailyPlanning.query.data;
  const membership = dailyMembership(todayDate, selectionReady ? dailyPlanning.query.data!.selectedTaskIds : [], selectedTaskQuery.data ?? []);
  const todayQuery = useTasks({ plannedDate: todayDate }, serverTasks);
  const commitmentQuery = useCommitments({ date: todayDate }, serverTasks);
  const dailyPlanQuery = useDailyPlan(todayDate, serverTasks);
  const dailyPlanMutation = usePutDailyPlan();
  const updateMutation = useUpdateTask();
  const createCommitmentMutation = useCreateCommitment();
  const updateCommitmentMutation = useUpdateCommitment();
  const deleteCommitmentMutation = useDeleteCommitment();
  const { captureTask, defaultDate } = useTaskCapture(taskSource);
  const [operationError, setOperationError] = useState(false);
  const integrated = serverTasks || initialState === 'normal';
  const isHydrating = serverTasks && (
    todayQuery.isPending
    || commitmentQuery.isPending
    || dailyPlanQuery.isPending
    || settingsQuery.isPending
  );
  const sourceTasks = serverTasks ? (todayQuery.data ?? []).filter(task => !selectionReady || !dailyPlanning.query.data!.selectedTaskIds.includes(task.id)) : demo.todayTasks;
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
  const serverTaskTime = serverTasks
    ? selectionReady ? { knownMinutes: membership.knownMinutes, unknownEstimateCount: membership.unknownCount }
      : summarizePlannedTaskTime(todayQuery.data ?? [])
    : null;

  const openCapture = (destination: CaptureDestination) => {
    setCaptureInitialDestination(destination);
    setCaptureOpen(true);
  };

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
  const planningContent = serverTasks ? <View style={{ gap: spacing.md }}>
    <DailyPlanningEntry key={`${userId}:${todayDate}`} date={todayDate} onOpen={() => setPlanningSession({
      date: todayDate, userId, timezone: settings.timezone, weekStartDay: settings.weekStartDay,
      dayStartTime: settings.dayStartTime, dayEndTime: settings.dayEndTime,
    })} />
    {selectionReady ? <>
      <Text style={styles.taskSource}>הסיכום כולל משימות שנבחרו או תוארכו ליום הזה, ללא ספירה כפולה. הזמן לפי משימות פעילות בלבד.</Text>
      <DailySelectedTasks plan={dailyPlanning.query.data} tasks={selectedTaskQuery.data!} onTask={setDetailsTaskId}
        pending={updateMutation.isPending} onStatus={(id, status) => { void updateStatus(id, status); }} />
    </> : null}
    {selectedTaskQuery.isError ? <>
      <Text accessibilityRole="alert" style={styles.taskSource}>לא הצלחנו לרענן את המשימות שנבחרו.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="רענון המשימות שנבחרו" onPress={() => { void selectedTaskQuery.refetch(); }}>
        <Text style={styles.taskSource}>נסה שוב</Text>
      </Pressable>
    </> : null}
    {activeTask || completedTodayTasks.length ? <>
      <CommitmentSectionHeader onAdd={openNewCommitment} />
      <Commitments items={presentedCommitments} onPress={openExistingCommitment} />
    </> : null}
  </View> : undefined;

  if (integrated) {
    const activeTodayTask = activeTask ? toPresentedTodayTask(activeTask) : undefined;
    const openTasks = openTodayTasks.map(toPresentedTodayTask);
    const completedTasks = completedTodayTasks.map(toPresentedTodayTask);

    if (activeTodayTask) {
      content = (
        <ActiveState
          planningContent={planningContent}
          onOpenTask={serverTasks ? setDetailsTaskId : undefined}
          commitment={serverTasks ? null : undefined}
          laterTasks={openTasks}
          dateLabel={serverTasks ? hebrewDateLabel(undefined, settings.timezone) : undefined}
          onFinish={() => void updateStatus(activeTodayTask.id, 'completed')}
          onStartTask={(taskId) => void updateStatus(taskId, 'in_progress')}
          onStop={() => void updateStatus(activeTodayTask.id, 'open')}
          plannedTaskTime={serverTaskTime ? formatTaskMinutesHebrew(serverTaskTime.knownMinutes) : undefined}
          task={activeTodayTask}
          unknownEstimateCount={serverTaskTime?.unknownEstimateCount}
        />
      );
    } else if (completedTasks.length > 0) {
      const nextTask = openTasks[0] ?? null;
      content = (
        <PartiallyCompletedState
          planningContent={planningContent}
          onOpenTask={serverTasks ? setDetailsTaskId : undefined}
          completedTasks={completedTasks}
          dateLabel={serverTasks ? hebrewDateLabel(undefined, settings.timezone) : undefined}
          nextTask={nextTask}
          openTasks={openTasks}
          onStart={() => nextTask && void updateStatus(nextTask.id, 'in_progress')}
          plannedTaskTime={serverTaskTime ? formatTaskMinutesHebrew(serverTaskTime.knownMinutes) : undefined}
          unknownEstimateCount={serverTaskTime?.unknownEstimateCount}
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
          planningContent={planningContent}
          onOpenTask={serverTasks ? setDetailsTaskId : undefined}
          focusTask={focusTask}
          focusedTaskId={serverTasks ? dailyPlanQuery.data?.focusTaskId ?? undefined : undefined}
          dateLabel={serverTasks ? hebrewDateLabel(undefined, settings.timezone) : undefined}
          movedTaskId={movedTaskId ?? movedInboxTask?.id}
          onStartFocus={() => focusTask && void updateStatus(focusTask.id, 'in_progress')}
          onStartTask={(taskId) => void updateStatus(taskId, 'in_progress')}
          onToggleFocus={serverTasks ? (taskId) => void selectDailyFocus(taskId) : undefined}
          commitments={serverTasks ? presentedCommitments : undefined}
          onAddCommitment={serverTasks ? openNewCommitment : undefined}
          onAddTask={() => openCapture('today')}
          onEditCommitment={serverTasks ? openExistingCommitment : undefined}
          serverCommitmentCount={serverTasks ? serverCommitments.length : undefined}
          serverTaskCount={serverTasks ? selectionReady ? membership.union.length : sourceTasks.length : undefined}
          serverPlannedTaskTime={serverTaskTime ? formatTaskMinutesHebrew(serverTaskTime.knownMinutes) : undefined}
          serverUnknownEstimateCount={serverTaskTime?.unknownEstimateCount}
          onCreateFocusTask={() => openCapture('inbox')}
          suggestion={serverTasks ? undefined : normalTodayFixture.suggestion}
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
          onOpenTask={serverTasks ? setDetailsTaskId : undefined}
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
          onOpenTask={serverTasks ? setDetailsTaskId : undefined}
            focusTask={normalTodayFixture.focus}
            onAddTask={() => openCapture('today')}
            onStartFocus={() => setTodayState('active')}
            onCreateFocusTask={() => openCapture('inbox')}
            suggestion={normalTodayFixture.suggestion}
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
        onQuickCapture={() => openCapture('inbox')}
      >
        <TaskQueryNotice
          error={serverTasks && (todayQuery.isError || commitmentQuery.isError || dailyPlanQuery.isError || settingsQuery.isError || operationError)}
          loading={isHydrating}
          onRetry={() => void Promise.all([todayQuery.refetch(), commitmentQuery.refetch(), dailyPlanQuery.refetch(), settingsQuery.refetch()])}
        />
        {isHydrating ? null : content}
      </MobileShell>
      {serverTasks && planningSession?.userId === userId ? <DailyPlanningSession key={`${userId}:${planningSession.date}`}
        context={planningSession} onClose={() => setPlanningSession(null)} /> : null}
      {serverTasks && detailsTaskId ? <Modal visible animationType="slide" onRequestClose={() => setDetailsTaskId(null)}>
        <TaskDetailScreen id={detailsTaskId} onBack={() => setDetailsTaskId(null)} />
      </Modal> : null}
      <QuickCaptureSheet defaultDate={defaultDate}
        initialDestination={captureInitialDestination}
        key={captureInitialDestination}
        onClose={() => setCaptureOpen(false)}
        onSave={captureTask}
        visible={captureOpen}
      />
      {serverTasks && commitmentEditorOpen ? (
        <CommitmentEditor notificationPreferences={settingsQuery.data?.notifications}
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
  planningContent,
  onOpenTask,
  commitments,
  dateLabel,
  focusTask,
  focusedTaskId,
  movedTaskId,
  onAddCommitment,
  onAddTask,
  onCreateFocusTask,
  onEditCommitment,
  onStartFocus,
  onStartTask,
  onToggleFocus,
  serverCommitmentCount,
  serverPlannedTaskTime,
  serverTaskCount,
  serverUnknownEstimateCount,
  suggestion,
  tasks,
}: {
  planningContent?: ReactNode;
  onOpenTask?: (id: string) => void;
  commitments?: typeof normalTodayFixture.commitments;
  dateLabel?: string;
  focusTask?: TodayTask;
  focusedTaskId?: string;
  movedTaskId?: string;
  onAddCommitment?: () => void;
  onAddTask: () => void;
  onCreateFocusTask?: () => void;
  onEditCommitment?: (id: string) => void;
  onStartFocus: () => void;
  onStartTask?: (taskId: string) => void;
  onToggleFocus?: (taskId: string) => void;
  serverCommitmentCount?: number;
  serverPlannedTaskTime?: string;
  serverTaskCount?: number;
  serverUnknownEstimateCount?: number;
  suggestion?: string;
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
          commitmentCount={serverCommitmentCount ?? today.summary.commitmentCount}
          dateLabel={dateLabel ?? today.dateLabel}
          greeting={today.greeting}
          plannedTaskTime={serverPlannedTaskTime ?? today.summary.plannedTaskTime}
          taskCount={taskCount}
          unknownEstimateCount={serverUnknownEstimateCount ?? today.summary.unknownEstimateCount}
        />
        {planningContent}
        {focusTask ? <FocusCard onOpenTask={onOpenTask} onStart={onStartFocus} task={focusTask} /> : null}

        {onAddCommitment ? <CommitmentSectionHeader onAdd={onAddCommitment} /> : <SectionLabel>התחייבויות</SectionLabel>}
        <Commitments items={commitments ?? today.commitments} onPress={onEditCommitment} />

        <SectionLabel>המשימות שלי</SectionLabel>
        <Text style={styles.taskSource}>{planningContent ? 'משימות שתוכננו לתאריך של היום ולא מופיעות בבחירה למעלה.' : 'משימות שתוכננו לתאריך של היום.'}</Text>
        <TaskList
          onOpenTask={onOpenTask}
          focusedTaskId={focusedTaskId}
          newTaskId={movedTaskId}
          onStartTask={onStartTask}
          onToggleFocus={onToggleFocus}
          tasks={tasks}
        />
        <Pressable
          accessibilityLabel="הוסף משימה להיום"
          accessibilityRole="button"
          onPress={onAddTask}
          style={styles.addTaskButton}
        >
          <Text style={styles.addTaskText}>+ הוסף משימה</Text>
        </Pressable>

        {suggestion && onCreateFocusTask ? (
          <>
            <SectionLabel>מיקוד שבועי לדוגמה</SectionLabel>
            <TodaySuggestion onCreateTask={onCreateFocusTask} title={suggestion} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  taskSource: { color: colors.textMuted, fontFamily: typography.family.regular, textAlign: 'right', writingDirection: 'rtl' },
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
    durationMinutes: task.estimatedMinutes ?? null,
    id: task.id,
    lifeArea: task.lifeArea ?? 'work',
    title: task.title,
  };
}
