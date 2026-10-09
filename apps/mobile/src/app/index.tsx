import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { TodayScreen } from '@/features/today/today-screen';
import { isTodayDemoState } from '@/features/today/today.types';
import { V2TodayScreen } from '@/features/today/v2-today-screen';
import { useAuth } from '@/features/auth/auth-provider';

export default function IndexRoute() {
  const router = useRouter();
  const { user } = useAuth();
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

  if (!requestedState || !developmentPreview) return <V2TodayScreen
    displayName={typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : undefined}
    preview={developmentPreview} onNavigateInbox={() => router.navigate('/inbox')}
    onNavigateMore={() => router.navigate('/more')} onNavigateWeek={() => router.navigate('/week')} />;

  return (
    <TodayScreen
      initialState={previewState}
      key={previewState}
      movedTaskId={movedTaskId}
      onNavigateInbox={() => router.navigate('/inbox' as Href)}
      onNavigateMore={() => router.navigate('/more' as Href)}
      onNavigateWeek={() => router.navigate('/week' as Href)}
      taskSource={developmentPreview ? 'preview' : 'server'}
    />
  );
}
