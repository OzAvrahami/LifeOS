import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CommitmentTimeField } from '@/features/commitments/commitment-date-time-fields';
import { TaskQueryNotice } from '@/features/tasks/task-query-notice';
import { colors, radius, spacing, typography } from '@/theme/tokens';

import { dayWindowError, dayWindowKind } from './day-window';
import { SettingsCard, SettingsPage } from './settings.components';
import { useEffectiveSettings, usePutSettings } from './settings.queries';
import type { EffectiveUserSettings } from './settings.types';

export function DayWindowScreen({ onBack }: { onBack: () => void }) {
  const { effective, query } = useEffectiveSettings();

  if (query.isPending) {
    return (
      <SettingsPage onBack={onBack} title="היום שלי">
        <TaskQueryNotice error={false} loading onRetry={() => undefined} />
      </SettingsPage>
    );
  }

  if (query.isError && !query.data) {
    return (
      <SettingsPage onBack={onBack} title="היום שלי">
        <TaskQueryNotice error loading={false} onRetry={() => void query.refetch()} />
      </SettingsPage>
    );
  }

  if (!effective.dayWindowSupported) {
    return (
      <SettingsPage onBack={onBack} title="היום שלי">
        <SettingsCard>
          <View accessibilityLabel="חלון היום אינו זמין" style={styles.unavailable}>
            <Text style={styles.unavailableTitle}>נדרש עדכון שרת</Text>
            <Text style={styles.description}>
              השרת המחובר עדיין אינו תומך בשמירת תחילת היום וסיומו. לא בוצע שינוי מקומי או בחשבון.
            </Text>
          </View>
        </SettingsCard>
      </SettingsPage>
    );
  }

  return (
    <DayWindowForm
      key={`${effective.dayStartTime ?? 'unset'}-${effective.dayEndTime ?? 'unset'}`}
      onBack={onBack}
      settings={effective}
    />
  );
}

function DayWindowForm({ onBack, settings }: { onBack: () => void; settings: EffectiveUserSettings }) {
  const [start, setStart] = useState(settings.dayStartTime);
  const [end, setEnd] = useState(settings.dayEndTime);
  const [saveError, setSaveError] = useState<string | null>(null);
  const mutation = usePutSettings();
  const validationError = dayWindowError(start, end);
  const kind = dayWindowKind(start, end);

  const save = async () => {
    if (validationError || mutation.isPending) return;
    setSaveError(null);
    try {
      await mutation.mutateAsync({
        dayEndTime: end,
        dayStartTime: start,
        defaultDailyCapacityMinutes: settings.defaultDailyCapacityMinutes,
        timezone: settings.timezone,
        weekStartDay: settings.weekStartDay,
      });
      onBack();
    } catch {
      setSaveError('לא הצלחנו לשמור. השעות שבחרת נשארו כאן ואפשר לנסות שוב.');
    }
  };

  return (
    <SettingsPage onBack={onBack} title="היום שלי">
      <Text style={styles.description}>
        הטווח מתאר מתי היום הפעיל שלך מתחיל ומסתיים. הוא אינו זמן פנוי למשימות ולא משנה לאיזה תאריך משימות שייכות.
      </Text>
      <SettingsCard>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>תחילת היום</Text>
          <CommitmentTimeField
            accessibilityLabel="תחילת היום"
            onChange={(value) => { setSaveError(null); setStart(value); }}
            placeholder="בחירת שעה"
            value={start}
          />
        </View>
        <View style={[styles.fieldGroup, styles.divider]}>
          <Text style={styles.label}>סיום היום</Text>
          <CommitmentTimeField
            accessibilityLabel="סיום היום"
            onChange={(value) => { setSaveError(null); setEnd(value); }}
            placeholder="בחירת שעה"
            value={end}
          />
        </View>
      </SettingsCard>

      {kind === 'overnight' ? (
        <Text accessibilityLabel="סיום ביום הבא" style={styles.note}>
          שעת הסיום היא ביום הקלנדרי הבא.
        </Text>
      ) : null}
      {kind === 'same-day' ? <Text style={styles.note}>שעת הסיום היא באותו יום קלנדרי.</Text> : null}
      {validationError ? <Text accessibilityRole="alert" style={styles.error}>{validationError}</Text> : null}
      {saveError ? <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text> : null}

      {kind !== 'unset' ? (
        <Pressable
          accessibilityLabel="ניקוי חלון היום"
          accessibilityRole="button"
          disabled={mutation.isPending}
          onPress={() => { setSaveError(null); setStart(null); setEnd(null); }}
          style={styles.clearButton}
        >
          <Text style={styles.clearText}>ניקוי הטווח</Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityLabel="שמירת היום שלי"
        accessibilityRole="button"
        accessibilityState={{ busy: mutation.isPending, disabled: Boolean(validationError) || mutation.isPending }}
        disabled={Boolean(validationError) || mutation.isPending}
        onPress={() => void save()}
        style={[styles.saveButton, (validationError || mutation.isPending) && styles.disabled]}
      >
        <Text style={styles.saveText}>{mutation.isPending ? 'שומר…' : 'שמירה'}</Text>
      </Pressable>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  description: {
    color: colors.textSubtle,
    fontFamily: typography.family.regular,
    fontSize: typography.size.meta,
    lineHeight: 21,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fieldGroup: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.md, minHeight: 76 },
  divider: { borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth },
  label: { color: colors.textSoft, flex: 1, fontFamily: typography.family.semibold, fontSize: typography.size.button, textAlign: 'right', writingDirection: 'rtl' },
  note: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: typography.size.label, marginTop: spacing.sm, textAlign: 'right', writingDirection: 'rtl' },
  error: { color: colors.warningText, fontFamily: typography.family.semibold, fontSize: typography.size.label, marginTop: spacing.sm, textAlign: 'right', writingDirection: 'rtl' },
  clearButton: { alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xs },
  clearText: { color: colors.textSubtle, fontFamily: typography.family.bold, fontSize: typography.size.label, writingDirection: 'rtl' },
  saveButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, height: 52, justifyContent: 'center', marginTop: spacing.lg },
  saveText: { color: colors.white, fontFamily: typography.family.extraBold, fontSize: 17 },
  disabled: { opacity: 0.55 },
  unavailable: { paddingVertical: spacing.lg },
  unavailableTitle: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: typography.size.title, textAlign: 'right', writingDirection: 'rtl' },
});
