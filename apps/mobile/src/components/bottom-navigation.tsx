import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/theme/theme-provider';
import { v2Layout, v2Typography } from '@/theme/tokens';
import { V2Icon, type V2IconName } from './v2-icon';

const navigationItems: { id: 'today' | 'week' | 'capture' | 'inbox' | 'calendar'; label: string; icon: V2IconName }[] = [
  { id: 'today', label: 'היום', icon: 'sun' },
  { id: 'week', label: 'השבוע', icon: 'calendar-days' },
  { id: 'capture', label: 'הוספה מהירה', icon: 'plus' },
  { id: 'inbox', label: 'משימות', icon: 'list-todo' },
  { id: 'calendar', label: 'יומן', icon: 'calendar' },
];

export function BottomNavigation({ onNavigateInbox, onNavigateToday, onNavigateWeek, onQuickCapture, selected }: {
  onNavigateInbox?: () => void; onNavigateMore?: () => void; onNavigateToday?: () => void;
  onNavigateWeek?: () => void; onQuickCapture?: () => void;
  selected: 'today' | 'week' | 'inbox' | 'more' | 'calendar';
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const nav = v2Layout.nav;
  const actions = {
    today: onNavigateToday ?? (() => router.navigate('/')),
    week: onNavigateWeek ?? (() => router.navigate('/week')),
    inbox: onNavigateInbox ?? (() => router.navigate('/inbox')),
    calendar: () => router.navigate('/calendar'),
    capture: onQuickCapture,
  };
  return <View accessibilityLabel="ניווט ראשי" style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1,
    paddingTop: nav.top, paddingHorizontal: nav.horizontal, paddingBottom: Math.max(nav.bottom, insets.bottom),
    flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'center', gap: nav.gap }}>
    {navigationItems.map(item => {
      const active = item.id === selected; const add = item.id === 'capture';
      return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label}
        accessibilityState={add ? undefined : { selected: active }} onPress={actions[item.id]} hitSlop={add ? 1 : undefined}
        style={({ pressed }) => ({ alignItems: 'center', justifyContent: 'center', gap: nav.labelGap,
          minWidth: add ? nav.addSize : nav.itemWidth, minHeight: add ? nav.addSize : nav.itemHeight,
          borderRadius: add ? nav.addRadius : 0, backgroundColor: add ? colors.accent : 'transparent', opacity: pressed ? 0.6 : 1 })}>
        {active ? <View style={{ position: 'absolute', top: -10, width: nav.indicatorWidth, height: nav.indicatorHeight, borderRadius: 3, backgroundColor: colors.accent }} /> : null}
        <V2Icon name={item.icon} size={nav.icon} color={add ? colors.onAccent : active ? colors.accent : colors.textMuted} />
        {!add ? <Text style={{ color: active ? colors.accent : colors.textMuted, fontSize: nav.label, lineHeight: 15.5,
          fontFamily: active ? v2Typography.family.bold : v2Typography.family.regular, includeFontPadding: false, writingDirection: 'rtl' }}>{item.label}</Text> : null}
      </Pressable>;
    })}
  </View>;
}
