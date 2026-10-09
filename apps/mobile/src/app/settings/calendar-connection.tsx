import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarConnectionScreen } from '@/features/settings/calendar-connection-screen';
export default function CalendarConnectionRoute() {
  const router = useRouter(); const { provider } = useLocalSearchParams<{ provider?: string }>();
  return <CalendarConnectionScreen provider={provider === 'apple' ? 'apple' : 'google'} onBack={() => router.canGoBack() ? router.back() : router.replace('/settings')} />;
}
