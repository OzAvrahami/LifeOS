import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { SettingsCard, SettingsPage, SettingsSectionLabel } from './settings.components';
import { useEffectiveSettings, usePutSettings } from './settings.queries';
import { timezoneOffsetLabel } from './settings-time';
import { timezoneOptions, type TimezoneOption } from './settings.types';

export function TimezoneScreen({ onBack }: { onBack: () => void }) {
  const { effective } = useEffectiveSettings();
  const mutation = usePutSettings();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const selected = timezoneOptions.find((option) => option.timezone === effective.timezone)
    ?? { label: effective.timezone, searchTerms: [], timezone: effective.timezone };
  const others = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('he-IL');
    return timezoneOptions.filter((option) => option.timezone !== selected.timezone).filter((option) =>
      !normalized
      || option.label.toLocaleLowerCase('he-IL').includes(normalized)
      || option.timezone.toLowerCase().includes(normalized)
      || option.searchTerms.some((term) => term.toLocaleLowerCase('he-IL').includes(normalized)));
  }, [search, selected.timezone]);

  const choose = async (timezone: string) => {
    if (mutation.isPending) return;
    setError(null);
    try {
      await mutation.mutateAsync({
        defaultDailyCapacityMinutes: effective.defaultDailyCapacityMinutes,
        timezone,
        weekStartDay: effective.weekStartDay,
      });
      onBack();
    } catch {
      setError('לא הצלחנו לשמור. אפשר לנסות שוב.');
    }
  };

  return (
    <SettingsPage onBack={onBack} title="אזור זמן">
      <View style={styles.search}>
        <Ionicons color="#B0AA9E" name="search-outline" size={19} />
        <TextInput
          accessibilityLabel="חיפוש עיר או אזור"
          onChangeText={setSearch}
          placeholder="חיפוש עיר או אזור"
          placeholderTextColor={colors.textFaint}
          returnKeyType="search"
          style={styles.searchInput}
          textAlign="right"
          value={search}
        />
      </View>
      <SettingsSectionLabel>נבחר</SettingsSectionLabel>
      <SettingsCard><TimezoneRow option={selected} selected /></SettingsCard>
      <SettingsSectionLabel>אחרים</SettingsSectionLabel>
      <SettingsCard>
        {others.map((option, index) => (
          <TimezoneRow
            divider={index < others.length - 1}
            key={option.timezone}
            onPress={() => void choose(option.timezone)}
            option={option}
          />
        ))}
        {others.length === 0 ? <Text style={styles.noResults}>לא נמצאו אזורי זמן מתאימים.</Text> : null}
      </SettingsCard>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </SettingsPage>
  );
}

function TimezoneRow({ divider, onPress, option, selected }: { divider?: boolean; onPress?: () => void; option: TimezoneOption; selected?: boolean }) {
  const content = (
    <>
      <View style={styles.timezoneCopy}>
        <Text style={[styles.timezoneLabel, selected && styles.timezoneLabelSelected]}>{option.label}</Text>
        <Text style={styles.timezoneMeta}>{option.timezone} · {timezoneOffsetLabel(option.timezone)}</Text>
      </View>
      {selected ? <View style={styles.check}><Ionicons color={colors.white} name="checkmark" size={15} /></View> : null}
    </>
  );
  if (!onPress) return <View style={[styles.timezoneRow, divider && styles.divider]}>{content}</View>;
  return <Pressable accessibilityLabel={`${option.label}, ${option.timezone}`} accessibilityRole="button" onPress={onPress} style={[styles.timezoneRow, divider && styles.divider]}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: spacing.sm, height: 48, marginTop: spacing.lg, paddingHorizontal: 14 },
  searchInput: { color: colors.textSoft, flex: 1, fontFamily: typography.family.regular, fontSize: typography.size.body, writingDirection: 'rtl' },
  timezoneRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.sm, minHeight: 66 },
  divider: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
  timezoneCopy: { flex: 1 },
  timezoneLabel: { color: colors.textSoft, fontFamily: typography.family.semibold, fontSize: typography.size.button, textAlign: 'right' },
  timezoneLabelSelected: { fontFamily: typography.family.bold },
  timezoneMeta: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, marginTop: 2, textAlign: 'right', writingDirection: 'ltr' },
  check: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 12, height: 24, justifyContent: 'center', width: 24 },
  noResults: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: typography.size.meta, paddingVertical: spacing.lg, textAlign: 'center' },
  error: { color: colors.warningText, fontFamily: typography.family.semibold, fontSize: typography.size.label, marginTop: spacing.md, textAlign: 'right' },
});
