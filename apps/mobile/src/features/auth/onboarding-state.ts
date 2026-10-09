import type { User } from '@supabase/supabase-js';

// Account preference only, never proof of authentication/email verification.
// Legacy accounts without a marker retain their returning-user journey.
export const newAccountMetadata = { lifeos_onboarding_version: 1, lifeos_onboarding_completed_at: null };
export function needsOnboarding(user: Pick<User, 'user_metadata'> | null | undefined) {
  return user?.user_metadata?.lifeos_onboarding_version === 1 && !user.user_metadata.lifeos_onboarding_completed_at;
}
