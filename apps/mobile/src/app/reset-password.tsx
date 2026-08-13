import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { ResetPasswordScreen } from '@/features/auth/reset-password-screen';
import { ResetPasswordPreviewState } from '@/features/auth/auth.types';

export default function ResetPasswordRoute() {
  const router = useRouter();
  const { invalid, state } = useLocalSearchParams<{ invalid?: string; state?: string }>();
  let previewState: ResetPasswordPreviewState = invalid === '1' ? 'expired' : 'form';
  if (__DEV__ && (state === 'success' || state === 'expired')) previewState = state;

  return (
    <ResetPasswordScreen
      initialState={previewState}
      onRequestNewLink={() => router.replace('/forgot-password' as Href)}
      onSignIn={() => router.replace('/sign-in' as Href)}
    />
  );
}
