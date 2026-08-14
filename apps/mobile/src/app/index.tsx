import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { TodayScreen } from '@/features/today/today-screen';
import { isTodayDemoState } from '@/features/today/today.types';

export default function IndexRoute() {
  const router = useRouter();
  const { inboxTaskId, preview, state } = useLocalSearchParams<{
    inboxTaskId?: string | string[];
    preview?: string | string[];
    state?: string | string[];
  }>();
  const requestedState = Array.isArray(state) ? state[0] : state;
  const requestedPreview = Array.isArray(preview) ? preview[0] : preview;
  const developmentPreview = __DEV__ && (requestedPreview === '1' || requestedState !== undefined);
  const previewState = __DEV__ && isTodayDemoState(requestedState) ? requestedState : 'normal';
  const movedTaskId = Array.isArray(inboxTaskId) ? inboxTaskId[0] : inboxTaskId;

  return (
    <TodayScreen
      initialState={previewState}
      key={previewState}
      movedTaskId={movedTaskId}
      onNavigateInbox={() => router.navigate('/inbox' as Href)}
      onNavigateWeek={() => router.navigate('/week' as Href)}
      taskSource={developmentPreview ? 'preview' : 'server'}
    />
  );
}
