import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

export function SettingsBackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="חזרה"
        accessibilityRole="button"
        onPress={onBack}
        style={styles.backButton}
      >
        <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

export function SettingsPage({
  children,
  footer,
  onBack,
  title,
}: PropsWithChildren<{ footer?: ReactNode; onBack: () => void; title: string }>) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.pageContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <SettingsBackHeader onBack={onBack} title={title} />
        {children}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SettingsSectionLabel({ children }: PropsWithChildren) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function SettingsCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function SettingsRow({
  divider = false,
  label,
  onPress,
  value,
}: {
  divider?: boolean;
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, divider && styles.rowDivider]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
      <Ionicons color="#B0AA9E" name="chevron-back" size={18} />
    </Pressable>
  );
}

export function RadioOption({
  current = false,
  label,
  onPress,
  selected,
}: {
  current?: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.radioOption, selected && styles.radioOptionSelected]}
    >
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected ? <Ionicons color={colors.white} name="checkmark" size={14} /> : null}
      </View>
      <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
      {selected && current ? <Text style={styles.currentBadge}>נוכחי</Text> : null}
    </Pressable>
  );
}

export function SettingsChoiceSheet({
  children,
  description,
  error,
  onCancel,
  onSave,
  saving,
  title,
}: PropsWithChildren<{
  description: string;
  error?: string | null;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  title: string;
}>) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={['top']} style={styles.choiceRoot}>
      <View style={styles.choiceBackground}>
        <Text style={styles.choiceBackgroundTitle}>הגדרות</Text>
        <SettingsSectionLabel>תכנון</SettingsSectionLabel>
        <View style={styles.choiceBackgroundCard}><Text style={styles.rowLabel}>{title}</Text></View>
      </View>
      <View style={styles.choiceOverlay} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Pressable accessibilityRole="button" onPress={onCancel}>
            <Text style={styles.cancelText}>ביטול</Text>
          </Pressable>
        </View>
        <Text style={styles.sheetDescription}>{description}</Text>
        <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityLabel={`שמירת ${title}`}
          accessibilityRole="button"
          accessibilityState={{ busy: saving }}
          disabled={saving}
          onPress={onSave}
          style={[styles.saveButton, saving && styles.disabled]}
        >
          <Text style={styles.saveText}>{saving ? 'שומר…' : 'שמירה'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  pageContent: { flexGrow: 1, paddingBottom: spacing.xl, paddingHorizontal: 30, paddingTop: spacing.sm },
  header: { alignItems: 'center', flexDirection: 'row-reverse', gap: 14 },
  backButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  headerTitle: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: typography.size.title, writingDirection: 'rtl' },
  sectionLabel: { color: colors.textSubtle, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.4, marginBottom: spacing.xs, marginTop: 28, textAlign: 'right', writingDirection: 'rtl' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, paddingHorizontal: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.sm, minHeight: 58 },
  rowDivider: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { color: colors.textSoft, flex: 1, fontFamily: typography.family.semibold, fontSize: typography.size.button, textAlign: 'right', writingDirection: 'rtl' },
  rowValue: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.body, textAlign: 'left', writingDirection: 'rtl' },
  footer: { flex: 1, justifyContent: 'flex-end', paddingTop: spacing.xxl },
  choiceRoot: { backgroundColor: colors.background, flex: 1, justifyContent: 'flex-end' },
  choiceBackground: { flex: 1, opacity: 0.45, paddingHorizontal: 30, paddingTop: spacing.md },
  choiceBackgroundTitle: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: typography.size.title, textAlign: 'right' },
  choiceBackgroundCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md },
  choiceOverlay: { backgroundColor: colors.overlay, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', paddingHorizontal: 22, paddingTop: 14 },
  handle: { alignSelf: 'center', backgroundColor: '#DED8CB', borderRadius: radius.round, height: 5, width: 38 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: spacing.md },
  sheetTitle: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 19, writingDirection: 'rtl' },
  cancelText: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.body },
  sheetDescription: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: typography.size.meta, lineHeight: 21, marginTop: spacing.sm, textAlign: 'right', writingDirection: 'rtl' },
  options: { gap: spacing.xs, paddingTop: spacing.lg },
  radioOption: { alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, flexDirection: 'row-reverse', gap: spacing.sm, minHeight: 50, paddingHorizontal: spacing.md },
  radioOptionSelected: { backgroundColor: colors.accentWeak, borderColor: colors.accent, borderWidth: 1.5 },
  radioCircle: { borderColor: '#C9C3B5', borderRadius: 11, borderWidth: 1.75, height: 22, width: 22 },
  radioCircleSelected: { alignItems: 'center', backgroundColor: colors.accent, borderColor: colors.accent, justifyContent: 'center' },
  radioLabel: { color: colors.textSoft, flex: 1, fontFamily: typography.family.medium, fontSize: typography.size.button, textAlign: 'right', writingDirection: 'rtl' },
  radioLabelSelected: { color: colors.accent, fontFamily: typography.family.bold },
  currentBadge: { backgroundColor: colors.surface, borderRadius: radius.round, color: colors.accent, fontFamily: typography.family.bold, fontSize: 12, paddingHorizontal: 9, paddingVertical: 3 },
  error: { color: colors.warningText, fontFamily: typography.family.semibold, fontSize: typography.size.label, marginTop: spacing.sm, textAlign: 'right' },
  saveButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 15, height: 52, justifyContent: 'center', marginTop: spacing.lg },
  saveText: { color: colors.white, fontFamily: typography.family.extraBold, fontSize: 17 },
  disabled: { opacity: 0.6 },
});
