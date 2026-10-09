import { Pressable, View } from 'react-native';
import { V2Button, V2Card, V2TaskRow, V2Text } from '@/components/v2';
import type { Task } from '@/features/tasks/task.types';
import type { Commitment } from '@/features/commitments/commitment.types';
import { useTheme } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';
import { commitmentTimeLabel } from './week-day-view';

export function V2WeekDayCard({ date, weekday, today, tasks, approved, commitments, onOpen }: {
  date: string; weekday: string; today: boolean; tasks: Task[]; approved: boolean; commitments: Commitment[]; onOpen: () => void;
}) {
  const { colors } = useTheme();
  const completed = tasks.filter(task => task.status === 'completed').length;
  return <Pressable accessibilityRole="button" accessibilityLabel={'פתח יום ' + date} accessibilityState={{ selected: today }} onPress={onOpen}>
    <V2Card style={today ? { borderColor: colors.accent } : undefined}>
      <V2Text variant="heading">{today ? 'היום · ' : ''}{weekday} · {Number(date.slice(8))}</V2Text>
      <V2Text variant="caption" muted>{approved ? 'התוכנית אושרה' : 'טרם אושרה תוכנית'} · {completed} מתוך {tasks.length} הושלמו</V2Text>
      <V2Text muted>{tasks.filter(task => task.status !== 'completed').length} משימות פעילות</V2Text>
      {tasks.slice(0, 3).map(task => <V2Text key={task.id} numberOfLines={2}>{task.status === 'completed' ? '✓ ' : '○ '}{task.title}</V2Text>)}
      {tasks.length > 3 ? <V2Text muted>ועוד {tasks.length - 3} משימות</V2Text> : null}
      {!tasks.length ? <V2Text muted>{approved ? 'יום מאושר ללא משימות' : 'מקום פתוח לדברים שיצוצו.'}</V2Text> : null}
      <V2Text variant="caption" muted>{commitments.length} {commitments.length === 1 ? 'התחייבות' : 'התחייבויות'}</V2Text>
      {commitments.slice(0, 2).map(event => <View key={event.id}><V2Text>{event.title}</V2Text><V2Text variant="caption" muted>{commitmentTimeLabel(event)} · LifeOS</V2Text></View>)}
      {commitments.length > 2 ? <V2Text muted>ועוד {commitments.length - 2} התחייבויות</V2Text> : null}
      <V2Text style={{ color: colors.accent }}>פתיחת היום ←</V2Text>
    </V2Card>
  </Pressable>;
}
export function V2WeekDayView({ tasks, commitments, pending, onTask, onStatus, onCommitment, onAddTask, onAddCommitment }: {
  tasks: Task[]; commitments: Commitment[]; pending: boolean;
  onTask: (id: string) => void; onStatus: (id: string, status: 'open' | 'in_progress' | 'completed') => void;
  onCommitment: (id: string) => void; onAddTask: () => void; onAddCommitment: () => void;
}) {
  return <View accessibilityLabel="תוכן היום" style={{ gap: spacing.md }}>
    <V2Card><V2Text variant="heading">ההתקדמות ביום הזה</V2Text>
      <V2Text>{tasks.filter(task => task.status === 'completed').length} מתוך {tasks.length} הושלמו</V2Text>
    </V2Card>
    <V2Text variant="heading">מה מקדמים ביום הזה</V2Text>
    {!tasks.length ? <V2Text muted>אין משימות פעילות ליום הזה</V2Text> : null}
    {tasks.map(task => <View key={task.id} accessibilityLabel={'משימה ביום: ' + task.title}>
      <V2TaskRow task={task} context={task.priority === 'important' ? 'חשובה' : 'בתוכנית ליום הזה'} pending={pending}
        onOpen={() => onTask(task.id)} onStatus={status => onStatus(task.id, status)} />
    </View>)}
    <V2Button secondary title="הוסף משימה ליום הזה" onPress={onAddTask} />
    <V2Text variant="heading">ביומן היום</V2Text>
    <V2Text variant="caption" muted>התחייבויות LifeOS. Google ו־Apple אינם מחוברים כאן. משימות אינן הופכות לאירועים.</V2Text>
    {!commitments.length ? <V2Text muted>אין התחייבויות ליום הזה</V2Text> : null}
    {commitments.map(event => <V2Card key={event.id}>
      <V2Button secondary title={event.title} accessibilityLabel={'פתח התחייבות: ' + event.title} onPress={() => onCommitment(event.id)} />
      <V2Text muted>{commitmentTimeLabel(event)} · LifeOS</V2Text>
    </V2Card>)}
    <V2Button secondary title="הוסף התחייבות ליום הזה" onPress={onAddCommitment} />
  </View>;
}
