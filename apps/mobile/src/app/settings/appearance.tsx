import { useRouter } from 'expo-router';
import { AppearanceSetting } from '@/features/settings/appearance-setting';
import { V2SettingsPage } from '@/features/settings/v2-settings';
export default function AppearanceRoute() {
  const router = useRouter();
  return <V2SettingsPage title="מראה האפליקציה" description="הבחירה נשמרת במכשיר הזה, גם לאחר יציאה מהחשבון." onBack={() => router.canGoBack() ? router.back() : router.replace('/settings')}><AppearanceSetting /></V2SettingsPage>;
}
