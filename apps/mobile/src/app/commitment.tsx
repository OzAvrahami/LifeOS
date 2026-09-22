import { useLocalSearchParams, useRouter } from 'expo-router';
import { CommitmentDetailScreen } from '@/features/commitments/commitment-detail-screen';

export default function CommitmentRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  return <CommitmentDetailScreen id={typeof id === 'string' ? id : ''} onBack={() => { if (router.canGoBack()) router.back(); else router.replace('/week'); }} />;
}
