import { useRouter } from 'expo-router';
import { NotificationSettingsScreen } from '@/features/notifications/notification-settings-screen';
export default function NotificationsRoute() {
  const router = useRouter();
  return <NotificationSettingsScreen onBack={() => router.back()} />;
}
