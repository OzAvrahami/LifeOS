import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import * as planningApi from '@/features/planning/planning.api';
import {
  useWeeklyPlan,
  useSaveWeeklyPlan,
  planningKeys,
  usePutDailyPlan,
  useReplaceWeeklyFocuses,
} from '@/features/planning/planning.queries';
import type { DailyPlan, WeeklyFocus, WeeklyPlanningState } from '@/features/planning/planning.types';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';

jest.mock('@/features/planning/planning.api', () => ({
  getWeeklyPlan: jest.fn(),
  saveWeeklyPlan: jest.fn(),
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


const completedState: WeeklyPlanningState = { weekPlan: { id: 'stable-plan', weekStart, status: 'completed', resumeStep: 4, completedAt: 'completed', createdAt: 'created', updatedAt: 'updated' }, focuses: [] };

it('updates only the selected user/week lifecycle and Focus cache from a save response', async () => {
  const client = makeQueryClient();
  const otherKey = planningKeys.weeklyPlan(userId, '2026-08-16');
  const otherUserKey = planningKeys.weeklyPlan('other-user', weekStart);
  client.setQueryData(otherKey, completedState); client.setQueryData(otherUserKey, completedState);
  const result = { ...completedState, focuses: [{ id: 'saved', weekPlanId: 'stable-plan', position: 0, title: 'Saved', createdAt: '', updatedAt: '' }] };
  jest.mocked(planningApi.saveWeeklyPlan).mockResolvedValueOnce(result);
  function Harness() { const save = useSaveWeeklyPlan(); return <Pressable accessibilityLabel="save plan" onPress={() => save.mutate({ weekStart, input: { action: 'save', step: 3, advance: false, titles: ['Saved'] } })}><Text>Save</Text></Pressable>; }
  await render(<Providers queryClient={client}><Harness /></Providers>); await fireEvent.press(screen.getByLabelText('save plan'));
  await waitFor(() => expect(client.getQueryData(planningKeys.weeklyPlan(userId, weekStart))).toEqual(result));
  expect(client.getQueryData(planningKeys.weeklyFocuses(userId, weekStart))).toEqual(result.focuses);
  expect(client.getQueryData(otherKey)).toBe(completedState); expect(client.getQueryData(otherUserKey)).toBe(completedState);
  expect(client.getQueryState(otherKey)?.isInvalidated).toBe(false); expect(client.getQueryState(otherUserKey)?.isInvalidated).toBe(false);
});

it('refreshes the correct lifecycle after a standalone Focus edit without resetting completed state', async () => {
  const client = makeQueryClient();
  client.setQueryData(planningKeys.weeklyPlan(userId, weekStart), completedState);
  jest.mocked(planningApi.getWeeklyPlan).mockResolvedValue(completedState);
  replaceWeeklyFocusesMock.mockResolvedValueOnce([]);
  function Harness() { const query = useWeeklyPlan(weekStart); const save = useReplaceWeeklyFocuses(); return <>
    <Text>{query.data?.weekPlan?.status}</Text><Pressable accessibilityLabel="clear focuses" onPress={() => save.mutate({ weekStart, titles: [] })}><Text>Clear</Text></Pressable>
  </>; }
  await render(<Providers queryClient={client}><Harness /></Providers>);
  await fireEvent.press(screen.getByLabelText('clear focuses'));
  await waitFor(() => expect(planningApi.getWeeklyPlan).toHaveBeenCalledWith(weekStart));
  expect(await screen.findByText('completed')).toBeTruthy();
  expect(client.getQueryData(planningKeys.weeklyPlan(userId, weekStart))).toEqual(completedState);
});

it('cancels an obsolete load so it cannot overwrite a saved lifecycle response', async () => {
  const client = makeQueryClient(); let resolveOld!: (state: WeeklyPlanningState) => void;
  jest.mocked(planningApi.getWeeklyPlan).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValue(completedState);
  jest.mocked(planningApi.saveWeeklyPlan).mockResolvedValueOnce(completedState);
  function Harness() { const query = useWeeklyPlan(weekStart); const save = useSaveWeeklyPlan(); return <>
    <Text>{query.data?.weekPlan?.status ?? 'loading'}</Text><Pressable accessibilityLabel="complete known plan" onPress={() => save.mutate({ weekStart, input: { action: 'complete' } })}><Text>Complete</Text></Pressable>
  </>; }
  await render(<Providers queryClient={client}><Harness /></Providers>);
  await screen.findByText('loading'); await fireEvent.press(screen.getByLabelText('complete known plan'));
  await screen.findByText('completed'); await act(async () => resolveOld({ weekPlan: null, focuses: [] }));
  expect(screen.getByText('completed')).toBeTruthy();
  expect(client.getQueryData(planningKeys.weeklyPlan(userId, weekStart))).toEqual(completedState);
});

it('keeps a failed lifecycle write recoverable without caching false completion', async () => {
  const client = makeQueryClient();
  const before = { ...completedState, weekPlan: { ...completedState.weekPlan!, status: 'in_progress' as const, completedAt: null } };
  client.setQueryData(planningKeys.weeklyPlan(userId, weekStart), before);
  jest.mocked(planningApi.saveWeeklyPlan).mockRejectedValueOnce(new Error('offline'));
  function Harness() { const save = useSaveWeeklyPlan(); return <><Text>{save.isError ? 'failed' : 'ready'}</Text><Pressable accessibilityLabel="fail completion" onPress={() => save.mutate({ weekStart, input: { action: 'complete' } })}><Text>Save</Text></Pressable></>; }
  await render(<Providers queryClient={client}><Harness /></Providers>); await fireEvent.press(screen.getByLabelText('fail completion'));
  await screen.findByText('failed'); expect(client.getQueryData(planningKeys.weeklyPlan(userId, weekStart))).toEqual(before);
});
