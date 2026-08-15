import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MobileShell } from '@/components/mobile-shell';
import { useAuth } from '@/features/auth/auth-provider';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { useTaskCapture } from '@/features/tasks/use-task-capture';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export function authDisplayName(metadata: Record<string, unknown> | undefined) {
  return typeof metadata?.name === 'string' && metadata.name.trim()
    ? metadata.name.trim()
    : 'החשבון שלי';
}

export function MoreScreen({
  onNavigateAccount,
  onNavigateInbox,
  onNavigateSettings,
  onNavigateToday,
  onNavigateWeek,
}: {
  onNavigateAccount: () => void;
  onNavigateInbox: () => void;
  onNavigateSettings: () => void;
  onNavigateToday: () => void;
  onNavigateWeek: () => void;
}) {
  const { user } = useAuth();
  const [captureOpen, setCaptureOpen] = useState(false);
  const { captureTask } = useTaskCapture('server');
  return (
    <>
      <MobileShell
        onNavigateInbox={onNavigateInbox}
        onNavigateToday={onNavigateToday}
        onNavigateWeek={onNavigateWeek}
        onQuickCapture={() => setCaptureOpen(true)}
        selected="more"
      >
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          <Text style={styles.title}>עוד</Text>
          <Text style={styles.subtitle}>מקום שקט לדברים שלא צריכים להיות במסך הראשי.</Text>
          <Text style={styles.section}>אישי ותכנון</Text>
          <View style={styles.card}>
            <MoreRow icon="settings-outline" label="הגדרות" onPress={onNavigateSettings} subtitle="תכנון, זמן ואזור זמן" />
            <View style={styles.divider} />
            <MoreRow disabled icon="apps-outline" label="תחומי חיים" subtitle="עבודה · משפחה · בית ועוד" />
          </View>
          <Text style={styles.section}>חשבון</Text>
          <View style={styles.card}>
            <MoreRow icon="person-outline" label="חשבון" onPress={onNavigateAccount} subtitle={authDisplayName(user?.user_metadata)} />
          </View>
          <Text style={styles.version}>LifeOS · גרסה 0.1</Text>
        </ScrollView>
      </MobileShell>
      <QuickCaptureSheet onClose={() => setCaptureOpen(false)} onSave={captureTask} visible={captureOpen} />
    </>
  );
}

function MoreRow({ disabled, icon, label, onPress, subtitle }: { disabled?: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; subtitle: string }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole={disabled ? undefined : 'button'} disabled={disabled} onPress={onPress} style={styles.row}>
      <View style={styles.icon}><Ionicons color={colors.textMuted} name={icon} size={21} /></View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {disabled ? <Text style={styles.soon}>בקרוב</Text> : <Ionicons color="#B0AA9E" name="chevron-back" size={18} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: spacing.xl, paddingHorizontal: 22, paddingTop: spacing.sm },
  title: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 30, textAlign: 'right' },
  subtitle: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: typography.size.body, lineHeight: 22, marginTop: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
  section: { color: colors.textSubtle, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.4, marginBottom: spacing.xs, marginTop: 28, textAlign: 'right' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, paddingHorizontal: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row-reverse', gap: 14, minHeight: 70 },
  icon: { alignItems: 'center', backgroundColor: '#EFEAE0', borderRadius: spacing.sm, height: 40, justifyContent: 'center', width: 40 },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.textSoft, fontFamily: typography.family.semibold, fontSize: typography.size.button, textAlign: 'right' },
  rowSubtitle: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, marginTop: 2, textAlign: 'right' },
  divider: { backgroundColor: colors.divider, height: StyleSheet.hairlineWidth, marginLeft: 0, marginRight: 54 },
  soon: { backgroundColor: '#EFEAE0', borderRadius: radius.round, color: '#A8A296', fontFamily: typography.family.bold, fontSize: 12, paddingHorizontal: 10, paddingVertical: 4 },
  version: { color: '#B0AA9E', fontFamily: typography.family.regular, fontSize: typography.size.label, marginTop: 34, textAlign: 'center', writingDirection: 'ltr' },
});
