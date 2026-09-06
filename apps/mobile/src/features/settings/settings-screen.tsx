import { Text } from 'react-native';

import { TaskQueryNotice } from '@/features/tasks/task-query-notice';
import { colors, spacing, typography } from '@/theme/tokens';

import { AppVersionFooter } from './app-version-footer';
import { SettingsCard, SettingsPage, SettingsRow, SettingsSectionLabel } from './settings.components';
import { useEffectiveSettings } from './settings.queries';
import { dayWindowValue, timezoneOffsetLabel } from './settings-time';
import { timezoneOptions, weekdayLabels } from './settings.types';

export function SettingsScreen({
  onBack,
  onDayWindow,
  onTimezone,
  onWeekStart,
}: {
  onBack: () => void;
  onDayWindow: () => void;
  onTimezone: () => void;
  onWeekStart: () => void;
}) {
  const { effective, query } = useEffectiveSettings();
  const timezoneLabel = timezoneOptions.find((item) => item.timezone === effective.timezone)?.label
    ?? effective.timezone;
  return (
    <SettingsPage footer={<AppVersionFooter />} onBack={onBack} title="הגדרות">
      <TaskQueryNotice error={query.isError} loading={query.isPending} onRetry={() => void query.refetch()} />
      <SettingsSectionLabel>היום שלי</SettingsSectionLabel>
      <SettingsCard>
        <SettingsRow
          divider
          label="תחילת היום"
          onPress={onDayWindow}
          value={query.isPending ? 'טוען…' : effective.dayWindowSupported ? effective.dayStartTime ?? 'לא הוגדר' : 'דורש עדכון שרת'}
        />
        <SettingsRow
          label="סיום היום"
          onPress={onDayWindow}
          value={query.isPending ? 'טוען…' : effective.dayWindowSupported ? effective.dayEndTime ?? 'לא הוגדר' : 'דורש עדכון שרת'}
        />
      </SettingsCard>
      <Text style={styles.hint}>
        {query.isPending
          ? 'טוען את טווח היום מהחשבון…'
          : query.isError
            ? 'לא ניתן לקבוע אם טווח היום זמין עד שההגדרות ייטענו.'
            : effective.dayWindowSupported
              ? `טווח היום הפעיל שלך (${dayWindowValue(effective.dayStartTime, effective.dayEndTime)}). הוא אינו זמן פנוי למשימות.`
              : 'שמירת טווח היום בחשבון תהיה זמינה לאחר עדכון השרת.'}
      </Text>
      <SettingsSectionLabel>תכנון שבועי</SettingsSectionLabel>
      <SettingsCard>
        <SettingsRow label="תחילת שבוע" onPress={onWeekStart} value={weekdayLabels[effective.weekStartDay] ?? weekdayLabels[0]} />
      </SettingsCard>
      <SettingsSectionLabel>מערכת</SettingsSectionLabel>
      <SettingsCard>
        <SettingsRow label="אזור זמן" onPress={onTimezone} value={`${timezoneLabel} · ${timezoneOffsetLabel(effective.timezone)}`} />
      </SettingsCard>
    </SettingsPage>
  );
}

const styles = {
  hint: {
    color: colors.textFaint,
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    lineHeight: 18,
    marginHorizontal: spacing.xxs,
    marginTop: spacing.xs,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
};
