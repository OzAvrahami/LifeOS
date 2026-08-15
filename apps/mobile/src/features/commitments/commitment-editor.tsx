import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { CommitmentDateField, CommitmentTimeField } from './commitment-date-time-fields';
import {
  commitmentLifeAreaLabels,
  commitmentLifeAreas,
  type Commitment,
  type CommitmentLifeArea,
  type CreateCommitmentInput,
} from './commitment.types';

type FieldErrors = { date?: string; general?: string; time?: string; title?: string };

export function CommitmentEditor({
  commitment,
  initialDate,
  onClose,
  onDelete,
  onSave,
  visible,
}: {
  commitment?: Commitment | null;
  initialDate: string;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
  onSave: (input: CreateCommitmentInput) => Promise<void>;
  visible: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(commitment?.title ?? '');
  const [description, setDescription] = useState(commitment?.description ?? '');
  const [date, setDate] = useState(commitment?.date ?? initialDate);
  const [startTime, setStartTime] = useState<string | null>(commitment?.startTime ?? null);
  const [endTime, setEndTime] = useState<string | null>(commitment?.endTime ?? null);
  const [lifeArea, setLifeArea] = useState<CommitmentLifeArea | null>(commitment?.lifeArea ?? null);
  const [detailsOpen, setDetailsOpen] = useState(Boolean(commitment?.description || commitment?.lifeArea));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const save = async () => {
    if (saving) return;
    const nextErrors: FieldErrors = {};
    if (!title.trim()) nextErrors.title = 'צריך להוסיף כותרת.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) nextErrors.date = 'צריך לבחור תאריך.';
    if (!startTime || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      nextErrors.time = 'צריך לבחור שעת התחלה.';
    } else if (endTime && endTime <= startTime) {
      nextErrors.time = 'שעת הסיום צריכה להיות אחרי שעת ההתחלה.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await onSave({
        date,
        description: description.trim() || null,
        endTime,
        lifeArea,
        startTime: startTime!,
        title: title.trim(),
      });
      onClose();
    } catch {
      setErrors({ general: 'לא הצלחנו לשמור. אפשר לנסות שוב.' });
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!commitment || !onDelete || saving) return;
    setSaving(true);
    try {
      await onDelete(commitment.id);
      onClose();
    } catch {
      setConfirmingDelete(false);
      setErrors({ general: 'לא הצלחנו למחוק. אפשר לנסות שוב.' });
      setSaving(false);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <Pressable accessibilityLabel="סגור עורך התחייבות" accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        {confirmingDelete && commitment ? (
          <View accessibilityLabel="אישור מחיקת התחייבות" style={styles.confirmation}>
            <Text style={styles.confirmationTitle}>למחוק את ההתחייבות?</Text>
            <View style={styles.confirmationItem}>
              <View style={[styles.areaDot, { backgroundColor: colors.lifeArea[commitment.lifeArea ?? 'personal'] }]} />
              <Text style={styles.confirmationItemTitle}>{commitment.title}</Text>
              <Text style={styles.confirmationTime}>{commitment.startTime}</Text>
            </View>
            <Text style={styles.confirmationBody}>ההתחייבות תימחק ולא ניתן יהיה לשחזר אותה.</Text>
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => void remove()} style={styles.deleteConfirmButton}>
              <Text style={styles.deleteConfirmText}>מחיקה</Text>
            </Pressable>
            <Pressable accessibilityLabel="ביטול מחיקה" accessibilityRole="button" disabled={saving} onPress={() => setConfirmingDelete(false)} style={styles.cancelDeleteButton}>
              <Text style={styles.cancelDeleteText}>ביטול</Text>
            </Pressable>
          </View>
        ) : (
          <View accessibilityLabel="עורך התחייבות" style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.handle} />
            <View style={styles.headingRow}>
              <Text style={styles.heading}>{commitment ? 'עריכת התחייבות' : 'התחייבות חדשה'}</Text>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>{commitment ? 'סגירה' : 'ביטול'}</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>כותרת</Text>
              <TextInput
                accessibilityLabel="כותרת התחייבות"
                autoFocus={!commitment}
                editable={!saving}
                onChangeText={(value) => { setTitle(value); setErrors((current) => ({ ...current, title: undefined })); }}
                placeholder={commitment ? undefined : 'תור לרופא'}
                placeholderTextColor={colors.textFaint}
                style={[styles.input, errors.title && styles.invalidField]}
                textAlign="right"
                value={title}
              />
              {errors.title ? <Text accessibilityRole="alert" style={styles.error}>{errors.title}</Text> : null}

              <Text style={styles.label}>תאריך</Text>
              <CommitmentDateField onChange={(value) => { setDate(value); setErrors((current) => ({ ...current, date: undefined })); }} value={date} />
              {errors.date ? <Text accessibilityRole="alert" style={styles.error}>{errors.date}</Text> : null}

              <Text style={styles.label}>שעה</Text>
              <View style={styles.timeRow}>
                <CommitmentTimeField accessibilityLabel="שעת התחלה" onChange={(value) => { setStartTime(value); setErrors((current) => ({ ...current, time: undefined })); }} placeholder="--:--" value={startTime} />
                <Text style={styles.until}>עד</Text>
                <CommitmentTimeField accessibilityLabel="שעת סיום" onChange={(value) => { setEndTime(value); setErrors((current) => ({ ...current, time: undefined })); }} optional placeholder="שעת סיום" value={endTime} />
              </View>
              <Text style={styles.hint}>שעת הסיום היא רשות — אפשר להשאיר אירוע נקודתי.</Text>
              {errors.time ? <Text accessibilityRole="alert" style={styles.error}>{errors.time}</Text> : null}

              {!detailsOpen ? (
                <Pressable accessibilityRole="button" onPress={() => setDetailsOpen(true)} style={styles.detailsButton}>
                  <Ionicons color={colors.accent} name="add" size={16} />
                  <Text style={styles.detailsButtonText}>תיאור או תחום בחיים</Text>
                </Pressable>
              ) : (
                <>
                  <Text style={styles.label}>תיאור</Text>
                  <TextInput accessibilityLabel="תיאור התחייבות" multiline onChangeText={setDescription} placeholder="פרטים נוספים (רשות)" placeholderTextColor={colors.textFaint} style={[styles.input, styles.description]} textAlign="right" textAlignVertical="top" value={description} />
                  <Text style={styles.label}>תחום בחיים</Text>
                  <View style={styles.lifeAreas}>
                    {commitmentLifeAreas.map((area) => {
                      const selected = lifeArea === area;
                      return (
                        <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={area} onPress={() => setLifeArea(selected ? null : area)} style={[styles.lifeArea, selected && styles.lifeAreaSelected]}>
                          <View style={[styles.areaDot, { backgroundColor: colors.lifeArea[area] }]} />
                          <Text style={[styles.lifeAreaText, selected && styles.lifeAreaTextSelected]}>{commitmentLifeAreaLabels[area]}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {errors.general ? <Text accessibilityRole="alert" style={styles.error}>{errors.general}</Text> : null}
              <Pressable accessibilityLabel="שמירת התחייבות" accessibilityRole="button" accessibilityState={{ busy: saving }} disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.disabled]}>
                <Text style={styles.saveText}>{saving ? 'שומר…' : commitment ? 'שמירת שינויים' : 'שמירה'}</Text>
              </Pressable>
              {commitment && onDelete ? (
                <Pressable accessibilityRole="button" disabled={saving} onPress={() => setConfirmingDelete(true)} style={styles.deleteButton}>
                  <Ionicons color={colors.warningText} name="trash-outline" size={17} />
                  <Text style={styles.deleteText}>מחיקת ההתחייבות</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: colors.overlay, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingHorizontal: 22, paddingTop: 14 },
  handle: { alignSelf: 'center', backgroundColor: '#DED8CB', borderRadius: radius.round, height: 5, width: 38 },
  headingRow: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: spacing.md },
  heading: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 19, writingDirection: 'rtl' },
  closeButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 4 },
  closeText: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.body, writingDirection: 'rtl' },
  form: { paddingBottom: spacing.xs },
  label: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.label, marginBottom: 7, marginTop: spacing.md, textAlign: 'right', writingDirection: 'rtl' },
  input: { backgroundColor: colors.completedSurface, borderColor: 'transparent', borderRadius: radius.md, borderWidth: 1.5, color: colors.textSoft, fontFamily: typography.family.regular, fontSize: typography.size.button, minHeight: 52, paddingHorizontal: 16, writingDirection: 'rtl' },
  invalidField: { backgroundColor: '#F7ECE4', borderColor: '#E3B7A4' },
  description: { minHeight: 76, paddingTop: 13 },
  timeRow: { alignItems: 'flex-start', flexDirection: 'row-reverse', gap: spacing.sm },
  until: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: typography.size.meta, lineHeight: 50, writingDirection: 'rtl' },
  hint: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: 12.5, marginTop: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
  error: { color: colors.warningText, fontFamily: typography.family.semibold, fontSize: typography.size.label, marginTop: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
  detailsButton: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row-reverse', gap: 6, minHeight: 40, marginTop: spacing.sm },
  detailsButtonText: { color: colors.accent, fontFamily: typography.family.bold, fontSize: typography.size.meta, writingDirection: 'rtl' },
  lifeAreas: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs },
  lifeArea: { alignItems: 'center', backgroundColor: colors.completedSurface, borderColor: 'transparent', borderRadius: radius.round, borderWidth: 1.5, flexDirection: 'row-reverse', gap: 6, minHeight: 38, paddingHorizontal: 13 },
  lifeAreaSelected: { backgroundColor: '#EAF0F3', borderColor: colors.accent },
  lifeAreaText: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.meta, writingDirection: 'rtl' },
  lifeAreaTextSelected: { color: colors.accentText, fontFamily: typography.family.bold },
  areaDot: { borderRadius: 4, height: 8, width: 8 },
  saveButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 15, height: 52, justifyContent: 'center', marginTop: spacing.lg },
  disabled: { opacity: 0.55 },
  saveText: { color: colors.white, fontFamily: typography.family.extraBold, fontSize: typography.size.button, writingDirection: 'rtl' },
  deleteButton: { alignItems: 'center', flexDirection: 'row-reverse', gap: 7, height: 48, justifyContent: 'center', marginTop: 6 },
  deleteText: { color: colors.warningText, fontFamily: typography.family.bold, fontSize: typography.size.body, writingDirection: 'rtl' },
  confirmation: { alignSelf: 'center', backgroundColor: colors.surface, borderRadius: 24, marginHorizontal: 22, padding: 22, width: '88%' },
  confirmationTitle: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 21, textAlign: 'center', writingDirection: 'rtl' },
  confirmationItem: { alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, flexDirection: 'row-reverse', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.md, minHeight: 54, paddingHorizontal: spacing.md },
  confirmationItemTitle: { color: colors.text, flexShrink: 1, fontFamily: typography.family.bold, fontSize: typography.size.button, writingDirection: 'rtl' },
  confirmationTime: { color: colors.textSoft, fontFamily: typography.family.bold, fontSize: typography.size.body, writingDirection: 'ltr' },
  confirmationBody: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: typography.size.label, lineHeight: 20, marginTop: spacing.sm, textAlign: 'center', writingDirection: 'rtl' },
  deleteConfirmButton: { alignItems: 'center', backgroundColor: colors.warningBadge, borderRadius: radius.md, height: 50, justifyContent: 'center', marginTop: spacing.md },
  deleteConfirmText: { color: colors.warningText, fontFamily: typography.family.extraBold, fontSize: typography.size.button, writingDirection: 'rtl' },
  cancelDeleteButton: { alignItems: 'center', backgroundColor: colors.completedSurface, borderRadius: radius.md, height: 50, justifyContent: 'center', marginTop: spacing.xs },
  cancelDeleteText: { color: colors.textSoft, fontFamily: typography.family.bold, fontSize: typography.size.button, writingDirection: 'rtl' },
});
