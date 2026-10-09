import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { V2Button, V2Card, V2Notice, V2Text } from '@/components/v2';
import { useTheme } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';
import { ApiError } from '@/lib/api/client';
import { approvedDayTasks, proposalReasonText, type FlowCommand } from './daily-flow.api';
import { useDailyFlow } from './daily-flow.queries';
import { newPlanningOperationId } from './daily-planning-model';
import { PlanTaskLibrary } from './plan-task-library';
import { useCommitments } from '@/features/commitments/commitment.queries';

function ProposalCalendar({ date }: { date: string }) {
  const query = useCommitments({ date });
  return <V2Card>
    <V2Text variant="heading">ביומן היום</V2Text>
    <V2Text variant="caption" muted>התחייבויות LifeOS בלבד. Google ו־Apple עדיין אינם מחוברים כאן; ההצעה אינה מחשבת זמן פנוי.</V2Text>
    {query.isError ? <V2Notice error title="לא הצלחנו לרענן את ההתחייבויות." onRetry={() => { void query.refetch(); }} /> : null}
    {query.data === undefined && !query.isError ? <V2Text muted>טוען התחייבויות…</V2Text> : null}
    {query.data?.length === 0 ? <V2Text muted>אין התחייבויות שמורות לתאריך הזה.</V2Text> : null}
    {query.data?.map(event => <View key={event.id}><V2Text>{event.title}</V2Text><V2Text variant="caption" muted>{event.startTime}{event.endTime ? `–${event.endTime}` : ''} · LifeOS</V2Text></View>)}
  </V2Card>;
}

