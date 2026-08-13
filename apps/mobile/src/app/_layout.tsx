import { Stack, useGlobalSearchParams } from 'expo-router';
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
import { DemoTaskProvider } from '@/features/tasks/demo-task-provider';
import { QueryProvider } from '@/lib/query/query-provider';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
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
    <QueryProvider>
      <AuthProvider>
        <AuthenticatedStack />
      </AuthProvider>
    </QueryProvider>
  );
}

function AuthenticatedStack() {
  const { isLoading, isRecovery, session } = useAuth();
  const { preview, state } = useGlobalSearchParams<{ preview?: string; state?: string }>();
  const developmentPreview = __DEV__ && (preview === '1' || Boolean(state));
  const gate = getAuthGateState({
    hasSession: Boolean(session),
    isDevelopmentPreview: developmentPreview,
    isLoading,
    isRecovery,
  });

  if (gate.showLoading) return <AuthLoadingScreen label="פותח את LifeOS…" />;

  return (
    <DemoTaskProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={gate.publicAuthAvailable}>
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
        </Stack.Protected>
        <Stack.Screen name="auth/callback" />
        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="auth-dev" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="dark" />
    </DemoTaskProvider>
  );
}
