import { Href, useRouter } from 'expo-router';

import { SettingsScreen } from '@/features/settings/settings-screen';

export default function SettingsRoute() {
  const router = useRouter();
  return (
    <SettingsScreen
      onBack={() => router.canGoBack() ? router.back() : router.replace('/')}
      onAccount={() => router.navigate('/account')}
      onCalendar={provider => router.navigate(`/settings/calendar-connection?provider=${provider}` as Href)}
      onAppearance={() => router.navigate('/settings/appearance' as Href)}
      onPreferences={() => router.navigate('/settings/preferences' as Href)}
      onNotifications={() => router.navigate('/settings/notifications' as Href)}
    />
  );
}
