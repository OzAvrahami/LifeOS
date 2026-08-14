import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MobileShell } from '@/components/mobile-shell';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { useDemoTasks } from '@/features/tasks/demo-task-provider';
import {
  currentWeekStart,
  dateFromApprovedDayChoice,
  localDateKey,
} from '@/features/tasks/task-dates';
import { toInboxTask } from '@/features/tasks/task-presenters';
import { TaskQueryNotice } from '@/features/tasks/task-query-notice';
import { useCancelTask, useTasks, useUpdateTask } from '@/features/tasks/task.queries';
import { TaskSource } from '@/features/tasks/task.types';
import { useTaskCapture } from '@/features/tasks/use-task-capture';
import { spacing } from '@/theme/tokens';

import {
  InboxBusyList,
  InboxCapture,
  InboxConfirmation,
  InboxEmptyState,
  InboxHeader,
  InboxItemList,
} from './inbox.components';
import { busyInboxItems, normalInboxItems } from './inbox.fixture';
import { InboxItemActionSheet } from './inbox-item-action-sheet';
import { InboxProcessingView } from './inbox-processing';
import { InboxDemoState, InboxDestination, InboxTask } from './inbox.types';

export function InboxScreen({
  initialState = 'normal',
  onMoveToToday,
  onNavigateToday,
  onNavigateWeek,
  taskSource = 'preview',
}: {
  initialState?: InboxDemoState;
  onMoveToToday?: (task: InboxTask) => void;
  onNavigateToday?: () => void;
  onNavigateWeek?: () => void;
  taskSource?: TaskSource;
}) {
  const demo = useDemoTasks();
  const {
    cancelTask: cancelDemoTask,
    inboxTasks,
    moveTaskToInbox,
    moveTaskToToday,
    moveTaskToWeek,
    scheduleTask,
    updateTaskTitle,
  } = demo;
  const serverTasks = taskSource === 'server';
  const demoIntegrated = taskSource === 'preview' && initialState === 'normal';
  const inboxQuery = useTasks({ placement: 'inbox' }, serverTasks);
  const updateMutation = useUpdateTask();
  const cancelMutation = useCancelTask();
  const { captureTask } = useTaskCapture(taskSource);
  const [screenState, setScreenState] = useState<InboxDemoState>(initialState);
  const [fixtureItems, setFixtureItems] = useState<InboxTask[]>(() => {
    if (initialState === 'empty') return [];
    return initialState === 'busy' ? [...busyInboxItems] : [...normalInboxItems];
  });
  const [fixtureTotalCount, setFixtureTotalCount] = useState(
    initialState === 'busy' ? 23 : fixtureItems.length,
  );
  const [selectedTask, setSelectedTask] = useState<InboxTask | null>(null);
  const [resolvedTaskId, setResolvedTaskId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [operationError, setOperationError] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const sharedItems: InboxTask[] = serverTasks
    ? (inboxQuery.data ?? []).map((task) => toInboxTask(task))
    : inboxTasks.map((task) => ({
        compactCreatedLabel: task.compactCreatedLabel,
        createdLabel: task.createdLabel,
        id: task.id,
        title: task.title,
      }));
  const items = serverTasks || demoIntegrated ? sharedItems : fixtureItems;
  const totalCount = serverTasks || demoIntegrated ? items.length : fixtureTotalCount;

  const runServerAction = async (action: () => Promise<unknown>) => {
    setOperationError(false);
    try {
      await action();
      return true;
    } catch {
      setOperationError(true);
      return false;
    }
  };

  const removeTask = (task: InboxTask, closeSheet = true) => {
    setFixtureItems((current) => current.filter((item) => item.id !== task.id));
    setFixtureTotalCount((current) => Math.max(0, current - 1));
    if (closeSheet) setSelectedTask(null);
  };

  const moveToToday = async (task: InboxTask) => {
    if (serverTasks) {
      const moved = await runServerAction(() => updateMutation.mutateAsync({
        id: task.id,
        input: { planning: { plannedDate: localDateKey(), type: 'day' } },
      }));
      if (!moved) return;
    } else if (demoIntegrated) moveTaskToToday(task.id);
    else if (resolvedTaskId !== task.id) removeTask(task);
    setSelectedTask(null);
    setResolvedTaskId(null);
    onMoveToToday?.(task);
  };

  const moveToWeek = async (task: InboxTask) => {
    if (serverTasks) {
      const moved = await runServerAction(() => updateMutation.mutateAsync({
        id: task.id,
        input: { planning: { type: 'week', weekStart: currentWeekStart() } },
      }));
      if (!moved) return;
    } else if (demoIntegrated) moveTaskToWeek(task.id);
    else if (resolvedTaskId !== task.id) removeTask(task, false);
    setResolvedTaskId(task.id);
    setConfirmation('נשלח לשבוע · אותה משימה, עכשיו בתכנון');
  };

  const chooseDay = async (task: InboxTask, day: string) => {
    if (serverTasks) {
      const moved = await runServerAction(() => updateMutation.mutateAsync({
        id: task.id,
        input: { planning: { plannedDate: dateFromApprovedDayChoice(day), type: 'day' } },
      }));
      if (!moved) return;
    } else if (demoIntegrated) scheduleTask(task.id, dayToPreviewDate(day));
    else if (resolvedTaskId !== task.id) removeTask(task);
    setSelectedTask(null);
    setResolvedTaskId(null);
    setConfirmation(`נקבע ל${day} · אותה משימה`);
  };

  const deleteTask = async (task: InboxTask) => {
    if (serverTasks) {
      const cancelled = await runServerAction(() => cancelMutation.mutateAsync(task.id));
      if (!cancelled) return;
    } else if (demoIntegrated) cancelDemoTask(task.id);
    else if (resolvedTaskId !== task.id) removeTask(task);
    setSelectedTask(null);
    setResolvedTaskId(null);
    setConfirmation('הפריט נמחק מה־Inbox');
  };

  const editTask = async (task: InboxTask, title: string) => {
    if (serverTasks) {
      const updated = await runServerAction(() => updateMutation.mutateAsync({
        id: task.id,
        input: { title },
      }));
      if (!updated) return;
    } else if (demoIntegrated) updateTaskTitle(task.id, title);
    else {
      setFixtureItems((current) =>
        current.map((item) => (item.id === task.id ? { ...item, title } : item)),
      );
    }
    setSelectedTask(null);
    setResolvedTaskId(null);
    setConfirmation('הכותרת עודכנה');
  };

  const stayInInbox = async (task: InboxTask) => {
    if (resolvedTaskId === task.id) {
      if (serverTasks) {
        const moved = await runServerAction(() => updateMutation.mutateAsync({
          id: task.id,
          input: { planning: { type: 'inbox' } },
        }));
        if (!moved) return;
      } else if (demoIntegrated) moveTaskToInbox(task.id);
      else {
        setFixtureItems((current) =>
          current.some((item) => item.id === task.id) ? current : [task, ...current],
        );
        setFixtureTotalCount((current) => current + 1);
      }
      setConfirmation(null);
    }
    setResolvedTaskId(null);
    setSelectedTask(null);
  };

  const closeActionSheet = () => {
    setResolvedTaskId(null);
    setSelectedTask(null);
  };

  const addTask = async (title: string) => {
    if (serverTasks) {
      setOperationError(false);
      try {
        await captureTask(title, 'inbox');
      } catch (error) {
        setOperationError(true);
        throw error;
      }
      setConfirmation('נוסף ל־Inbox');
      return;
    }
    if (demoIntegrated) {
      await captureTask(title, 'inbox');
      setConfirmation('נוסף ל־Inbox');
      return;
    }
    const newTask: InboxTask = {
      compactCreatedLabel: 'עכשיו',
      createdLabel: 'נוסף עכשיו',
      id: `local-${Date.now()}`,
      title,
    };
    setFixtureItems((current) => [newTask, ...current]);
    setFixtureTotalCount((current) => current + 1);
    setScreenState((current) => (current === 'empty' ? 'normal' : current));
    setConfirmation('נוסף ל־Inbox');
  };

  const processMove = async (task: InboxTask, destination: InboxDestination, day?: string) => {
    if (serverTasks) {
      const moved = await runServerAction(() => {
        if (destination === 'deleted') return cancelMutation.mutateAsync(task.id);
        return updateMutation.mutateAsync({
          id: task.id,
          input: {
            planning: destination === 'today'
              ? { plannedDate: localDateKey(), type: 'day' }
              : destination === 'week'
                ? { type: 'week', weekStart: currentWeekStart() }
                : { plannedDate: dateFromApprovedDayChoice(day ?? ''), type: 'day' },
          },
        });
      });
      if (!moved) throw new Error('Task operation failed');
    } else if (demoIntegrated) {
      if (destination === 'today') moveTaskToToday(task.id);
      if (destination === 'week') moveTaskToWeek(task.id);
      if (destination === 'day' && day) scheduleTask(task.id, dayToPreviewDate(day));
      if (destination === 'deleted') cancelDemoTask(task.id);
    } else {
      setFixtureItems((current) => current.filter((item) => item.id !== task.id));
      setFixtureTotalCount((current) => Math.max(0, current - 1));
    }
    if (destination === 'today') setConfirmation('נוסף להיום מה־Inbox · אותה משימה');
    if (destination === 'week') setConfirmation('נשלח לשבוע · אותה משימה, עכשיו בתכנון');
    if (destination === 'day' && day) setConfirmation(`נקבע ל${day} · אותה משימה`);
    if (destination === 'deleted') setConfirmation('הפריט נמחק מה־Inbox');
  };

  if (screenState === 'processing') {
    return (
      <InboxProcessingView
        initialIndex={serverTasks || demoIntegrated ? 0 : undefined}
        items={serverTasks || demoIntegrated ? items : undefined}
        onExit={() => setScreenState(items.length ? 'normal' : 'empty')}
        onMove={processMove}
      />
    );
  }

  const isBusy = screenState === 'busy';
  const isLoading = serverTasks && inboxQuery.isPending;
  const isEmpty = !isLoading && items.length === 0;

  return (
    <>
      <MobileShell
        onNavigateToday={onNavigateToday}
        onNavigateWeek={onNavigateWeek}
        onQuickCapture={() => setCaptureOpen(true)}
        selected="inbox"
      >
        <View style={styles.container}>
          {confirmation && !resolvedTaskId ? <InboxConfirmation message={confirmation} /> : null}
          <ScrollView
            contentContainerStyle={[
              styles.content,
              isEmpty && styles.emptyContent,
              confirmation && styles.contentWithConfirmation,
            ]}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <InboxHeader
              busy={isBusy}
              count={isEmpty ? undefined : totalCount}
              onProcess={() => setScreenState('processing')}
            />
            <InboxCapture onAdd={addTask} />
            <TaskQueryNotice
              error={serverTasks && (inboxQuery.isError || operationError)}
              loading={isLoading}
              onRetry={() => void inboxQuery.refetch()}
            />
            {isLoading ? null : isEmpty ? (
              <InboxEmptyState />
            ) : isBusy ? (
              <InboxBusyList items={items} onOpen={setSelectedTask} />
            ) : (
              <InboxItemList items={items} onOpen={setSelectedTask} />
            )}
          </ScrollView>
        </View>
      </MobileShell>
      <QuickCaptureSheet
        onClose={() => setCaptureOpen(false)}
        onSave={captureTask}
        visible={captureOpen}
      />
      {selectedTask ? (
        <InboxItemActionSheet
          key={selectedTask.id}
          confirmation={resolvedTaskId === selectedTask.id ? confirmation : null}
          confirmedDestination={resolvedTaskId === selectedTask.id ? 'week' : undefined}
          error={operationError}
          onChooseDay={chooseDay}
          onClose={closeActionSheet}
          onDelete={deleteTask}
          onEdit={editTask}
          onMoveToToday={moveToToday}
          onMoveToWeek={moveToWeek}
          onStay={stayInInbox}
          task={selectedTask}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: spacing.xl, paddingHorizontal: 22, paddingTop: spacing.xs },
  emptyContent: { flexGrow: 1 },
  contentWithConfirmation: { paddingTop: 64 },
});

function dayToPreviewDate(day: string) {
  if (day.startsWith('שני')) return '2026-08-10';
  if (day.startsWith('שלישי')) return '2026-08-11';
  return '2026-08-09';
}
