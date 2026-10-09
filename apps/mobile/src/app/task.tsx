import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TaskDetailScreen } from '@/features/tasks/task-detail-screen';
export default function TaskRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const scope = useTaskQueryScope();
  return <TaskDetailScreen key={scope} id={typeof id === 'string' ? id : ''} onBack={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }} />;
}
