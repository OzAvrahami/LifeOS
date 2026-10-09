import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { SignInScreen } from '@/features/auth/sign-in-screen';
import { AuthFormPreviewState } from '@/features/auth/auth.types';
import { consumeAuthDestination } from '@/features/auth/auth-destination';
import { useAuth } from '@/features/auth/auth-provider';
import { needsOnboarding } from '@/features/auth/onboarding-state';

export default function SignInRoute() {
  const router = useRouter();
  const { user } = useAuth();
  const { state } = useLocalSearchParams<{ state?: string }>();
  const previewState: AuthFormPreviewState = __DEV__ && state === 'error' ? 'error' : 'normal';

  return (
    <SignInScreen
      initialState={previewState}
      onAuthenticated={() => router.replace((needsOnboarding(user) ? '/auth/confirmed' : consumeAuthDestination()) as Href)}
      onBack={() => router.replace('/welcome' as Href)}
      onForgotPassword={() => router.push('/forgot-password' as Href)}
      onSignUp={() => router.replace('/sign-up' as Href)}
      onVerificationRequired={email => router.replace({ pathname: '/verify-email', params: { email } })}
    />
  );
}
