import { useRouter } from 'expo-router';

import { DayWindowScreen } from '@/features/settings/day-window-screen';

export default function DayWindowRoute() {
  const router = useRouter();
  return <DayWindowScreen onBack={() => router.back()} />;
}
