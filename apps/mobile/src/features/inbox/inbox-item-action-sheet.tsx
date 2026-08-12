import { Ionicons } from '@expo/vector-icons';
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

import { lightweightDayChoices } from './inbox.fixture';
import { InboxTask } from './inbox.types';

type SheetMode = 'actions' | 'choose-day' | 'edit';

export function InboxItemActionSheet({
  confirmation,
  confirmedDestination,
  onChooseDay,
  onClose,
  onDelete,
  onEdit,
  onMoveToToday,
  onMoveToWeek,
  onStay,
  task,
}: {
  confirmation?: string | null;
  confirmedDestination?: 'week';
  onChooseDay: (task: InboxTask, day: string) => void;
  onClose: () => void;
  onDelete: (task: InboxTask) => void;
  onEdit: (task: InboxTask, title: string) => void;
  onMoveToToday: (task: InboxTask) => void;
  onMoveToWeek: (task: InboxTask) => void;
  onStay: (task: InboxTask) => void;
  task: InboxTask;
}) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<SheetMode>('actions');
  const [title, setTitle] = useState(task.title);

  const saveEdit = () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onEdit(task, nextTitle);
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        {confirmation ? (
          <View
            accessibilityLabel="אישור פעולת Inbox"
            style={[styles.confirmation, { top: insets.top + 10 }]}
          >
            <View style={styles.confirmationIcon}>
              <Ionicons color={colors.white} name="checkmark" size={13} />
            </View>
            <Text style={styles.confirmationText}>{confirmation}</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityLabel="סגור פעולות Inbox"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          accessibilityLabel="מה צריך לקרות עם זה"
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        >
          <View style={styles.handle} />
          {mode === 'actions' ? (
            <ActionChoices
              onChooseDay={() => setMode('choose-day')}
              onDelete={() => onDelete(task)}
              onEdit={() => setMode('edit')}
              onMoveToToday={() => onMoveToToday(task)}
              onMoveToWeek={() => onMoveToWeek(task)}
              onStay={() => onStay(task)}
              weekConfirmed={confirmedDestination === 'week'}
              task={task}
            />
          ) : mode === 'choose-day' ? (
            <DayChoices
              onBack={() => setMode('actions')}
              onChoose={(day) => onChooseDay(task, day)}
              task={task}
            />
          ) : (
            <EditTask
              onBack={() => setMode('actions')}
              onChangeTitle={setTitle}
              onSave={saveEdit}
              title={title}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ActionChoices({
  onChooseDay,
  onDelete,
  onEdit,
  onMoveToToday,
  onMoveToWeek,
  onStay,
  task,
  weekConfirmed,
}: {
  onChooseDay: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMoveToToday: () => void;
  onMoveToWeek: () => void;
  onStay: () => void;
  task: InboxTask;
  weekConfirmed: boolean;
}) {
  return (
    <>
      <Text style={styles.eyebrow}>מה צריך לקרות עם זה?</Text>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <View style={styles.primaryActions}>
        <ActionButton label="היום" onPress={onMoveToToday} />
        <ActionButton label="השבוע" onPress={onMoveToWeek} selected={weekConfirmed} />
        <ActionButton label="לבחור יום" onPress={onChooseDay} />
      </View>
      <View style={styles.secondaryActions}>
        <Pressable accessibilityRole="button" onPress={onEdit} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>עריכה</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDelete} style={styles.secondaryButton}>
          <Text style={styles.deleteText}>מחיקה</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onStay} style={styles.stayButton}>
          <Text style={styles.secondaryText}>להשאיר ב־Inbox</Text>
        </Pressable>
      </View>
    </>
  );
}

function ActionButton({
  label,
  onPress,
  selected = false,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.actionButton, selected && styles.actionButtonSelected]}
    >
      <Text style={[styles.actionText, selected && styles.actionTextSelected]}>{label}</Text>
      {selected ? <Ionicons color={colors.white} name="checkmark" size={18} /> : null}
    </Pressable>
  );
}

function DayChoices({
  onBack,
  onChoose,
  task,
}: {
  onBack: () => void;
  onChoose: (day: string) => void;
  task: InboxTask;
}) {
  return (
    <>
      <Text style={styles.eyebrow}>לבחור יום</Text>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <View style={styles.primaryActions}>
        {lightweightDayChoices.map((day) => (
          <Pressable accessibilityRole="button" key={day} onPress={() => onChoose(day)} style={styles.dayButton}>
            <Text style={styles.actionText}>{day}</Text>
            <Ionicons color={colors.textFaint} name="calendar-clear-outline" size={18} />
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.secondaryText}>חזרה</Text>
      </Pressable>
    </>
  );
}

function EditTask({
  onBack,
  onChangeTitle,
  onSave,
  title,
}: {
  onBack: () => void;
  onChangeTitle: (title: string) => void;
  onSave: () => void;
  title: string;
}) {
  return (
    <>
      <Text style={styles.eyebrow}>עריכת כותרת</Text>
      <TextInput
        accessibilityLabel="עריכת כותרת Inbox"
        autoFocus
        onChangeText={onChangeTitle}
        onSubmitEditing={onSave}
        returnKeyType="done"
        style={styles.editInput}
        textAlign="right"
        value={title}
      />
      <Pressable accessibilityRole="button" onPress={onSave} style={styles.saveButton}>
        <Text style={styles.saveText}>שמירה</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.secondaryText}>חזרה</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    backgroundColor: colors.overlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  confirmation: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: radius.md,
    flexDirection: 'row-reverse',
    gap: 10,
    left: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    position: 'absolute',
    right: 22,
    zIndex: 3,
  },
  confirmationIcon: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  confirmationText: {
    color: colors.background,
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.meta,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#DED8CB',
    borderRadius: radius.round,
    height: 5,
    marginBottom: spacing.md,
    width: 38,
  },
  eyebrow: {
    color: colors.textSubtle,
    fontFamily: typography.family.bold,
    fontSize: typography.size.label,
    letterSpacing: 0.5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  taskTitle: {
    color: colors.text,
    fontFamily: typography.family.extraBold,
    fontSize: typography.size.title,
    marginTop: spacing.xs,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  primaryActions: { gap: 9, marginTop: spacing.md },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.completedSurface,
    borderRadius: radius.md,
    height: 50,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  actionButtonSelected: { backgroundColor: colors.accent },
  actionText: {
    color: colors.textSoft,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.button,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionTextSelected: { color: colors.white, fontFamily: typography.family.bold },
  secondaryActions: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: spacing.lg,
    marginTop: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.xxs,
  },
  secondaryButton: { justifyContent: 'center', minHeight: 42 },
  stayButton: { justifyContent: 'center', marginRight: 'auto', minHeight: 42 },
  secondaryText: {
    color: colors.textSubtle,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.body,
    writingDirection: 'rtl',
  },
  deleteText: {
    color: '#A8502F',
    fontFamily: typography.family.semibold,
    fontSize: typography.size.body,
    writingDirection: 'rtl',
  },
  dayButton: {
    alignItems: 'center',
    backgroundColor: colors.completedSurface,
    borderRadius: radius.md,
    flexDirection: 'row-reverse',
    height: 50,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  backButton: { alignSelf: 'flex-start', justifyContent: 'center', marginTop: spacing.xs, minHeight: 42 },
  editInput: {
    backgroundColor: colors.completedSurface,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: typography.family.regular,
    fontSize: typography.size.button,
    marginTop: spacing.md,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    writingDirection: 'rtl',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    height: 50,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveText: {
    color: colors.white,
    fontFamily: typography.family.bold,
    fontSize: typography.size.button,
    writingDirection: 'rtl',
  },
});
