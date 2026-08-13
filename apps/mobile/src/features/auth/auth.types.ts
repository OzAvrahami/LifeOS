import { Session, User } from '@supabase/supabase-js';

export type AuthIdentity = {
  email: string | null;
  id: string;
};

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = SignInCredentials & {
  emailRedirectTo: string;
  name: string;
};

export type AuthContextValue = {
  beginRecovery: () => void;
  clearRecovery: () => void;
  isLoading: boolean;
  isRecovery: boolean;
  requestPasswordReset: (email: string, redirectTo: string) => Promise<void>;
  resendVerification: (email: string, emailRedirectTo: string) => Promise<void>;
  session: Session | null;
  signIn: (credentials: SignInCredentials) => Promise<Session>;
  signOut: () => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<Session | null>;
  updatePassword: (password: string) => Promise<void>;
  user: User | null;
};

export type AuthFormPreviewState = 'normal' | 'error' | 'validation';
export type ForgotPasswordPreviewState = 'form' | 'sent';
export type ResetPasswordPreviewState = 'form' | 'success' | 'expired';
