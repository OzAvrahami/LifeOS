import { useRouter } from 'expo-router';

import { TimezoneScreen } from '@/features/settings/timezone-screen';

export default function TimezoneRoute() {
  const router = useRouter();
  return <TimezoneScreen onBack={() => router.back()} />;
}
