import { View } from 'react-native';
import { V2Button, V2Card, V2Text } from '@/components/v2';
import { V2SettingsPage, V2SettingsRow } from './v2-settings';
import { GoogleCalendarScreen } from './google-calendar-screen';

export function CalendarConnectionScreen({ provider, onBack }: { provider: 'google' | 'apple'; onBack: () => void }) {
  if (provider === 'google') return <GoogleCalendarScreen onBack={onBack} />;
  const name = 'Apple Calendar';
  return <V2SettingsPage title={name} eyebrow="חיבורי יומן" description="היומנים שלך ממכשיר Apple." onBack={onBack}>
    <View style={{ marginTop: 15 }}><V2Card>
      <V2SettingsRow title="החיבור עדיין אינו זמין" description="לא ניתנה דרך LifeOS גישה ליומן חיצוני." icon="calendar-days" />
      <V2Text muted>חיבור, בחירת יומנים וסנכרון עדיין אינם פעילים בגרסה הזאת. אין צורך לשנות את חשבון LifeOS שלך.</V2Text>
      <V2Text muted>גישה ליומני Apple תדרוש תמיכה והרשאה נפרדות במכשיר. לא מופעל כאן סנכרון iCloud.</V2Text>
    </V2Card></View>
    <V2Text variant="caption" muted style={{ marginTop: 18 }}>התחייבויות שנשמרו ב־LifeOS נשארות זמינות ביומן. פתיחת העמוד אינה מחברת חשבון, בוחרת יומנים או משנה אירועים.</V2Text>
    <V2Button secondary title="חזרה להגדרות" onPress={onBack} style={{ marginTop: 22 }} />
  </V2SettingsPage>;
}
