import { Redirect } from 'expo-router';

import { isAuthDevRouteAvailable } from '@/features/auth/auth-dev-availability';
import { AuthDevScreen } from '@/features/auth/auth-dev-screen';

export default function AuthDevRoute() {
  if (!isAuthDevRouteAvailable(__DEV__)) {
    return <Redirect href="/" />;
  }

  return <AuthDevScreen />;
}
