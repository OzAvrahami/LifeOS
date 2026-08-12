import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { unplannedTodayFixture } from './today.fixture';

export function UnplannedState() {
  const today = unplannedTodayFixture;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>{today.greeting}</Text>
      <Text style={styles.date}>{today.dateLabel}</Text>
      <Text style={styles.summary}>אין משימות מתוכננות · 2 התחייבויות היום</Text>

      <View accessibilityLabel="יום לא מתוכנן" style={styles.openDay}>
        <View style={styles.openIcon}>
          <Ionicons color={colors.accent} name="navigate-circle-outline" size={46} />
        </View>
        <Text style={styles.title}>היום שלך עדיין פתוח</Text>
        <Text style={styles.message}>
          בוא נבחר מה באמת חשוב שיקרה היום. אין צורך למלא את היום — רק לבחור נכון.
        </Text>
        <Pressable accessibilityRole="button" style={[styles.action, styles.primaryAction]}>
          <Text style={[styles.actionText, styles.primaryActionText]}>בחירת מיקוד להיום</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.action}>
          <Text style={styles.actionText}>לבחור מתוך השבוע</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.action}>
          <Text style={styles.actionText}>לבחור מתוך Inbox</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>כבר ביומן</Text>
      <View accessibilityLabel="כבר ביומן" style={styles.commitments}>
        {today.commitments.map((commitment, index) => (
          <View key={commitment.id} style={[styles.row, index === 0 && styles.divider]}>
            <Text style={styles.time}>{commitment.time}</Text>
            <Text style={styles.commitmentTitle}>{commitment.title}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, paddingHorizontal: 22, paddingTop: spacing.xs },
  greeting: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.body, textAlign: 'right', writingDirection: 'rtl' },
  date: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: typography.size.display, lineHeight: 36, marginTop: 2, textAlign: 'right', writingDirection: 'rtl' },
  summary: { color: colors.textMuted, fontFamily: typography.family.medium, fontSize: typography.size.label, marginTop: 14, textAlign: 'right', writingDirection: 'rtl' },
  openDay: { alignItems: 'center', marginTop: 25 },
  openIcon: { alignItems: 'center', backgroundColor: colors.accentWeak, borderRadius: 48, height: 96, justifyContent: 'center', width: 96 },
  title: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 23, marginTop: spacing.md, textAlign: 'center', writingDirection: 'rtl' },
  message: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: typography.size.body, lineHeight: 23, marginBottom: spacing.md, marginTop: spacing.xs, maxWidth: 320, textAlign: 'center', writingDirection: 'rtl' },
  action: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, height: 50, justifyContent: 'center', marginTop: spacing.xs, width: '100%' },
  primaryAction: { backgroundColor: colors.accent, borderColor: colors.accent, height: 52 },
  actionText: { color: colors.textSoft, fontFamily: typography.family.bold, fontSize: typography.size.button, writingDirection: 'rtl' },
  primaryActionText: { color: colors.white },
  sectionLabel: { color: colors.textSubtle, fontFamily: typography.family.extraBold, fontSize: typography.size.label, letterSpacing: 0.5, marginBottom: spacing.xxs, marginTop: 24, textAlign: 'right', writingDirection: 'rtl' },
  commitments: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.md, minHeight: 52 },
  divider: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
  time: { color: colors.textSoft, fontFamily: typography.family.bold, fontSize: typography.size.meta, textAlign: 'left', writingDirection: 'ltr' },
  commitmentTitle: { color: colors.text, flex: 1, fontFamily: typography.family.regular, fontSize: typography.size.body, textAlign: 'right', writingDirection: 'rtl' },
});
