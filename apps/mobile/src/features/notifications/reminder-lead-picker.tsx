import { useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { validReminderLead } from './commitment-reminder-time';

const presets = [0, 5, 15, 30, 60];
export function reminderLeadLabel(value: number | null) {
  if (value === null) return 'ללא תזכורת';
  if (value === 0) return 'בזמן ההתחייבות';
  if (value === 60) return 'שעה לפני';
  return `${value} דקות לפני`;
}

export function ReminderLeadPicker({ value, onChange, allowNone = true, disabled = false }: {
  value: number | null; onChange: (value: number | null) => void; allowNone?: boolean; disabled?: boolean;
}) {
  const [custom, setCustom] = useState(value !== null && !presets.includes(value));
  const choices = allowNone ? [null, ...presets] : presets;
  const choose = (next: number | null) => { if (Platform.OS !== 'web') Keyboard.dismiss(); setCustom(false); onChange(next); };
  return <View style={styles.content}>
    <View style={styles.choices}>
      {choices.map(lead => <Pressable key={String(lead)} accessibilityRole="radio" accessibilityLabel={reminderLeadLabel(lead)} accessibilityState={{ selected: !custom && value === lead, disabled }} disabled={disabled} onPress={() => choose(lead)} style={[styles.choice, !custom && value === lead && styles.selected]}>
        <Text style={styles.text}>{reminderLeadLabel(lead)}</Text>
      </Pressable>)}
      <Pressable accessibilityRole="radio" accessibilityLabel="מותאם אישית" accessibilityState={{ selected: custom, disabled }} disabled={disabled} onPress={() => { setCustom(true); if (value === null) onChange(NaN); }} style={[styles.choice, custom && styles.selected]}><Text style={styles.text}>מותאם אישית</Text></Pressable>
    </View>
    {custom ? <>
      <Text style={styles.text}>מספר דקות לפני ההתחייבות (0–1440)</Text>
      <TextInput accessibilityLabel="דקות לפני ההתחייבות" keyboardType="number-pad" editable={!disabled} value={value !== null && Number.isFinite(value) ? String(value) : ''} onChangeText={text => onChange(/^\d+$/.test(text) ? Number(text) : NaN)} style={styles.input} />
      {value === null || !validReminderLead(value) ? <Text accessibilityRole="alert" style={styles.text}>צריך לבחור מספר שלם בין 0 ל־1440 דקות.</Text> : null}
    </> : null}
  </View>;
}
const styles = StyleSheet.create({
  content: { gap: spacing.sm }, choices: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs },
  choice: { minHeight: 44, padding: spacing.sm, justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.completedSurface, borderWidth: 1, borderColor: 'transparent' },
  selected: { borderColor: colors.accent, backgroundColor: colors.accentWeak },
  text: { color: colors.text, fontFamily: typography.family.regular, fontSize: 15, textAlign: 'right', writingDirection: 'rtl' },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text, textAlign: 'right' },
});
