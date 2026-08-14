import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { WeekScreen } from '@/features/week/week-screen';
import { isWeekDemoState } from '@/features/week/week.types';

export default function WeekRoute() {
  const router = useRouter();
  const { preview, state } = useLocalSearchParams<{
    preview?: string | string[];
    state?: string | string[];
  }>();
  const requestedState = Array.isArray(state) ? state[0] : state;
  const requestedPreview = Array.isArray(preview) ? preview[0] : preview;
  const developmentPreview = __DEV__ && (requestedPreview === '1' || requestedState !== undefined);
  const previewState = __DEV__ && isWeekDemoState(requestedState) ? requestedState : 'normal';

  return (
    <WeekScreen
      initialState={previewState}
      key={previewState}
      onNavigateInbox={() => router.navigate('/inbox' as Href)}
      onNavigateToday={() => router.replace('/')}
      taskSource={developmentPreview ? 'preview' : 'server'}
    />
  );
}
