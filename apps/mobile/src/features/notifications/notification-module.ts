import type * as Notifications from 'expo-notifications';

// Web and Android retain reminder intent editing without importing iOS delivery.
export async function getNativeNotifications(): Promise<typeof Notifications> {
  throw new Error('Local notification delivery is available on iOS');
}
