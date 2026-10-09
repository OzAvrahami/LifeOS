import { useRouter } from 'expo-router';
import { DatePreferencesScreen } from '@/features/settings/date-preferences-screen';
export default function DatePreferencesRoute() {
  const router = useRouter();
  return <DatePreferencesScreen onBack={() => router.canGoBack() ? router.back() : router.replace('/settings')}
    onTimezone={() => router.navigate('/settings/timezone')} onWeekStart={() => router.navigate('/settings/week-start')} onDayWindow={() => router.navigate('/settings/day-window')} />;
}
