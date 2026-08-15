import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { InboxScreen } from '@/features/inbox/inbox-screen';
import { isInboxDemoState } from '@/features/inbox/inbox.types';

export default function InboxRoute() {
  const router = useRouter();
  const { preview, state } = useLocalSearchParams<{
    preview?: string | string[];
    state?: string | string[];
  }>();
  const requestedState = Array.isArray(state) ? state[0] : state;
  const requestedPreview = Array.isArray(preview) ? preview[0] : preview;
  const developmentPreview = __DEV__ && (requestedPreview === '1' || requestedState !== undefined);
  const previewState = __DEV__ && isInboxDemoState(requestedState) ? requestedState : 'normal';

  return (
    <InboxScreen
      initialState={previewState}
      key={previewState}
      onMoveToToday={(task) =>
        router.replace({
          params: { inboxTaskId: task.id },
          pathname: '/',
        } as Href)
      }
      onNavigateToday={() => router.replace('/')}
      onNavigateMore={() => router.navigate('/more' as Href)}
      onNavigateWeek={() => router.navigate('/week' as Href)}
      taskSource={developmentPreview ? 'preview' : 'server'}
    />
  );
}
