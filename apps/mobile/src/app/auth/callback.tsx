import { Href, useRouter } from 'expo-router';

import { AuthCallbackScreen } from '@/features/auth/auth-callback-screen';

export default function AuthCallbackRoute() {
  const router = useRouter();
  return (
    <AuthCallbackScreen
      onConfirmed={() => router.replace('/auth/confirmed' as Href)}
      onExpired={() => router.replace('/auth/invalid' as Href)}
      onRecovery={() => router.replace('/reset-password' as Href)}
    />
  );
}
