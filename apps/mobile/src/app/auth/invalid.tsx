import { Href, useRouter } from 'expo-router';
import { AuthLink, AuthPrimaryButton, AuthScreen, AuthStateIcon, AuthStateView } from '@/features/auth/auth.components';
import { useAuth } from '@/features/auth/auth-provider';

export default function InvalidCallbackRoute() {
  const router = useRouter();
  const { session, isRecovery } = useAuth();
  return <AuthScreen><AuthStateView icon={<AuthStateIcon name="time-outline" tone="danger" />}
    title="הקישור כבר לא בתוקף" subtitle="הקישור פג, כבר נוצל או אינו תקין. אפשר לחזור לכניסה או לבקש קישור איפוס חדש."
    actions={<>
      <AuthPrimaryButton title={session && !isRecovery ? 'לתכנון היום' : 'חזרה להתחברות'} onPress={() => router.replace(session && !isRecovery ? '/' : '/sign-in' as Href)} />
      {!session || isRecovery ? <AuthLink title="בקשת קישור איפוס חדש" onPress={() => router.replace('/forgot-password' as Href)} /> : null}
    </>} /></AuthScreen>;
}
