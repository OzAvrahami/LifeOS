import { useEffect, useState } from 'react';
import { AppState, Modal, ScrollView, View } from 'react-native';
import { MobileShell } from '@/components/mobile-shell';
import { V2Button, V2Card, V2Notice, V2TaskRow, V2Text } from '@/components/v2';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { CommitmentEditor } from '@/features/commitments/commitment-editor';
import { useCommitments, useCreateCommitment, useDeleteCommitment, useUpdateCommitment } from '@/features/commitments/commitment.queries';
import type { Commitment } from '@/features/commitments/commitment.types';
import { DailyFlowCard } from '@/features/planning/daily-flow-card';
import { approvedDayTasks } from '@/features/planning/daily-flow.api';
import { useDailyFlow } from '@/features/planning/daily-flow.queries';
import { useDailyPlanning, useDailyPlanningTasks } from '@/features/planning/daily-planning.queries';
import { useDailyPlan, usePutDailyPlan } from '@/features/planning/planning.queries';
import { useEffectiveSettings } from '@/features/settings/settings.queries';
import { useDemoTasks } from '@/features/tasks/demo-task-provider';
import { TaskDetailScreen } from '@/features/tasks/task-detail-screen';
import { hebrewDateLabel, localDateKey } from '@/features/tasks/task-dates';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { useTasks, useUpdateTask } from '@/features/tasks/task.queries';
import { useTaskCapture } from '@/features/tasks/use-task-capture';
import type { Task } from '@/features/tasks/task.types';
import { spacing } from '@/theme/tokens';

// One identity across persisted selection and dated tasks. Dates, estimates and history are untouched.
export function todayTaskUnion(dated: Task[], selected: Task[], selectedIds: string[]) {
  const byId = new Map([...selected, ...dated].map(task => [task.id, task]));
  return [...new Set([...selectedIds, ...dated.map(task => task.id)])]
    .flatMap(id => byId.has(id) && byId.get(id)!.status !== 'cancelled' ? [byId.get(id)!] : []);
}

