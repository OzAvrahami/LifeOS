import { Href, useRouter } from 'expo-router';

import { AuthCallbackScreen } from '@/features/auth/auth-callback-screen';

export default function AuthCallbackRoute() {
  const router = useRouter();
  return (
    <AuthCallbackScreen
      onConfirmed={() => router.replace('/sign-in' as Href)}
      onExpired={() => router.replace({ pathname: '/reset-password', params: { invalid: '1' } } as unknown as Href)}
      onRecovery={() => router.replace('/reset-password' as Href)}
    />
  );
}
