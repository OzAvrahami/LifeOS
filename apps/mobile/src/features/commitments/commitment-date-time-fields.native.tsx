import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, typography } from '@/theme/tokens';

function dateFromKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year!, month! - 1, day!, 12);
}

function dateKey(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function timeDate(value: string | null) {
  const date = new Date();
  const [hours, minutes] = (value ?? '09:00').split(':').map(Number);
  date.setHours(hours!, minutes!, 0, 0);
  return date;
}

function timeValue(value: Date) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export function CommitmentDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const change = (event: DateTimePickerEvent, selected?: Date) => {
    setOpen(false);
    if (event.type !== 'dismissed' && selected) onChange(dateKey(selected));
  };
  return (
    <View>
      <Pressable accessibilityLabel="תאריך התחייבות" accessibilityRole="button" onPress={() => setOpen((current) => !current)} style={styles.field}>
        <Text style={styles.dateText}>{new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', weekday: 'long' }).format(dateFromKey(value))}</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          display={process.env.EXPO_OS === 'ios' ? 'spinner' : 'default'}
          mode="date"
          onChange={change}
          value={dateFromKey(value)}
        />
      ) : null}
    </View>
  );
}

export function CommitmentTimeField({
  accessibilityLabel,
  onChange,
  optional = false,
  placeholder,
  value,
}: {
  accessibilityLabel: string;
  onChange: (value: string | null) => void;
  optional?: boolean;
  placeholder: string;
  value: string | null;
}) {
  const [open, setOpen] = useState(false);
  const change = (event: DateTimePickerEvent, selected?: Date) => {
    setOpen(false);
    if (event.type !== 'dismissed' && selected) onChange(timeValue(selected));
  };
  return (
    <View style={styles.timeContainer}>
      <View style={styles.timeActions}>
        <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={() => setOpen((current) => !current)} style={styles.timeField}>
          <Text style={[styles.timeText, !value && styles.placeholder]}>{value ?? placeholder}</Text>
        </Pressable>
        {optional && value ? (
          <Pressable accessibilityLabel="נקה שעת סיום" accessibilityRole="button" onPress={() => onChange(null)} style={styles.clear}>
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <DateTimePicker
          display={process.env.EXPO_OS === 'ios' ? 'spinner' : 'default'}
          minuteInterval={15}
          mode="time"
          onChange={change}
          value={timeDate(value)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { backgroundColor: colors.completedSurface, borderRadius: radius.md, minHeight: 52, justifyContent: 'center', paddingHorizontal: 16 },
  dateText: { color: colors.textSoft, fontFamily: typography.family.semibold, fontSize: typography.size.button, textAlign: 'right', writingDirection: 'rtl' },
  timeContainer: { flex: 1 },
  timeActions: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  timeField: { alignItems: 'center', backgroundColor: colors.completedSurface, borderRadius: radius.md, flex: 1, minHeight: 50, justifyContent: 'center', paddingHorizontal: 10 },
  timeText: { color: colors.textSoft, fontFamily: typography.family.bold, fontSize: 18, writingDirection: 'ltr' },
  placeholder: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.button },
  clear: { alignItems: 'center', height: 36, justifyContent: 'center', width: 28 },
  clearText: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: 20 },
});
