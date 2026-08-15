import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import * as settingsApi from '@/features/settings/settings.api';
import { settingsKeys, usePutSettings } from '@/features/settings/settings.queries';
import type { UserSettings } from '@/features/settings/settings.types';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';

jest.mock('@/features/settings/settings.api', () => ({
  getSettings: jest.fn(),
  putSettings: jest.fn(),
}));

const userId = 'settings-cache-user';
const saved: UserSettings = {
  defaultDailyCapacityMinutes: 480,
  persisted: true,
  timezone: 'Europe/London',
  weekStartDay: 1,
};

function client() {
  return new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
}

describe('Settings query cache', () => {
  it('updates only the caller settings cache with no follow-up GET or broad refetch', async () => {
    const queryClient = client();
    const otherUser = { ...saved, timezone: 'Asia/Tokyo' };
    queryClient.setQueryData(settingsKeys.user('other-user'), otherUser);
    jest.mocked(settingsApi.putSettings).mockResolvedValueOnce(saved);
    function Harness() {
      const mutation = usePutSettings();
      return (
        <Pressable accessibilityLabel="שמור הגדרות" onPress={() => mutation.mutate({
          defaultDailyCapacityMinutes: 480,
          timezone: 'Europe/London',
          weekStartDay: 1,
        })}><Text>שמירה</Text></Pressable>
      );
    }
    const rendered = await render(
      <QueryClientProvider client={queryClient}>
        <TaskQueryScopeProvider userId={userId}><Harness /></TaskQueryScopeProvider>
      </QueryClientProvider>,
    );
    await userEvent.setup().press(rendered.getByLabelText('שמור הגדרות'));
    await waitFor(() => expect(queryClient.getQueryData(settingsKeys.user(userId))).toEqual(saved));
    expect(queryClient.getQueryData(settingsKeys.user('other-user'))).toBe(otherUser);
    expect(settingsApi.getSettings).not.toHaveBeenCalled();
    expect(queryClient.isFetching()).toBe(0);
  });
});
