import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { V2Text } from '@/components/v2';
import { V2Icon, type V2IconName } from '@/components/v2-icon';
import { useTheme } from '@/theme/theme-provider';
import { v2Typography } from '@/theme/tokens';

export function V2SettingsPage({ title, eyebrow, description, onBack, children, footer }: PropsWithChildren<{
  title: string; eyebrow?: string; description?: string; onBack: () => void; footer?: ReactNode;
}>) {
  const { colors } = useTheme(); const { width } = useWindowDimensions();
  return <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: width <= 375 ? 14 : 19, paddingTop: 16, paddingBottom: 22, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="חזרה" onPress={onBack}
        style={{ alignSelf: 'flex-end', flexDirection: 'row-reverse', alignItems: 'center', gap: 9, minHeight: 44, marginBottom: 25 }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}><V2Icon name="arrow-right" size={17} color={colors.text} /></View>
        <V2Text style={{ fontSize: 13, fontFamily: v2Typography.family.semibold }}>חזרה</V2Text>
      </Pressable>
      {eyebrow ? <V2Text muted style={{ fontSize: 12, lineHeight: 18.6, marginBottom: 5 }}>{eyebrow}</V2Text> : null}
      <V2Text variant="title" accessibilityRole="header" style={[{ marginBottom: 8 }, width <= 375 && v2Typography.narrowTitle]}>{title}</V2Text>
      {description ? <V2Text variant="caption" muted>{description}</V2Text> : null}
      {children}
      {footer ? <View style={{ marginTop: 26 }}>{footer}</View> : null}
    </ScrollView>
  </SafeAreaView>;
}
export function V2SettingsHeading({ children }: PropsWithChildren) {
  return <V2Text variant="heading" style={{ marginTop: 18, marginBottom: 11 }}>{children}</V2Text>;
}
export function V2SettingsGroup({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 17, overflow: 'hidden' }}>{children}</View>;
}
export function V2SettingsRow({ title, description, icon, onPress, trailing, divider, ltr = false }: {
  title: string; description?: string; icon: V2IconName | 'google'; onPress?: () => void; trailing?: ReactNode; divider?: boolean; ltr?: boolean;
}) {
  const { colors } = useTheme(); const { width } = useWindowDimensions(); const narrow = width <= 375;
  const content = <>
    <View style={{ width: narrow ? 30 : 36, height: narrow ? 30 : 36, borderRadius: 11, backgroundColor: colors.accentWeak, alignItems: 'center', justifyContent: 'center' }}>
      {icon === 'google' ? <V2Text style={{ fontFamily: 'Arial', fontWeight: '700', fontSize: 22, color: colors.accent }}>G</V2Text> : <V2Icon name={icon} size={20} color={colors.accent} />}
    </View>
    <View style={{ minWidth: 0, flex: 1 }}>
      <V2Text style={{ fontFamily: v2Typography.family.semibold, fontSize: 14, lineHeight: 21.7, ...(ltr ? { writingDirection: 'ltr' } : {}) }}>{title}</V2Text>
      {description ? <V2Text muted style={{ fontSize: 11, lineHeight: 17.6, marginTop: 3 }}>{description}</V2Text> : null}
    </View>
    {trailing ?? (onPress ? <V2Icon name="chevron-left" size={16} color={colors.textMuted} /> : null)}
  </>;
  const style = { flexDirection: 'row-reverse' as const, alignItems: 'center' as const, minHeight: 76, padding: narrow ? 12 : 14,
    gap: narrow ? 8 : 12, borderTopWidth: divider ? 1 : 0, borderColor: colors.border };
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.6 : 1 }]}>{content}</Pressable> : <View style={style}>{content}</View>;
}

// Reference geometry, one accessible switch target (including its label), and
// a >=44pt hit area. No duplicate nested switch or text-only toggle affordance.
export function V2SettingsSwitch({ label, description, value, disabled, onChange, divider }: {
  label: string; description?: string; value: boolean; disabled?: boolean; onChange: (value: boolean) => void; divider?: boolean;
}) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityHint={description}
    {...(Platform.OS === 'web' ? { onKeyDown: (event: { key: string; repeat: boolean; preventDefault: () => void }) => {
      // RN Web handles Enter, but its PressResponder handles Space only for role=button.
      if (event.key === ' ' || event.key === 'Spacebar') { event.preventDefault(); if (!disabled && !event.repeat) onChange(!value); }
    } } : {})}
    aria-checked={value} aria-disabled={!!disabled}
    accessibilityState={{ checked: value, disabled: !!disabled }} disabled={disabled} onPress={() => onChange(!value)}
    style={({ pressed }) => ({ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 15, minHeight: 59,
      borderTopWidth: divider ? 1 : 0, borderColor: colors.border, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
    <View style={{ flex: 1, minWidth: 0 }}>
      <V2Text style={{ fontFamily: v2Typography.family.semibold, fontSize: 14, lineHeight: 21.7 }}>{label}</V2Text>
      {description ? <V2Text muted style={{ fontSize: 11, lineHeight: 17.6, marginTop: 3 }}>{description}</V2Text> : null}
    </View>
    <View style={{ pointerEvents: 'none', width: 42, height: 26, borderRadius: 20, backgroundColor: value ? colors.accent : colors.border }}>
      <View style={{ position: 'absolute', top: 3, left: value ? 19 : 3, width: 20, height: 20, borderRadius: 10, backgroundColor: value ? colors.onAccent : colors.surface }} />
    </View>
  </Pressable>;
}
