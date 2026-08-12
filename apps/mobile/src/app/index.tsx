import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { TodayScreen } from '@/features/today/today-screen';
import { isTodayDemoState } from '@/features/today/today.types';

export default function IndexRoute() {
  const router = useRouter();
  const { inboxTaskId, inboxTaskTitle, state } = useLocalSearchParams<{
    inboxTaskId?: string | string[];
    inboxTaskTitle?: string | string[];
    state?: string | string[];
  }>();
  const requestedState = Array.isArray(state) ? state[0] : state;
  const previewState = __DEV__ && isTodayDemoState(requestedState) ? requestedState : 'normal';
  const movedTaskId = Array.isArray(inboxTaskId) ? inboxTaskId[0] : inboxTaskId;
  const movedTaskTitle = Array.isArray(inboxTaskTitle) ? inboxTaskTitle[0] : inboxTaskTitle;

  return (
    <TodayScreen
      initialState={previewState}
      key={previewState}
      movedInboxTask={movedTaskId && movedTaskTitle ? { id: movedTaskId, title: movedTaskTitle } : undefined}
      onNavigateInbox={() => router.push('/inbox' as Href)}
      onNavigateWeek={() => router.push('/week' as Href)}
    />
  );
}
