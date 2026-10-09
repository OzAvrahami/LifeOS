import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { Href, useRouter } from 'expo-router';

import { MoreScreen } from '@/features/settings/more-screen';

export default function MoreRoute() {
  const router = useRouter();
  const scope = useTaskQueryScope();
  return (
    <MoreScreen key={scope}
      onNavigateAccount={() => router.navigate('/account' as Href)}
      onNavigateInbox={() => router.navigate('/inbox' as Href)}
      onNavigateSettings={() => router.navigate('/settings' as Href)}
      onNavigateToday={() => router.replace('/')}
      onNavigateWeek={() => router.navigate('/week' as Href)}
    />
  );
}
