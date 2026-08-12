import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Assistant_400Regular,
  Assistant_500Medium,
  Assistant_600SemiBold,
  Assistant_700Bold,
  Assistant_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/assistant';

import { QueryProvider } from '@/lib/query/query-provider';
import { DemoTaskProvider } from '@/features/tasks/demo-task-provider';

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
      <DemoTaskProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="dark" />
      </DemoTaskProvider>
    </QueryProvider>
  );
}
