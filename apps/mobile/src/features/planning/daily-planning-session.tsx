import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { useCommitments } from '@/features/commitments/commitment.queries';
import { TaskDateSelection } from '@/features/tasks/task-date-selection';
import { hebrewPlanningDate, weekStartForDateKey } from '@/features/tasks/task-dates';
import type { TaskCapturePlacement } from '@/features/tasks/task-capture.types';
import type { CreateTaskInput, Task, UpdateTaskInput } from '@/features/tasks/task.types';
import { synchronizeTaskCaches } from '@/features/tasks/task.queries';
import { DayAction, commitmentTimeLabel, taskEstimateLabel } from '@/features/week/week-day-view';
import { planningStyles as styles } from '@/features/week/weekly-planning.styles';
import { formatTaskMinutesHebrew } from '@/features/today/today-task-summary';
import { apiRequest } from '@/lib/api/client';
import { useWeeklyFocuses } from './planning.queries';
import { dailyPlanningKeys, useDailyPlanning, useDailyPlanningTasks } from './daily-planning.queries';
import { useDailyPlanningCommand } from './daily-planning-command';
import { dailyMembership, newPlanningOperationId } from './daily-planning-model';

export type DailySessionContext = { date: string; userId: string; timezone: string; weekStartDay: number; dayStartTime: string | null; dayEndTime: string | null };

