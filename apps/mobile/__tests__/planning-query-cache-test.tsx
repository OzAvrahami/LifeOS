import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import * as planningApi from '@/features/planning/planning.api';
import {
  planningKeys,
  usePutDailyPlan,
  useReplaceWeeklyFocuses,
} from '@/features/planning/planning.queries';
import type { DailyPlan, WeeklyFocus } from '@/features/planning/planning.types';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';

jest.mock('@/features/planning/planning.api', () => ({
  getDailyPlan: jest.fn(),
  getWeeklyFocuses: jest.fn(),
  putDailyPlan: jest.fn(),
  replaceWeeklyFocuses: jest.fn(),
}));

const putDailyPlanMock = jest.mocked(planningApi.putDailyPlan);
const replaceWeeklyFocusesMock = jest.mocked(planningApi.replaceWeeklyFocuses);
const userId = 'planning-cache-user';
const date = '2026-08-14';
const weekStart = '2026-08-09';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
}

function Providers({ children, queryClient }: React.PropsWithChildren<{ queryClient: QueryClient }>) {
  return (
    <QueryClientProvider client={queryClient}>
      <TaskQueryScopeProvider userId={userId}>{children}</TaskQueryScopeProvider>
    </QueryClientProvider>
  );
}

describe('Planning query cache synchronization', () => {
  it('writes the authoritative DailyPlan response to only its exact date cache', async () => {
    const queryClient = makeQueryClient();
    const otherDate = '2026-08-15';
    const otherPlan = { id: 'other' } as DailyPlan;
    queryClient.setQueryData(planningKeys.dailyPlan(userId, otherDate), otherPlan);
    const plan = {
      availableMinutes: null,
      createdAt: '2026-08-14T08:00:00.000Z',
      date,
      focusTaskId: 'task-1',
      id: 'plan-1',
      updatedAt: '2026-08-14T08:00:00.000Z',
    } satisfies DailyPlan;
    putDailyPlanMock.mockResolvedValueOnce(plan);

    function Harness() {
      const mutation = usePutDailyPlan();
      return (
        <Pressable accessibilityLabel="save focus" onPress={() => mutation.mutate({
          date,
          input: { availableMinutes: null, focusTaskId: 'task-1' },
        })}>
          <Text>save</Text>
        </Pressable>
      );
    }

    await render(<Providers queryClient={queryClient}><Harness /></Providers>);
    await userEvent.setup().press(screen.getByLabelText('save focus'));
    await waitFor(() => expect(queryClient.getQueryData(planningKeys.dailyPlan(userId, date))).toEqual(plan));
    expect(queryClient.getQueryData(planningKeys.dailyPlan(userId, otherDate))).toBe(otherPlan);
    expect(planningApi.getDailyPlan).not.toHaveBeenCalled();
  });

  it('replaces only the current week cache in server order without a refetch', async () => {
    const queryClient = makeQueryClient();
    const otherWeek = '2026-08-16';
    const otherFocus = [{ id: 'other-focus' }] as WeeklyFocus[];
    queryClient.setQueryData(planningKeys.weeklyFocuses(userId, otherWeek), otherFocus);
    const focuses = ['One', 'Two'].map((title, position): WeeklyFocus => ({
      createdAt: '2026-08-14T08:00:00.000Z',
      id: `focus-${position}`,
      position,
      title,
      updatedAt: '2026-08-14T08:00:00.000Z',
      weekPlanId: 'week-plan-1',
    }));
    replaceWeeklyFocusesMock.mockResolvedValueOnce(focuses);

    function Harness() {
      const mutation = useReplaceWeeklyFocuses();
      return (
        <Pressable accessibilityLabel="save weekly focuses" onPress={() => mutation.mutate({
          titles: focuses.map((focus) => focus.title),
          weekStart,
        })}>
          <Text>save</Text>
        </Pressable>
      );
    }

    await render(<Providers queryClient={queryClient}><Harness /></Providers>);
    await userEvent.setup().press(screen.getByLabelText('save weekly focuses'));
    await waitFor(() => expect(queryClient.getQueryData(
      planningKeys.weeklyFocuses(userId, weekStart),
    )).toEqual(focuses));
    expect(queryClient.getQueryData(planningKeys.weeklyFocuses(userId, otherWeek))).toBe(otherFocus);
    expect(planningApi.getWeeklyFocuses).not.toHaveBeenCalled();
  });

  it('retains the previous cache when a planning mutation fails', async () => {
    const queryClient = makeQueryClient();
    const previous = null;
    queryClient.setQueryData(planningKeys.dailyPlan(userId, date), previous);
    putDailyPlanMock.mockRejectedValueOnce(new Error('offline'));

    function Harness() {
      const mutation = usePutDailyPlan();
      const [failed, setFailed] = useState(false);
      return (
        <>
          <Pressable accessibilityLabel="failed focus" onPress={() => void mutation.mutateAsync({
            date,
            input: { availableMinutes: null, focusTaskId: 'task-1' },
          }).catch(() => setFailed(true))}>
            <Text>save</Text>
          </Pressable>
          {failed ? <Text>failed</Text> : null}
        </>
      );
    }

    await render(<Providers queryClient={queryClient}><Harness /></Providers>);
    await userEvent.setup().press(screen.getByLabelText('failed focus'));
    await waitFor(() => expect(screen.getByText('failed')).toBeTruthy());
    expect(queryClient.getQueryData(planningKeys.dailyPlan(userId, date))).toBe(previous);
  });
});
