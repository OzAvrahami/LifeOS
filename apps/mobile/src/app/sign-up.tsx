import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { SignUpScreen } from '@/features/auth/sign-up-screen';
import { AuthFormPreviewState } from '@/features/auth/auth.types';

export default function SignUpRoute() {
  const router = useRouter();
  const { state } = useLocalSearchParams<{ state?: string }>();
  const previewState: AuthFormPreviewState = __DEV__ && state === 'validation' ? 'validation' : 'normal';

  return (
    <SignUpScreen
      initialState={previewState}
      onAuthenticated={() => router.replace('/')}
      onBack={() => router.replace('/welcome' as Href)}
      onSignIn={() => router.replace('/sign-in' as Href)}
      onVerificationRequired={(email) => router.replace({ pathname: '/verify-email', params: { email } } as unknown as Href)}
    />
  );
}
