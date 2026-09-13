import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export const planningStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { padding: spacing.md, gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface },
  heading: { color: colors.text, fontFamily: typography.family.bold, fontSize: 22, textAlign: 'right', writingDirection: 'rtl' },
  text: { color: colors.textSoft, fontFamily: typography.family.regular, fontSize: 16, textAlign: 'right', writingDirection: 'rtl' },
  error: { color: colors.warningText, fontFamily: typography.family.regular, fontSize: 16, textAlign: 'right', writingDirection: 'rtl' },
});
