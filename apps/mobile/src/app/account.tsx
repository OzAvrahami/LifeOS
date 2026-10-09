import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { useRouter } from 'expo-router';

import { AccountScreen } from '@/features/settings/account-screen';

export default function AccountRoute() {
  const router = useRouter();
  const scope = useTaskQueryScope();
  return <AccountScreen key={scope} onBack={() => router.back()} onSignedOut={() => router.replace('/welcome')} />;
}
