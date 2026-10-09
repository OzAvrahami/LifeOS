import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { V2Button, V2Notice, V2Text } from '@/components/v2';
import { CommitmentTimeField } from '@/features/commitments/commitment-date-time-fields';
import { RadioOption } from '@/features/settings/settings.components';
import { V2SettingsGroup, V2SettingsHeading, V2SettingsPage, V2SettingsRow, V2SettingsSwitch } from '@/features/settings/v2-settings';
import { patchNotificationPreferences } from '@/features/settings/settings.api';
import { settingsKeys, useEffectiveSettings } from '@/features/settings/settings.queries';
import { weekdayLabels } from '@/features/settings/settings.types';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { ReminderLeadPicker } from './reminder-lead-picker';
import { validReminderLead } from './commitment-reminder-time';
import { useNotifications } from './notification-context';
import { openNotificationSettings } from './notification.service';
import type { NotificationPreferences } from './notification.types';

export function NotificationSettingsScreen({ onBack }: { onBack: () => void }) {
  const userId = useTaskQueryScope();
  return <ScopedSettings key={userId} onBack={onBack} userId={userId} />;
}
function ScopedSettings({ onBack, userId }: { onBack: () => void; userId: string }) {
  const { query, effective } = useEffectiveSettings();
  return <V2SettingsPage title="התראות ותזכורות" eyebrow="איך לעדכן אותך" description="בחר מה תרצה לקבל מ־LifeOS." onBack={onBack}>
    <View style={{ marginTop: 15 }}>
      {query.isError ? <V2Notice error title="לא הצלחנו לרענן את העדפות ההתראות." onRetry={() => { void query.refetch(); }} /> : null}
      {!query.data && !query.isError ? <V2Notice title="טוען העדפות…" /> : null}
      {query.data && !query.data.notifications ? <V2Notice title="שמירת התראות תהיה זמינה לאחר עדכון השרת." /> : null}
      {query.data?.notifications ? <NotificationSettingsForm initial={query.data.notifications} timezone={effective.timezone} userId={userId} /> : null}
    </View>
  </V2SettingsPage>;
}
function NotificationSettingsForm({ initial, timezone, userId }: { initial: NotificationPreferences; timezone: string; userId: string }) {
  const [prefs, setPrefs] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [detail, setDetail] = useState<'commitment' | 'weekly' | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false); const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => { if (!dirty && !busy.current) setPrefs(initial); }, [initial, dirty]);
  const [error, setError] = useState<string | null>(null);
  const client = useQueryClient(); const router = useRouter();
  const notifications = useNotifications();
  const invalidWeekly = prefs.weeklyPlanningEnabled && (prefs.weeklyPlanningWeekday === null || !prefs.weeklyPlanningTime);
  const invalid = invalidWeekly || !validReminderLead(prefs.commitmentDefaultReminderMinutes);
  const labels = { not_requested: 'טרם התבקשה הרשאה', allowed: 'מותר', denied: 'חסום בהגדרות המכשיר', unavailable: 'קבלת התראות מקומיות זמינה ב־iPhone' };
  const change = (patch: Partial<NotificationPreferences>) => { setDirty(true); setPrefs(p => ({ ...p, ...patch })); };
  const save = async () => {
    if (busy.current || invalid) return;
    busy.current = true; setSaving(true); setError(null);
    try {
      const settings = await patchNotificationPreferences(prefs, timezone, userId);
      if (!active.current) return;
      client.setQueryData(settingsKeys.user(userId), settings);
      setPrefs(settings.notifications!); setDirty(false);
      if (prefs.enabled) await notifications.requestPermission();
      if (active.current) await notifications.reconcile();
    } catch { if (active.current) setError('לא הצלחנו לשמור את ההגדרות. הבחירות נשארו כאן ואפשר לנסות שוב.'); }
    finally { busy.current = false; if (active.current) setSaving(false); }
  };
  const categoryDisabled = saving || !prefs.enabled;
  return <>
    <V2SettingsGroup><V2SettingsSwitch label="התראות LifeOS" description="אפשר לכבות את כולן יחד." value={prefs.enabled} disabled={saving}
      onChange={enabled => { change({ enabled }); if (!enabled) setDetail(null); }} /></V2SettingsGroup>
    {!prefs.enabled ? <V2Text muted style={{ fontSize: 11, lineHeight: 17.6, marginTop: 9 }}>כל ההתראות כבויות. הבחירות והתזכורות נשמרות להפעלה הבאה.</V2Text> : null}
    <V2SettingsHeading>על מה לעדכן?</V2SettingsHeading>
    <V2SettingsGroup>
      <V2SettingsSwitch label="תזכורות למשימות" description="רק למשימות שהגדרת להן תזכורת." value={prefs.taskRemindersEnabled} disabled={categoryDisabled} onChange={taskRemindersEnabled => change({ taskRemindersEnabled })} />
      <V2SettingsSwitch label="תזכורות להתחייבויות" value={prefs.commitmentRemindersEnabled} divider disabled={categoryDisabled}
        onChange={commitmentRemindersEnabled => { change({ commitmentRemindersEnabled }); if (!commitmentRemindersEnabled) setDetail(null); }} />
      <V2SettingsSwitch label="תזכורת לתכנון השבוע" value={prefs.weeklyPlanningEnabled} divider disabled={categoryDisabled}
        onChange={weeklyPlanningEnabled => { change({ weeklyPlanningEnabled }); if (!weeklyPlanningEnabled) setDetail(null); }} />
    </V2SettingsGroup>
    <View style={{ gap: 9, marginTop: 9 }}>
      {prefs.enabled && prefs.commitmentRemindersEnabled ? <V2Button secondary title={detail === 'commitment' ? 'סגירת הגדרות התחייבויות' : 'הגדרות תזכורות להתחייבויות'} disabled={saving} onPress={() => setDetail(detail === 'commitment' ? null : 'commitment')} /> : null}
      {prefs.enabled && prefs.weeklyPlanningEnabled ? <V2Button secondary title={detail === 'weekly' ? 'סגירת הגדרות תכנון השבוע' : 'הגדרות תזכורת לתכנון השבוע'} disabled={saving} onPress={() => setDetail(detail === 'weekly' ? null : 'weekly')} /> : null}
      {prefs.enabled && prefs.commitmentRemindersEnabled && detail === 'commitment' ? <View style={{ gap: 9 }}>
        <V2Text variant="heading">תזכורת ברירת מחדל להתחייבויות חדשות</V2Text>
        <ReminderLeadPicker allowNone={false} disabled={saving} value={prefs.commitmentDefaultReminderMinutes} onChange={value => change({ commitmentDefaultReminderMinutes: value ?? 15 })} />
        <V2Text variant="caption" muted>הבחירה אינה משנה התחייבויות קיימות. אפשר לבחור תזכורת אחרת בכל התחייבות.</V2Text>
      </View> : null}
      {prefs.enabled && prefs.weeklyPlanningEnabled && detail === 'weekly' ? <View style={{ gap: 9 }}>
        <V2Text variant="heading">יום ושעה לפי השעון המקומי במכשיר</V2Text>
        {weekdayLabels.map((label, day) => <RadioOption key={day} label={label} selected={prefs.weeklyPlanningWeekday === day} disabled={saving} onPress={() => change({ weeklyPlanningWeekday: day })} />)}
        <View pointerEvents={saving ? 'none' : 'auto'} accessibilityElementsHidden={saving}>
          <CommitmentTimeField webMinuteStep={1} accessibilityLabel="שעת תכנון השבוע" placeholder="בחירת שעה" value={prefs.weeklyPlanningTime} onChange={value => { if (!busy.current) change({ weeklyPlanningTime: value }); }} />
        </View>
      </View> : null}
      {invalidWeekly ? <V2Text accessibilityRole="alert">צריך לבחור יום ושעה בהגדרות התזכורת השבועית, או לבטל את הפעלתה לפני השמירה.</V2Text> : null}
      {error ? <V2Notice error title={error} /> : null}
      <V2Button title="שמירת התראות" busy={saving} disabled={saving || Boolean(invalid) || !dirty} onPress={() => { void save(); }} />
      {dirty ? <V2Button secondary title="ביטול השינויים" disabled={saving} onPress={() => { setPrefs(initial); setDirty(false); setDetail(null); setError(null); }} /> : null}
    </View>
    <V2SettingsHeading>הרשאה במכשיר</V2SettingsHeading>
    <V2Text accessibilityLabel="הרשאת התראות" variant="caption" muted>{labels[notifications.permission]}</V2Text>
    {notifications.permission === 'denied' ? <View style={{ gap: 9, marginTop: 9 }}>
      <V2Text variant="caption" muted>ההרשאה חסומה. התזכורות וההגדרות נשמרות, אך לא יישלחו התראות עד למתן הרשאה.</V2Text>
      <Action label="פתיחת הגדרות iPhone" onPress={() => { setError(null); void openNotificationSettings().catch(() => setError('לא הצלחנו לפתוח את הגדרות המכשיר. אפשר לנסות שוב.')); }} />
    </View> : null}
    <V2Text muted style={{ fontSize: 11, lineHeight: 17.6, marginTop: 9 }}>השינויים נשמרים בחשבון רק בלחיצה על שמירה. כל iPhone מסנכרן את ההתראות שלו.</V2Text>
    {notifications.error ? <V2Notice error title="סנכרון ההתראות במכשיר טרם הושלם. ההגדרות בחשבון נשמרות; אפשר לנסות שוב." /> : null}
    {Boolean(notifications.result?.deferred) ? <V2Text muted>מגבלת ההתראות במכשיר מאפשרת כעת רק את התזכורות הקרובות. יתר התזכורות ייבדקו בפתיחה הבאה.</V2Text> : null}
    {notifications.permission !== 'unavailable' ? <View style={{ marginTop: 9 }}><Action label={notifications.permission === 'not_requested' && prefs.enabled ? 'בקשת הרשאת התראות' : 'סנכרון מחדש'} disabled={saving}
      onPress={() => { void (notifications.permission === 'not_requested' && prefs.enabled ? notifications.requestPermission() : notifications.reconcile()); }} /></View> : null}
    <V2SettingsHeading>צלילים ורטט</V2SettingsHeading>
    <V2SettingsGroup><V2SettingsRow icon="volume" title="אופן מסירת התזכורות" description="היכולות והמגבלות במכשיר הזה" onPress={() => router.navigate('/settings/notification-delivery')} /></V2SettingsGroup>
  </>;
}

export function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <V2Button secondary title={label} onPress={onPress} disabled={disabled} />;
}
