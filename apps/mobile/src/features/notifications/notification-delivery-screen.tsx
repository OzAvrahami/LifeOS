import { useState } from 'react';
import { View } from 'react-native';
import { V2Button, V2Notice, V2Text } from '@/components/v2';
import { V2SettingsGroup, V2SettingsHeading, V2SettingsPage, V2SettingsRow } from '@/features/settings/v2-settings';
import { localNotificationsSupported, openNotificationSettings } from './notification.service';

export function NotificationDeliveryScreen({ onBack }: { onBack: () => void }) {
  const [error, setError] = useState(false);
  return <V2SettingsPage title="צלילים ורטט" eyebrow="התראות" description="מה נתמך במסירת התזכורות." onBack={onBack}>
    <V2SettingsHeading>בגרסה הזאת</V2SettingsHeading>
    <V2SettingsGroup>
      <V2SettingsRow icon="volume" title="צליל" description="התראות LifeOS מתוזמנות ללא צליל. אין כרגע אפשרות להפעיל צליל באפליקציה." />
      <V2SettingsRow icon="vibrate" title="רטט" divider description="LifeOS אינו מגדיר רטט להתראות. התנהגות המכשיר כפופה להגדרות המערכת; אין כאן מתג רטט פעיל." />
    </V2SettingsGroup>
    <View style={{ marginTop: 18, gap: 12 }}>
      <V2Text muted>{localNotificationsSupported ? 'הרשאה ומסירת התראות תלויות גם בהגדרות ה־iPhone ובמצבי הריכוז שלו.' : 'מסירת התראות מקומיות נתמכת כרגע רק ב־iPhone. ניתן לשמור העדפות חשבון גם כאן.'}</V2Text>
      {localNotificationsSupported ? <V2Button secondary title="פתיחת הגדרות iPhone" onPress={() => { setError(false); void openNotificationSettings().catch(() => setError(true)); }} /> : null}
      {error ? <V2Notice error title="לא הצלחנו לפתוח את הגדרות המכשיר. אפשר לנסות שוב." /> : null}
    </View>
  </V2SettingsPage>;
}
