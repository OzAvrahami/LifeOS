import { V2Notice, V2Text } from '@/components/v2';
import { V2SettingsPage, V2SettingsGroup, V2SettingsHeading, V2SettingsRow } from './v2-settings';
import { useEffectiveSettings } from './settings.queries';
import { dayWindowValue, timezoneOffsetLabel } from './settings-time';
import { timezoneOptions, weekdayLabels } from './settings.types';

export function DatePreferencesScreen({ onBack, onTimezone, onWeekStart, onDayWindow }: {
  onBack: () => void; onTimezone: () => void; onWeekStart: () => void; onDayWindow: () => void;
}) {
  const { query, effective } = useEffectiveSettings();
  const timezone = timezoneOptions.find(item => item.timezone === effective.timezone)?.label ?? effective.timezone;
  return <V2SettingsPage title="תאריך וזמן" description="העדפות לתצוגת ימים ותאריכים." onBack={onBack}>
    {query.isError ? <V2Notice error title="לא הצלחנו לרענן את ההעדפות." onRetry={() => { void query.refetch(); }} /> : null}
    {!query.data ? !query.isError ? <V2Notice title="טוען העדפות…" /> : null : <>
      <V2SettingsHeading>העדפות החשבון</V2SettingsHeading>
      <V2SettingsGroup>
        <V2SettingsRow title="אזור זמן" description={`${timezone} · ${timezoneOffsetLabel(effective.timezone)}`} icon="clock" onPress={onTimezone} />
        <V2SettingsRow title="תחילת שבוע" description={weekdayLabels[effective.weekStartDay]} icon="calendar-days" divider onPress={onWeekStart} />
        <V2SettingsRow title="חלון היום" description={effective.dayWindowSupported ? dayWindowValue(effective.dayStartTime, effective.dayEndTime) : 'נדרש עדכון שרת'} icon="sun" divider onPress={onDayWindow} />
      </V2SettingsGroup>
      <V2Text variant="caption" muted style={{ marginTop: 12 }}>חלון היום אינו זמן פנוי למשימות ואינו משנה את התוכניות שלך.</V2Text>
    </>}
  </V2SettingsPage>;
}
