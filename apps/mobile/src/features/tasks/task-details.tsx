import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EditTask } from '@/features/inbox/inbox-item-action-sheet';
import { TaskDateSelection } from '@/features/tasks/task-date-selection';
import type { Task, UpdateTaskInput } from '@/features/tasks/task.types';
import { colors, spacing, typography } from '@/theme/tokens';

import { DayAction, taskEstimateLabel } from '@/features/week/week-day-view';
import { TaskReminderEditor } from '@/features/notifications/task-reminder-editor';
import { localDateKey } from '@/features/tasks/task-dates';

// A focused entry to existing title/date/lifecycle operations, not a new description editor.
export function TaskDetails({ task, onClose, onUpdate, onDelete, backLabel = 'חזרה ליום' }: {
  backLabel?: string;
  task: Task; onClose: () => void;
  onUpdate: (input: UpdateTaskInput) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [mode, setMode] = useState<'details' | 'title' | 'date' | 'delete' | 'reminder'>('details');
  const [title, setTitle] = useState(task.title);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const busy = useRef(false);
  const run = async (action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true; setPending(true); setError(false);
    try { await action(); onClose(); }
    catch { setError(true); }
    finally { busy.current = false; setPending(false); }
  };
  return <View accessibilityLabel="פרטי משימה" style={styles.content}>
    <DayAction label={backLabel} disabled={pending} onPress={onClose} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>לא הצלחנו לעדכן. אפשר לנסות שוב.</Text> : null}
    {mode === 'reminder' ? <TaskReminderEditor value={task.reminderAt ?? null} onCancel={() => setMode('details')} onSave={reminderAt => onUpdate({ reminderAt })} />
      : mode === 'date' ? <TaskDateSelection value={task.plannedDate} defaultDate={task.plannedDate ?? localDateKey()}
      onPendingChange={setPending} onCancel={() => setMode('details')}
      onConfirm={async date => { await onUpdate({ planning: { type: 'day', plannedDate: date } }); onClose(); }} />
      : mode === 'title' ? <EditTask accessibilityLabel="עריכת כותרת משימה" disabled={pending} title={title}
        onChangeTitle={setTitle} onBack={() => setMode('details')}
        onSave={() => { if (title.trim()) void run(() => onUpdate({ title: title.trim() })); }} />
        : mode === 'delete' ? <>
          <Text style={styles.text}>למחוק את המשימה מהתכנון?</Text>
          <DayAction label="אישור מחיקת משימה" disabled={pending} onPress={() => void run(onDelete)} />
          <DayAction label="ביטול מחיקת משימה" disabled={pending} onPress={() => setMode('details')} />
        </> : <>
          <Text accessibilityRole="header" style={styles.title}>{task.title}</Text>
          <Text style={styles.text}>{taskEstimateLabel(task)}</Text>
          <Text style={styles.text}>תאריך לתכנון: {task.plannedDate}</Text>
          {task.dueDate ? <Text style={styles.text}>מועד אחרון: {task.dueDate}</Text> : null}
          <Text style={styles.text}>{task.status === 'completed' ? 'הושלמה' : task.status === 'in_progress' ? 'בביצוע' : 'לביצוע'}</Text>
          <DayAction label="עריכת כותרת" disabled={pending} onPress={() => setMode('title')} />
          {task.reminderAt ? <Text style={styles.text}>תזכורת: {new Date(task.reminderAt).toLocaleString('he-IL', { hour12: false })}</Text> : null}
          <DayAction label="הזכר לי" disabled={pending} onPress={() => setMode('reminder')} />
          <DayAction label="שינוי תאריך המשימה" disabled={pending} onPress={() => setMode('date')} />
          <DayAction label={task.status === 'completed' ? 'פתיחה מחדש' : 'סימון כהושלמה'} disabled={pending}
            onPress={() => void run(() => onUpdate({ status: task.status === 'completed' ? 'open' : 'completed' }))} />
          <DayAction label="מחיקת משימה" disabled={pending} onPress={() => setMode('delete')} />
        </>}
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm },
  title: { fontSize: 22, color: colors.text, fontFamily: typography.family.bold, textAlign: 'right', writingDirection: 'rtl' },
  text: { fontSize: 16, color: colors.text, fontFamily: typography.family.regular, textAlign: 'right', writingDirection: 'rtl' },
  error: { fontSize: 16, color: colors.warningText, fontFamily: typography.family.regular, textAlign: 'right', writingDirection: 'rtl' },
});
