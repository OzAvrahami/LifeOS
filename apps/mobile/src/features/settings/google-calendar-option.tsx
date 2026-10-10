import { Platform, Pressable, View } from 'react-native';
import { V2Text } from '@/components/v2';
import { V2Icon } from '@/components/v2-icon';
import { useTheme } from '@/theme/theme-provider';
import { v2Typography } from '@/theme/tokens';

export function GoogleCalendarOption({ label, description, value, disabled, onChange }: {
  label: string; description: string; value: boolean; disabled: boolean; onChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityHint={description}
    accessibilityState={{ checked: value, disabled }} aria-checked={value} aria-disabled={disabled} disabled={disabled}
    {...(Platform.OS === 'web' ? { onKeyDown: (event: { key: string; repeat: boolean; preventDefault: () => void }) => {
      if (event.key === ' ' || event.key === 'Spacebar') { event.preventDefault(); if (!disabled && !event.repeat) onChange(!value); }
    } } : {})}
    onPress={() => onChange(!value)} style={({ pressed }) => ({ flexDirection: 'row-reverse', alignItems: 'center', gap: 11,
      padding: 16, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
      marginTop: 10, minHeight: 56, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
    <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: value ? colors.accent : colors.textMuted,
      backgroundColor: value ? colors.accent : colors.surface, alignItems: 'center', justifyContent: 'center' }}>
      {value ? <V2Icon name="check" size={14} color={colors.onAccent} /> : null}
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <V2Text style={{ fontSize: 14, fontFamily: v2Typography.family.semibold }}>{label}</V2Text>
      <V2Text muted style={{ fontSize: 11 }}>{description}</V2Text>
    </View>
  </Pressable>;
}
