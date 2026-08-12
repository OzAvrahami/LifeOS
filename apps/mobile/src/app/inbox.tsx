import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { InboxScreen } from '@/features/inbox/inbox-screen';
import { isInboxDemoState } from '@/features/inbox/inbox.types';

export default function InboxRoute() {
  const router = useRouter();
  const { state } = useLocalSearchParams<{ state?: string | string[] }>();
  const requestedState = Array.isArray(state) ? state[0] : state;
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
      onNavigateWeek={() => router.push('/week' as Href)}
    />
  );
}
