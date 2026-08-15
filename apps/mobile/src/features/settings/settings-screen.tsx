import { Text } from 'react-native';

import { TaskQueryNotice } from '@/features/tasks/task-query-notice';
import { colors, spacing, typography } from '@/theme/tokens';

import { SettingsCard, SettingsPage, SettingsRow, SettingsSectionLabel } from './settings.components';
import { useEffectiveSettings } from './settings.queries';
import { hoursLabel, timezoneOffsetLabel } from './settings-time';
import { timezoneOptions, weekdayLabels } from './settings.types';

export function SettingsScreen({
  onBack,
  onDailyCapacity,
  onTimezone,
  onWeekStart,
}: {
  onBack: () => void;
  onDailyCapacity: () => void;
  onTimezone: () => void;
  onWeekStart: () => void;
}) {
  const { effective, query } = useEffectiveSettings();
  const timezoneLabel = timezoneOptions.find((item) => item.timezone === effective.timezone)?.label
    ?? effective.timezone;
  return (
    <SettingsPage onBack={onBack} title="הגדרות">
      <TaskQueryNotice error={query.isError} loading={query.isPending} onRetry={() => void query.refetch()} />
      <SettingsSectionLabel>תכנון יומי</SettingsSectionLabel>
      <SettingsCard>
        <SettingsRow label="זמן זמין ביום" onPress={onDailyCapacity} value={hoursLabel(effective.defaultDailyCapacityMinutes)} />
      </SettingsCard>
      <Text style={styles.hint}>כמה זמן ביום בדרך כלל תרצה להקדיש לדברים מתוכננים.</Text>
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
