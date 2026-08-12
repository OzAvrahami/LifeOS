import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { WeekScreen } from '@/features/week/week-screen';
import { isWeekDemoState } from '@/features/week/week.types';

export default function WeekRoute() {
  const router = useRouter();
  const { state } = useLocalSearchParams<{ state?: string | string[] }>();
  const requestedState = Array.isArray(state) ? state[0] : state;
  const previewState = __DEV__ && isWeekDemoState(requestedState) ? requestedState : 'normal';

  return (
    <WeekScreen
      initialState={previewState}
      key={previewState}
      onNavigateInbox={() => router.push('/inbox' as Href)}
      onNavigateToday={() => router.replace('/')}
    />
  );
}
