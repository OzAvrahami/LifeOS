import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MobileShell } from '@/components/mobile-shell';
import {
  CaptureDestination,
  QuickCaptureSheet,
} from '@/features/capture/quick-capture-sheet';
import { DEMO_TODAY } from '@/features/tasks/demo-task.fixture';
import { useDemoTasks } from '@/features/tasks/demo-task-provider';
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
}: {
  initialState?: InboxDemoState;
  onMoveToToday?: (task: InboxTask) => void;
  onNavigateToday?: () => void;
  onNavigateWeek?: () => void;
}) {
  const {
    cancelTask,
    captureTask,
    inboxTasks,
    moveTaskToInbox,
    moveTaskToToday,
    moveTaskToWeek,
    scheduleTask,
    updateTaskTitle,
  } = useDemoTasks();
  const integrated = initialState === 'normal';
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
  const [captureOpen, setCaptureOpen] = useState(false);
  const sharedItems: InboxTask[] = inboxTasks.map((task) => ({
    compactCreatedLabel: task.compactCreatedLabel,
    createdLabel: task.createdLabel,
    id: task.id,
    title: task.title,
  }));
  const items = integrated ? sharedItems : fixtureItems;
  const totalCount = integrated ? items.length : fixtureTotalCount;

  const removeTask = (task: InboxTask, closeSheet = true) => {
    setFixtureItems((current) => current.filter((item) => item.id !== task.id));
    setFixtureTotalCount((current) => Math.max(0, current - 1));
    if (closeSheet) setSelectedTask(null);
  };

  const moveToToday = (task: InboxTask) => {
    if (integrated) moveTaskToToday(task.id);
    else if (resolvedTaskId !== task.id) removeTask(task);
    setSelectedTask(null);
    setResolvedTaskId(null);
    onMoveToToday?.(task);
  };

  const moveToWeek = (task: InboxTask) => {
    if (integrated) moveTaskToWeek(task.id);
    else if (resolvedTaskId !== task.id) removeTask(task, false);
    setResolvedTaskId(task.id);
    setConfirmation('נשלח לשבוע · אותה משימה, עכשיו בתכנון');
  };

  const chooseDay = (task: InboxTask, day: string) => {
    if (integrated) scheduleTask(task.id, dayToDemoDate(day));
    else if (resolvedTaskId !== task.id) removeTask(task);
    setSelectedTask(null);
    setResolvedTaskId(null);
    setConfirmation(`נקבע ל${day} · אותה משימה`);
  };

  const deleteTask = (task: InboxTask) => {
    if (integrated) cancelTask(task.id);
    else if (resolvedTaskId !== task.id) removeTask(task);
    setSelectedTask(null);
    setResolvedTaskId(null);
    setConfirmation('הפריט נמחק מה־Inbox');
  };

  const editTask = (task: InboxTask, title: string) => {
    if (integrated) updateTaskTitle(task.id, title);
    else {
      setFixtureItems((current) =>
        current.map((item) => (item.id === task.id ? { ...item, title } : item)),
      );
    }
    setSelectedTask(null);
    setResolvedTaskId(null);
    setConfirmation('הכותרת עודכנה');
  };

  const stayInInbox = (task: InboxTask) => {
    if (resolvedTaskId === task.id) {
      if (integrated) moveTaskToInbox(task.id);
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

  const addTask = (title: string) => {
    if (integrated) {
      captureTask(title, 'inbox');
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

  const processMove = (task: InboxTask, destination: InboxDestination, day?: string) => {
    if (integrated) {
      if (destination === 'today') moveTaskToToday(task.id);
      if (destination === 'week') moveTaskToWeek(task.id);
      if (destination === 'day' && day) scheduleTask(task.id, dayToDemoDate(day));
      if (destination === 'deleted') cancelTask(task.id);
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
        initialIndex={integrated ? 0 : undefined}
        items={integrated ? items : undefined}
        onExit={() => setScreenState(items.length ? 'normal' : 'empty')}
        onMove={processMove}
      />
    );
  }

  const isBusy = screenState === 'busy';
  const isEmpty = items.length === 0;

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
            {isEmpty ? (
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
        onSave={(title, destination) => handleQuickCapture(title, destination, captureTask)}
        visible={captureOpen}
      />
      {selectedTask ? (
        <InboxItemActionSheet
          key={selectedTask.id}
          confirmation={resolvedTaskId === selectedTask.id ? confirmation : null}
          confirmedDestination={resolvedTaskId === selectedTask.id ? 'week' : undefined}
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

function dayToDemoDate(day: string) {
  if (day.startsWith('שני')) return '2026-08-10';
  if (day.startsWith('שלישי')) return '2026-08-11';
  return DEMO_TODAY;
}

function handleQuickCapture(
  title: string,
  destination: CaptureDestination,
  captureTask: (title: string, destination: 'inbox' | 'today' | 'week') => void,
) {
  if (destination !== 'day') captureTask(title, destination);
}
