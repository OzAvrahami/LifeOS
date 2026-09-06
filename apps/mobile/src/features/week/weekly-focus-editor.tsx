import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { WeeklyFocus } from '@/features/planning/planning.types';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const maxFocusMessage = 'אפשר לבחור עד 3 מיקודים. כדי לבחור מיקוד נוסף, בטל קודם אחד מהמיקודים שנבחרו.';
const duplicateFocusMessage = 'המיקוד הזה כבר נמצא ברשימה.';

function normalizedFocusTitle(title: string) {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase('he-IL');
}

export function WeeklyFocusEditor({
  focuses,
  onCancel,
  onSave,
  onSaved,
}: {
  focuses: WeeklyFocus[];
  onCancel: () => void;
  onSave: (titles: string[]) => Promise<WeeklyFocus[]>;
  onSaved: () => void;
}) {
  const [candidates, setCandidates] = useState(
    focuses.map(({ id, title }) => ({ id, title })),
  );
  const [selectedFocuses, setSelectedFocuses] = useState(
    focuses.map((focus) => focus.id),
  );
  const [newFocus, setNewFocus] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const nextCustomFocusId = useRef(1);

  const toggleFocus = (id: string) => {
    if (savingRef.current) return;
    setSelectedFocuses((current) => {
      if (current.includes(id)) {
        setMessage(null);
        return current.filter((item) => item !== id);
      }
      if (current.length >= 3) {
        setMessage(maxFocusMessage);
        return current;
      }
      setMessage(null);
      return [...current, id];
    });
  };

  const addFocus = () => {
    if (savingRef.current) return;
    const title = newFocus.trim().replace(/\s+/g, ' ');
    if (!title) return;
    const normalizedTitle = normalizedFocusTitle(title);
    if (candidates.some((focus) => normalizedFocusTitle(focus.title) === normalizedTitle)) {
      setMessage(duplicateFocusMessage);
      return;
    }

    setCandidates((current) => [
      ...current,
      { id: `custom-focus-${nextCustomFocusId.current++}`, title },
    ]);
    setNewFocus('');
    setMessage(null);
  };

  const save = async () => {
    if (savingRef.current) return;
    const titles = candidates
      .filter((focus) => selectedFocuses.includes(focus.id))
      .map((focus) => focus.title);
    savingRef.current = true;
    setSaveError(false);
    setSaving(true);
    try {
      await onSave(titles);
      onSaved();
    } catch {
      setSaveError(true);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View accessibilityLabel="עורך מיקודים לשבוע" style={styles.container}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityLabel="ביטול עריכת מיקודים"
            accessibilityRole="button"
            disabled={saving}
            onPress={onCancel}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>ביטול</Text>
          </Pressable>
          <Text style={styles.flowTitle}>מיקודים לשבוע</Text>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>מה חשוב שיקרה השבוע?</Text>
          <Text style={styles.subtitle}>
            בחר עד שלושה מיקודים. מיקוד הוא כיוון לשבוע, לא משימה ולא שיבוץ ליום.
          </Text>

          <View style={styles.options}>
            {candidates.length === 0 ? (
              <View accessibilityLabel="אין מיקודים שמורים" style={styles.emptyState}>
                <Ionicons color={colors.accent} name="compass-outline" size={28} />
                <Text style={styles.emptyTitle}>עוד לא נשמרו מיקודים לשבוע הזה.</Text>
                <Text style={styles.emptyBody}>אפשר להוסיף מועמד למיקוד, ואז לבחור אותו לשמירה.</Text>
              </View>
            ) : null}

            {candidates.map((focus) => (
              <Pressable
                accessibilityLabel={focus.title}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selectedFocuses.includes(focus.id) }}
                disabled={saving}
                key={focus.id}
                onPress={() => toggleFocus(focus.id)}
              >
                <View style={[
                  styles.selectableRow,
                  selectedFocuses.includes(focus.id) && styles.selectedRow,
                ]}>
                  <View style={[
                    styles.checkbox,
                    selectedFocuses.includes(focus.id) && styles.checked,
                  ]}>
                    {selectedFocuses.includes(focus.id) ? (
                      <Ionicons color={colors.white} name="checkmark" size={14} />
                    ) : null}
                  </View>
                  <Text style={styles.optionTitle}>{focus.title}</Text>
                </View>
              </Pressable>
            ))}

            <View style={styles.newFocusRow}>
              <Pressable
                accessibilityLabel="הוסף מיקוד"
                accessibilityRole="button"
                disabled={saving}
                onPress={addFocus}
                style={styles.addFocusButton}
              >
                <Text style={styles.plus}>+</Text>
              </Pressable>
              <TextInput
                accessibilityLabel="מיקוד חדש"
                editable={!saving}
                onChangeText={(value) => {
                  setNewFocus(value);
                  setMessage(null);
                  setSaveError(false);
                }}
                onSubmitEditing={addFocus}
                placeholder="מיקוד חדש…"
                placeholderTextColor={colors.textFaint}
                returnKeyType="done"
                style={styles.newFocusInput}
                textAlign="right"
                value={newFocus}
              />
            </View>

            {message ? (
              <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>
            ) : null}
            {saveError ? (
              <Text accessibilityLiveRegion="assertive" style={styles.errorText}>
                לא הצלחנו לשמור את המיקודים. הטיוטה נשמרה כאן ואפשר לנסות שוב.
              </Text>
            ) : null}
          </View>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: saving, disabled: saving }}
          disabled={saving}
          onPress={() => void save()}
          style={[styles.saveButton, saving && styles.disabledButton]}
        >
          <Text style={styles.saveText}>{saving ? 'שומר…' : 'שמירת מיקודים'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: spacing.xs },
  topRow: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  cancelButton: { justifyContent: 'center', minHeight: 44, minWidth: 76 },
  cancelText: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.body, textAlign: 'right', writingDirection: 'rtl' },
  flowTitle: { color: colors.text, fontFamily: typography.family.bold, fontSize: typography.size.body, writingDirection: 'rtl' },
  headerSpacer: { minWidth: 76 },
  content: { paddingBottom: spacing.lg },
  heading: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 24, lineHeight: 32, marginTop: 26, textAlign: 'right', writingDirection: 'rtl' },
  subtitle: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: typography.size.body, lineHeight: 23, marginTop: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
  options: { gap: spacing.xs, marginTop: spacing.lg },
  emptyState: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.xs, padding: spacing.lg },
  emptyTitle: { color: colors.text, fontFamily: typography.family.bold, fontSize: typography.size.body, textAlign: 'center', writingDirection: 'rtl' },
  emptyBody: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: typography.size.meta, lineHeight: 20, textAlign: 'center', writingDirection: 'rtl' },
  selectableRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 11, minHeight: 52, padding: 14 },
  selectedRow: { backgroundColor: colors.accentWeak, borderColor: colors.accentWeak },
  checkbox: { alignItems: 'center', borderColor: '#C9C3B5', borderRadius: 7, borderWidth: 1.75, height: 22, justifyContent: 'center', width: 22 },
  checked: { backgroundColor: colors.accent, borderColor: colors.accent },
  optionTitle: { color: colors.text, flex: 1, fontFamily: typography.family.semibold, fontSize: typography.size.button, textAlign: 'right', writingDirection: 'rtl' },
  newFocusRow: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 11, minHeight: 52, paddingHorizontal: 14 },
  addFocusButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 32 },
  plus: { color: colors.accent, fontFamily: typography.family.regular, fontSize: 20 },
  newFocusInput: { color: colors.text, flex: 1, fontFamily: typography.family.regular, fontSize: typography.size.button, writingDirection: 'rtl' },
  message: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: typography.size.meta, textAlign: 'right', writingDirection: 'rtl' },
  errorText: { color: colors.warningText, fontFamily: typography.family.regular, fontSize: typography.size.meta, textAlign: 'right', writingDirection: 'rtl' },
  saveButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 15, height: 52, justifyContent: 'center', marginBottom: spacing.sm },
  disabledButton: { opacity: 0.65 },
  saveText: { color: colors.white, fontFamily: typography.family.bold, fontSize: typography.size.button, writingDirection: 'rtl' },
});
