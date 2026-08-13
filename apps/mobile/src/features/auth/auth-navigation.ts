import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export type AuthCallbackIntent = 'signup' | 'recovery';

export function createAuthCallbackUrl(intent: AuthCallbackIntent) {
  const query = `intent=${intent}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback?${query}`;
  }

  return `${Linking.createURL('auth/callback', { scheme: 'lifeos' })}?${query}`;
}
