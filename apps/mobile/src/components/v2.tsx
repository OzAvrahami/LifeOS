import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, TextProps, View, ViewStyle } from 'react-native';
import { radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

export function V2Text({ variant = 'body', muted, style, ...props }: TextProps & { variant?: 'body' | 'title' | 'heading' | 'caption'; muted?: boolean }) {
  const { colors } = useTheme();
  return <Text {...props} style={[{ color: muted ? colors.textMuted : colors.text, fontFamily: variant === 'title' || variant === 'heading' ? typography.family.bold : typography.family.regular, fontSize: { body: 16, title: 30, heading: 21, caption: 13 }[variant], textAlign: 'right', writingDirection: 'rtl' }, style]} />;
}
export function V2Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, borderCurve: 'continuous', padding: spacing.md, gap: spacing.sm }, style]}>{children}</View>;
}
export function V2Button({ title, accessibilityLabel = title, onPress, disabled, busy, secondary = false }: { title: string; accessibilityLabel?: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => ({ minHeight: 50, padding: spacing.sm, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: secondary ? colors.accentWeak : colors.accent, alignItems: 'center', justifyContent: 'center', opacity: disabled || pressed ? 0.6 : 1 })}>
    {busy ? <ActivityIndicator color={secondary ? colors.accent : colors.onAccent} /> : <V2Text style={{ color: secondary ? colors.accent : colors.onAccent, fontFamily: typography.family.bold, textAlign: 'center' }}>{title}</V2Text>}
  </Pressable>;
}
export function V2Brand() {
  const { colors } = useTheme();
  return <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs }}>
    <View style={{ backgroundColor: colors.accent, borderRadius: radius.sm, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-7deg' }] }}><Text style={{ color: colors.onAccent, fontSize: 25, fontFamily: typography.family.extraBold }}>L</Text></View>
    <V2Text variant="heading" style={{ writingDirection: 'ltr' }}>LifeOS</V2Text>
  </View>;
}
export function V2Notice({ title, onRetry, error = false }: { title: string; onRetry?: () => void; error?: boolean }) {
  const { colors } = useTheme();
  return <V2Card style={{ backgroundColor: error ? colors.warningSurface : colors.accentWeak }}>
    <V2Text accessibilityRole={error ? 'alert' : undefined} selectable>{title}</V2Text>
    {onRetry ? <V2Button secondary title="נסה שוב" onPress={onRetry} /> : null}
  </V2Card>;
}
export function V2TaskRow({ task, context, pending, onOpen, onStatus, onFocus, focused }: {
  task: { id: string; title: string; status: string }; context: string; pending?: boolean; onOpen: () => void;
  onStatus: (status: 'open' | 'in_progress' | 'completed') => void; onFocus?: () => void; focused?: boolean;
}) {
  const { colors } = useTheme();
  const completed = task.status === 'completed';
  return <V2Card style={{ padding: spacing.sm }}>
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.xs }}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={`${completed ? 'פתיחה מחדש' : 'סימון כהושלמה'}: ${task.title}`} accessibilityState={{ checked: completed, disabled: !!pending }} disabled={pending} onPress={() => onStatus(completed ? 'open' : 'completed')} style={({ pressed }) => ({ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
        <Ionicons name={completed ? 'checkbox' : 'square-outline'} size={25} color={colors.accent} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`פרטי משימה: ${task.title}`} onPress={onOpen} style={({ pressed }) => ({ flex: 1, minHeight: 44, gap: spacing.xxs, opacity: pressed ? 0.6 : 1 })}>
        <V2Text style={{ fontFamily: typography.family.semibold, textDecorationLine: completed ? 'line-through' : 'none' }}>{task.title}</V2Text>
        <V2Text variant="caption" muted>{context}{task.status === 'in_progress' ? ' · בביצוע' : ''}</V2Text>
      </Pressable>
    </View>
    {!completed ? <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs }}>
      <V2Button secondary disabled={pending} title={task.status === 'in_progress' ? 'עצירה' : 'התחל'} accessibilityLabel={`${task.status === 'in_progress' ? 'עצירת משימה' : 'התחל משימה'}: ${task.title}`} onPress={() => onStatus(task.status === 'in_progress' ? 'open' : 'in_progress')} />
      {onFocus ? <Pressable accessibilityRole="button" accessibilityLabel={`${focused ? 'ביטול מיקוד' : 'בחירה כמיקוד'}: ${task.title}`} onPress={onFocus} disabled={pending} style={{ minHeight: 44, justifyContent: 'center' }}><V2Text variant="caption" muted>{focused ? 'ביטול מיקוד' : 'בחירה כמיקוד'}</V2Text></Pressable> : null}
    </View> : null}
  </V2Card>;
}
