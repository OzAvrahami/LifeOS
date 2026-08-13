import { EmailOtpType, Session, SupabaseClient } from '@supabase/supabase-js';

import { AuthCallbackIntent } from './auth-navigation';

export type AuthCallbackResult = {
  intent: AuthCallbackIntent;
  session: Session;
};

function readUrlParameters(url: string) {
  const parsedUrl = new URL(url);
  const parameters = new URLSearchParams(parsedUrl.search);
  const hash = parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash;
  const hashParameters = new URLSearchParams(hash);
  hashParameters.forEach((value, key) => {
    if (!parameters.has(key)) parameters.set(key, value);
  });
  return parameters;
}

const callbackOnlyParameterNames = [
  'access_token',
  'refresh_token',
  'expires_in',
  'token_type',
  'token_hash',
  'code',
  'type',
  'error',
  'error_code',
  'error_description',
] as const;

export function sanitizedAuthCallbackPath(url: string) {
  const parsedUrl = new URL(url);
  const hashParameters = new URLSearchParams(
    parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash,
  );

  callbackOnlyParameterNames.forEach((name) => {
    parsedUrl.searchParams.delete(name);
    hashParameters.delete(name);
  });

  const remainingHash = hashParameters.toString();
  return `${parsedUrl.pathname}${parsedUrl.search}${remainingHash ? `#${remainingHash}` : ''}`;
}

export async function processAuthCallback(
  client: SupabaseClient,
  url: string,
): Promise<AuthCallbackResult> {
  const parameters = readUrlParameters(url);
  if (parameters.get('error') || parameters.get('error_code')) {
    throw new Error('Auth callback rejected');
  }

  const requestedIntent = parameters.get('intent');
  const callbackType = parameters.get('type');
  const intent: AuthCallbackIntent =
    requestedIntent === 'recovery' || callbackType === 'recovery' ? 'recovery' : 'signup';

  let session: Session | null = null;
  const code = parameters.get('code');
  const tokenHash = parameters.get('token_hash');
  const accessToken = parameters.get('access_token');
  const refreshToken = parameters.get('refresh_token');

  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    session = data.session;
  } else if (tokenHash && callbackType) {
    const { data, error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: callbackType as EmailOtpType,
    });
    if (error) throw error;
    session = data.session;
  } else if (accessToken && refreshToken) {
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    session = data.session;
  }

  if (!session) {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    session = data.session;
  }

  if (!session) throw new Error('No authenticated session in callback');
  return { intent, session };
}
