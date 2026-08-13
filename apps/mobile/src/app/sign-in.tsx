import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { SignInScreen } from '@/features/auth/sign-in-screen';
import { AuthFormPreviewState } from '@/features/auth/auth.types';

export default function SignInRoute() {
  const router = useRouter();
  const { state } = useLocalSearchParams<{ state?: string }>();
  const previewState: AuthFormPreviewState = __DEV__ && state === 'error' ? 'error' : 'normal';

  return (
    <SignInScreen
      initialState={previewState}
      onAuthenticated={() => router.replace('/')}
      onBack={() => router.replace('/welcome' as Href)}
      onForgotPassword={() => router.push('/forgot-password' as Href)}
      onSignUp={() => router.replace('/sign-up' as Href)}
    />
  );
}
