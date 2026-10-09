import { useEffect, useState } from 'react';
import { AppState, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { MobileShell, V2Header } from '@/components/mobile-shell';
import { V2Button, V2Notice, V2TaskRow, V2Text } from '@/components/v2';
import { V2Icon } from '@/components/v2-icon';
import { useTheme } from '@/theme/theme-provider';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { CommitmentEditor } from '@/features/commitments/commitment-editor';
import { useCommitments, useCreateCommitment, useDeleteCommitment, useUpdateCommitment } from '@/features/commitments/commitment.queries';
import type { Commitment } from '@/features/commitments/commitment.types';
import { DailyFlowContent } from '@/features/planning/daily-flow-card';
import { approvedDayTasks } from '@/features/planning/daily-flow.api';
import { useDailyFlow } from '@/features/planning/daily-flow.queries';
import { useDailyPlan, usePutDailyPlan } from '@/features/planning/planning.queries';
import { useEffectiveSettings } from '@/features/settings/settings.queries';
import { useDemoTasks } from '@/features/tasks/demo-task-provider';
import { TaskDetailScreen } from '@/features/tasks/task-detail-screen';
import { hebrewDateLabel, localDateKey } from '@/features/tasks/task-dates';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { useUpdateTask } from '@/features/tasks/task.queries';
import { useTaskCapture } from '@/features/tasks/use-task-capture';
import type { Task } from '@/features/tasks/task.types';
import { v2Layout, v2Typography } from '@/theme/tokens';

// One identity across persisted selection and dated tasks. Dates, estimates and history are untouched.
export function todayTaskUnion(dated: Task[], selected: Task[], selectedIds: string[]) {
  const byId = new Map([...selected, ...dated].map(task => [task.id, task]));
  return [...new Set([...selectedIds, ...dated.map(task => task.id)])]
    .flatMap(id => byId.has(id) && byId.get(id)!.status !== 'cancelled' ? [byId.get(id)!] : []);
}

type TodayProps = {
  displayName?: string;
  preview?: boolean; onNavigateInbox: () => void; onNavigateMore: () => void; onNavigateWeek: () => void;
};
export function V2TodayScreen(props: TodayProps) {
  const userId = useTaskQueryScope();
  return <ScopedToday key={userId} {...props} />;
}
export function todayGreeting(timezone: string, displayName?: string) {
  const hour = Number(new Intl.DateTimeFormat('en', { timeZone: timezone, hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  const greeting = hour < 5 ? 'לילה טוב' : hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';
  return displayName?.trim() ? `${greeting}, ${displayName.trim()}` : greeting;
}
function ScopedToday({ preview = false, displayName, onNavigateInbox, onNavigateMore, onNavigateWeek }: TodayProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const narrow = width <= v2Layout.body.narrowBreakpoint;
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
  const commitments = useCommitments({ date }, ready);
  const flow = useDailyFlow(date, ready, true);
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
  const tasks = server ? approved ? approvedDayTasks(flow.query.data!.plan!, flow.query.data!.tasks) : [] : demo.todayTasks;
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
  const calendarContent = ready && (commitments.isError || commitments.isPending || !!commitments.data?.length) ? <View>
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: v2Layout.section.gap, marginTop: v2Layout.section.top, marginBottom: 2 }}>
      <V2Text variant="heading">ביומן היום</V2Text>
      {commitments.data?.length ? <V2Text muted style={{ fontSize: 12, lineHeight: 18.6 }}>{commitments.data.length === 1 ? 'אירוע אחד' : `${commitments.data.length} אירועים`}</V2Text> : null}
    </View>
    {commitments.data === undefined && !commitments.isError ? <V2Notice title="טוען התחייבויות…" /> : null}
    {commitments.isError ? <V2Notice error title="לא הצלחנו לרענן את ההתחייבויות." onRetry={() => { void commitments.refetch(); }} /> : null}
    {(commitments.data ?? []).map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`פרטי אירוע: ${item.title}`} onPress={() => setEditor(item)}
      style={({ pressed }) => ({ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 13, marginTop: 9, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 })}>
      <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 6, backgroundColor: colors.gold }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <V2Text style={{ fontSize: 13, lineHeight: 20.15, fontFamily: v2Typography.family.semibold }}>{item.title}</V2Text>
        <V2Text muted style={{ fontSize: 11, lineHeight: 17.05 }}>{item.startTime}{item.endTime ? `–${item.endTime}` : ''} · LifeOS</V2Text>
      </View>
      <V2Icon name="calendar" size={17} color={colors.textMuted} />
    </Pressable>)}
    <V2Text muted style={{ ...v2Typography.reason, marginTop: 8 }}>חיבורי Google ו־Apple עדיין אינם זמינים.</V2Text>
  </View> : null;
  return <>
    <MobileShell header={false} onNavigateInbox={onNavigateInbox} onNavigateMore={onNavigateMore} onNavigateWeek={onNavigateWeek} onQuickCapture={() => setCapture('inbox')}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: narrow ? v2Layout.body.narrowHorizontal : v2Layout.body.horizontal, paddingTop: narrow ? 14 : v2Layout.body.top, paddingBottom: v2Layout.body.bottom, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <V2Header displayName={displayName} onSettings={onNavigateMore} />
        {preview ? <V2Notice title="תצוגת פיתוח · משימות לדוגמה, ללא חיבור לחשבון או ליומן" /> : null}
        <View>
          {ready || preview ? <V2Text muted style={{ fontSize: 12, lineHeight: 18.6, marginBottom: 5 }}>{hebrewDateLabel(undefined, settings.timezone)}</V2Text> : null}
          <V2Text variant="title" accessibilityRole="header" style={[{ marginBottom: 8 }, narrow && v2Typography.narrowTitle]}>{todayGreeting(settings.timezone, displayName)}</V2Text>
          <V2Text variant="caption" muted>{approved ? 'צעד אחד בכל פעם.' : 'בוא נפנה מקום למה שחשוב לך.'}</V2Text>
        </View>
        {ready ? <DailyFlowContent key={`${flow.userId}:${date}`} flow={flow} date={date} today proposalCalendar={calendarContent} onAllTasks={onNavigateInbox} onAddTask={() => setCapture('today')} onOpenTask={setDetails} /> : !settingsQuery.isError ? <View style={{ marginTop: 17 }}><V2Notice title={preview ? 'תכנון יומי זמין לאחר כניסה לחשבון. ההדגמה אינה מאשרת תוכנית.' : 'טוען את היום שלך…'} /></View> : null}
        {failed ? <V2Notice error title="השינוי לא נשמר. אפשר לנסות שוב באותה פעולה." /> : null}
        {server && settingsQuery.isError ? <V2Notice error title="הגדרות היום לא רועננו; מוצג המידע הזמין." onRetry={() => { void settingsQuery.refetch(); }} /> : null}
        {tasks.length ? <V2Text variant="heading" style={{ marginTop: v2Layout.section.top, marginBottom: v2Layout.section.bottom }}>מה מקדמים היום</V2Text> : null}
        <View style={{ gap: v2Layout.task.listGap }}>
        {tasks.map(task => <V2TaskRow key={task.id} task={task} context="נבחרה לתכנון היום" pending={pending}
          onOpen={() => preview ? onNavigateInbox() : setDetails(task.id)} onStatus={next => { void status(task.id, next); }}
          focused={focus.data?.focusTaskId === task.id} onFocus={server && focus.data !== undefined && !focus.isError ? () => { void toggleFocus(task.id); } : undefined} />)}
        </View>
        {!flow.query.data?.plan?.proposal || approved ? calendarContent : null}
        {approved || preview ? <V2Button secondary icon="plus" style={{ marginTop: v2Layout.action.top }} title="הוסף משימה להיום" onPress={() => setCapture('today')} /> : null}
        {server && approved ? <V2Button secondary style={{ marginTop: v2Layout.action.gap }} disabled={!ready} title="הוספת התחייבות" onPress={() => setEditor('new')} /> : null}
      </ScrollView>
    </MobileShell>
    <QuickCaptureSheet defaultDate={defaultDate} initialDestination={capture ?? 'inbox'} visible={capture !== null} onSave={captureTask} onClose={() => setCapture(null)} />
    {details ? <Modal visible animationType="slide" onRequestClose={() => setDetails(null)}><TaskDetailScreen id={details} onBack={() => setDetails(null)} /></Modal> : null}
    {editor ? <CommitmentEditor visible commitment={editor === 'new' ? null : editor} initialDate={date} notificationPreferences={settingsQuery.data?.notifications}
      onClose={() => setEditor(null)} onSave={async input => { if (editor === 'new') await createCommitment.mutateAsync(input); else await updateCommitment.mutateAsync({ id: editor.id, input }); }} onDelete={async id => { await deleteCommitment.mutateAsync(id); }} /> : null}
  </>;
}
