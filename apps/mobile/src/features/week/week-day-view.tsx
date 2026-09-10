import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMinutes } from '@/features/commitments/commitment.metrics';
import type { Commitment } from '@/features/commitments/commitment.types';
import type { Task } from '@/features/tasks/task.types';
import { colors, radius, spacing, typography } from '@/theme/tokens';

import type { WeekDayTasks } from './week-aggregation';

export function commitmentTimeLabel(item: Commitment) {
  return item.endTime ? `${item.startTime}–${item.endTime}` : `${item.startTime} · ללא שעת סיום`;
}
export function taskEstimateLabel(task: Task) {
  return task.estimatedMinutes === null ? 'ללא הערכת זמן' : `${formatMinutes(task.estimatedMinutes)} משוער`;
}
export function DaySummary({ active, commitments }: { active: WeekDayTasks; commitments: Commitment[] }) {
  return <View style={styles.summary}>
    <Text style={styles.meta}>{active.tasks.length} {active.tasks.length === 1 ? 'משימה' : 'משימות'} · {formatMinutes(active.plannedMinutes)} זמן משימות מתוכנן</Text>
    <Text style={styles.meta}>{commitments.length} {commitments.length === 1 ? 'התחייבות' : 'התחייבויות'}</Text>
  </View>;
}

export function WeekDayCard({ date, weekday, today, active, completed, commitments, onOpen }: {
  date: string; weekday: string; today: boolean; active: WeekDayTasks; completed: Task[]; commitments: Commitment[]; onOpen: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`פתח יום ${date}`} accessibilityState={{ selected: today }}
    onPress={onOpen} style={[styles.card, today && styles.today]}>
    <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}><Text style={styles.heading}>{today ? 'היום' : weekday}</Text><Text style={styles.heading}>{Number(date.slice(8))}</Text></View>
    <DaySummary active={active} commitments={commitments} />
    {active.tasks.slice(0, 2).map(task => <Text key={task.id} numberOfLines={2} style={styles.text}>{task.title} · {taskEstimateLabel(task)}</Text>)}
    {active.tasks.length > 2 ? <Text style={styles.meta}>ועוד {active.tasks.length - 2} משימות</Text> : null}
    {commitments.slice(0, 2).map(item => <View key={item.id} style={styles.preview}>
      <Text numberOfLines={2} style={styles.text}>{item.title}</Text>
      <Text style={styles.time}>{commitmentTimeLabel(item)}</Text>
    </View>)}
    {commitments.length > 2 ? <Text style={styles.meta}>ועוד {commitments.length - 2} התחייבויות</Text> : null}
    {completed.length > 0 ? <Text style={styles.meta}>{completed.length} משימות שהושלמו · בהיסטוריית היום</Text> : null}
    {!active.tasks.length && !completed.length && !commitments.length ? <Text style={styles.meta}>אין משימות או התחייבויות ליום הזה</Text> : null}
  </Pressable>;
}

export function WeekDayView({ active, completed, commitments, onTask, onCommitment, onAddTask, onAddCommitment }: {
  active: WeekDayTasks; completed: Task[]; commitments: Commitment[];
  onTask: (id: string) => void; onCommitment: (id: string) => void; onAddTask: () => void; onAddCommitment: () => void;
}) {
  return <View accessibilityLabel="תוכן היום" style={styles.content}>
    <DaySummary active={active} commitments={commitments} />
    <Text accessibilityRole="header" style={styles.heading}>התחייבויות</Text>
    {!commitments.length ? <Text style={styles.meta}>אין התחייבויות ליום הזה</Text> : null}
    {commitments.map(item => <Pressable accessibilityRole="button" accessibilityLabel={`פתח התחייבות: ${item.title}`}
      key={item.id} onPress={() => onCommitment(item.id)} style={styles.card}>
      <Text style={styles.text}>{item.title}</Text><Text style={styles.time}>{commitmentTimeLabel(item)}</Text>
    </Pressable>)}
    <DayAction label="הוסף התחייבות ליום הזה" onPress={onAddCommitment} />
    <Text accessibilityRole="header" style={styles.heading}>משימות</Text>
    {!active.tasks.length ? <Text style={styles.meta}>אין משימות פעילות ליום הזה</Text> : null}
    {active.tasks.map(task => <TaskRow key={task.id} task={task} onPress={() => onTask(task.id)} />)}
    <DayAction label="הוסף משימה ליום הזה" onPress={onAddTask} />
    {completed.length ? <View accessibilityLabel="משימות שהושלמו" style={styles.content}>
      <Text accessibilityRole="header" style={styles.heading}>הושלמו · לא נכללות בתכנון הפעיל</Text>
      {completed.map(task => <TaskRow key={task.id} task={task} onPress={() => onTask(task.id)} />)}
    </View> : null}
  </View>;
}
function TaskRow({ task, onPress }: { task: Task; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`פתח משימה: ${task.title}`} onPress={onPress} style={styles.card}>
    <Text style={styles.text}>{task.title}</Text><Text style={styles.meta}>{taskEstimateLabel(task)}</Text>
    {task.status === 'in_progress' ? <Text style={styles.meta}>בביצוע</Text> : null}
    {task.status === 'completed' ? <Text style={styles.meta}>הושלמה</Text> : null}
  </Pressable>;
}
export function DayAction({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} accessibilityState={{ disabled }}
    onPress={onPress} style={styles.action}><Text style={styles.text}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({
  content: { gap: spacing.sm },
  summary: { gap: spacing.xxs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, minHeight: 48 },
  today: { borderWidth: 1, borderColor: colors.accent },
  heading: { color: colors.text, fontFamily: typography.family.bold, fontSize: 18, textAlign: 'right', writingDirection: 'rtl' },
  text: { color: colors.text, fontFamily: typography.family.semibold, fontSize: 16, textAlign: 'right', writingDirection: 'rtl' },
  meta: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: 14, textAlign: 'right', writingDirection: 'rtl' },
  time: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: 14, textAlign: 'right' },
  preview: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, paddingTop: spacing.xs, gap: spacing.xxs },
  action: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: colors.completedSurface },
});
