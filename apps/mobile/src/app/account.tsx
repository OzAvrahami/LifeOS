import { useRouter } from 'expo-router';

import { AccountScreen } from '@/features/settings/account-screen';

export default function AccountRoute() {
  const router = useRouter();
  return <AccountScreen onBack={() => router.back()} onSignedOut={() => router.replace('/welcome')} />;
}
