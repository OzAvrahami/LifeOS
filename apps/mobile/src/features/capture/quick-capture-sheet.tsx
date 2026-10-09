import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, typography } from '@/theme/tokens';
import { useTheme, type Palette } from '@/theme/theme-provider';

import type { CaptureDestination, TaskCaptureDetails, TaskCapturePlacement } from '@/features/tasks/task-capture.types';
import { newPlanningOperationId } from '@/features/planning/daily-planning-model';
import { normalizeTaskDescription, taskContentError } from '@/features/tasks/task-content';
import { V2Button, V2Text } from '@/components/v2';
import { TaskDateSelection } from '@/features/tasks/task-date-selection';
import { addDaysToDateKey, isPlanningDate, localDateKey } from '@/features/tasks/task-dates';

export type { CaptureDestination } from '@/features/tasks/task-capture.types';

const destinations: { id: CaptureDestination; label: string; ltr?: boolean }[] = [
  { id: 'inbox', label: 'ללא יום' },
  { id: 'today', label: 'היום' },
  { id: 'week', label: 'השבוע' },
  { id: 'day', label: 'בחר יום' },
];

type CaptureProps = {
  lockDraftOnSaveAttempt?: boolean;
  focusTitle?: string;
  initialDestination?: CaptureDestination;
  initialPlannedDate?: string;
  weekLabel?: string;
  defaultDate?: string;
  onClose: () => void;
  onSave: (title: string, placement: TaskCapturePlacement, details?: TaskCaptureDetails) => Promise<void> | void;
  visible: boolean;
};

export function QuickCaptureSheet(props: CaptureProps) {
  return props.visible ? <CaptureSession {...props} /> : null;
}

