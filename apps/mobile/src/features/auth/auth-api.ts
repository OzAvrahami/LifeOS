import { apiRequest } from '@/lib/api/client';

import { AuthIdentity } from './auth.types';

export async function verifyApiIdentity(expectedUserId: string) {
  const identity = await apiRequest<AuthIdentity>('/auth/me', { auth: 'required' });
  if (identity.id !== expectedUserId) throw new Error('Authenticated identity mismatch');
  return identity;
}
