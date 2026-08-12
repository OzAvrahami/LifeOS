import { useLocalSearchParams } from 'expo-router';

import { TodayScreen } from '@/features/today/today-screen';
import { isTodayDemoState } from '@/features/today/today.types';

export default function IndexRoute() {
  const { state } = useLocalSearchParams<{ state?: string | string[] }>();
  const requestedState = Array.isArray(state) ? state[0] : state;
  const previewState = __DEV__ && isTodayDemoState(requestedState) ? requestedState : 'normal';

  return <TodayScreen initialState={previewState} key={previewState} />;
}