type Props = { date: string; source?: 'daily' | 'weekly'; onAllTasks: () => void };
export function DailyFlowCard(props: Props) {
  const flow = useDailyFlow(props.date);
  return <FlowCard key={`${flow.userId}:${props.date}`} {...props} flow={flow} />;
}
function FlowCard({ date, source = 'daily', flow }: Props & { flow: ReturnType<typeof useDailyFlow> }) {
  const { colors } = useTheme();
  const { data } = flow.query; const plan = data?.plan;
  const [mode, setMode] = useState<'proposal' | 'edit' | 'summary' | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [base, setBase] = useState({ revision: 0, snapshot: '' });
  const [pending, setPending] = useState(false);
  const [library, setLibrary] = useState(false);
  const [failure, setFailure] = useState<{ command: FlowCommand; conflict: boolean } | null>(null);
  const busy = useRef(false);
  const execute = async (command: FlowCommand) => {
    if (busy.current) return;
    busy.current = true; setPending(true); setFailure(null);
    try {
      const saved = await flow.save(command);
      if (command.action === 'propose') {
        setIds(saved.plan?.proposal?.ids ?? []); setBase({ revision: saved.plan?.revision ?? 0, snapshot: saved.snapshot }); setMode('proposal');
      } else { setMode(null); }
    } catch (error) { setFailure({ command, conflict: error instanceof ApiError && error.status === 409 }); }
    finally { busy.current = false; setPending(false); }
  };
  const send = (action: FlowCommand['action'], extra: Partial<FlowCommand> = {}, editing = false) => {
    if (!data) return;
    void execute({ action, operationId: newPlanningOperationId(), revision: editing ? base.revision : plan?.revision ?? 0,
      snapshot: editing ? base.snapshot : data.snapshot, ...extra });
  };
  const open = (next: 'proposal' | 'edit' | 'summary') => {
    if (!data) return;
    setIds(next === 'proposal' ? plan?.proposal?.ids ?? [] : plan?.ids ?? []);
    setBase({ revision: plan?.revision ?? 0, snapshot: data.snapshot });
    setNote(plan?.summary?.note ?? ''); setFailure(null); setMode(next);
  };
  const error = failure ? <V2Notice error title={failure.conflict
    ? 'הנתונים השתנו. הבחירה לא נדרסה. טען מחדש וסקור הצעה עדכנית.'
    : 'לא התקבל אישור לשמירה. הבחירה נשמרת כאן; אפשר לנסות שוב.'}
    onRetry={failure.conflict ? () => { setMode(null); setFailure(null); void flow.query.refetch(); } : () => { void execute(failure.command); }} /> : null;
  if (!data) return <V2Notice error={flow.query.isError} title={flow.query.isError
    ? 'הצעת היום אינה זמינה כרגע. נדרש API מעודכן וחיבור תקין.' : 'טוען את התוכנית השמורה…'} onRetry={flow.query.isError ? () => { void flow.query.refetch(); } : undefined} />;
  const historical = date < data.today;
  const proposal = plan?.proposal;
  const stale = !!proposal && proposal.snapshot !== data.snapshot;
  const chosen = ids.flatMap(id => data.tasks.find(t => t.id === id) ? [data.tasks.find(t => t.id === id)!] : []);
  const available = data.tasks.filter(t => !ids.includes(t.id) && ['open', 'in_progress'].includes(t.status));
  const move = (id: string, delta: number) => setIds(current => {
    const result = [...current]; const index = result.indexOf(id); const other = index + delta;
    if (index >= 0 && other >= 0 && other < result.length) [result[index], result[other]] = [result[other]!, result[index]!];
    return result;
  });
  const disabled = pending || !!failure;
  const rows = (selected: boolean) => (selected ? chosen : available).map((task, index) => <V2Card key={task.id}>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled }} accessibilityLabel={`${selected ? 'הסר' : 'הוסף'} לתוכנית: ${task.title}`}
      disabled={disabled} onPress={() => setIds(current => selected ? current.filter(id => id !== task.id) : [...current, task.id])} style={{ minHeight: 48, justifyContent: 'center' }}>
      <V2Text>{selected ? '✓ ' : '+ '}{task.title}</V2Text>
    </Pressable>
    <V2Text variant="caption" muted>{selected && mode === 'proposal' && proposal?.reasons[task.id] ? proposalReasonText(proposal.reasons[task.id]) : plan?.ids.includes(task.id) ? 'בתוכנית שאושרה' : 'בחירה ידנית שלך'}</V2Text>
    {task.plannedDate && task.plannedDate !== date ? <V2Text variant="caption" muted>תאריך המשימה: {task.plannedDate} · בחירה כאן אינה משנה אותו</V2Text> : null}
    {task.status === 'cancelled' ? <V2Text>המשימה בוטלה. יש להסיר אותה לפני השמירה.</V2Text> : null}
    {selected ? <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
      <V2Button secondary title="למעלה" accessibilityLabel={`העלה: ${task.title}`} disabled={disabled || index === 0} onPress={() => move(task.id, -1)} />
      <V2Button secondary title="למטה" accessibilityLabel={`הורד: ${task.title}`} disabled={disabled || index === chosen.length - 1} onPress={() => move(task.id, 1)} />
    </View> : null}
  </V2Card>);
  return <>
    <V2Card style={{ backgroundColor: colors.accentWeak }}>
      <V2Text variant="heading">{plan?.approved ? 'התוכנית שלך' : 'יום חדש, בחירה חדשה'}</V2Text>
      <V2Text>{plan?.approved ? plan.source === 'weekly' ? 'היום אושר בתכנון השבועי. שינויים מוצעים מחכים לבחירה שלך.' : 'התוכנית אושרה ונשמרה. אפשר לערוך אותה.' : 'הצעה מתוך המשימות שלך, בלי להעביר אוטומטית עבודה מימים קודמים.'}</V2Text>
      {flow.query.isError ? <V2Notice error title="הרענון נכשל. מוצגת התוכנית האחרונה שנטענה." onRetry={() => { void flow.query.refetch(); }} /> : null}
      {!historical ? <>
        {proposal ? <V2Button title={stale ? 'עדכון ההצעה שהשתנתה' : 'סקירת ההצעה השמורה'} busy={pending} onPress={() => stale ? send('propose') : open('proposal')} />
          : <V2Button title={plan?.approved ? 'בדיקת הצעות לשינוי' : 'הצעת היום'} busy={pending} onPress={() => send('propose')} />}
        {plan?.approved ? <V2Button secondary title="עריכת התוכנית" disabled={pending} onPress={() => open('edit')} /> : null}
      </> : <V2Text muted>תוכנית היסטורית · הבחירה נשמרת ללא שכתוב</V2Text>}
      {plan?.approved && date <= data.today ? <V2Button secondary title="סיכום היום · לא חובה" disabled={pending} onPress={() => open('summary')} /> : null}
      <V2Button secondary title="כל המשימות" disabled={pending} onPress={() => setLibrary(true)} />
      {!mode ? error : null}
    </V2Card>
    {mode ? <Modal visible animationType="slide" onRequestClose={() => { if (!pending) setMode(null); }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 640, alignSelf: 'center', width: '100%' }}>
          <V2Button secondary title={mode === 'summary' ? 'דילוג וחזרה ליום' : 'ביטול וחזרה ליום'} disabled={pending} onPress={() => setMode(null)} />
          <V2Text variant="caption">{date}</V2Text>
          <V2Text variant="title">{mode === 'summary' ? 'גם צעד קטן הוא התקדמות' : mode === 'edit' ? 'מה מתאים להיום?' : plan?.approved ? 'שינויים מוצעים לתוכנית' : 'ההצעה שלך'}</V2Text>
          {mode === 'summary' ? <>
            <V2Text>{approvedDayTasks(plan!, data.tasks).filter(t => t.status === 'completed').length} מתוך {approvedDayTasks(plan!, data.tasks).length} הושלמו</V2Text>
            <V2Text muted>מה שלא הושלם נשאר פתוח. מחר אפשר לבחור מחדש, גם בלי לשמור סיכום.</V2Text>
            <TextInput accessibilityLabel="הערה לסיכום היום" value={note} onChangeText={setNote} multiline maxLength={1000} editable={!disabled}
              placeholder="מה כדאי לזכור? (לא חובה)" placeholderTextColor={colors.textMuted} style={{ color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: spacing.md, minHeight: 100, textAlign: 'right', writingDirection: 'rtl' }} />
            <V2Button title="שמירת הסיכום" disabled={disabled} onPress={() => send('summarize', { note }, true)} />
          </> : <>
            <V2Text muted>{mode === 'edit' ? 'שמירה היא שינוי מפורש שלך בתוכנית המאושרת.' : 'עד 5 בחירות מוצעות, מהן עד 2 מימים קודמים. אפשר לשנות או לבחור יום ללא משימות.'}</V2Text>
            {plan?.approved && mode === 'proposal' ? <V2Text>התוכנית הקיימת נשארת בתוקף עד קבלת השינויים.</V2Text> : null}
            <ProposalCalendar date={date} />
            <V2Text variant="heading">{ids.length} בתוכנית</V2Text>
            {rows(true)}
            {ids.length === 0 ? <V2Notice title="יום ללא משימות הוא תוכנית תקפה." /> : null}
            {ids.some(id => !data.tasks.some(t => t.id === id)) ? <V2Button secondary title="הסרת הפניות למשימות שאינן זמינות" disabled={disabled} onPress={() => setIds(current => current.filter(id => data.tasks.some(t => t.id === id)))} /> : null}
            <V2Button title={mode === 'edit' ? 'שמירת השינויים' : plan?.approved ? 'קבלת השינויים המוצעים' : ids.length ? 'אישור התוכנית' : 'אישור יום ללא משימות'} disabled={disabled}
              onPress={() => send(mode === 'edit' ? 'edit' : 'approve', { ids, ...(mode === 'edit' ? {} : { source }) }, true)} />
            {mode === 'proposal' ? <>
              <V2Button secondary title="שמירת טיוטה להמשך" disabled={disabled} onPress={() => send('save-draft', { ids }, true)} />
              <V2Button secondary title="ויתור על ההצעה" disabled={disabled} onPress={() => send('discard', {}, true)} />
            </> : null}
            <V2Text muted>משימות שלא נבחרו נשארות פתוחות ונגישות ברשימת המשימות.</V2Text>
            <V2Button secondary title="כל המשימות" disabled={pending} onPress={() => { setMode(null); setLibrary(true); }} />
            <V2Text variant="heading">אפשר להוסיף</V2Text>
            {rows(false)}
          </>}
          {error}
        </ScrollView>
      </SafeAreaView>
    </Modal> : null}
    {library ? <PlanTaskLibrary date={date} onClose={() => setLibrary(false)} /> : null}
  </>;
}
