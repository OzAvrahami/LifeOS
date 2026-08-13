import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { VerifyEmailScreen } from '@/features/auth/verify-email-screen';

export default function VerifyEmailRoute() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  return (
    <VerifyEmailScreen
      email={email ?? ''}
      onBack={() => router.replace('/sign-up' as Href)}
      onSignIn={() => router.replace('/sign-in' as Href)}
    />
  );
}
