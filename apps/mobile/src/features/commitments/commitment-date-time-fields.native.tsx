import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

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
      <Pressable accessibilityLabel="תאריך התחייבות" accessibilityRole="button" onPress={() => { Keyboard.dismiss(); setOpen((current) => !current); }} style={styles.field}>
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

type TimeSelection = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

const TimePickerContext = createContext<{
  selection: TimeSelection | null;
  open: (selection: TimeSelection) => void;
  close: () => void;
  isCurrent: (selection: TimeSelection) => boolean;
} | null>(null);

// One selection per editor; replacing/clearing it invalidates late native callbacks.
export function CommitmentTimePickerProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<TimeSelection | null>(null);
  const current = useRef<TimeSelection | null>(null);
  useEffect(() => () => { current.current = null; }, []);
  const open = useCallback((next: TimeSelection) => {
    Keyboard.dismiss();
    current.current = next;
    setSelection(next);
  }, []);
  const close = useCallback(() => { current.current = null; setSelection(null); }, []);
  const isCurrent = useCallback((candidate: TimeSelection) => current.current === candidate, []);

  return (
    <TimePickerContext.Provider value={{
      selection,
      open,
      close,
      isCurrent,
    }}>
      {children}
    </TimePickerContext.Provider>
  );
}

export function CommitmentTimePicker() {
  const picker = useContext(TimePickerContext);
  return picker?.selection ? (
    <TimeSelectionSurface key={picker.selection.label} selection={picker.selection} />
  ) : null;
}

function TimeSelectionSurface({ selection }: { selection: TimeSelection }) {
  const picker = useContext(TimePickerContext)!;
  const { close, isCurrent } = picker;
  const [draft, setDraft] = useState(() => timeDate(selection.value));
  const latestDraft = useRef(draft);
  const ios = process.env.EXPO_OS === 'ios';
  const confirm = useCallback((selected: Date) => {
    if (!isCurrent(selection)) return;
    close();
    selection.onChange(timeValue(selected));
  }, [close, isCurrent, selection]);
  const change = useCallback((event: DateTimePickerEvent, selected?: Date) => {
    if (!isCurrent(selection)) return;
    if (event.type !== 'set') { close(); return; }
    if (!selected) return;
    if (ios) {
      latestDraft.current = selected;
      setDraft(selected);
    } else {
      // Android emits `set` only after its native positive button is pressed.
      confirm(selected);
    }
  }, [close, confirm, ios, isCurrent, selection]);
  const control = (
    <DateTimePicker
      accessibilityLabel={`בחירת ${selection.label}`}
      display={ios ? 'spinner' : 'default'}
      {...(ios ? { locale: 'en-GB', textColor: colors.text } : {
        is24Hour: true,
        positiveButton: { label: 'אישור' },
        negativeButton: { label: 'ביטול' },
      })}
      minuteInterval={1}
      mode="time"
      onChange={change}
      style={styles.picker}
      value={draft}
    />
  );
  if (!ios) return control;
  return (
    <View style={styles.selection}>
      <Text accessibilityRole="header" style={styles.selectionLabel}>{selection.label}</Text>
      {control}
      <View style={styles.selectionActions}>
        <Pressable accessibilityLabel="אישור שעה" accessibilityRole="button" onPress={() => confirm(latestDraft.current)} style={styles.selectionAction}>
          <Text style={styles.actionText}>אישור</Text>
        </Pressable>
        <Pressable accessibilityLabel="ביטול בחירת שעה" accessibilityRole="button" onPress={picker.close} style={styles.selectionAction}>
          <Text style={styles.actionText}>ביטול</Text>
        </Pressable>
      </View>
    </View>
  );
}

type TimeFieldProps = {
  accessibilityLabel: string;
  onChange: (value: string | null) => void;
  optional?: boolean;
  placeholder: string;
  value: string | null;
};

export function CommitmentTimeField(props: TimeFieldProps) {
  const picker = useContext(TimePickerContext);
  // Preserve standalone callers (Day Window already gives each field full width).
  if (!picker) return (
    <CommitmentTimePickerProvider>
      <CommitmentTimeField {...props} />
      <CommitmentTimePicker />
    </CommitmentTimePickerProvider>
  );
  return <TimeField {...props} />;
}

function TimeField({
  accessibilityLabel,
  onChange,
  optional = false,
  placeholder,
  value,
}: TimeFieldProps) {
  const picker = useContext(TimePickerContext)!;
  return (
    <View style={styles.timeContainer}>
      <View style={styles.timeActions}>
        <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={() => {
          if (picker.selection?.label === accessibilityLabel) picker.close();
          else picker.open({ label: accessibilityLabel, onChange, value });
        }} style={styles.timeField}>
          <Text style={[styles.timeText, !value && styles.placeholder]}>{value ?? placeholder}</Text>
        </Pressable>
        {optional && value ? (
          <Pressable accessibilityLabel="נקה שעת סיום" accessibilityRole="button" onPress={() => { Keyboard.dismiss(); picker.close(); onChange(null); }} style={styles.clear}>
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        ) : null}
      </View>
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
  picker: { alignSelf: 'stretch', width: '100%' },
  selection: { marginTop: spacing.sm },
  selectionLabel: { color: colors.textSoft, fontFamily: typography.family.bold, fontSize: typography.size.button, textAlign: 'right', writingDirection: 'rtl' },
  selectionActions: { flexDirection: 'row-reverse', gap: spacing.sm },
  selectionAction: { alignItems: 'center', backgroundColor: colors.completedSurface, borderRadius: radius.md, flex: 1, justifyContent: 'center', minHeight: 48, padding: spacing.sm },
  actionText: { color: colors.accent, fontFamily: typography.family.bold, fontSize: typography.size.button, writingDirection: 'rtl' },
  clear: { alignItems: 'center', minHeight: 44, justifyContent: 'center', minWidth: 44 },
  clearText: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: 20 },
});
