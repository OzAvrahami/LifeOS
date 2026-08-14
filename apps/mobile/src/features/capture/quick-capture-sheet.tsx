import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

export type CaptureDestination = 'inbox' | 'today' | 'week' | 'day';

const destinations: { id: CaptureDestination; label: string; ltr?: boolean }[] = [
  { id: 'inbox', label: 'Inbox', ltr: true },
  { id: 'today', label: 'היום' },
  { id: 'week', label: 'השבוע' },
  { id: 'day', label: 'בחר יום' },
];

export function QuickCaptureSheet({
  onClose,
  onSave,
  visible,
}: {
  onClose: () => void;
  onSave?: (title: string, destination: CaptureDestination) => Promise<void> | void;
  visible: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState<CaptureDestination>('inbox');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setTitle('');
    setDestination('inbox');
    setError(false);
    setSaving(false);
    onClose();
  };

  const save = async () => {
    const nextTitle = title.trim();
    if (!nextTitle || saving) return;
    setError(false);
    setSaving(true);
    try {
      await onSave?.(nextTitle, destination);
      close();
    } catch {
      setError(true);
      setSaving(false);
    }
  };

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
          <View style={styles.handle} />
          <Text style={styles.heading}>מה צריך לזכור?</Text>
          <TextInput
            accessibilityLabel="כותרת"
            autoFocus
            editable={!saving}
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

          {error ? <Text accessibilityRole="alert" style={styles.error}>לא הצלחנו לשמור. אפשר לנסות שוב.</Text> : null}

          <Text style={styles.destinationLabel}>לאן זה הולך?</Text>
          <View style={styles.destinations}>
            {destinations.map((item) => {
              const selected = destination === item.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={item.id}
                  onPress={() => setDestination(item.id)}
                  style={[styles.destination, selected && styles.destinationSelected]}
                >
                  <Text
                    style={[
                      styles.destinationText,
                      selected && styles.destinationTextSelected,
                      item.ltr && styles.ltr,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: saving, disabled: !title.trim() || saving }}
            disabled={!title.trim() || saving}
            onPress={() => void save()}
            style={[styles.saveButton, (!title.trim() || saving) && styles.saveButtonDisabled]}
          >
            <Text style={styles.saveText}>{saving ? 'שומר…' : 'שמירה'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: colors.overlay, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '82%', paddingHorizontal: 22, paddingTop: 14 },
  handle: { alignSelf: 'center', backgroundColor: '#DED8CB', borderRadius: radius.round, height: 5, width: 38 },
  heading: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 19, marginTop: spacing.lg, textAlign: 'right', writingDirection: 'rtl' },
  input: { backgroundColor: colors.completedSurface, borderRadius: 15, color: colors.text, fontFamily: typography.family.regular, fontSize: 17, marginTop: spacing.sm, minHeight: 54, paddingHorizontal: spacing.md, paddingVertical: 15, writingDirection: 'rtl' },
  error: { color: colors.warningText, fontFamily: typography.family.semibold, fontSize: typography.size.label, marginTop: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
  destinationLabel: { color: colors.textSubtle, fontFamily: typography.family.bold, fontSize: typography.size.label, marginTop: spacing.lg, textAlign: 'right', writingDirection: 'rtl' },
  destinations: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  destination: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.round, minHeight: 40, justifyContent: 'center', paddingHorizontal: 15 },
  destinationSelected: { backgroundColor: colors.accent },
  destinationText: { color: colors.textMuted, fontFamily: typography.family.bold, fontSize: typography.size.meta, writingDirection: 'rtl' },
  destinationTextSelected: { color: colors.white },
  ltr: { writingDirection: 'ltr' },
  saveButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, height: 52, justifyContent: 'center', marginTop: spacing.lg },
  saveButtonDisabled: { opacity: 0.48 },
  saveText: { color: colors.white, fontFamily: typography.family.bold, fontSize: typography.size.button },
});
