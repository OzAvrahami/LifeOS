import { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, TextProps, View, ViewStyle } from 'react-native';
import { spacing, v2Layout, v2Typography } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';
import { V2Icon, type V2IconName } from './v2-icon';

export function V2Text({ variant = 'body', muted, style, ...props }: TextProps & { variant?: 'body' | 'title' | 'heading' | 'caption'; muted?: boolean }) {
  const { colors } = useTheme();
  return <Text {...props} style={[{ color: muted ? colors.textMuted : colors.text, fontFamily: variant === 'title' ? v2Typography.family.extraBold : variant === 'heading' ? v2Typography.family.bold : v2Typography.family.regular, ...v2Typography[variant], textAlign: 'right', writingDirection: 'rtl', includeFontPadding: false }, style]} />;
}
export function V2Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 17, padding: 15, gap: spacing.sm }, style]}>{children}</View>;
}
export function V2Button({ title, accessibilityLabel = title, onPress, disabled, busy, secondary = false, icon, style }: { title: string; accessibilityLabel?: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean; icon?: V2IconName; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [{ minHeight: secondary ? 44 : v2Layout.action.height, paddingVertical: secondary ? 10 : v2Layout.action.vertical, paddingHorizontal: secondary ? 13 : v2Layout.action.horizontal, borderRadius: secondary ? 13 : v2Layout.action.radius, borderWidth: secondary ? 1 : 0, borderColor: colors.border, backgroundColor: secondary ? colors.surface : colors.accent, flexDirection: 'row-reverse', gap: 8, alignItems: 'center', justifyContent: 'center', opacity: disabled || pressed ? 0.6 : 1 }, style]}>
    {busy ? <ActivityIndicator color={secondary ? colors.text : colors.onAccent} /> : <>
      <V2Text style={{ color: secondary ? colors.text : colors.onAccent, fontFamily: secondary ? v2Typography.family.regular : v2Typography.family.bold, fontSize: 14, lineHeight: 21.7, textAlign: 'center', flexShrink: 1 }}>{title}</V2Text>
      {icon ? <V2Icon name={icon} size={v2Layout.action.icon} color={secondary ? colors.text : colors.onAccent} /> : null}
    </>}
  </Pressable>;
}
export function V2Brand() {
  const { colors } = useTheme();
  return <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs }}>
    <View style={{ backgroundColor: colors.accent, borderRadius: v2Layout.chrome.symbolRadius, width: v2Layout.chrome.symbol, height: v2Layout.chrome.symbol, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-7deg' }] }}><Text style={{ color: colors.onAccent, fontSize: 21, lineHeight: 28, fontFamily: 'Arial', fontWeight: '800', includeFontPadding: false }}>L</Text></View>
    <V2Text style={{ fontFamily: v2Typography.family.extraBold, fontSize: 21, lineHeight: 32.55, letterSpacing: -1, writingDirection: 'ltr' }}>LifeOS</V2Text>
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
  return <V2Card style={{ padding: v2Layout.task.padding, borderRadius: v2Layout.task.radius, backgroundColor: completed ? 'transparent' : colors.surface }}>
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: v2Layout.task.gap }}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={`${completed ? 'פתיחה מחדש' : 'סימון כהושלמה'}: ${task.title}`} accessibilityState={{ checked: completed, disabled: !!pending }} disabled={pending} onPress={() => onStatus(completed ? 'open' : 'completed')} style={({ pressed }) => ({ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
        <View style={{ width: 21, height: 21, borderRadius: 7, borderWidth: 1.5, borderColor: completed ? colors.accent : colors.border, backgroundColor: completed ? colors.accent : colors.background, alignItems: 'center', justifyContent: 'center' }}>{completed ? <V2Icon name="check" size={14} color={colors.onAccent} /> : null}</View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`פרטי משימה: ${task.title}`} onPress={onOpen} style={({ pressed }) => ({ flex: 1, minHeight: 44, gap: spacing.xxs, opacity: pressed ? 0.6 : 1 })}>
        <V2Text style={{ ...v2Typography.taskTitle, fontFamily: v2Typography.family.semibold, color: completed ? colors.textMuted : colors.text, textDecorationLine: completed ? 'line-through' : 'none' }}>{task.title}</V2Text>
        <V2Text variant="caption" muted style={v2Typography.reason}>{context}{task.status === 'in_progress' ? ' · בביצוע' : ''}</V2Text>
      </Pressable>
    </View>
    {!completed ? <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs }}>
      <V2Button secondary disabled={pending} title={task.status === 'in_progress' ? 'עצירה' : 'התחל'} accessibilityLabel={`${task.status === 'in_progress' ? 'עצירת משימה' : 'התחל משימה'}: ${task.title}`} onPress={() => onStatus(task.status === 'in_progress' ? 'open' : 'in_progress')} />
      {onFocus ? <Pressable accessibilityRole="button" accessibilityLabel={`${focused ? 'ביטול מיקוד' : 'בחירה כמיקוד'}: ${task.title}`} onPress={onFocus} disabled={pending} style={{ minHeight: 44, justifyContent: 'center' }}><V2Text variant="caption" muted>{focused ? 'ביטול מיקוד' : 'בחירה כמיקוד'}</V2Text></Pressable> : null}
    </View> : null}
  </V2Card>;
}
