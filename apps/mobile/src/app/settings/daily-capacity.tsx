import { useRouter } from 'expo-router';

import { DailyCapacityScreen } from '@/features/settings/daily-capacity-screen';

export default function DailyCapacityRoute() {
  const router = useRouter();
  return <DailyCapacityScreen onClose={() => router.back()} />;
}
