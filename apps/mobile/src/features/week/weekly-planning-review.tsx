import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { useCommitments } from '@/features/commitments/commitment.queries';
import { addDaysToDateKey } from '@/features/tasks/task-dates';
import { useTasks } from '@/features/tasks/task.queries';

import { commitmentTimeLabel, DayAction, taskEstimateLabel } from './week-day-view';
import { planningStyles as styles } from './weekly-planning.styles';

/** Read-only real records: no implicit carryover, focus-to-task conversion or fixture scheduling. */
export function WeeklyPlanningReview({ weekStart, step, onReady }: {
  weekStart: string; step: number; onReady: (ready: boolean) => void;
}) {
  const taskStart = step === 1 ? addDaysToDateKey(weekStart, -7) : weekStart;
  const tasks = useTasks({ plannedDateFrom: taskStart, plannedDateTo: addDaysToDateKey(taskStart, 6) }, step !== 2);
  const weekTasks = useTasks({ weekStart: taskStart }, step !== 2);
  const commitments = useCommitments({ dateFrom: weekStart, dateTo: addDaysToDateKey(weekStart, 6) }, step !== 1);
  const queries = step === 1 ? [tasks, weekTasks] : step === 2 ? [commitments] : [tasks, weekTasks, commitments];
  const ready = queries.every(q => q.isSuccess);
  useEffect(() => onReady(ready), [onReady, ready, step]);
  const active = [...(tasks.data ?? []), ...(weekTasks.data ?? [])].filter(t => t.status === 'open' || t.status === 'in_progress');
  return <View style={styles.card}>
    {queries.some(q => q.isPending) ? <Text style={styles.text}>טוען נתונים לסקירה…</Text>
      : queries.some(q => q.isError) ? <>
        <Text accessibilityRole="alert" style={styles.error}>לא הצלחנו לטעון את נתוני הסקירה.</Text>
        <DayAction label="נסה שוב נתוני סקירה" onPress={() => { void Promise.all(queries.map(q => q.refetch())); }} />
      </> : <>
        {step !== 2 ? <>
          <Text style={styles.heading}>{step === 1 ? 'משימות פתוחות מהשבוע הקודם' : 'משימות בתכנון השבוע'}</Text>
          {active.length ? active.map(t => <Text style={styles.text} key={t.id}>{t.title} · {taskEstimateLabel(t)} · {t.plannedDate ?? 'ללא יום בתכנון'}</Text>)
            : <Text style={styles.text}>אין משימות בתכנון הזה.</Text>}
        </> : null}
        {step !== 1 ? <>
          <Text style={styles.heading}>התחייבויות השבוע</Text>
          {(commitments.data ?? []).length ? [...commitments.data!].sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map(c =>
            <Text style={styles.text} key={c.id}>{c.title} · {c.date} · {commitmentTimeLabel(c)}</Text>)
            : <Text style={styles.text}>אין התחייבויות בשבוע הזה.</Text>}
        </> : null}
      </>}
  </View>;
}
