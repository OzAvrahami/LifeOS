import { EmailOtpType, Session, SupabaseClient } from '@supabase/supabase-js';

import { AuthCallbackIntent } from './auth-navigation';

export type AuthCallbackResult = {
  intent: AuthCallbackIntent;
  session: Session;
};

function readUrlParameters(url: string) {
  const parsedUrl = new URL(url);
  const path = parsedUrl.protocol === 'lifeos:' ? `${parsedUrl.hostname}${parsedUrl.pathname}` : parsedUrl.pathname.replace(/^\//, '').replace(/^--\//, '');
  if (!['lifeos:', 'http:', 'https:', 'exp:', 'exps:'].includes(parsedUrl.protocol) || path !== 'auth/callback') throw new Error('Unexpected callback route');
  const parameters = new URLSearchParams(parsedUrl.search);
  const hash = parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash;
  const hashParameters = new URLSearchParams(hash);
  for (const source of [parameters, hashParameters]) {
    for (const key of new Set(source.keys())) {
      if (source.getAll(key).length > 1) throw new Error('Ambiguous callback parameter');
    }
  }
  hashParameters.forEach((value, key) => {
    if (parameters.has(key) && parameters.get(key) !== value) throw new Error('Conflicting callback parameter');
    if (!parameters.has(key)) parameters.set(key, value);
  });
  return parameters;
}

const callbackOnlyParameterNames = [
  'access_token',
  'refresh_token',
  'expires_in',
  'expires_at',
  'provider_token',
  'provider_refresh_token',
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
  let intent: AuthCallbackIntent =
    requestedIntent === 'recovery' || callbackType === 'recovery' ? 'recovery' : 'signup';
  if (requestedIntent && !['recovery', 'signup'].includes(requestedIntent)) throw new Error('Unsupported callback intent');
  if (callbackType && !['recovery', 'signup', 'email'].includes(callbackType)) throw new Error('Unsupported callback type');
  if (requestedIntent === 'recovery' && callbackType && callbackType !== 'recovery') throw new Error('Conflicting callback intent');

  let session: Session | null = null;
  const code = parameters.get('code');
  const tokenHash = parameters.get('token_hash');
  const accessToken = parameters.get('access_token');
  const refreshToken = parameters.get('refresh_token');
  if ([!!code, !!tokenHash, !!(accessToken || refreshToken)].filter(Boolean).length !== 1) throw new Error('Ambiguous callback credentials');
  if (!!accessToken !== !!refreshToken) throw new Error('Incomplete callback credentials');

  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    session = data.session;
    if ('redirectType' in data && data.redirectType === 'recovery') intent = 'recovery';
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

  // A cached login is never proof that this particular email link was accepted.
  if (!session) throw new Error('No authenticated session in callback');
  return { intent, session };
}
