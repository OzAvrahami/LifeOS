import { Stack, useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { rememberAuthDestination } from '@/features/auth/auth-destination';
import { StatusBar } from 'expo-status-bar';
import {
  Assistant_400Regular,
  Assistant_500Medium,
  Assistant_600SemiBold,
  Assistant_700Bold,
  Assistant_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/assistant';

import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { AuthLoadingScreen } from '@/features/auth/auth-loading-screen';
import { getAuthGateState } from '@/features/auth/auth-gate';
import { needsOnboarding } from '@/features/auth/onboarding-state';
import { SessionQueryCacheBoundary } from '@/features/auth/session-query-cache';
import { DemoTaskProvider } from '@/features/tasks/demo-task-provider';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import { QueryProvider } from '@/lib/query/query-provider';
import { NotificationProvider } from '@/features/notifications/notification-provider';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { v2Fonts } from '@/theme/v2-fonts';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...v2Fonts,
    Assistant_400Regular,
    Assistant_500Medium,
    Assistant_600SemiBold,
    Assistant_700Bold,
    Assistant_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider><QueryProvider>
      <AuthProvider>
        <NotificationProvider>
          <SessionQueryCacheBoundary>
            <AuthenticatedStack />
          </SessionQueryCacheBoundary>
        </NotificationProvider>
      </AuthProvider>
    </QueryProvider></ThemeProvider>
  );
}

function AuthenticatedStack() {
  const { mode, colors } = useTheme();
  const { isLoading, isRecovery, isAuthenticating, session, sessionExpired } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const parameters = useGlobalSearchParams();
  useEffect(() => {
    if (isLoading || (!session && sessionExpired)) rememberAuthDestination(pathname, parameters.id);
  }, [isLoading, pathname, parameters.id, session, sessionExpired]);
  useEffect(() => {
    if (!isLoading && isRecovery && (pathname === '/' || pathname === '/welcome')) router.replace('/reset-password');
  }, [isLoading, isRecovery, pathname, router]);
  const { preview, state } = useGlobalSearchParams<{ preview?: string; state?: string }>();
  const developmentPreview = __DEV__ && (preview === '1' || Boolean(state));
  const gate = getAuthGateState({
    hasSession: Boolean(session),
    isDevelopmentPreview: developmentPreview,
    isLoading,
    isRecovery,
    needsOnboarding: needsOnboarding(session?.user),
  });

  if (gate.showLoading) return <AuthLoadingScreen label="פותח את LifeOS…" />;

  return (
    <TaskQueryScopeProvider userId={session?.user.id}>
      <DemoTaskProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={gate.publicAuthAvailable || isAuthenticating}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
        </Stack.Protected>
        <Stack.Protected guard={gate.productAvailable}>
          <Stack.Screen name="index" />
          <Stack.Screen name="week" />
          <Stack.Screen name="inbox" />
          <Stack.Screen name="more" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="account" />
          <Stack.Screen name="task" />
          <Stack.Screen name="commitment" />
          <Stack.Screen name="calendar" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(session) && !isRecovery}>
          <Stack.Screen name="auth/confirmed" />
        </Stack.Protected>
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="auth/invalid" />
        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="auth-dev" />
        </Stack.Protected>
        </Stack>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </DemoTaskProvider>
    </TaskQueryScopeProvider>
  );
}
