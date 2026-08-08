const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

type ApiRequestOptions = RequestInit & {
  accessToken?: string;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  const { accessToken, headers, ...requestOptions } = options;
  const response = await fetch(`${apiBaseUrl}/${path.replace(/^\//, '')}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`LifeOS API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
