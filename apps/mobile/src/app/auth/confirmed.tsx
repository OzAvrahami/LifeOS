import { useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { consumeAuthDestination } from '@/features/auth/auth-destination';
import { needsOnboarding } from '@/features/auth/onboarding-state';
import { OnboardingScreen } from '@/features/auth/onboarding-screen';

export default function ConfirmedRoute() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (user && !needsOnboarding(user)) router.replace(consumeAuthDestination() as Href);
  }, [router, user]);
  return user && needsOnboarding(user) ? <OnboardingScreen key={user.id} /> : null;
}
