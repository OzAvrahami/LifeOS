import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { InboxTask } from './inbox.types';

export function InboxHeader({
  busy = false,
  count,
  onProcess,
}: {
  busy?: boolean;
  count?: number;
  onProcess: () => void;
}) {
  return (
    <View>
      <Text accessibilityRole="header" style={styles.headerTitle}>Inbox</Text>
      {typeof count === 'number' ? (
        <View style={[styles.contextRow, busy && styles.busyContextRow]}>
          <Text style={[styles.contextText, busy && styles.busyContextText]}>
            {count === 1 ? 'דבר אחד מחכה' : `${count} דברים מחכים`} ל{busy ? 'מיון' : 'החלטה'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onProcess}
            style={busy ? styles.busyProcessButton : styles.processButton}
          >
            <Text style={busy ? styles.busyProcessText : styles.processText}>מיין כמה עכשיו</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function InboxCapture({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState('');

  const submit = () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onAdd(nextTitle);
    setTitle('');
  };

  return (
    <View accessibilityLabel="הוספה מהירה ל-Inbox" style={styles.capture}>
      <Pressable accessibilityLabel="הוסף ל-Inbox" accessibilityRole="button" onPress={submit}>
        <View style={styles.captureIcon}>
          <Ionicons color={colors.accent} name="add" size={18} />
        </View>
      </Pressable>
      <TextInput
        accessibilityLabel="מה צריך לזכור"
        enterKeyHint="done"
        onChangeText={setTitle}
        onSubmitEditing={submit}
        placeholder="מה צריך לזכור?"
        placeholderTextColor={colors.textFaint}
        returnKeyType="done"
        style={styles.captureInput}
        textAlign="right"
        value={title}
      />
    </View>
  );
}

export function InboxItemList({
  items,
  onOpen,
}: {
  items: InboxTask[];
  onOpen: (task: InboxTask) => void;
}) {
  return (
    <View accessibilityLabel="דברים שמחכים להחלטה" style={styles.itemList}>
      {items.map((item, index) => (
        <Pressable
          accessibilityLabel={`פריט Inbox: ${item.title}`}
          accessibilityRole="button"
          key={item.id}
          onPress={() => onOpen(item)}
          style={[styles.itemRow, index < items.length - 1 && styles.itemDivider]}
        >
          <View style={styles.itemBody}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMetadata}>{item.createdLabel}</Text>
          </View>
          <Pressable
            accessibilityLabel={`פתח פעולות עבור ${item.title}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onOpen(item)}
            style={styles.disclosure}
          >
            <Ionicons color="#B8B2A6" name="ellipsis-vertical" size={20} />
          </Pressable>
        </Pressable>
      ))}
    </View>
  );
}

export function InboxBusyList({
  items,
  onOpen,
}: {
  items: InboxTask[];
  onOpen: (task: InboxTask) => void;
}) {
  return (
    <View accessibilityLabel="דברים שמחכים למיון" style={styles.busyList}>
      {items.map((item, index) => (
        <Pressable
          accessibilityLabel={`פריט Inbox: ${item.title}`}
          accessibilityRole="button"
          key={item.id}
          onPress={() => onOpen(item)}
          style={[styles.busyRow, index < items.length - 1 && styles.itemDivider]}
        >
          <Text style={styles.busyTitle}>{item.title}</Text>
          <Text style={styles.busyMetadata}>{item.compactCreatedLabel}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function InboxEmptyState() {
  return (
    <View accessibilityLabel="Inbox ריק" style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons color={colors.accent} name="checkmark" size={42} />
      </View>
      <Text style={styles.emptyTitle}>הכול מסודר</Text>
      <Text style={styles.emptyMessage}>
        אין כרגע דברים שמחכים להחלטה. מה שעולה לראש — פשוט תוסיף.
      </Text>
    </View>
  );
}

export function InboxConfirmation({ message }: { message: string }) {
  return (
    <View accessibilityLabel="אישור פעולת Inbox" pointerEvents="none" style={styles.toast}>
      <View style={styles.toastIcon}>
        <Ionicons color={colors.white} name="checkmark" size={13} />
      </View>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: colors.text,
    fontFamily: typography.family.extraBold,
    fontSize: typography.size.display,
    lineHeight: 36,
    textAlign: 'right',
    writingDirection: 'ltr',
  },
  contextRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginTop: 2,
  },
  busyContextRow: { marginTop: 6 },
  contextText: {
    color: colors.textSubtle,
    fontFamily: typography.family.regular,
    fontSize: typography.size.meta,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  busyContextText: { color: colors.textMuted },
  processButton: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 2 },
  processText: {
    color: colors.accent,
    fontFamily: typography.family.bold,
    fontSize: typography.size.label,
    writingDirection: 'rtl',
  },
  busyProcessButton: {
    backgroundColor: colors.accent,
    borderRadius: 11,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 14,
  },
  busyProcessText: {
    color: colors.white,
    fontFamily: typography.family.bold,
    fontSize: typography.size.label,
    writingDirection: 'rtl',
  },
  capture: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: spacing.md,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  captureIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentWeak,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  captureInput: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.button,
    minHeight: 52,
    paddingVertical: 0,
    writingDirection: 'rtl',
  },
  itemList: { marginTop: 18 },
  itemRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    minHeight: 70,
    paddingHorizontal: spacing.xxs,
    paddingVertical: 15,
  },
  itemDivider: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
  itemBody: { flex: 1 },
  itemTitle: {
    color: colors.text,
    fontFamily: typography.family.medium,
    fontSize: typography.size.button,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  itemMetadata: {
    color: colors.textFaint,
    fontFamily: typography.family.regular,
    fontSize: 12,
    marginTop: 3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  disclosure: {
    alignItems: 'center',
    borderRadius: spacing.xs,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  busyList: { marginTop: spacing.sm },
  busyRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.sm,
  },
  busyTitle: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.body,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  busyMetadata: {
    color: colors.textFaint,
    fontFamily: typography.family.regular,
    fontSize: 12,
    writingDirection: 'rtl',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 440,
    paddingBottom: 40,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentWeak,
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.family.extraBold,
    fontSize: 23,
    marginTop: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptyMessage: {
    color: colors.textMuted,
    fontFamily: typography.family.regular,
    fontSize: typography.size.button,
    lineHeight: 24,
    marginTop: 2,
    maxWidth: 270,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  toast: {
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
    top: 10,
    zIndex: 3,
  },
  toastIcon: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  toastText: {
    color: colors.background,
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.meta,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