type TodayProps = {
  preview?: boolean; onNavigateInbox: () => void; onNavigateMore: () => void; onNavigateWeek: () => void;
};
export function V2TodayScreen(props: TodayProps) {
  const userId = useTaskQueryScope();
  return <ScopedToday key={userId} {...props} />;
}
function ScopedToday({ preview = false, onNavigateInbox, onNavigateMore, onNavigateWeek }: TodayProps) {
  const server = !preview;
  const demo = useDemoTasks();
  const { effective: settings, query: settingsQuery } = useEffectiveSettings(server);
  const [, tick] = useState(0);
  useEffect(() => {
    const refresh = () => tick(value => value + 1);
    const interval = setInterval(refresh, 30_000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);
  const date = localDateKey(undefined, settings.timezone);
  const ready = server && settingsQuery.data !== undefined;
  const dated = useTasks({ plannedDate: date }, ready);
  const commitments = useCommitments({ date }, ready);
  const planning = useDailyPlanning(date, ready);
  const flow = useDailyFlow(date, ready);
  const selected = useDailyPlanningTasks(date, ready && !!planning.query.data && planning.query.data.status !== 'not_started');
  const focus = useDailyPlan(date, ready);
  const saveFocus = usePutDailyPlan();
  const update = useUpdateTask();
  const createCommitment = useCreateCommitment();
  const updateCommitment = useUpdateCommitment();
  const deleteCommitment = useDeleteCommitment();
  const { captureTask, defaultDate } = useTaskCapture(server ? 'server' : 'preview');
  const [capture, setCapture] = useState<'today' | 'inbox' | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [editor, setEditor] = useState<Commitment | 'new' | null>(null);
  const [failed, setFailed] = useState(false);
  const approved = flow.query.data?.plan?.approved;
  const ids = approved ? flow.query.data!.plan!.ids : planning.query.data?.selectedTaskIds ?? [];
  const tasks = server ? approved ? approvedDayTasks(flow.query.data!.plan!, flow.query.data!.tasks)
    : todayTaskUnion(dated.data ?? [], selected.data ?? [], ids) : demo.todayTasks;
  const pending = update.isPending || saveFocus.isPending;
  const status = async (id: string, next: 'open' | 'in_progress' | 'completed') => {
    if (pending) return;
    if (preview) { if (next === 'completed') demo.completeTask(id); else if (next === 'in_progress') demo.startTask(id); else demo.stopTask(id); return; }
    setFailed(false);
    try { await update.mutateAsync({ id, input: { status: next } }); } catch { setFailed(true); }
  };
  const toggleFocus = async (id: string) => {
    if (pending || focus.data === undefined || focus.isError) return;
    setFailed(false);
    try { await saveFocus.mutateAsync({ date, input: { availableMinutes: focus.data?.availableMinutes ?? null, focusTaskId: focus.data?.focusTaskId === id ? null : id } }); } catch { setFailed(true); }
  };
  const loading = ready && ((flow.query.data === undefined && !flow.query.isError) || (!approved && dated.data === undefined && !dated.isError));
  const completed = tasks.filter(task => task.status === 'completed').length;
  return <>
    <MobileShell onNavigateInbox={onNavigateInbox} onNavigateMore={onNavigateMore} onNavigateWeek={onNavigateWeek} onQuickCapture={() => setCapture('inbox')}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl, gap: spacing.lg, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        {preview ? <V2Notice title="תצוגת פיתוח · משימות לדוגמה, ללא חיבור לחשבון או ליומן" /> : null}
        <View style={{ gap: spacing.xs }}>
          {ready || preview ? <V2Text variant="caption" muted>{hebrewDateLabel(undefined, settings.timezone)}</V2Text> : null}
          <V2Text variant="title" accessibilityRole="header">היום שלי</V2Text>
          <V2Text muted>קצת פחות לתכנן. קצת יותר לחיות.</V2Text>
        </View>
        {ready ? <DailyFlowCard date={date} onAllTasks={onNavigateInbox} /> : <V2Notice title={preview ? 'תכנון יומי זמין לאחר כניסה לחשבון. ההדגמה אינה מאשרת תוכנית.' : 'ממתין להגדרות היום לפני טעינת התכנון.'} />}
        {failed ? <V2Notice error title="השינוי לא נשמר. אפשר לנסות שוב באותה פעולה." /> : null}
        {server && settingsQuery.isError ? <V2Notice error title="הגדרות היום לא רועננו; מוצג המידע הזמין." onRetry={() => { void settingsQuery.refetch(); }} /> : null}
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', gap: spacing.sm }}>
          <V2Text variant="heading">המשימות שלי</V2Text>
          {!loading && (!server || dated.data !== undefined) ? <V2Text muted>{completed} מתוך {tasks.length} הושלמו</V2Text> : null}
        </View>
        {loading ? <V2Notice title="טוען את המשימות…" /> : null}
        {server && dated.isError ? <V2Notice error title="לא הצלחנו לרענן את המשימות. מידע שכבר נטען נשאר מוצג." onRetry={() => { void dated.refetch(); }} /> : null}
        {server && ids.length > 0 && selected.data === undefined ? <V2Notice error={selected.isError} title={selected.isError ? 'לא הצלחנו לטעון את המשימות שנבחרו לתכנון.' : 'טוען את הבחירה לתכנון…'} onRetry={selected.isError ? () => { void selected.refetch(); } : undefined} /> : null}
        {(ready || preview) && !loading && !dated.isError && !tasks.length && (!ids.length || selected.data !== undefined) ? <V2Card><V2Text>יש מקום ליום שלך.</V2Text><V2Text muted>אפשר להוסיף משימה או לבחור מתוך המשימות שלך. גם יום ללא משימות הוא תוכנית תקפה.</V2Text><V2Button secondary title="כל המשימות" onPress={onNavigateInbox} /></V2Card> : null}
        {tasks.map(task => <V2TaskRow key={task.id} task={task} context={ids.includes(task.id) ? approved || planning.query.data?.status === 'completed' ? 'נבחרה לתכנון היום' : 'טיוטת התכנון · טרם אושרה' : 'תוכננה לתאריך של היום'} pending={pending}
          onOpen={() => preview ? onNavigateInbox() : setDetails(task.id)} onStatus={next => { void status(task.id, next); }}
          focused={focus.data?.focusTaskId === task.id} onFocus={server && focus.data !== undefined && !focus.isError ? () => { void toggleFocus(task.id); } : undefined} />)}
        <V2Button secondary disabled={server && !ready} title="הוסף משימה להיום" onPress={() => setCapture('today')} />
        <V2Text variant="heading">ביומן היום</V2Text>
        <V2Text variant="caption" muted>התחייבויות שנשמרו ב־LifeOS. חיבורי Google ו־Apple עדיין אינם זמינים.</V2Text>
        {ready && commitments.data === undefined && !commitments.isError ? <V2Notice title="טוען התחייבויות…" /> : null}
        {server && commitments.isError ? <V2Notice error title="לא הצלחנו לרענן את ההתחייבויות." onRetry={() => { void commitments.refetch(); }} /> : null}
        {server && commitments.data?.length === 0 ? <V2Text muted>אין התחייבויות שמורות להיום.</V2Text> : null}
        {(server ? commitments.data ?? [] : []).map(item => <V2Card key={item.id}><V2Text variant="caption" muted>{item.startTime}{item.endTime ? `–${item.endTime}` : ''} · LifeOS</V2Text><V2Button secondary title={item.title} onPress={() => setEditor(item)} /></V2Card>)}
        {server ? <V2Button secondary disabled={!ready} title="הוספת התחייבות" onPress={() => setEditor('new')} /> : null}
      </ScrollView>
    </MobileShell>
    <QuickCaptureSheet defaultDate={defaultDate} initialDestination={capture ?? 'inbox'} visible={capture !== null} onSave={captureTask} onClose={() => setCapture(null)} />
    {details ? <Modal visible animationType="slide" onRequestClose={() => setDetails(null)}><TaskDetailScreen id={details} onBack={() => setDetails(null)} /></Modal> : null}
    {editor ? <CommitmentEditor visible commitment={editor === 'new' ? null : editor} initialDate={date} notificationPreferences={settingsQuery.data?.notifications}
      onClose={() => setEditor(null)} onSave={async input => { if (editor === 'new') await createCommitment.mutateAsync(input); else await updateCommitment.mutateAsync({ id: editor.id, input }); }} onDelete={async id => { await deleteCommitment.mutateAsync(id); }} /> : null}
  </>;
}
