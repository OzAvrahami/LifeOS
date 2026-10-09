import { apiRequest } from '@/lib/api/client';

import { AuthIdentity } from './auth.types';

export async function verifyApiIdentity(expectedUserId: string) {
  const identity = await apiRequest<AuthIdentity>('/auth/me', { auth: 'required', expectedUserId });
  if (identity.id !== expectedUserId) throw new Error('Authenticated identity mismatch');
  return identity;
}

export function isIdentityRejection(error: unknown) {
  const failure = error as { status?: number; message?: string };
  return failure?.status === 401 || failure?.status === 403 || failure?.message === 'Authenticated identity mismatch';
}
