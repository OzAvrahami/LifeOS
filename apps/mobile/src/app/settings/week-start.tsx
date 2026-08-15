import { useRouter } from 'expo-router';

import { WeekStartScreen } from '@/features/settings/week-start-screen';

export default function WeekStartRoute() {
  const router = useRouter();
  return <WeekStartScreen onClose={() => router.back()} />;
}
