import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { V2Button, V2Card, V2Notice, V2Text } from '@/components/v2';
import { getDailyFlow, type DailyFlow } from '@/features/planning/daily-flow.api';
import { newPlanningOperationId } from '@/features/planning/daily-planning-model';
import { saveWeekAllocation, type WeekAllocation } from '@/features/planning/week-allocation.api';
import { hebrewPlanningDate, weekDateKeys } from '@/features/tasks/task-dates';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { ApiError } from '@/lib/api/client';
import { useTheme } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

export function WeekAllocationEditor({ weekStart, today, onClose }: { weekStart: string; today: string; onClose: () => void }) {
  const userId = useTaskQueryScope();
  return <Editor key={userId + ':' + weekStart} weekStart={weekStart} today={today} userId={userId} onClose={onClose} />;
}
function Editor({ weekStart, today, userId, onClose }: { weekStart: string; today: string; userId: string; onClose: () => void }) {
  const { colors } = useTheme(); const client = useQueryClient();
  const dates = weekDateKeys(weekStart).filter(date => date >= today);
  const query = useQuery({ queryKey: ['week-review', userId, weekStart, today], staleTime: 0,
    queryFn: ({ signal }) => Promise.all(dates.map(async date => ({ date, flow: await getDailyFlow(userId, date, signal) }))) });
  const [draft, setDraft] = useState<Record<string, string[]> | null>(null);
  const [baseline, setBaseline] = useState<{ date: string; flow: DailyFlow }[]>([]);
  const [moving, setMoving] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<'conflict' | 'network' | null>(null);
  const request = useRef<WeekAllocation | null>(null);
  const busy = useRef(false); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  // Freeze one reviewed snapshot; background refetches must not replace a draft.
  if (query.data && !draft) {
    setBaseline(query.data);
    setDraft(Object.fromEntries(query.data.map(({ date, flow }) => [date, flow.plan?.approved ? flow.plan.ids
      : flow.plan?.proposal?.ids ?? flow.tasks.filter(task => task.plannedDate === date && ['open', 'in_progress'].includes(task.status)).map(task => task.id)])));
  }
  const tasks = baseline[0]?.flow.tasks ?? [];
  const assigned = new Set(Object.values(draft ?? {}).flat());
  const available = tasks.filter(task => ['open', 'in_progress'].includes(task.status) && !assigned.has(task.id));
  const locked = pending || !!failure;
  const assign = (id: string, target: string | null) => {
    setDraft(value => Object.fromEntries(Object.entries(value ?? {}).map(([date, ids]) => [date,
      date === target ? [...ids.filter(item => item !== id), id] : ids.filter(item => item !== id)])));
    setMoving(null);
  };
  const move = (date: string, index: number, delta: number) => setDraft(value => {
    const ids = [...value![date]!]; const other = index + delta;
    if (other >= 0 && other < ids.length) [ids[index], ids[other]] = [ids[other]!, ids[index]!];
    return { ...value, [date]: ids };
  });
  const save = async () => {
    if (!draft || busy.current) return;
    request.current ??= { operationId: newPlanningOperationId(), days: baseline.map(({ date, flow }) => ({
      date, revision: flow.plan?.revision ?? 0, snapshot: flow.snapshot, ids: draft[date]!,
    })) };
    busy.current = true; setPending(true); setFailure(null);
    try {
      await saveWeekAllocation(userId, weekStart, request.current);
      if (!mounted.current) return;
      await Promise.all(['daily-flow', 'daily-planning', 'week-days', 'task-memberships', 'week-review'].map(key => client.invalidateQueries({ queryKey: [key, userId] })));
      if (mounted.current) onClose();
    } catch (error) { if (mounted.current) setFailure(error instanceof ApiError && error.status === 409 ? 'conflict' : 'network'); }
    finally { busy.current = false; if (mounted.current) setPending(false); }
  };
  return <Modal visible animationType="slide" onRequestClose={() => { if (!pending) onClose(); }}>
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 22, gap: spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center', paddingBottom: 40 }}>
        <V2Button secondary title="ביטול וחזרה לשבוע" disabled={pending} onPress={onClose} />
        <V2Text variant="title">{review ? 'סקירת החלוקה לשבוע' : 'חלוקה שמתאימה לך'}</V2Text>
        <V2Text muted>בחירה שלך לפי יום וסדר, ללא שעות למשימות. התוכניות הקיימות נשארות בתוקף עד השמירה.</V2Text>
        <V2Text variant="caption" muted>אפשר להשאיר ימים פנויים. ימים שכבר עברו נשמרים ללא שינוי. אירועי היומן נשארים נפרדים.</V2Text>
        {!draft ? <V2Notice error={query.isError} title={query.isError ? 'לא הצלחנו לטעון את השבוע.' : 'טוען את התוכניות…'} onRetry={query.isError ? () => { void query.refetch(); } : undefined} /> : <>
          {baseline.map(({ date, flow }) => <V2Card key={date}>
            <V2Text variant="heading">{hebrewPlanningDate(date)}</V2Text>
            <V2Text variant="caption" muted>{flow.plan?.approved ? 'תוכנית מאושרת · עריכה מפורשת' : flow.plan?.proposal ? 'טיוטת הצעה · ממתינה לאישור' : 'בחירה ראשונה ליום הזה'}</V2Text>
            {draft[date]?.length === 0 ? <V2Text muted>יום ללא משימות</V2Text> : null}
            {draft[date]?.map((id, index) => {
              const task = tasks.find(item => item.id === id);
              return <View key={id} style={{ gap: spacing.xs }}>
                <V2Text>{index + 1}. {task?.title ?? 'משימה שאינה זמינה'}{task?.status === 'completed' ? ' · הושלמה' : ''}</V2Text>
                {!review ? <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs }}>
                  <V2Button secondary title="למעלה" accessibilityLabel={'העלה בשבוע: ' + (task?.title ?? id)} disabled={locked || index === 0} onPress={() => move(date, index, -1)} />
                  <V2Button secondary title="למטה" accessibilityLabel={'הורד בשבוע: ' + (task?.title ?? id)} disabled={locked || index === draft[date]!.length - 1} onPress={() => move(date, index, 1)} />
                  <V2Button secondary title="שינוי יום" accessibilityLabel={'שינוי יום בשבוע: ' + (task?.title ?? id)} disabled={locked} onPress={() => setMoving(id)} />
                </View> : null}
              </View>;
            })}
          </V2Card>)}
          {moving ? <V2Card><V2Text variant="heading">לאיזה יום להעביר?</V2Text>
            <V2Text>{tasks.find(task => task.id === moving)?.title}</V2Text>
            {tasks.find(task => task.id === moving)?.status !== 'completed' ? dates.map(date => <V2Button secondary key={date} title={hebrewPlanningDate(date)} accessibilityLabel={'העבר ליום ' + date} disabled={locked} onPress={() => assign(moving, date)} />) : null}
            <V2Button secondary title="הסרה מהחלוקה השבועית" disabled={locked} onPress={() => assign(moving, null)} />
            <V2Button secondary title="ביטול העברה" onPress={() => setMoving(null)} />
          </V2Card> : null}
          {!review ? <><V2Text variant="heading">משימות שאפשר לשבץ</V2Text>
            {available.length === 0 ? <V2Text muted>כל המשימות הפתוחות כבר בחלוקה, או שאין משימות פתוחות.</V2Text> : null}
            {available.map(task => <V2Card key={task.id}><V2Button secondary title={task.title} accessibilityLabel={'שיבוץ בשבוע: ' + task.title} disabled={locked} onPress={() => setMoving(task.id)} />
              <V2Text variant="caption" muted>{task.plannedDate ? 'תאריך המשימה: ' + task.plannedDate : 'ללא תאריך'}{task.dueDate ? ' · יעד: ' + task.dueDate : ''}</V2Text></V2Card>)}
          </> : <V2Notice title="האישור ישמור את כל הימים המוצגים יחד, כולל ימים ריקים. משימות שלא נבחרו נשארות ברשימת המשימות." />}
          {!failure ? <V2Button title={review ? 'אישור ושמירת השבוע' : 'סקירת החלוקה'} disabled={pending || !!moving || !dates.length} busy={pending}
            onPress={() => review ? void save() : setReview(true)} /> : null}
          {review && !locked ? <V2Button secondary title="שינוי החלוקה" onPress={() => setReview(false)} /> : null}
        </>}
        {failure ? <V2Notice error title={failure === 'conflict' ? 'השבוע השתנה. אף יום לא נדרס; יש לטעון ולסקור מחדש.' : 'לא התקבל אישור לשמירה. ניסיון חוזר משתמש באותה בקשה.'}
          onRetry={failure === 'conflict' ? () => { void query.refetch().then(result => { if (result.isSuccess) { request.current = null; setDraft(null); setReview(false); setFailure(null); } }); } : () => { void save(); }} /> : null}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
