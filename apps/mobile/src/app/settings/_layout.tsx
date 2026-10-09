import { Stack } from 'expo-router';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';

export default function SettingsLayout() {
  const scope = useTaskQueryScope();
  return <Stack key={scope} screenOptions={{ headerShown: false }} />;
}
