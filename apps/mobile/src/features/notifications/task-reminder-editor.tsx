import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { CommitmentTimeField } from '@/features/commitments/commitment-date-time-fields';
import { useSettings } from '@/features/settings/settings.queries';
import { TaskDateSelection } from '@/features/tasks/task-date-selection';
import { localDateKey } from '@/features/tasks/task-dates';
import { colors, spacing, typography } from '@/theme/tokens';

import { Action } from './notification-settings-screen';
import { useNotifications } from './notification-context';
import { reminderInstant, reminderLocalParts } from './reminder-time';

export function TaskReminderEditor({ value, onSave, onCancel }: {
  value: string | null; onSave: (value: string | null) => Promise<void>; onCancel: () => void;
}) {
  const parts = reminderLocalParts(value);
  const [enabled, setEnabled] = useState(Boolean(value));
  const [date, setDate] = useState(parts?.date ?? localDateKey());
  const [time, setTime] = useState(parts?.time ?? null);
  const [dateOpen, setDateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const settings = useSettings();
  const notifications = useNotifications();
  const save = async () => {
    if (busy.current) return;
    let instant: string | null;
    try { instant = enabled ? reminderInstant(date, time) : null; }
    catch (error) { setError((error as Error).message); return; }
    busy.current = true; setSaving(true); setError(null);
    try {
      await onSave(instant);
      if (instant && settings.data?.notifications?.enabled && settings.data.notifications.taskRemindersEnabled) await notifications.requestPermission();
      await notifications.reconcile();
      onCancel();
    } catch { setError('לא הצלחנו לשמור את התזכורת. אפשר לנסות שוב.'); }
    finally { busy.current = false; setSaving(false); }
  };
  return <View accessibilityLabel="עריכת תזכורת" style={{ gap: spacing.sm }}>
    <Text style={text}>הזכר לי</Text>
    <Text style={text}>התזכורת נבחרת בנפרד מתאריך התכנון והמועד האחרון. שינוי התכנון לא יזיז אותה.</Text>
    {!enabled ? <Action label="הוספת תזכורת" disabled={saving} onPress={() => setEnabled(true)} /> : <>
      <Action label={`תאריך תזכורת: ${date}`} disabled={saving} onPress={() => setDateOpen(true)} />
      {dateOpen ? <TaskDateSelection label="תאריך תזכורת" value={date} defaultDate={date} onCancel={() => setDateOpen(false)} onConfirm={async selected => { setDate(selected); setDateOpen(false); }} /> : null}
      <CommitmentTimeField webMinuteStep={1} key={enabled ? 'enabled' : 'disabled'} accessibilityLabel="שעת תזכורת" value={time} placeholder="בחירת שעה" onChange={value => { if (!saving) setTime(value); }} />
      <Action label="ניקוי תזכורת" disabled={saving} onPress={() => { setEnabled(false); setDateOpen(false); setError(null); }} />
    </>}
    {!settings.data?.notifications?.enabled || !settings.data.notifications.taskRemindersEnabled ? <Text style={text}>התזכורת תישמר בחשבון. לקבלת התראות, יש להפעיל התראות LifeOS ותזכורות למשימות בהגדרות.</Text> : null}
    {notifications.permission === 'denied' ? <Text style={text}>הרשאת ההתראות חסומה במכשיר. התזכורת תישמר ותסונכרן אם ההרשאה תינתן לפני זמנה.</Text> : null}
    {error ? <Text accessibilityRole="alert" style={text}>{error}</Text> : null}
    <Action label={saving ? 'שומר…' : 'שמירת תזכורת'} disabled={saving || dateOpen} onPress={() => void save()} />
    <Action label="ביטול עריכת תזכורת" disabled={saving} onPress={onCancel} />
  </View>;
}
const text = { color: colors.text, fontFamily: typography.family.regular, fontSize: 16, textAlign: 'right' as const, writingDirection: 'rtl' as const };
