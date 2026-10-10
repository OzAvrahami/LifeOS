import { Pressable, useWindowDimensions, View } from 'react-native';
import { V2Notice, V2Text } from '@/components/v2';
import { V2Icon } from '@/components/v2-icon';
import { useTheme } from '@/theme/theme-provider';
import { AppVersionFooter } from './app-version-footer';
import { useEffectiveSettings } from './settings.queries';
import { V2SettingsGroup, V2SettingsHeading, V2SettingsPage, V2SettingsRow } from './v2-settings';
import { useGoogleCalendar } from './google-calendar.api';

export function SettingsScreen({ onBack, onAccount, onCalendar, onNotifications, onAppearance, onPreferences }: {
  onBack: () => void; onAccount: () => void; onCalendar: (provider: 'google' | 'apple') => void;
  onNotifications: () => void; onAppearance: () => void; onPreferences: () => void;
}) {
  const { query } = useEffectiveSettings(); const { colors, preference } = useTheme();
  const google = useGoogleCalendar().query;
  const googleDescription = !google.data ? google.isError ? 'לא ניתן לבדוק את החיבור' : 'בודק חיבור…'
    : !google.data.configured ? 'החיבור עדיין אינו זמין'
      : google.data.status === 'connected' ? `מחובר · ${google.data.calendars.filter(c => c.selected).length} יומנים נבחרו`
        : google.data.status === 'reconnect_required' ? 'נדרש חיבור מחדש'
          : google.data.status === 'failed' ? 'הייבוא האחרון לא הושלם' : 'לא מחובר';
  const narrow = useWindowDimensions().width <= 375;
  const appearance = { system: 'לפי המכשיר', light: 'בהיר', dark: 'כהה' }[preference];
  return <V2SettingsPage onBack={onBack} eyebrow="LifeOS" title="הגדרות" description="חיבורים, התראות והעדפות אישיות.">
    <V2SettingsHeading>החשבון שלי</V2SettingsHeading>
    <V2SettingsGroup><V2SettingsRow title="פרטי חשבון וסיסמה" description="פרטים אישיים, איפוס סיסמה ויציאה" icon="user-round" onPress={onAccount} /></V2SettingsGroup>
    <V2SettingsHeading>חיבורי יומן</V2SettingsHeading>
    <V2SettingsGroup>
      <V2SettingsRow title="Google Calendar" description={googleDescription} icon="google" ltr onPress={() => onCalendar('google')} />
      <V2SettingsRow title="Apple Calendar" description="החיבור עדיין אינו זמין" icon="calendar-days" ltr divider onPress={() => onCalendar('apple')} />
    </V2SettingsGroup>
    <V2Text muted style={{ fontSize: 11, lineHeight: 17.6, marginTop: 9 }}>ייבוא Google דורש חיבור ובחירה מפורשת. Apple עדיין אינו זמין.</V2Text>
    <V2SettingsHeading>התראות</V2SettingsHeading>
    <V2SettingsGroup><V2SettingsRow title="התראות ותזכורות" icon="bell" onPress={onNotifications}
      description={query.data?.notifications ? query.data.notifications.enabled ? 'בחירת סוגי התראות והעדפות מסירה' : 'ההתראות כבויות' : query.isError ? 'לא ניתן לטעון את ההעדפות' : query.data ? 'נדרש עדכון שרת לשמירת התראות' : 'טוען העדפות…'} /></V2SettingsGroup>
    {query.isError ? <V2Notice error title="לא הצלחנו לרענן את ההעדפות." onRetry={() => { void query.refetch(); }} /> : null}
    <V2SettingsHeading>תצוגה</V2SettingsHeading>
    <V2SettingsGroup><V2SettingsRow title="מראה האפליקציה" icon="sun-moon" trailing={
      <Pressable accessibilityRole="button" accessibilityLabel={'מראה האפליקציה: ' + appearance} onPress={onAppearance} hitSlop={2}
        style={{ minHeight: 40, maxWidth: narrow ? 103 : 122, padding: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.background, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
        <V2Text style={{ fontSize: narrow ? 11 : 12, flexShrink: 1 }}>{appearance}</V2Text><V2Icon name="chevron-down" size={14} color={colors.textMuted} />
      </Pressable>} /></V2SettingsGroup>
    <Pressable accessibilityRole="button" accessibilityLabel="העדפות תאריך וזמן" onPress={onPreferences} style={{ minHeight: 44, justifyContent: 'center', marginTop: 12 }}>
      <V2Text variant="caption" muted>העדפות תאריך וזמן</V2Text>
    </Pressable>
    <View style={{ marginTop: 26 }}><AppVersionFooter /></View>
  </V2SettingsPage>;
}
