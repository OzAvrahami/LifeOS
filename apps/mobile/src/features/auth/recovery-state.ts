import type { Session } from '@supabase/supabase-js';
import { recoveryStorage } from '@/lib/supabase/session-storage';

const key = 'lifeos.auth.recovery';
type RecoveryMarker = { userId: string; signedInAt: string };
let writes = Promise.resolve();
export function saveRecoverySession(session: Session | null) {
  const marker: RecoveryMarker | null = session ? {
    userId: session.user.id, signedInAt: session.user.last_sign_in_at ?? '',
  } : null;
  writes = writes.catch(() => undefined).then(() => marker ? recoveryStorage.setItem(key, JSON.stringify(marker)) : recoveryStorage.removeItem(key));
  return writes;
}
export async function isRecoverySession(session: Session | null) {
  if (!session) return false;
  await writes.catch(() => undefined);
  const raw = await recoveryStorage.getItem(key);
  if (!raw) return false;
  try {
    const marker = JSON.parse(raw) as RecoveryMarker;
    return marker.userId === session.user.id && marker.signedInAt === (session.user.last_sign_in_at ?? '');
  } catch { return false; }
}
