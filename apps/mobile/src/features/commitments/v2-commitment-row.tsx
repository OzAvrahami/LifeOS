import { Pressable, View } from 'react-native';
import { V2Text } from '@/components/v2';
import { V2Icon } from '@/components/v2-icon';
import { useTheme } from '@/theme/theme-provider';
import { v2Typography } from '@/theme/tokens';
import type { Commitment } from './commitment.types';
import { commitmentSourceLabel, commitmentTimeLabel } from './commitment-presentation';

// Approved prototype event row, shared by real Calendar/Today/selected-day records.
export function V2CommitmentRow({ item, onPress, accessibilityLabel = `פרטי אירוע: ${item.title}` }: {
  item: Commitment; onPress: () => void; accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}
    style={({ pressed }) => ({ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 13, marginTop: 9,
      borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 })}>
    <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 6, backgroundColor: colors.gold }} />
    <View style={{ flex: 1, minWidth: 0 }}>
      <V2Text style={{ fontSize: 13, lineHeight: 20.15, fontFamily: v2Typography.family.semibold }}>{item.title}</V2Text>
      <V2Text muted style={{ fontSize: 11, lineHeight: 17.05 }}>{commitmentTimeLabel(item)} · {commitmentSourceLabel(item)}</V2Text>
      {item.location ? <V2Text muted variant="caption">{item.location}</V2Text> : null}
    </View>
    {item.calendarSource ? <V2Text muted style={{ fontFamily: 'Arial', fontWeight: '700', fontSize: 17, writingDirection: 'ltr' }}>G</V2Text>
      : <V2Icon name="calendar" size={17} color={colors.textMuted} />}
  </Pressable>;
}
