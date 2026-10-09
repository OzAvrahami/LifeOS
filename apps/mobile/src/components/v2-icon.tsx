import { Image } from 'react-native';

// Exact Lucide 1.8.0 geometry extracted from the approved reference. Transparent
// 96px masters retain 4x detail at the largest 24px use, without a new native module.
const sources = {
  sun: require('../../assets/icons/lucide/Sun.png'),
  'calendar-days': require('../../assets/icons/lucide/CalendarDays.png'),
  plus: require('../../assets/icons/lucide/Plus.png'),
  'list-todo': require('../../assets/icons/lucide/ListTodo.png'),
  calendar: require('../../assets/icons/lucide/Calendar.png'),
  sparkles: require('../../assets/icons/lucide/Sparkles.png'),
  check: require('../../assets/icons/lucide/Check.png'),
  user: require('../../assets/icons/lucide/User.png'),
};
export type V2IconName = keyof typeof sources;
export function V2Icon({ name, size = 20, color }: { name: V2IconName; size?: number; color: string }) {
  return <Image accessible={false} importantForAccessibility="no" source={sources[name]} resizeMode="contain"
    style={{ width: size, height: size, tintColor: color, flexShrink: 0 }} />;
}
