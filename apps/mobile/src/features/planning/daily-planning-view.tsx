import { Text, View } from 'react-native';
import type { Task } from '@/features/tasks/task.types';
import { DayAction, taskEstimateLabel } from '@/features/week/week-day-view';
import { planningStyles as styles } from '@/features/week/weekly-planning.styles';
import type { DailyPlanningPlan } from './daily-planning.api';
import { useDailyPlanning } from './daily-planning.queries';
import { useDailyPlanningCommand } from './daily-planning-command';
import { useTheme } from '@/theme/theme-provider';
import { V2Button } from '@/components/v2';

export function DailyPlanningEntry({ date, onOpen }: { date: string; onOpen: () => void }) {
  const { colors } = useTheme();
  const themed = { ...styles, card: [styles.card, { backgroundColor: colors.accentWeak, borderColor: colors.border }], heading: [styles.heading, { color: colors.text }], text: [styles.text, { color: colors.textMuted }], error: [styles.error, { color: colors.warningText }] };
  const { query, save } = useDailyPlanning(date);
  const command = useDailyPlanningCommand(save);
  const open = async () => {
    if (command.pending || command.failed) return;
    if (query.data && query.data.status !== 'not_started') { onOpen(); return; }
    if (await command.run({ action: 'start', revision: query.data?.revision ?? 0 })) onOpen();
  };
  return <View accessibilityLabel="מצב התכנון היומי" style={themed.card}>
    <Text style={themed.heading}>התכנון שלי להיום</Text>
    {query.data === undefined ? <>
      <Text style={query.isError ? themed.error : themed.text}>{query.isError ? 'לא הצלחנו לטעון את התכנון היומי. ייתכן שנדרש עדכון שרת.' : 'טוען את התכנון היומי…'}</Text>
      {query.isError ? <DayAction label="נסה שוב תכנון יומי" onPress={() => { void query.refetch(); }} /> : null}
    </> : <>
      <Text style={themed.text}>{query.data?.status === 'completed' ? 'התכנון להיום הושלם. אפשר לסקור אותו ולבחור לערוך.'
        : query.data?.status === 'in_progress' ? 'התכנון בתהליך · ההתקדמות והבחירות שמורות.' : 'מה תרצה לבחור ליום הזה?'}</Text>
      <V2Button title={query.data?.status === 'completed' ? 'סקירת התכנון להיום' : query.data?.status === 'in_progress' ? 'המשך התכנון' : 'תכנון היום'}
        disabled={command.pending || !!command.failed || query.isError} onPress={() => { void open(); }} />
      {query.isError ? <DayAction label="רענון התכנון היומי" onPress={() => { void query.refetch(); }} /> : null}
    </>}
    {command.pending ? <Text style={styles.text}>שומר…</Text> : null}
    {command.failed ? <>
      <Text accessibilityRole="alert" style={styles.error}>{command.conflict ? 'התכנון השתנה במקום אחר. יש לטעון את המצב העדכני.' : 'לא הצלחנו לאשר את השמירה. אפשר לנסות שוב בבטחה.'}</Text>
      {!command.conflict ? <DayAction label="ניסיון חוזר לפתיחת התכנון" onPress={() => { void command.retry().then(result => { if (result) onOpen(); }); }} /> : null}
      <DayAction label="טען תכנון עדכני" onPress={() => { command.discard(); void query.refetch(); }} />
    </> : null}
  </View>;
}

export function DailySelectedTasks({ plan, tasks, onTask, onStatus, pending }: {
  plan: DailyPlanningPlan | null | undefined; tasks: Task[]; onTask: (id: string) => void;
  onStatus: (id: string, status: 'open' | 'in_progress' | 'completed') => void; pending: boolean;
}) {
  if (!plan || plan.status === 'not_started') return null;
  return <View accessibilityLabel="משימות שנבחרו לתכנון היומי" style={styles.card}>
    <Text style={styles.heading}>נבחרו לתכנון היום</Text>
    <Text style={styles.text}>בחירה ליום הזה אינה משנה תאריך מתוכנן, מועד אחרון או חשיבות.</Text>
    {!plan.selectedTaskIds.length ? <Text style={styles.text}>{plan.status === 'completed' ? 'בחרת להשלים תכנון ללא משימות.' : 'עדיין לא נבחרו משימות.'}</Text> : null}
    {plan.selectedTaskIds.map(id => {
      const task = tasks.find(t => t.id === id);
      return <View key={id} style={styles.card}>
        <Text style={styles.text}>{task?.title ?? 'משימה שאינה זמינה עוד'}</Text>
        {task ? <>
          <Text style={styles.text}>{taskEstimateLabel(task)}{task.plannedDate ? ` · תאריך מתוכנן: ${task.plannedDate}` : ' · ללא יום מתוכנן'}</Text>
          <Text style={styles.text}>{task.status === 'completed' ? 'הושלמה' : task.status === 'cancelled' ? 'בוטלה · אינה נכללת בסיכום הפעיל' : task.status === 'in_progress' ? 'בביצוע' : 'לביצוע'}</Text>
          {task.status !== 'cancelled' ? <>
            <DayAction label={`פרטי משימה שנבחרה: ${task.title}`} onPress={() => onTask(id)} />
            <DayAction label={`${task.status === 'completed' ? 'פתיחה מחדש' : 'סימון כהושלמה'}: ${task.title}`} disabled={pending}
              onPress={() => onStatus(id, task.status === 'completed' ? 'open' : 'completed')} />
            {task.status !== 'completed' ? <DayAction label={`${task.status === 'in_progress' ? 'עצירת משימה' : 'התחל משימה'}: ${task.title}`} disabled={pending}
              onPress={() => onStatus(id, task.status === 'in_progress' ? 'open' : 'in_progress')} /> : null}
          </> : null}
        </> : null}
      </View>;
    })}
  </View>;
}
