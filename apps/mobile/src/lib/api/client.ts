import { supabase } from '@/lib/supabase/client';

export type ApiAuthMode = 'none' | 'optional' | 'required';

export type ApiRequestOptions = RequestInit & {
  auth?: ApiAuthMode;
  expectedUserId?: string;
};

type ApiClientDependencies = {
  baseUrl: string | undefined;
  fetchImplementation?: typeof fetch;
  getAccessToken: (expectedUserId?: string) => Promise<string | null>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createApiClient({
  baseUrl,
  fetchImplementation = fetch,
  getAccessToken,
}: ApiClientDependencies) {
  const normalizedBaseUrl = baseUrl?.replace(/\/$/, '');

  return async function request<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    if (!normalizedBaseUrl) {
      throw new Error('EXPO_PUBLIC_API_URL is not configured');
    }

    const { auth = 'optional', expectedUserId, headers: suppliedHeaders, ...requestOptions } = options;
    const accessToken = auth === 'none' ? null : await getAccessToken(expectedUserId);

    if (auth === 'required' && !accessToken) {
      throw new ApiError('Authentication is required', 401);
    }

    const headers = new Headers(suppliedHeaders);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    } else {
      headers.delete('Authorization');
    }

    const response = await fetchImplementation(
      `${normalizedBaseUrl}/${path.replace(/^\//, '')}`,
      { ...requestOptions, headers },
    );

    if (!response.ok) {
      // Consume only known public recovery codes, never echo arbitrary server payloads.
      const payload: unknown = await response.json().catch(() => null);
      const code = payload && typeof payload === 'object' && 'code' in payload
        && typeof payload.code === 'string'
        && ['selection_unavailable', 'daily_plan_conflict', 'historical_plan_read_only'].includes(payload.code)
        ? payload.code : undefined;
      throw new ApiError(`LifeOS API request failed with status ${response.status}`, response.status, code);
    }

    return response.json() as Promise<T>;
  };
}

export const apiRequest = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  getAccessToken: async (expectedUserId) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (expectedUserId && session?.user.id !== expectedUserId) throw new ApiError('Account changed', 401);
    return session?.access_token ?? null;
  },
});
