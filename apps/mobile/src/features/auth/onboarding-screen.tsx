import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { AuthScreen, AuthLink, AuthPrimaryButton, AuthSecondaryButton } from './auth.components';
import { useAuth } from './auth-provider';
import { V2Card, V2Notice, V2Text } from '@/components/v2';
import { useTheme } from '@/theme/theme-provider';
import { typography } from '@/theme/tokens';

// Native recreation of the approved orbit/L mark, with accessible themed text.
export function LifeOSHero() {
  const { colors } = useTheme();
  const tagStyle = { position: 'absolute' as const, flexDirection: 'row-reverse' as const, alignItems: 'center' as const,
    gap: 7, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border };
  return <View accessibilityLabel="LifeOS · היומן והמשימות יחד" style={{ height: 180, marginTop: 8, marginBottom: 24, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', width: 168, height: 168, borderRadius: 84, borderWidth: 1, borderColor: colors.border }} />
    <View style={{ position: 'absolute', width: 122, height: 122, borderRadius: 61, backgroundColor: colors.accentWeak }} />
    <View style={{ height: 68, width: 68, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-10deg' }] }}>
      <Text style={{ fontSize: 48, fontFamily: typography.family.extraBold, color: colors.onAccent }}>L</Text>
    </View>
    <View style={[tagStyle, { top: 25, right: 0, transform: [{ rotate: '5deg' }] }]}>
      <Ionicons name="checkmark" size={14} color={colors.accent} /><V2Text variant="caption">להתקדם במה שחשוב</V2Text>
    </View>
    <View style={[tagStyle, { bottom: 25, left: 0, transform: [{ rotate: '-5deg' }] }]}>
      <Ionicons name="calendar-outline" size={14} color={colors.accent} /><V2Text variant="caption">היומן והמשימות, יחד</V2Text>
    </View>
  </View>;
}
export function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const { colors } = useTheme();
  const [calendarInfo, setCalendarInfo] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const complete = async () => {
    if (busy.current) return;
    busy.current = true; setPending(true); setFailed(false);
    try { await completeOnboarding(); }
    catch { setFailed(true); }
    finally { busy.current = false; setPending(false); }
  };
  return <AuthScreen contentStyle={{ paddingTop: 0 }}>
    <LifeOSHero />
    <View style={{ alignItems: 'center', gap: 10 }}>
      <V2Text variant="caption" muted style={{ textAlign: 'center' }}>קצת פחות לתכנן. קצת יותר לחיות.</V2Text>
      <V2Text variant="title" accessibilityRole="header" style={{ textAlign: 'center', fontSize: 30, lineHeight: 38 }}>היום שלך, בקצב שלך</V2Text>
      <V2Text muted style={{ textAlign: 'center', lineHeight: 25 }}>LifeOS מציע תוכנית מתוך המשימות שלך.{'\n'}אתה מחליט מה מתאים.</V2Text>
    </View>
    <View style={{ marginTop: 26, gap: 18 }}>
      <V2Card>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
          <Ionicons name="calendar-outline" size={22} color={colors.accent} /><V2Text variant="heading">מתחילים מהיומן שלך</V2Text>
        </View>
        <V2Text muted>היומן מציג את מה שכבר קבוע. בינתיים אפשר להוסיף התחייבויות ב־LifeOS, לצד המשימות.</V2Text>
        <V2Text variant="caption" muted>חיבורי Google ו־Apple עדיין אינם זמינים.</V2Text>
      </V2Card>
      <AuthSecondaryButton title="חיבור Google Calendar" disabled={pending} onPress={() => setCalendarInfo(value => !value)} />
      {calendarInfo ? <V2Notice title="חיבור Google Calendar עדיין בפיתוח. לא בוצע חיבור ולא ניתנה גישה ליומן. אפשר להמשיך לתכנון היום בלי לחבר יומן." /> : null}
      {failed ? <V2Notice error title="לא הצלחנו לשמור את השלמת ההיכרות. אפשר לנסות שוב." /> : null}
      <AuthPrimaryButton title="לתכנון היום" isLoading={pending} loadingLabel="שומר…" onPress={() => { void complete(); }} />
      <AuthLink title="אראה קודם איך זה עובד" disabled={pending} onPress={() => { void complete(); }} />
      <V2Text variant="caption" muted style={{ textAlign: 'center', marginBottom: 20 }}>כל הצעה מחכה לאישור שלך.</V2Text>
    </View>
  </AuthScreen>;
}