export function DailyPlanningSession({ context, onClose }: { context: DailySessionContext; onClose: () => void }) {
  const { date, userId } = context;
  const { query, save } = useDailyPlanning(date);
  const tasksQuery = useDailyPlanningTasks(date);
  const commitments = useCommitments({ date });
  const weekStart = weekStartForDateKey(date, context.weekStartDay);
  const focuses = useWeeklyFocuses(weekStart);
  const command = useDailyPlanningCommand(save);
  const client = useQueryClient();
  const [capture, setCapture] = useState<{ focusTitle?: string; creationId: string } | null>(null);
  const [moving, setMoving] = useState<Task | null>(null);
  const [taskError, setTaskError] = useState(false);
  const [taskPending, setTaskPending] = useState(false);
  const taskBusy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const plan = query.data;
  const tasks = tasksQuery.data ?? [];
  const membership = dailyMembership(date, plan?.selectedTaskIds ?? [], tasks);
  const step = plan?.resumeStep ?? 1;
  const completed = plan?.status === 'completed';
  const loading = query.data === undefined || tasksQuery.data === undefined || commitments.data === undefined || focuses.data === undefined;
  const loadError = query.isError || tasksQuery.isError || commitments.isError || focuses.isError;
  const busy = command.pending || taskPending;
  const blocked = busy || !!command.failed || loading || loadError;
  const refresh = () => Promise.all([query.refetch(), tasksQuery.refetch(), commitments.refetch(), focuses.refetch()]);
  const persist = (selectedTaskIds: string[], nextStep = step) => {
    if (!plan || blocked) return;
    void command.run({ action: 'save', revision: plan.revision, step: nextStep, selectedTaskIds });
  };
  const updateTask = async (task: Task, input: UpdateTaskInput) => {
    if (taskBusy.current) return;
    taskBusy.current = true; setTaskPending(true); setTaskError(false);
    try {
      const result = await apiRequest<{ task: Task }>(`/tasks/${task.id}`, { auth: 'required', expectedUserId: userId,
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (mounted.current) {
        synchronizeTaskCaches(client, userId, result.task, { ensurePlanning: input.planning });
        await client.invalidateQueries({ queryKey: dailyPlanningKeys.user(userId) });
        setMoving(null);
      }
    } catch (error) { if (mounted.current) setTaskError(true); throw error; }
    finally { taskBusy.current = false; if (mounted.current) setTaskPending(false); }
  };
  const captureTask = async (title: string, placement: TaskCapturePlacement, details?: import('@/features/tasks/task-capture.types').TaskCaptureDetails) => {
    if (!capture) return;
    const input: CreateTaskInput = { title, ...(details ? { description: details.description } : {}), planning: placement.destination === 'day' ? { type: 'day', plannedDate: placement.plannedDate }
      : placement.destination === 'today' ? { type: 'day', plannedDate: date }
      : placement.destination === 'week' ? { type: 'week', weekStart } : { type: 'inbox' } };
    const result = await apiRequest<{ task: Task }>('/tasks', { auth: 'required', expectedUserId: userId,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': capture.creationId }, body: JSON.stringify(input) });
    if (mounted.current) {
      synchronizeTaskCaches(client, userId, result.task, { ensurePlanning: input.planning });
      await client.invalidateQueries({ queryKey: dailyPlanningKeys.tasks(userId, date) });
    }
    // Explicit creation does not imply selection; it becomes an ordinary candidate.
  };
  const close = () => { if (!busy && !capture && !moving && !command.failed) onClose(); };
  const candidates = tasks.filter(t => t.status === 'open' || t.status === 'in_progress');
  const unfinished = candidates.filter(t => t.previouslySelected || (t.plannedDate && t.plannedDate < date) || (t.dueDate && t.dueDate < date));
  const showTask = (task: Task, choices: boolean) => {
    const selected = plan?.selectedTaskIds.includes(task.id);
    return <View key={task.id} style={styles.card}>
      <Text style={styles.text}>{task.title}</Text>
      <Text style={styles.text}>{taskEstimateLabel(task)} · {task.plannedDate ? `תאריך מתוכנן: ${task.plannedDate}` : task.weekPlanId ? 'משויכת לשבוע, ללא יום' : 'ב־Inbox, ללא יום'}</Text>
      {task.dueDate ? <Text style={styles.text}>מועד אחרון: {task.dueDate}</Text> : null}
      {choices ? <>
        <DayAction label={`${selected ? 'הסר מהבחירה' : 'בחר לתכנון'}: ${task.title}`} disabled={blocked}
          onPress={() => persist(selected ? plan!.selectedTaskIds.filter(id => id !== task.id) : [...plan!.selectedTaskIds, task.id])} />
        <DayAction label={`דחה לתאריך אחר: ${task.title}`} disabled={blocked} onPress={() => setMoving(task)} />
        <DayAction label={`החזר ל־Inbox: ${task.title}`} disabled={blocked} onPress={() => { void updateTask(task, { planning: { type: 'inbox' } }).catch(() => {}); }} />
        <DayAction label={`סמן שהושלמה: ${task.title}`} disabled={blocked} onPress={() => { void updateTask(task, { status: 'completed' }).catch(() => {}); }} />
      </> : null}
    </View>;
  };
  return <Modal visible animationType="slide" onRequestClose={close}>
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" accessibilityLabel="תכנון יומי שמור">
        <DayAction label="סגירת התכנון וחזרה להיום" disabled={busy || !!capture || !!moving || !!command.failed} onPress={close} />
        <Text style={styles.text}>{hebrewPlanningDate(date)}</Text>
        <Text style={styles.text}>התכנון נשאר לתאריך הזה גם אם היום או אזור הזמן השתנו.</Text>
        {loading ? <Text style={styles.text}>טוען את התכנון ואת המשימות…</Text> : null}
        {loadError ? <><Text accessibilityRole="alert" style={styles.error}>לא הצלחנו לרענן את כל הנתונים. אין שמירה עד לטעינה תקינה.</Text>
          <DayAction label="נסה שוב טעינת התכנון" onPress={() => { void refresh(); }} /></> : null}
        {!loading && plan ? <>
          <Text accessibilityRole="header" style={styles.heading}>{completed ? 'סקירת התכנון שהושלם' : ['מה מחכה ביום הזה?', 'מה בוחרים ליום הזה?', 'סקירה ואישור'][step - 1]}</Text>
          {!completed ? <Text style={styles.text}>שלב {step} מתוך 3 · הבחירות וההתקדמות נשמרות בכל פעולה</Text> : null}
          {context.dayStartTime && context.dayEndTime ? <Text style={styles.text}>חלון היום: {context.dayStartTime}–{context.dayEndTime}. זהו טווח היום שלך, לא זמן פנוי.</Text> : null}
          <Text style={styles.text}>בחירה אינה שיבוץ. שינוי תאריך או חזרה ל־Inbox הם פעולות נפרדות, ואינם מסירים בחירה מהתכנון.</Text>
          {step === 1 && !completed ? <>
            <Text style={styles.heading}>משימות מתוארכות ליום הזה</Text>
            {tasks.filter(t => t.plannedDate === date && t.status !== 'cancelled').map(t => showTask(t, false))}
            <Text style={styles.heading}>משימות שלא הושלמו · לבדיקה</Text>
            {!unfinished.length ? <Text style={styles.text}>אין משימות מתוארכות או עם מועד אחרון שחלף שדורשות סקירה.</Text> : unfinished.map(t => showTask(t, true))}
          </> : null}
          {step <= 2 && !completed ? <>
            <Text style={styles.heading}>מיקודים לשבוע · כיוונים, לא משימות</Text>
            {!focuses.data?.length ? <Text style={styles.text}>לא הוגדרו מיקודים לשבוע הזה.</Text> : focuses.data.map(f => <View key={f.id} style={styles.card}>
              <Text style={styles.text}>{f.title}</Text><DayAction label={`יצירת משימה בהשראת: ${f.title}`} disabled={blocked} onPress={() => setCapture({ focusTitle: f.title, creationId: newPlanningOperationId() })} />
            </View>)}
            <DayAction label="הוסף משימה במהלך התכנון" disabled={blocked} onPress={() => setCapture({ creationId: newPlanningOperationId() })} />
            {step === 2 ? <>
              <Text style={styles.heading}>משימות לבחירה</Text>
              {!candidates.length ? <Text style={styles.text}>אין משימות פעילות. אפשר להוסיף משימה או להשלים תכנון ריק.</Text> : candidates.map(t => showTask(t, true))}
            </> : null}
          </> : null}
          <Text style={styles.heading}>התחייבויות בתאריך הזה</Text>
          {!commitments.data?.length ? <Text style={styles.text}>אין התחייבויות בתאריך הזה.</Text> : commitments.data.map(c => <Text key={c.id} style={styles.text}>{c.title} · {commitmentTimeLabel(c)}</Text>)}
          {(step === 3 || completed) ? <>
            <View accessibilityLabel="סיכום התכנון" style={styles.card}>
              <Text style={styles.text}>{plan.selectedTaskIds.length} בחירות מפורשות · {membership.dated.length} משימות מתוארכות נוספות</Text>
              <Text style={styles.text}>{membership.active.length} משימות פעילות ייחודיות · {formatTaskMinutesHebrew(membership.knownMinutes)} לפי הערכות קיימות</Text>
              <Text style={styles.text}>{membership.unknownCount} משימות פעילות ללא הערכת זמן. משימות שהושלמו או בוטלו אינן נכללות בזמן הפעיל.</Text>
              <Text style={styles.text}>התחייבויות מוצגות בנפרד. אין הסקה של זמן פנוי או קיבולת.</Text>
            </View>
            <Text style={styles.heading}>סדר המשימות שנבחרו</Text>
            {!plan.selectedTaskIds.length ? <Text style={styles.text}>לא נבחרו משימות. אפשר לאשר את היום גם כך.</Text> : null}
            {plan.selectedTaskIds.map((id, index) => {
              const task = tasks.find(t => t.id === id);
              return <View key={id} style={styles.card}>
                <Text style={styles.text}>{index + 1}. {task?.title ?? 'משימה שאינה זמינה עוד'}</Text>
                {task ? <Text style={styles.text}>{taskEstimateLabel(task)} · {task.status === 'completed' ? 'הושלמה' : task.status === 'cancelled' ? 'בוטלה' : task.plannedDate ? `תאריך מתוכנן: ${task.plannedDate}` : 'ללא תאריך מתוכנן'}</Text> : null}
                {!completed ? <>
                  <DayAction label={`הסר בחירה ${index + 1}`} disabled={blocked} onPress={() => persist(plan.selectedTaskIds.filter(value => value !== id))} />
                  {index > 0 ? <DayAction label={`הקדם בחירה ${index + 1}`} disabled={blocked} onPress={() => {
                    const ids = [...plan.selectedTaskIds]; [ids[index - 1], ids[index]] = [ids[index]!, ids[index - 1]!]; persist(ids);
                  }} /> : null}
                </> : null}
              </View>;
            })}
          </> : null}
          {completed ? <DayAction label="עריכת התכנון היומי" disabled={blocked} onPress={() => { void command.run({ action: 'edit', revision: plan.revision }); }} /> : <>
            <DayAction label={step === 3 ? 'אישור התכנון והתחלת היום' : 'שמירה והמשך'} disabled={blocked}
              onPress={() => step === 3 ? void command.run({ action: 'complete', revision: plan.revision }) : persist(plan.selectedTaskIds, step + 1)} />
            {step > 1 ? <DayAction label="השלב הקודם" disabled={blocked} onPress={() => persist(plan.selectedTaskIds, step - 1)} /> : null}
          </>}
        </> : null}
        {command.pending || taskPending ? <Text style={styles.text}>שומר…</Text> : null}
        {command.failed ? <View style={styles.card}>
          <Text accessibilityRole="alert" style={styles.error}>{command.conflict ? 'התכנון השתנה במקום אחר. הבקשה שלך לא דרסה אותו. יש לטעון ולבדוק את התכנון העדכני לפני בחירה מחדש.' : 'אישור השמירה לא התקבל. הבקשה נשמרה לניסיון חוזר; אין צורך לבחור מחדש.'}</Text>
          {!command.conflict ? <DayAction label="נסה שוב שמירת תכנון" disabled={busy} onPress={() => { void command.retry(); }} /> : null}
          <DayAction label="ויתור על הבקשה וטעינת התכנון העדכני" disabled={busy} onPress={() => { command.discard(); void refresh(); }} />
        </View> : null}
        {taskError ? <Text accessibilityRole="alert" style={styles.error}>עדכון המשימה לא אושר. אפשר לרענן ולנסות את הפעולה שוב.</Text> : null}
        {moving ? <TaskDateSelection value={moving.plannedDate} defaultDate={date} onCancel={() => setMoving(null)}
          onConfirm={nextDate => updateTask(moving, { planning: { type: 'day', plannedDate: nextDate } })} /> : null}
      </ScrollView>
    </SafeAreaView>
    {capture ? <QuickCaptureSheet visible lockDraftOnSaveAttempt defaultDate={date} initialDestination="inbox" focusTitle={capture.focusTitle}
      onSave={captureTask} onClose={() => { setCapture(null); void tasksQuery.refetch(); }} /> : null}
  </Modal>;
}
