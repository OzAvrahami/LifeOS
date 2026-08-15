import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import * as commitmentApi from '@/features/commitments/commitment.api';
import {
  commitmentKeys,
  synchronizeCommitmentCaches,
  useCreateCommitment,
} from '@/features/commitments/commitment.queries';
import type { Commitment } from '@/features/commitments/commitment.types';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';

jest.mock('@/features/commitments/commitment.api', () => ({
  createCommitment: jest.fn(),
  deleteCommitment: jest.fn(),
  listCommitments: jest.fn(),
  updateCommitment: jest.fn(),
}));

const userId = 'commitment-cache-user';
const date = '2026-08-17';
const week = { dateFrom: '2026-08-16', dateTo: '2026-08-22' };
const commitment: Commitment = {
  createdAt: '2026-08-15T08:00:00.000Z',
  date,
  description: null,
  endTime: '10:30',
  id: 'commitment-1',
  lifeArea: 'health',
  startTime: '09:30',
  title: 'תור לרופא',
  updatedAt: '2026-08-15T08:00:00.000Z',
};

function client() {
  return new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
}

describe('Commitment query cache synchronization', () => {
  it('upserts one stable ID into matching day/range caches in chronological order', () => {
    const queryClient = client();
    const later = { ...commitment, id: 'later', startTime: '14:00' };
    queryClient.setQueryData(commitmentKeys.list(userId, { date }), [later]);
    queryClient.setQueryData(commitmentKeys.list(userId, week), [later]);
    queryClient.setQueryData(commitmentKeys.list(userId, { date: '2026-08-18' }), []);

    synchronizeCommitmentCaches(queryClient, userId, commitment, 'upsert');
    expect(queryClient.getQueryData<Commitment[]>(commitmentKeys.list(userId, { date }))?.map((item) => item.id)).toEqual([commitment.id, later.id]);
    expect(queryClient.getQueryData<Commitment[]>(commitmentKeys.list(userId, week))?.map((item) => item.id)).toEqual([commitment.id, later.id]);
    expect(queryClient.getQueryData(commitmentKeys.list(userId, { date: '2026-08-18' }))).toEqual([]);

    synchronizeCommitmentCaches(queryClient, userId, { ...commitment, title: 'עודכן' }, 'upsert');
    expect(queryClient.getQueryData<Commitment[]>(commitmentKeys.list(userId, { date }))).toHaveLength(2);
    expect(queryClient.getQueryData<Commitment[]>(commitmentKeys.list(userId, { date }))?.[0]?.title).toBe('עודכן');
    synchronizeCommitmentCaches(queryClient, userId, commitment, 'delete');
    expect(queryClient.getQueryData<Commitment[]>(commitmentKeys.list(userId, week))?.map((item) => item.id)).toEqual([later.id]);
    queryClient.clear();
  });

  it('does not refetch collections after an authoritative mutation response', async () => {
    const queryClient = client();
    queryClient.setQueryData(commitmentKeys.list(userId, { date }), []);
    queryClient.setQueryData(commitmentKeys.list(userId, week), []);
    jest.mocked(commitmentApi.createCommitment).mockResolvedValueOnce(commitment);

    function Harness() {
      const mutation = useCreateCommitment();
      return <Pressable accessibilityLabel="צור התחייבות" onPress={() => mutation.mutate({ date, startTime: '09:30', title: commitment.title })}><Text>צור</Text></Pressable>;
    }
    await render(
      <QueryClientProvider client={queryClient}>
        <TaskQueryScopeProvider userId={userId}><Harness /></TaskQueryScopeProvider>
      </QueryClientProvider>,
    );
    await userEvent.setup().press(screen.getByLabelText('צור התחייבות'));
    await waitFor(() => expect(queryClient.getQueryData<Commitment[]>(commitmentKeys.list(userId, { date }))).toEqual([commitment]));
    expect(commitmentApi.listCommitments).not.toHaveBeenCalled();
  });

  it('retains cached data when a mutation fails', async () => {
    const queryClient = client();
    queryClient.setQueryData(commitmentKeys.list(userId, { date }), [commitment]);
    jest.mocked(commitmentApi.createCommitment).mockRejectedValueOnce(new Error('offline'));

    function Harness() {
      const mutation = useCreateCommitment();
      const [failed, setFailed] = useState(false);
      return (
        <>
          <Pressable accessibilityLabel="יצירה נכשלת" onPress={() => void mutation.mutateAsync({ date, startTime: '12:00', title: 'חדש' }).catch(() => setFailed(true))}><Text>צור</Text></Pressable>
          {failed ? <Text>נכשל</Text> : null}
        </>
      );
    }
    await render(
      <QueryClientProvider client={queryClient}>
        <TaskQueryScopeProvider userId={userId}><Harness /></TaskQueryScopeProvider>
      </QueryClientProvider>,
    );
    await userEvent.setup().press(screen.getByLabelText('יצירה נכשלת'));
    await waitFor(() => expect(screen.getByText('נכשל')).toBeTruthy());
    expect(queryClient.getQueryData(commitmentKeys.list(userId, { date }))).toEqual([commitment]);
  });
});
