import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { V2Button, V2Card, V2Notice, V2Text } from '@/components/v2';
import { V2SettingsPage } from './v2-settings';
import { GoogleCalendarOption } from './google-calendar-option';
import { googleAttemptStorage, googleRequest, useGoogleCalendar, type GoogleAttempt, type GoogleConnection } from './google-calendar.api';

export function GoogleCalendarScreen({ onBack }: { onBack: () => void }) {
  const { user, query, refresh, accept } = useGoogleCalendar();
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, [user]);
  const [busy, setBusy] = useState(false); const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<GoogleAttempt | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  useEffect(() => { let active = true; void googleAttemptStorage.read(user).then(value => { if (active) setPending(value); }).catch(() => { if (active) setFailed(true); }); return () => { active = false; }; }, [user]);
  const run = async (action: () => Promise<unknown>) => {
    if (busy) return; setBusy(true); setFailed(false);
    try {
      const result = await action();
      if (active.current && result && typeof result === 'object' && 'configured' in result) accept(result as GoogleConnection);
    } catch { setFailed(true); } finally { await refresh(); setBusy(false); }
  };
  const begin = () => run(async () => {
    const attempt = await googleRequest<GoogleAttempt & { authorizationUrl: string }>(user, '/authorize', 'POST', { platform: Platform.OS === 'web' ? 'web' : 'native' });
    try {
      if (!active.current) return;
      await googleAttemptStorage.save(user, { id: attempt.id, proof: attempt.proof }); setPending(attempt);
      if (!active.current) return;
      await Linking.openURL(attempt.authorizationUrl);
    } catch (error) { await googleRequest(user, '/cancel', 'POST', { id: attempt.id }); throw error; }
  });
  const state = query.data;
  const linked = state && !['unavailable', 'disconnected'].includes(state.status);
  return <V2SettingsPage title="Google Calendar" eyebrow="חיבורי יומן" description="בחירת יומנים וייבוא אירועים לקריאה בלבד." onBack={onBack}>
    <View style={{ gap: 16, marginTop: 18 }}>
      {!state && !query.isError ? <V2Text>טוען את מצב החיבור…</V2Text> : null}
      {query.isError ? <V2Notice error title="לא הצלחנו לבדוק את החיבור." onRetry={() => { void query.refetch(); }} /> : null}
      {failed ? <V2Notice error title="הפעולה לא הושלמה. בדקו את החיבור ואת הבחירה העדכנית ונסו שוב. אירועים קיימים לא נמחקו מ־Google." /> : null}
      {state && !state.configured ? <V2Card><V2Text variant="heading">החיבור עדיין אינו זמין</V2Text><V2Text muted>נדרשת הגדרת Google בצד השרת. אפשר להמשיך להשתמש בהתחייבויות LifeOS.</V2Text></V2Card> : null}
      {state?.configured ? <>
        <V2Card><V2Text variant="heading">{({ disconnected: 'לא מחובר', connected: 'מחובר לקריאה בלבד', failed: 'הייבוא האחרון לא הושלם', reconnect_required: 'נדרש חיבור מחדש', unavailable: 'לא זמין' })[state.status]}</V2Text>
          {state.email ? <V2Text>{state.email}</V2Text> : null}
          <V2Text muted>החיבור נפרד מהכניסה לחשבון LifeOS. לא משנים אירועים ב־Google ולא משנים את תכנון המשימות.</V2Text>
          {state.lastSyncAt ? <V2Text muted>ייבוא אחרון: {new Date(state.lastSyncAt).toLocaleString('he-IL')}</V2Text> : null}
        </V2Card>
        {!linked || state.status === 'reconnect_required' ? <V2Button title={linked ? 'חיבור מחדש ל־Google' : 'חיבור חשבון Google'} disabled={busy} onPress={() => { void begin(); }} /> : null}
        {pending ? <V2Button secondary title="ביטול בקשת החיבור" disabled={busy} onPress={() => { void run(async () => { await googleRequest(user, '/cancel', 'POST', { id: pending.id }); await googleAttemptStorage.clear(user); setPending(null); }); }} /> : null}
        {linked && state.status !== 'reconnect_required' ? <>
          <V2Button secondary title="טעינת רשימת היומנים" disabled={busy} onPress={() => { void run(() => googleRequest(user, '/calendars')); }} />
          <CalendarSelection key={state.revision} state={state} busy={busy} save={ids => run(() => googleRequest(user, '/selection', 'PUT', { ids, revision: state.revision }))}
            sync={() => run(() => googleRequest(user, '/import', 'POST', { revision: state.revision }))} />
        </> : null}
        {linked ? <>
          {disconnecting ? <V2Card><V2Text>לנתק את Google? האירועים המיובאים יוסתרו ב־LifeOS. אירועים ב־Google והתחייבויות מקומיות לא יימחקו.</V2Text>
            <V2Button title="אישור ניתוק" disabled={busy} onPress={() => { void run(async () => { const result = await googleRequest<GoogleConnection>(user, '/disconnect', 'POST', {}); if (active.current) accept(result); await googleAttemptStorage.clear(user); setPending(null); setDisconnecting(false); return result; }); }} />
            <V2Button secondary title="ביטול" disabled={busy} onPress={() => setDisconnecting(false)} /></V2Card>
            : <V2Button secondary title="ניתוק Google" disabled={busy} onPress={() => setDisconnecting(true)} />}
        </> : null}
      </> : null}
      {busy || state?.importing ? <V2Text accessibilityRole="alert">הפעולה מתבצעת…</V2Text> : null}
      <V2Text muted variant="caption">אין סנכרון אוטומטי בגרסה הזאת. שינויים ב־Google יופיעו לאחר ייבוא נוסף. Apple Calendar עדיין אינו זמין.</V2Text>
    </View>
  </V2SettingsPage>;
}
function CalendarSelection({ state, busy, save, sync }: { state: GoogleConnection; busy: boolean; save: (ids: string[]) => Promise<void>; sync: () => Promise<void> }) {
  const [ids, setIds] = useState(state.calendars.filter(c => c.selected).map(c => c.id));
  const saved = state.calendars.filter(c => c.selected).map(c => c.id);
  const dirty = ids.length !== saved.length || ids.some(id => !saved.includes(id));
  return <View style={{ gap: 12 }}>
    <V2Text variant="heading">היומנים לייבוא</V2Text>
    <V2Text muted>רק יומנים שבחרת ייובאו. אירועים מיובאים אינם מקבלים תזכורות LifeOS.</V2Text>
    {!state.calendars.length ? <V2Text muted>טענו את הרשימה כדי לבחור יומנים. אף יומן אינו נבחר אוטומטית.</V2Text> : null}
    <View>{state.calendars.map(calendar => <GoogleCalendarOption key={calendar.id} label={calendar.summary}
      description={['reader', 'writer', 'owner'].includes(calendar.accessRole) ? `${calendar.timeZone} · קריאה בלבד ב־LifeOS` : 'אין הרשאה לקריאת פרטי האירועים'}
      value={ids.includes(calendar.id)} disabled={busy || !['reader', 'writer', 'owner'].includes(calendar.accessRole) || (!ids.includes(calendar.id) && ids.length >= 10)}
      onChange={value => setIds(current => value ? [...current, calendar.id] : current.filter(id => id !== calendar.id))} />)}</View>
    <V2Button secondary title="שמירת בחירת היומנים" disabled={busy || !dirty} onPress={() => { void save(ids); }} />
    {dirty ? <V2Text muted>צריך לשמור את הבחירה לפני הייבוא.</V2Text> : null}
    {state.window ? <V2Text variant="caption" muted>חלון הייבוא: {state.window.from.slice(0, 10)} עד {state.window.to.slice(0, 10)} (לא כולל יום הסיום, לפי UTC).</V2Text> : null}
    <V2Button title="ייבוא מהיומנים שנבחרו" disabled={busy || dirty || !saved.length || state.importing} onPress={() => { void sync(); }} />
  </View>;
}
