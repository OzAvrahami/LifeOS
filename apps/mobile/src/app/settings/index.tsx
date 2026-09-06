import { Href, useRouter } from 'expo-router';

import { SettingsScreen } from '@/features/settings/settings-screen';

export default function SettingsRoute() {
  const router = useRouter();
  return (
    <SettingsScreen
      onBack={() => router.back()}
      onDayWindow={() => router.navigate('/settings/day-window' as Href)}
      onTimezone={() => router.navigate('/settings/timezone' as Href)}
      onWeekStart={() => router.navigate('/settings/week-start' as Href)}
    />
  );
}
