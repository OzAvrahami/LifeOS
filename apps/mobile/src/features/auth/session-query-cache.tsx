import type { QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useRef } from 'react';

import { useAuth } from './auth-provider';

export function clearUserQueryCache(queryClient: QueryClient) {
  queryClient.clear();
}

export function SessionQueryCacheBoundary({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const userId = user?.id;
    if (previousUserId.current && previousUserId.current !== userId) {
      clearUserQueryCache(queryClient);
    }
    previousUserId.current = userId;
  }, [queryClient, user?.id]);

  return children;
}
