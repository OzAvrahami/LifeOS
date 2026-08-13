import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { ForgotPasswordScreen } from '@/features/auth/forgot-password-screen';
import { ForgotPasswordPreviewState } from '@/features/auth/auth.types';

export default function ForgotPasswordRoute() {
  const router = useRouter();
  const { state } = useLocalSearchParams<{ state?: string }>();
  const previewState: ForgotPasswordPreviewState = __DEV__ && state === 'sent' ? 'sent' : 'form';
  return (
    <ForgotPasswordScreen
      initialState={previewState}
      onBack={() => router.replace('/sign-in' as Href)}
      onSignIn={() => router.replace('/sign-in' as Href)}
    />
  );
}
