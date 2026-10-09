import { useTaskQueryScope } from '@/features/tasks/task-query-scope';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CommitmentDetailScreen } from '@/features/commitments/commitment-detail-screen';

export default function CommitmentRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const scope = useTaskQueryScope();
  return <CommitmentDetailScreen key={scope} id={typeof id === 'string' ? id : ''} onBack={() => { if (router.canGoBack()) router.back(); else router.replace('/week'); }} />;
}
