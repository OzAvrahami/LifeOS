import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MobileShell } from '@/components/mobile-shell';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { CommitmentEditor } from '@/features/commitments/commitment-editor';
import { useCommitments, useCreateCommitment, useDeleteCommitment, useUpdateCommitment } from '@/features/commitments/commitment.queries';
import type { Commitment } from '@/features/commitments/commitment.types';
import { useReplaceWeeklyFocuses, useWeeklyFocuses } from '@/features/planning/planning.queries';
import type { WeeklyFocus } from '@/features/planning/planning.types';
import { useEffectiveSettings } from '@/features/settings/settings.queries';
import { weekdayLabels } from '@/features/settings/settings.types';
import type { TaskCapturePlacement } from '@/features/tasks/task-capture.types';
import { addDaysToDateKey, hebrewPlanningDate, hebrewSelectedWeekRange, localDateKey, weekDateKeys, weekStartForDateKey, weekdayForDateKey } from '@/features/tasks/task-dates';
import { toWeekTask } from '@/features/tasks/task-presenters';
import { TaskQueryNotice } from '@/features/tasks/task-query-notice';
import { useCancelTask, useCreateTask, useTasks, useUpdateTask } from '@/features/tasks/task.queries';
import { spacing } from '@/theme/tokens';

import { tasksByPlannedDate } from './week-aggregation';
import { DayAction, WeekDayCard, WeekDayView } from './week-day-view';
import { WeekNavigation } from './week-navigation';
import type { WeekScreenProps } from './week-screen';
import { TaskDetails } from '@/features/tasks/task-details';
import { UnscheduledWeekTasks, WeeklyFocusCard, WeekSectionLabel } from './week.components';
import { WeeklyFocusEditor } from './weekly-focus-editor';
import { WeeklyPlanningEntry } from './weekly-planning-entry';
import { DailyFlowCard } from '@/features/planning/daily-flow-card';
import { approvedDayTasks } from '@/features/planning/daily-flow.api';
import { useWeekDays } from '@/features/planning/daily-flow.queries';

