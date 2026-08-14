import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DemoTaskProvider } from '@/features/tasks/demo-task-provider';
import { DemoTaskState } from '@/features/tasks/demo-task.types';

const initialMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

export function TestProviders({
  children,
  initialTaskState,
}: PropsWithChildren<{ initialTaskState?: DemoTaskState }>) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  }));
  useEffect(() => () => queryClient.clear(), [queryClient]);

  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <QueryClientProvider client={queryClient}>
        <DemoTaskProvider initialState={initialTaskState}>{children}</DemoTaskProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
