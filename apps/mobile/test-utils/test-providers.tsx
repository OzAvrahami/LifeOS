import { PropsWithChildren } from 'react';
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
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <DemoTaskProvider initialState={initialTaskState}>{children}</DemoTaskProvider>
    </SafeAreaProvider>
  );
}
