import { Href, useRouter } from 'expo-router';

import { WelcomeScreen } from '@/features/auth/welcome-screen';
import { useAuth } from '@/features/auth/auth-provider';

export default function WelcomeRoute() {
  const router = useRouter();
  const { sessionExpired } = useAuth();
  return <WelcomeScreen sessionExpired={sessionExpired} onSignIn={() => router.push('/sign-in' as Href)} onSignUp={() => router.push('/sign-up' as Href)} />;
}
