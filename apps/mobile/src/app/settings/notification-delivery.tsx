import { useRouter } from 'expo-router';
import { NotificationDeliveryScreen } from '@/features/notifications/notification-delivery-screen';
export default function NotificationDeliveryRoute() {
  const router = useRouter();
  return <NotificationDeliveryScreen onBack={() => router.canGoBack() ? router.back() : router.replace('/settings/notifications')} />;
}
