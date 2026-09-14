import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CommitmentTimeField } from '@/features/commitments/commitment-date-time-fields';
import { SettingsCard, SettingsPage, RadioOption } from '@/features/settings/settings.components';
import { patchNotificationPreferences } from '@/features/settings/settings.api';
import { settingsKeys, useEffectiveSettings } from '@/features/settings/settings.queries';
import { weekdayLabels } from '@/features/settings/settings.types';
import { TaskQueryNotice } from '@/features/tasks/task-query-notice';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { colors, radius, spacing, typography } from '@/theme/tokens';

import { useNotifications } from './notification-context';
import { openNotificationSettings } from './notification.service';
import type { NotificationPreferences } from './notification.types';

export function NotificationSettingsScreen({ onBack }: { onBack: () => void }) {
  const { query, effective } = useEffectiveSettings();
  return <SettingsPage title="התראות" onBack={onBack}>
    <TaskQueryNotice loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
    {query.isSuccess && !query.data.notifications ? <Text accessibilityRole="alert">שמירת התראות תהיה זמינה לאחר עדכון השרת.</Text> : null}
    {query.data?.notifications ? <NotificationSettingsForm key={JSON.stringify(query.data.notifications)} initial={query.data.notifications} timezone={effective.timezone} /> : null}
  </SettingsPage>;
}

function NotificationSettingsForm({ initial, timezone }: { initial: NotificationPreferences; timezone: string }) {
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState(false);
  const client = useQueryClient();
  const userId = useTaskQueryScope();
  const notifications = useNotifications();
  const invalid = prefs.weeklyPlanningEnabled && (prefs.weeklyPlanningWeekday === null || !prefs.weeklyPlanningTime);
  const labels = { not_requested: 'טרם התבקשה הרשאה', allowed: 'מותר', denied: 'חסום בהגדרות המכשיר', unavailable: 'קבלת התראות מקומיות זמינה ב־iPhone' };
  const save = async () => {
    if (busy.current || invalid) return;
    busy.current = true;
    setSaving(true); setError(false);
    try {
      const settings = await patchNotificationPreferences(prefs, timezone);
      if (prefs.enabled) await notifications.requestPermission();
      client.setQueryData(settingsKeys.user(userId), settings);
      await notifications.reconcile();
    } catch { setError(true); }
    finally { busy.current = false; setSaving(false); }
  };
  return <View style={styles.content}>
    <Text style={styles.text}>מעט תזכורות, רק לפי הבחירה שלך. שמירת ההגדרות חלה על החשבון; כל iPhone מסנכרן את ההתראות שלו.</Text>
    <Text accessibilityLabel="הרשאת התראות" style={styles.text}>{labels[notifications.permission]}</Text>
    {notifications.permission === 'denied' ? <>
      <Text style={styles.text}>ההרשאה חסומה. התזכורות וההגדרות נשמרות, אך לא יישלחו התראות עד למתן הרשאה.</Text>
      <Action label="פתיחת הגדרות iPhone" onPress={() => void openNotificationSettings().catch(() => setError(true))} />
    </> : null}
    <SettingsCard>
      <Toggle label="התראות LifeOS" value={prefs.enabled} disabled={saving} onChange={value => setPrefs(p => ({ ...p, enabled: value }))} />
      <Toggle label="תזכורות למשימות" value={prefs.taskRemindersEnabled} disabled={saving} onChange={value => setPrefs(p => ({ ...p, taskRemindersEnabled: value }))} />
      <Toggle label="תזכורת לתכנון השבוע" value={prefs.weeklyPlanningEnabled} disabled={saving} onChange={value => setPrefs(p => ({ ...p, weeklyPlanningEnabled: value }))} />
    </SettingsCard>
    {prefs.weeklyPlanningEnabled ? <View>
      <Text style={styles.text}>יום ושעה לפי השעון המקומי במכשיר</Text>
      {weekdayLabels.map((label, day) => <RadioOption key={day} label={label} selected={prefs.weeklyPlanningWeekday === day} onPress={() => { if (!saving) setPrefs(p => ({ ...p, weeklyPlanningWeekday: day })); }} />)}
      <CommitmentTimeField webMinuteStep={1} accessibilityLabel="שעת תכנון השבוע" placeholder="בחירת שעה" value={prefs.weeklyPlanningTime} onChange={value => { if (!saving) setPrefs(p => ({ ...p, weeklyPlanningTime: value })); }} />
    </View> : null}
    {invalid ? <Text accessibilityRole="alert" style={styles.text}>צריך לבחור יום ושעה לתזכורת השבועית.</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.text}>לא הצלחנו לשמור את ההגדרות. אפשר לנסות שוב.</Text> : null}
    {notifications.error ? <Text accessibilityRole="alert" style={styles.text}>סנכרון ההתראות במכשיר טרם הושלם. ההגדרות בחשבון נשמרות; אפשר לנסות שוב.</Text> : null}
    {Boolean(notifications.result?.deferred) ? <Text style={styles.text}>מגבלת ההתראות במכשיר מאפשרת כעת רק את התזכורות הקרובות. יתר התזכורות ייבדקו בפתיחה הבאה.</Text> : null}
    <Action label={saving ? 'שומר…' : 'שמירת התראות'} disabled={saving || Boolean(invalid)} onPress={() => void save()} />
    <Action label="סנכרון מחדש" disabled={saving} onPress={() => void notifications.reconcile()} />
  </View>;
}

export function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.action, disabled && { opacity: 0.5 }]}><Text style={styles.actionText}>{label}</Text></Pressable>;
}
function Toggle({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (value: boolean) => void; disabled: boolean }) {
  return <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value, disabled }} disabled={disabled} onPress={() => onChange(!value)} style={styles.toggle}>
    <Text style={styles.text}>{label}</Text><Text style={styles.text}>{value ? 'פעיל' : 'כבוי'}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  content: { gap: spacing.md, marginTop: spacing.md },
  text: { color: colors.text, fontFamily: typography.family.regular, fontSize: 16, textAlign: 'right', writingDirection: 'rtl' },
  toggle: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 },
  action: { alignItems: 'center', justifyContent: 'center', minHeight: 48, borderRadius: radius.md, backgroundColor: colors.accent, padding: spacing.sm },
  actionText: { color: colors.white, fontFamily: typography.family.bold, fontSize: 16, writingDirection: 'rtl' },
});
