import { Href, useRouter } from 'expo-router';

import { MoreScreen } from '@/features/settings/more-screen';

export default function MoreRoute() {
  const router = useRouter();
  return (
    <MoreScreen
      onNavigateAccount={() => router.navigate('/account' as Href)}
      onNavigateInbox={() => router.navigate('/inbox' as Href)}
      onNavigateSettings={() => router.navigate('/settings' as Href)}
      onNavigateToday={() => router.replace('/')}
      onNavigateWeek={() => router.navigate('/week' as Href)}
    />
  );
}
