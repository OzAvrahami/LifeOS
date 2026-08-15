import { Href, useRouter } from 'expo-router';

import { SettingsScreen } from '@/features/settings/settings-screen';

export default function SettingsRoute() {
  const router = useRouter();
  return (
    <SettingsScreen
      onBack={() => router.back()}
      onDailyCapacity={() => router.navigate('/settings/daily-capacity' as Href)}
      onTimezone={() => router.navigate('/settings/timezone' as Href)}
      onWeekStart={() => router.navigate('/settings/week-start' as Href)}
    />
  );
}