function CaptureSession({
  lockDraftOnSaveAttempt = true,
  focusTitle,
  initialDestination = 'inbox',
  initialPlannedDate,
  weekLabel = 'השבוע',
  defaultDate = localDateKey(),
  onClose,
  onSave,
  visible,
}: CaptureProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creationId] = useState(newPlanningOperationId);
  const [validation, setValidation] = useState<string | null>(null);
  const attemptedRequest = useRef<{ title: string; placement: TaskCapturePlacement; details: TaskCaptureDetails } | null>(null);
  const [destination, setDestination] = useState<CaptureDestination>(initialDestination);
  const [plannedDate, setPlannedDate] = useState<string | null>(initialDestination === 'day' && isPlanningDate(initialPlannedDate) ? initialPlannedDate : null);
  const [choosingDay, setChoosingDay] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const fieldsLocked = saving || (lockDraftOnSaveAttempt && attempted);

  const close = () => {
    if (busy.current) return;
    setTitle('');
    setPlannedDate(null);
    setChoosingDay(false);
    setDestination(initialDestination);
    setError(false);
    setSaving(false);
    onClose();
  };

  const save = async () => {
    const nextTitle = title.trim();
    const invalid = taskContentError(title, description);
    if (invalid) { setValidation(invalid); return; }
    if (!nextTitle || busy.current || choosingDay || (destination === 'day' && !isPlanningDate(plannedDate))) return;
    busy.current = true;
    setAttempted(true);
    setError(false);
    setSaving(true);
    try {
      const placement: TaskCapturePlacement = destination === 'day'
        ? { destination, plannedDate: plannedDate! } : { destination };
      attemptedRequest.current ??= { title: nextTitle, placement, details: { description: normalizeTaskDescription(description), creationId } };
      const request = attemptedRequest.current;
      await onSave(request.title, request.placement, request.details);
      busy.current = false;
      close();
    } catch {
      busy.current = false;
      setError(true);
      setSaving(false);
    }
  };

  const saveDisabled = !title.trim() || saving || choosingDay || (destination === 'day' && !isPlanningDate(plannedDate));

  return (
    <Modal animationType="slide" onRequestClose={close} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel="סגור הוספה מהירה"
          accessibilityRole="button"
          onPress={close}
          style={styles.backdrop}
        />
        <View
          accessibilityLabel="חלונית הוספה מהירה"
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
        >
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : Platform.OS === 'android' ? 'on-drag' : 'none'}>
            <View style={styles.handle} />
            <Text style={styles.heading}>מה צריך לעשות?</Text>
            <V2Text muted>אפשר להוסיף עכשיו ולהחליט על היום אחר כך.</V2Text>
            {focusTitle ? <Text style={styles.destinationLabel}>בהשראת המיקוד: {focusTitle}. זו משימה עצמאית; המיקוד לא ישתנה.</Text> : null}
            <V2Text>כותרת</V2Text>
            <TextInput
              accessibilityLabel="כותרת"
              autoFocus
              editable={!fieldsLocked}
              enterKeyHint="done"
              onChangeText={setTitle}
              onSubmitEditing={() => void save()}
              placeholder="למשל, לקבוע טיפול לרכב"
              placeholderTextColor={colors.textFaint}
              returnKeyType="done"
              style={styles.input}
              textAlign="right"
              value={title}
            />
            <V2Text style={{ marginTop: spacing.md }}>תיאור (לא חובה)</V2Text>
            <TextInput accessibilityLabel="תיאור (לא חובה)" value={description} onChangeText={setDescription}
              editable={!fieldsLocked} multiline textAlignVertical="top" placeholder="כל מה שחשוב לזכור"
              placeholderTextColor={colors.textFaint} style={[styles.input, { minHeight: 100 }]} />
            {validation ? <Text accessibilityRole="alert" style={styles.error}>{validation}</Text> : null}

            {error ? <Text accessibilityRole="alert" style={styles.error}>לא הצלחנו לשמור. אפשר לנסות שוב.</Text> : null}
            {error && lockDraftOnSaveAttempt ? <Text style={styles.error}>ניסיון חוזר משתמש באותה בקשה כדי למנוע כפילות. לשינוי פרטים, סגור ובדוק תחילה אם המשימה כבר נשמרה.</Text> : null}

            <Text style={styles.destinationLabel}>לאן זה הולך?</Text>
            <View style={styles.destinations}>
              {destinations.map((item) => {
                const selected = destination === item.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={item.id}
                    disabled={fieldsLocked || undefined}
                    onPress={() => {
                      if (Platform.OS !== 'web') Keyboard.dismiss();
                      if (item.id === 'day') setChoosingDay(true);
                      else { setDestination(item.id); setPlannedDate(null); setChoosingDay(false); }
                    }}
                    style={[styles.destination, selected && styles.destinationSelected]}
                  >
                    <Text
                      style={[
                        styles.destinationText,
                        selected && styles.destinationTextSelected,
                        item.ltr && styles.ltr,
                      ]}
                    >
                      {item.id === 'week' ? weekLabel : item.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable accessibilityRole="button" accessibilityLabel="מחר" disabled={fieldsLocked}
                accessibilityState={{ selected: destination === 'day' && plannedDate === addDaysToDateKey(defaultDate, 1) }}
                onPress={() => { setDestination('day'); setPlannedDate(addDaysToDateKey(defaultDate, 1)); setChoosingDay(false); }}
                style={[styles.destination, destination === 'day' && plannedDate === addDaysToDateKey(defaultDate, 1) && styles.destinationSelected]}>
                <Text style={[styles.destinationText, destination === 'day' && plannedDate === addDaysToDateKey(defaultDate, 1) && styles.destinationTextSelected]}>מחר</Text>
              </Pressable>
            </View>

            {destination === 'day' && plannedDate ? <Text accessibilityLabel="תאריך המשימה" style={styles.destinationLabel}>{plannedDate}</Text> : null}
            {destination === 'day' && !plannedDate && !choosingDay ? <Text accessibilityRole="alert" style={styles.error}>יש לבחור ולאשר תאריך.</Text> : null}
            {choosingDay ? <TaskDateSelection defaultDate={defaultDate} value={plannedDate}
              onCancel={() => setChoosingDay(false)}
              onConfirm={(date) => { setPlannedDate(date); setDestination('day'); setChoosingDay(false); }} /> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: saving, disabled: saveDisabled }}
              disabled={saveDisabled}
              onPress={() => void save()}
              style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled]}
            >
              <Text style={styles.saveText}>{saving ? 'שומר…' : 'שמירה'}</Text>
            </Pressable>
            <V2Button secondary title="ביטול" disabled={saving} onPress={close} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: colors.overlay, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '82%', paddingHorizontal: 22, paddingTop: 14 },
  handle: { alignSelf: 'center', backgroundColor: '#DED8CB', borderRadius: radius.round, height: 5, width: 38 },
  heading: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 19, marginTop: spacing.lg, textAlign: 'right', writingDirection: 'rtl' },
  input: { backgroundColor: colors.surfaceMuted, borderRadius: 15, color: colors.text, fontFamily: typography.family.regular, fontSize: 17, marginTop: spacing.sm, minHeight: 54, paddingHorizontal: spacing.md, paddingVertical: 15, writingDirection: 'rtl' },
  error: { color: colors.warningText, fontFamily: typography.family.semibold, fontSize: typography.size.label, marginTop: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
  destinationLabel: { color: colors.textSubtle, fontFamily: typography.family.bold, fontSize: typography.size.label, marginTop: spacing.lg, textAlign: 'right', writingDirection: 'rtl' },
  destinations: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  destination: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.round, minHeight: 44, justifyContent: 'center', paddingHorizontal: 15 },
  destinationSelected: { backgroundColor: colors.accent },
  destinationText: { color: colors.textMuted, fontFamily: typography.family.bold, fontSize: typography.size.meta, writingDirection: 'rtl' },
  destinationTextSelected: { color: colors.onAccent },
  ltr: { writingDirection: 'ltr' },
  saveButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, height: 52, justifyContent: 'center', marginTop: spacing.lg },
  saveButtonDisabled: { opacity: 0.48 },
  saveText: { color: colors.onAccent, fontFamily: typography.family.bold, fontSize: typography.size.button },
});