export function ServerWeekScreen({ onNavigateInbox, onNavigateMore, onNavigateToday }: WeekScreenProps) {
  const { effective: settings, query: settingsQuery } = useEffectiveSettings();
  const today = localDateKey(undefined, settings.timezone);
  // null follows the settings-aware current date until the user explicitly browses.
  const [anchorDate, setAnchorDate] = useState<string | null>(null);
  const [dayOpen, setDayOpen] = useState(false);
  const selectedDate = anchorDate ?? today;
  const weekStart = weekStartForDateKey(selectedDate, settings.weekStartDay);
  const dateKeys = weekDateKeys(weekStart);
  const weekEnd = dateKeys[6]!;
  const weekQuery = useTasks({ plannedDateFrom: weekStart, plannedDateTo: weekEnd });
  const daysQuery = useWeekDays(weekStart, settingsQuery.isSuccess);
  const weekOnlyQuery = useTasks({ weekStart });
  const commitmentQuery = useCommitments({ dateFrom: weekStart, dateTo: weekEnd });
  const focusQuery = useWeeklyFocuses(weekStart);
  const replaceFocus = useReplaceWeeklyFocuses();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const cancelTask = useCancelTask();
  const createCommitment = useCreateCommitment();
  const updateCommitment = useUpdateCommitment();
  const deleteCommitment = useDeleteCommitment();
  const [focusEditor, setFocusEditor] = useState<{ weekStart: string; focuses: WeeklyFocus[] } | null>(null);
  const [capture, setCapture] = useState<{ date: string; day: boolean; weekStart: string; focusTitle?: string } | null>(null);
  const [commitmentEditor, setCommitmentEditor] = useState<{ date: string; item?: Commitment } | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState(false);
  const tasks = weekQuery.data ?? [];
  const activeDays = tasksByPlannedDate(tasks, dateKeys);
  const tasksFor = (date: string) => {
    const plan = daysQuery.data?.days.find(day => day.date === date && day.approved);
    return plan ? approvedDayTasks(plan, daysQuery.data!.tasks) : tasks.filter(task => task.plannedDate === date);
  };
  for (const date of dateKeys) {
    const active = tasksFor(date).filter(task => ['open', 'in_progress'].includes(task.status));
    activeDays.set(date, { tasks: active, plannedMinutes: active.reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0) });
  }
  const completedFor = (date: string) => tasksFor(date).filter(task => task.status === 'completed');
  const commitmentsFor = (date: string) => (commitmentQuery.data ?? [])
    .filter(item => item.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const selectedTask = [...(daysQuery.data?.tasks ?? []), ...tasks, ...(weekOnlyQuery.data ?? [])].find(task => task.id === taskId && task.status !== 'cancelled');
  const browseDate = (date: string) => { setAnchorDate(date); setTaskId(null); setOperationError(false); };
  const captureTask = async (title: string, placement: TaskCapturePlacement) => {
    await createTask.mutateAsync({ title, planning: placement.destination === 'day'
      ? { type: 'day', plannedDate: placement.plannedDate }
      : placement.destination === 'today' ? { type: 'day', plannedDate: today }
        : placement.destination === 'week' ? { type: 'week', weekStart: capture!.weekStart }
          : { type: 'inbox' } });
  };
  const loading = settingsQuery.isPending || weekQuery.isPending || commitmentQuery.isPending || (daysQuery.data === undefined && !daysQuery.isError);
  const error = settingsQuery.isError || weekQuery.isError || commitmentQuery.isError;
  const notice = <TaskQueryNotice loading={loading || (!dayOpen && weekOnlyQuery.isPending)}
    error={error || operationError || (!dayOpen && (weekOnlyQuery.isError || focusQuery.isError))}
    onRetry={() => { setOperationError(false); void Promise.all([settingsQuery.refetch(), weekQuery.refetch(), weekOnlyQuery.refetch(), commitmentQuery.refetch(), focusQuery.refetch()]); }} />;

  if (focusEditor) return <WeeklyFocusEditor focuses={focusEditor.focuses} dateRange={hebrewSelectedWeekRange(focusEditor.weekStart)}
    onCancel={() => setFocusEditor(null)} onSaved={() => setFocusEditor(null)}
    onSave={titles => replaceFocus.mutateAsync({ titles, weekStart: focusEditor.weekStart })} />;

  return <>
    <MobileShell selected="week" onNavigateInbox={onNavigateInbox} onNavigateMore={onNavigateMore} onNavigateToday={onNavigateToday}
      onQuickCapture={() => setCapture({ date: selectedDate, day: false, weekStart })}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {selectedTask ? <TaskDetails backLabel={dayOpen ? 'חזרה ליום' : 'חזרה לשבוע'} key={selectedTask.id} task={selectedTask} onClose={() => setTaskId(null)}
          onUpdate={async input => { await updateTask.mutateAsync({ id: selectedTask.id, input }); }}
          onDelete={async () => { await cancelTask.mutateAsync(selectedTask.id); }} /> : <>
          {dayOpen ? <DayAction label="חזרה לשבוע" onPress={() => setDayOpen(false)} /> : null}
          <WeekNavigation kind={dayOpen ? 'day' : 'week'} label={dayOpen ? hebrewPlanningDate(selectedDate) : hebrewSelectedWeekRange(weekStart)}
            current={dayOpen ? selectedDate === today : weekStart === weekStartForDateKey(today, settings.weekStartDay)}
            onPrevious={() => browseDate(addDaysToDateKey(dayOpen ? selectedDate : weekStart, dayOpen ? -1 : -7))}
            onNext={() => browseDate(addDaysToDateKey(dayOpen ? selectedDate : weekStart, dayOpen ? 1 : 7))}
            onCurrent={() => { setAnchorDate(null); setTaskId(null); }} />
          {notice}
          {daysQuery.isError ? <TaskQueryNotice error loading={false} onRetry={() => { void daysQuery.refetch(); }} /> : null}
          {dayOpen && settingsQuery.isSuccess ? <DailyFlowCard date={selectedDate} source="weekly" onAllTasks={() => onNavigateInbox?.()} /> : null}
          {dayOpen ? (!loading && !error ? <WeekDayView active={activeDays.get(selectedDate)!} completed={completedFor(selectedDate)}
            commitments={commitmentsFor(selectedDate)} onTask={setTaskId}
            onCommitment={id => { const item = commitmentsFor(selectedDate).find(c => c.id === id); if (item) setCommitmentEditor({ date: selectedDate, item }); }}
            onAddTask={() => setCapture({ date: selectedDate, day: true, weekStart })}
            onAddCommitment={() => setCommitmentEditor({ date: selectedDate })} /> : null) : <>
            <WeeklyPlanningEntry key={weekStart} weekStart={weekStart} enabled={settingsQuery.isSuccess} />
            <WeeklyFocusCard focuses={focusQuery.data ?? []} state={focusQuery.isPending ? 'loading' : focusQuery.isError ? 'error' : 'ready'}
              onCreateTask={focusQuery.isSuccess && settingsQuery.isSuccess ? focus => setCapture({ date: selectedDate, day: false, weekStart, focusTitle: focus.title }) : undefined}
              onEdit={focusQuery.isSuccess ? () => setFocusEditor({ weekStart, focuses: focusQuery.data.map(f => ({ ...f })) }) : undefined} />
            {!loading && !error ? <View accessibilityLabel="סקירת שבעת ימי השבוע" style={styles.days}>
              {dateKeys.map(date => <WeekDayCard key={date} date={date} weekday={weekdayLabels[weekdayForDateKey(date)]!} today={date === today}
                active={activeDays.get(date)!} completed={completedFor(date)} commitments={commitmentsFor(date)}
                onOpen={() => { browseDate(date); setDayOpen(true); }} />)}
            </View> : null}
            <WeekSectionLabel>לתכנן בשבוע המוצג</WeekSectionLabel>
            {!weekOnlyQuery.isPending && !weekOnlyQuery.isError ? <UnscheduledWeekTasks onDetails={setTaskId} defaultDate={weekStart}
              tasks={(weekOnlyQuery.data ?? []).filter(t => t.status === 'open' || t.status === 'in_progress').map(toWeekTask)}
              onSchedule={async (id, plannedDate) => { await updateTask.mutateAsync({ id, input: { planning: { type: 'day', plannedDate } } }); }}
              onMoveToToday={async id => {
                setOperationError(false);
                try { await updateTask.mutateAsync({ id, input: { planning: { type: 'day', plannedDate: today } } }); onNavigateToday?.(); }
                catch { setOperationError(true); }
              }} /> : null}
          </>}
        </>}
      </ScrollView>
    </MobileShell>
    {capture ? <QuickCaptureSheet focusTitle={capture.focusTitle} visible initialDestination={capture.day ? 'day' : 'inbox'} defaultDate={capture.date}
      initialPlannedDate={capture.day ? capture.date : undefined} weekLabel="השבוע המוצג"
      onClose={() => setCapture(null)} onSave={captureTask} /> : null}
    {commitmentEditor ? <CommitmentEditor notificationPreferences={settingsQuery.data?.notifications} visible initialDate={commitmentEditor.date} commitment={commitmentEditor.item}
      onClose={() => setCommitmentEditor(null)} onDelete={async id => { await deleteCommitment.mutateAsync(id); }}
      onSave={async input => {
        if (commitmentEditor.item) await updateCommitment.mutateAsync({ id: commitmentEditor.item.id, input });
        else await createCommitment.mutateAsync(input);
      }} /> : null}
  </>;
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  days: { gap: spacing.sm },
});
