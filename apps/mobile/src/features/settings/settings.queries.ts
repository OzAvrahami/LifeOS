import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTaskQueryScope } from '@/features/tasks/task-query-scope';

import { getSettings, putSettings } from './settings.api';
import { effectiveUserSettings } from './settings-time';
import type { UserSettings } from './settings.types';

export const SETTINGS_STALE_TIME_MS = 5 * 60_000;

export const settingsKeys = {
  all: ['settings'] as const,
  user: (userId: string) => [...settingsKeys.all, userId] as const,
};

export function useSettings(enabled = true) {
  const userId = useTaskQueryScope();
  return useQuery({
    enabled,
    queryFn: getSettings,
    queryKey: settingsKeys.user(userId),
    refetchOnWindowFocus: false,
    staleTime: SETTINGS_STALE_TIME_MS,
  });
}

export function useEffectiveSettings(enabled = true) {
  const query = useSettings(enabled);
  return { effective: effectiveUserSettings(query.data), query };
}

export function usePutSettings() {
  const queryClient = useQueryClient();
  const userId = useTaskQueryScope();
  return useMutation({
    mutationFn: putSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData<UserSettings>(settingsKeys.user(userId), settings);
    },
  });
}
