import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { lightweightDayChoices, processingInboxItems } from './inbox.fixture';
import { InboxDestination, InboxTask } from './inbox.types';

const initialProcessingIndex = 2;

export function InboxProcessingView({
  initialIndex = initialProcessingIndex,
  items = processingInboxItems,
  onExit,
  onMove,
}: {
  initialIndex?: number;
  items?: InboxTask[];
  onExit: () => void;
  onMove: (task: InboxTask, destination: InboxDestination, day?: string) => Promise<void> | void;
}) {
  const [queue] = useState(items);
  const [index, setIndex] = useState(initialIndex);
  const [choosingDay, setChoosingDay] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const task = queue[index];

  const advance = async (destination?: InboxDestination, day?: string) => {
    if (pending) return;
    setError(false);
    setPending(true);
    try {
      if (destination) await onMove(task, destination, day);
      setChoosingDay(false);
      if (index >= queue.length - 1) {
        onExit();
        return;
      }
      setIndex((current) => current + 1);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  const progress = ((index + 1) / queue.length) * 100;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View accessibilityLabel="מיון מהיר" style={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.title}>מיון מהיר</Text>
          <Pressable accessibilityLabel="סגור מיון מהיר" accessibilityRole="button" onPress={onExit} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.counter}>{index + 1} מתוך {queue.length}</Text>
        <View
          accessibilityLabel={`${index + 1} מתוך ${queue.length}`}
          accessibilityRole="progressbar"
          accessibilityValue={{ max: queue.length, min: 1, now: index + 1 }}
          style={styles.progressTrack}
        >
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.cardArea}>
          <View style={styles.taskCard}>
            <Text style={styles.prompt}>מה צריך לקרות עם זה?</Text>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.metadata}>{task.createdLabel}</Text>
          </View>
        </View>

        {choosingDay ? (
          <View accessibilityLabel="בחירת יום במיון מהיר" style={styles.actions}>
            {lightweightDayChoices.map((day) => (
              <Pressable
                accessibilityRole="button"
                key={day}
                disabled={pending}
                onPress={() => void advance('day', day)}
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>{day}</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" disabled={pending} onPress={() => setChoosingDay(false)} style={styles.inlineAction}>
              <Text style={styles.skipText}>חזרה</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            <View style={styles.destinationRow}>
              <Pressable accessibilityRole="button" disabled={pending} onPress={() => void advance('today')} style={styles.primaryAction}>
                <Text style={styles.primaryActionText}>היום</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={pending} onPress={() => void advance('week')} style={styles.secondaryActionHalf}>
                <Text style={styles.secondaryActionText}>השבוע</Text>
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" disabled={pending} onPress={() => setChoosingDay(true)} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>לבחור יום</Text>
            </Pressable>
            <View style={styles.secondaryRow}>
              <Pressable accessibilityRole="button" disabled={pending} onPress={() => void advance('deleted')} style={styles.inlineAction}>
                <Text style={styles.deleteText}>מחק</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={pending} onPress={() => void advance()} style={styles.inlineAction}>
                <Text style={styles.skipText}>דלג ←</Text>
              </Pressable>
            </View>
          </View>
        )}
        {error ? <Text accessibilityRole="alert" style={styles.error}>לא הצלחנו לעדכן. אפשר לנסות שוב.</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#EEEAE1', flex: 1 },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: spacing.xs },
  topRow: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  title: {
    color: colors.text,
    fontFamily: typography.family.bold,
    fontSize: typography.size.body,
    writingDirection: 'rtl',
  },
  closeButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  closeText: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: 20 },
  counter: {
    color: colors.textSubtle,
    fontFamily: typography.family.regular,
    fontSize: typography.size.meta,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressTrack: {
    backgroundColor: '#DED8CB',
    borderRadius: 2,
    height: 4,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: colors.accent, borderRadius: 2, height: 4 },
  cardArea: { flex: 1, justifyContent: 'center' },
  taskCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  prompt: {
    color: colors.textSubtle,
    fontFamily: typography.family.bold,
    fontSize: typography.size.label,
    letterSpacing: 0.5,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  taskTitle: {
    color: colors.text,
    fontFamily: typography.family.extraBold,
    fontSize: 24,
    lineHeight: 31,
    marginTop: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  metadata: {
    color: colors.textFaint,
    fontFamily: typography.family.regular,
    fontSize: typography.size.label,
    marginTop: spacing.xs,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  actions: { gap: 10, paddingBottom: spacing.sm },
  destinationRow: { flexDirection: 'row-reverse', gap: 10 },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  primaryActionText: {
    color: colors.white,
    fontFamily: typography.family.bold,
    fontSize: typography.size.button,
    writingDirection: 'rtl',
  },
  secondaryActionHalf: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: colors.textSoft,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.button,
    writingDirection: 'rtl',
  },
  secondaryRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.xxs,
  },
  inlineAction: { justifyContent: 'center', minHeight: 44 },
  deleteText: {
    color: '#A8502F',
    fontFamily: typography.family.semibold,
    fontSize: typography.size.body,
    writingDirection: 'rtl',
  },
  skipText: {
    color: colors.textSubtle,
    fontFamily: typography.family.bold,
    fontSize: typography.size.body,
    writingDirection: 'rtl',
  },
  error: { color: '#A8502F', fontFamily: typography.family.semibold, fontSize: typography.size.label, paddingBottom: spacing.xs, textAlign: 'center', writingDirection: 'rtl' },
});
