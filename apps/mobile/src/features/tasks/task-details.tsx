import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TextInput, View } from 'react-native';
import { V2Button, V2Card, V2Notice, V2Text } from '@/components/v2';
import { TaskDateSelection } from './task-date-selection';
import type { Task, UpdateTaskInput } from './task.types';
import { TaskReminderEditor } from '@/features/notifications/task-reminder-editor';
import { useEffectiveSettings } from '@/features/settings/settings.queries';
import { addDaysToDateKey, currentWeekStart, localDateKey } from './task-dates';
import { normalizeTaskDescription, taskContentError } from './task-content';
import { useTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';
import { getTaskMemberships } from '@/features/planning/week-allocation.api';
import { useTaskQueryScope } from './task-query-scope';

export function TaskDetails({ task, onClose, onUpdate, onDelete, backLabel = 'חזרה ליום' }: {
  backLabel?: string; task: Task; onClose: () => void;
  onUpdate: (input: UpdateTaskInput) => Promise<void>; onDelete: () => Promise<void>;
}) {
  const { colors } = useTheme();
  const { effective: settings, query: settingsQuery } = useEffectiveSettings();
  const today = localDateKey(undefined, settings.timezone);
  const userId = useTaskQueryScope();
  const memberships = useQuery({ queryKey: ['task-memberships', userId, today], staleTime: 0,
    enabled: settingsQuery.data !== undefined,
    queryFn: ({ signal }) => getTaskMemberships(userId, today, signal) });
  const planDates = memberships.data?.days.filter(day => day.ids.includes(task.id)).map(day => day.date);
  const [mode, setMode] = useState<'details' | 'title' | 'date' | 'delete' | 'reminder'>('details');
  const [draft, setDraft] = useState({ title: task.title, description: task.description ?? '' });
  const base = useRef(draft);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const run = async (action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true; setPending(true); setError(null);
    try { await action(); onClose(); }
    catch { setError('לא הצלחנו לעדכן. הפרטים נשמרים כאן; אפשר לנסות שוב.'); }
    finally { busy.current = false; setPending(false); }
  };
  const edit = () => {
    base.current = { title: task.title, description: task.description ?? '' };
    setDraft(base.current); setMode('title'); setError(null);
  };
  const fieldStyle = { color: colors.text, backgroundColor: colors.surfaceMuted, borderRadius: 16,
    padding: spacing.md, minHeight: 52, fontSize: 17, fontFamily: typography.family.regular,
    textAlign: 'right' as const, writingDirection: 'rtl' as const };
  return <View accessibilityLabel="פרטי משימה" style={{ gap: spacing.md }}>
    <V2Button secondary title={backLabel} disabled={pending} onPress={onClose} />
    {error ? <V2Notice error title={error} /> : null}
    {mode === 'reminder' ? <TaskReminderEditor value={task.reminderAt ?? null} onCancel={() => setMode('details')}
      onSave={async reminderAt => { await onUpdate({ reminderAt }); }} />
      : mode === 'date' ? <TaskDateSelection value={task.plannedDate} defaultDate={task.plannedDate ?? today}
        onPendingChange={setPending} onCancel={() => setMode('details')}
        onConfirm={async date => { await onUpdate({ planning: { type: 'day', plannedDate: date } }); onClose(); }} />
      : mode === 'title' ? <V2Card>
        <V2Text variant="heading">עריכת המשימה</V2Text>
        <V2Text>כותרת</V2Text>
        <TextInput accessibilityLabel="כותרת משימה" value={draft.title} editable={!pending} style={fieldStyle}
          onChangeText={title => setDraft(value => ({ ...value, title }))} />
        <V2Text>תיאור (לא חובה)</V2Text>
        <TextInput accessibilityLabel="תיאור (לא חובה)" multiline textAlignVertical="top" editable={!pending}
          value={draft.description} style={[fieldStyle, { minHeight: 140 }]}
          onChangeText={description => setDraft(value => ({ ...value, description }))} />
        <V2Text variant="caption" muted>כותרת: עד 500 תווים · תיאור: עד 10,000 תווים. תיאור ריק יימחק.</V2Text>
        <V2Button title="שמירת שינויים" busy={pending} onPress={() => {
          const invalid = taskContentError(draft.title, draft.description);
          if (invalid) { setError(invalid); return; }
          // Omit untouched content so title-only edits preserve the latest description.
          const input: UpdateTaskInput = {
            ...(draft.title.trim() !== base.current.title ? { title: draft.title.trim() } : {}),
            ...(draft.description !== base.current.description ? { description: normalizeTaskDescription(draft.description) } : {}),
          };
          if (Object.keys(input).length) void run(() => onUpdate(input)); else setMode('details');
        }} />
        <V2Button secondary title="ביטול עריכה" disabled={pending} onPress={() => setMode('details')} />
      </V2Card> : mode === 'delete' ? <V2Card>
        <V2Text>למחוק את המשימה מהתכנון?</V2Text>
        <V2Button title="אישור מחיקת משימה" busy={pending} onPress={() => void run(onDelete)} />
        <V2Button secondary title="ביטול מחיקת משימה" disabled={pending} onPress={() => setMode('details')} />
      </V2Card> : <>
        <V2Text variant="title" accessibilityRole="header" selectable>{task.title}</V2Text>
        <V2Text muted>{task.status === 'completed' ? 'הושלמה' : task.status === 'in_progress' ? 'בביצוע' : 'לביצוע'}</V2Text>
        <V2Card><V2Text variant="heading">תיאור</V2Text><V2Text selectable muted={!task.description}>{task.description || 'אין תיאור למשימה הזאת.'}</V2Text></V2Card>
        {planDates ? <V2Text>{planDates.length ? 'בתוכניות המאושרות: ' + planDates.join(' · ') : 'לא שובצה בתוכנית מאושרת מהיום והלאה.'}</V2Text>
          : <V2Text muted>{memberships.isError ? 'השיבוץ בתוכניות אינו זמין כרגע.' : 'טוען שיבוץ בתוכניות…'}</V2Text>}
        {memberships.isError ? <V2Button secondary title="רענון השיבוץ" onPress={() => { void memberships.refetch(); }} /> : null}
        <V2Text>תאריך המשימה: {task.plannedDate ?? (task.weekPlanId ? 'בתכנון שבועי · ללא יום' : 'לא נקבע')}</V2Text>
        <V2Text variant="caption" muted>שינוי יום מעביר את המשימה בתוכניות הנוכחיות והעתידיות. ההיסטוריה נשמרת.</V2Text>
        <V2Card><V2Text variant="heading">מתי לקדם?</V2Text>
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs }}>
            <V2Button secondary title="היום" disabled={pending} onPress={() => void run(() => onUpdate({ planning: { type: 'day', plannedDate: today } }))} />
            <V2Button secondary title="מחר" disabled={pending} onPress={() => void run(() => onUpdate({ planning: { type: 'day', plannedDate: addDaysToDateKey(today, 1) } }))} />
            <V2Button secondary title="ללא יום" disabled={pending} onPress={() => void run(() => onUpdate({ planning: { type: 'inbox' } }))} />
            <V2Button secondary title="השבוע" disabled={pending} onPress={() => void run(() => onUpdate({ planning: { type: 'week', weekStart: currentWeekStart(undefined, settings) } }))} />
          </View>
          <V2Button secondary title="שינוי תאריך המשימה" disabled={pending} onPress={() => setMode('date')} />
        </V2Card>
        <V2Text muted>{task.priority === 'important' ? 'חשיבות: חשובה' : 'חשיבות: רגילה'}</V2Text>
        {task.dueDate ? <V2Text>מועד אחרון: {task.dueDate}</V2Text> : null}
        {task.reminderAt ? <V2Text>תזכורת: {new Date(task.reminderAt).toLocaleString('he-IL', { hour12: false, timeZone: settings.timezone })}</V2Text> : null}
        <V2Button title={task.status === 'completed' ? 'פתיחה מחדש' : 'סימון כהושלמה'} disabled={pending}
          onPress={() => void run(() => onUpdate({ status: task.status === 'completed' ? 'open' : 'completed' }))} />
        {task.status !== 'completed' ? <V2Button secondary title={task.status === 'in_progress' ? 'עצירה' : 'התחל'} disabled={pending}
          onPress={() => void run(() => onUpdate({ status: task.status === 'in_progress' ? 'open' : 'in_progress' }))} /> : null}
        <V2Button secondary title="עריכת כותרת ותיאור" accessibilityLabel="עריכת כותרת" disabled={pending} onPress={edit} />
        <V2Button secondary title="הזכר לי" disabled={pending} onPress={() => setMode('reminder')} />
        <V2Button secondary title="מחיקת משימה" disabled={pending} onPress={() => setMode('delete')} />
      </>}
  </View>;
}
