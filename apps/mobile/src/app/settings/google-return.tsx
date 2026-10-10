import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { V2Button, V2Notice, V2Text } from '@/components/v2';
import { V2SettingsPage } from '@/features/settings/v2-settings';
import { googleAttemptStorage, googleRequest, useGoogleCalendar, type GoogleConnection } from '@/features/settings/google-calendar.api';

export default function GoogleReturnRoute() {
  const router = useRouter(); const { attempt, result, receipt } = useLocalSearchParams<{ attempt?: string; result?: string; receipt?: string }>();
  const { user, refresh, accept } = useGoogleCalendar(); const [busy, setBusy] = useState(false); const [failed, setFailed] = useState(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, [user]);
  const back = () => router.replace({ pathname: '/settings/calendar-connection', params: { provider: 'google' } });
  const complete = async () => {
    if (busy) return; setBusy(true); setFailed(false);
    try {
      const saved = await googleAttemptStorage.read(user);
      if (!saved || saved.id !== attempt) throw new Error('No matching account attempt');
      const state = await googleRequest<GoogleConnection>(user, '/complete', 'POST', { ...saved, receipt });
      if (active.current) accept(state);
      await googleAttemptStorage.clear(user); await refresh(); if (active.current) back();
    } catch { setFailed(true); } finally { setBusy(false); }
  };
  return <V2SettingsPage title="חיבור Google" onBack={back}>
    <V2Text muted>צריך להיות מחוברים לאותו חשבון LifeOS שבו התחילה הבקשה. אין ייבוא לפני בחירת יומנים.</V2Text>
    {result === 'ready' ? <V2Button title="סיום החיבור ובחירת יומנים" disabled={busy} onPress={() => { void complete(); }} style={{ marginTop: 20 }} />
      : <V2Notice title={result === 'cancelled' ? 'בקשת החיבור בוטלה. לא חובר חשבון חדש.' : 'החיבור לא הושלם. אפשר לחזור להגדרות ולנסות שוב.'} />}
    {failed ? <V2Notice error title="לא הצלחנו להשלים את החיבור. בדקו שזהו חשבון LifeOS המקורי, או התחילו בקשה חדשה." /> : null}
    <V2Button secondary title="חזרה לחיבורי יומן" disabled={busy} onPress={back} style={{ marginTop: 16 }} />
  </V2SettingsPage>;
}
