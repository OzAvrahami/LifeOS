import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '@/theme/tokens';

export function TaskDetailsButton({ task, onOpen, light = false }: { task: { id: string; title: string }; onOpen?: (id: string) => void; light?: boolean }) {
  if (!onOpen) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel={`פרטי משימה ותזכורת: ${task.title}`} onPress={() => onOpen(task.id)} style={styles.button}>
    <Text style={[styles.text, light && { color: colors.white }]}>פרטים · תזכורת</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm, alignSelf: 'flex-end' },
  text: { color: colors.accent, fontFamily: typography.family.bold, fontSize: 14, writingDirection: 'rtl' },
});
