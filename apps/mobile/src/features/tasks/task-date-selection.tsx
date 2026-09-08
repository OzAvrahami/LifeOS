import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { TaskDateControl } from './task-date-control';
import { isPlanningDate } from './task-dates';

// Mount for each selection attempt. Cancel/unmount discards this draft entirely.
export function TaskDateSelection({ value, defaultDate, onConfirm, onCancel, onPendingChange }: {
  value?: string | null;
  defaultDate: string;
  onConfirm: (date: string) => void | Promise<void>;
  onCancel: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [draft, setDraft] = useState(value ?? defaultDate);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [nativeOpen, setNativeOpen] = useState(true);
  const busy = useRef(false);
  const confirm = async (date: string) => {
    if (busy.current || !isPlanningDate(date)) return;
    busy.current = true;
    setDraft(date);
    setNativeOpen(false);
    setPending(true);
    onPendingChange?.(true);
    setError(false);
    try { await onConfirm(date); }
    catch { setError(true); }
    finally { busy.current = false; setPending(false); onPendingChange?.(false); }
  };
  return (
    <View accessibilityLabel="בחירת תאריך לתכנון" style={styles.container}>
      <Text style={styles.label}>תאריך לתכנון</Text>
      {!pending && (Platform.OS !== 'android' || nativeOpen) ? (
        <TaskDateControl value={draft} onChange={setDraft} onConfirm={(date) => void confirm(date)} onCancel={onCancel} />
      ) : null}
      <Text accessibilityLabel="תאריך בבחירה" style={styles.label}>{draft}</Text>
      {!isPlanningDate(draft) ? <Text accessibilityRole="alert" style={styles.error}>יש לבחור תאריך תקין.</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>לא הצלחנו לעדכן. אפשר לנסות שוב או לבטל.</Text> : null}
      {Platform.OS !== 'android' || !nativeOpen ? (
        <View style={styles.actions}>
          <Pressable accessibilityLabel="אישור תאריך" accessibilityRole="button" disabled={pending || !isPlanningDate(draft)} onPress={() => void confirm(draft)} style={styles.button}>
            <Text style={styles.label}>{pending ? 'שומר…' : 'אישור'}</Text>
          </Pressable>
          <Pressable accessibilityLabel="ביטול בחירת תאריך" accessibilityRole="button" disabled={pending} onPress={onCancel} style={styles.button}>
            <Text style={styles.label}>ביטול</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', gap: spacing.xs, marginTop: spacing.sm },
  label: { color: colors.text, fontFamily: typography.family.semibold, fontSize: typography.size.button, textAlign: 'right' },
  error: { color: colors.warningText, textAlign: 'right' },
  actions: { flexDirection: 'row-reverse', gap: spacing.sm },
  button: { alignItems: 'center', justifyContent: 'center', minHeight: 48, flex: 1, backgroundColor: colors.completedSurface, borderRadius: radius.md },
});
