import { supabase } from '@/lib/supabase/client';

export type ApiAuthMode = 'none' | 'optional' | 'required';

export type ApiRequestOptions = RequestInit & {
  auth?: ApiAuthMode;
};

type ApiClientDependencies = {
  baseUrl: string | undefined;
  fetchImplementation?: typeof fetch;
  getAccessToken: () => Promise<string | null>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
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

    const { auth = 'optional', headers: suppliedHeaders, ...requestOptions } = options;
    const accessToken = auth === 'none' ? null : await getAccessToken();

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
      throw new ApiError(`LifeOS API request failed with status ${response.status}`, response.status);
    }

    return response.json() as Promise<T>;
  };
}

export const apiRequest = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  getAccessToken: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  },
});
