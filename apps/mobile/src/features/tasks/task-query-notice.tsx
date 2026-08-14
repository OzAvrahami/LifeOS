import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

export function TaskQueryNotice({
  error,
  loading,
  onRetry,
}: {
  error: boolean;
  loading: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return <Text accessibilityLabel="טוען משימות" style={styles.text}>טוען משימות…</Text>;
  }
  if (!error) return null;
  return (
    <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
      <Text style={styles.error}>לא הצלחנו לטעון את המשימות · נסו שוב</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.warningText, fontFamily: typography.family.semibold, fontSize: typography.size.label, textAlign: 'right', writingDirection: 'rtl' },
  retry: { minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.xxs },
  text: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: typography.size.label, minHeight: 36, paddingHorizontal: spacing.xxs, paddingTop: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
});
