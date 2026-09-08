import { tasksByPlannedDate } from '@/features/week/week-aggregation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import * as taskApi from '@/features/tasks/task.api';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import {
  synchronizeTaskCaches,
  taskKeys,
  useUpdateTask,
} from '@/features/tasks/task.queries';
import { Task } from '@/features/tasks/task.types';

jest.mock('@/features/tasks/task.api', () => ({
  cancelTask: jest.fn(),
  createTask: jest.fn(),
  listTasks: jest.fn(),
  updateTask: jest.fn(),
}));

const updateTaskMock = jest.mocked(taskApi.updateTask);
const userId = 'cache-user';
const today = '2026-08-14';
const weekStart = '2026-08-09';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    completedAt: null,
    createdAt: '2026-08-14T08:00:00.000Z',
    description: null,
    dueDate: null,
    estimatedMinutes: null,
    id: 'task-1',
    plannedDate: null,
    position: 0,
    priority: 'normal',
    status: 'open',
    title: 'משימת cache',
    updatedAt: '2026-08-14T08:00:00.000Z',
    weekPlanId: null,
    ...overrides,
  };
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
}

function ids(queryClient: QueryClient, filters: Parameters<typeof taskKeys.list>[1]) {
  return (queryClient.getQueryData<Task[]>(taskKeys.list(userId, filters)) ?? []).map((task) => task.id);
}

describe('Task query cache synchronization', () => {
  it('moves one stable ID Inbox → Week → Today without duplicates or unrelated refetches', () => {
    const queryClient = makeQueryClient();
    const task = makeTask();
    queryClient.setQueryData(taskKeys.list(userId, { placement: 'inbox' }), [task]);
    queryClient.setQueryData(taskKeys.list(userId, { weekStart }), []);
    queryClient.setQueryData(taskKeys.list(userId, { plannedDate: today }), []);

    const weekTask = { ...task, weekPlanId: 'week-plan-1' };
    synchronizeTaskCaches(queryClient, userId, weekTask, {
      ensurePlanning: { type: 'week', weekStart },
    });
    expect(ids(queryClient, { placement: 'inbox' })).toEqual([]);
    expect(ids(queryClient, { weekStart })).toEqual([task.id]);
    expect(ids(queryClient, { plannedDate: today })).toEqual([]);

    const todayTask = { ...weekTask, plannedDate: today, weekPlanId: null };
    synchronizeTaskCaches(queryClient, userId, todayTask, {
      ensurePlanning: { plannedDate: today, type: 'day' },
    });
    expect(ids(queryClient, { placement: 'inbox' })).toEqual([]);
    expect(ids(queryClient, { weekStart })).toEqual([]);
    expect(ids(queryClient, { plannedDate: today })).toEqual([task.id]);
    expect(ids(queryClient, { plannedDate: today }).filter((id) => id === task.id)).toHaveLength(1);
    queryClient.clear();
  });

  it('updates an active-task handoff and completion in place', () => {
    const queryClient = makeQueryClient();
    const first = makeTask({ id: 'first', plannedDate: today, status: 'in_progress' });
    const second = makeTask({ id: 'second', plannedDate: today });
    const key = taskKeys.list(userId, { plannedDate: today });
    queryClient.setQueryData(key, [first, second]);

    synchronizeTaskCaches(queryClient, userId, { ...second, status: 'in_progress' }, {
      activeHandoff: true,
    });
    const afterStart = queryClient.getQueryData<Task[]>(key) ?? [];
    expect(afterStart.filter((task) => task.status === 'in_progress')).toHaveLength(1);
    expect(afterStart.find((task) => task.id === 'first')?.status).toBe('open');
    expect(afterStart.find((task) => task.id === 'second')?.status).toBe('in_progress');

    synchronizeTaskCaches(queryClient, userId, {
      ...second,
      completedAt: '2026-08-14T09:00:00.000Z',
      status: 'completed',
    });
    const completed = queryClient.getQueryData<Task[]>(key) ?? [];
    expect(completed.find((task) => task.id === 'second')).toEqual(expect.objectContaining({
      completedAt: '2026-08-14T09:00:00.000Z',
      status: 'completed',
    }));
    queryClient.clear();
  });

  it('synchronizes date-range caches for moves, duration changes, completion, and cancellation', () => {
    const queryClient = makeQueryClient();
    const tomorrow = '2026-08-15';
    const filters = { plannedDateFrom: today, plannedDateTo: tomorrow };
    const task = makeTask({ estimatedMinutes: 30, plannedDate: today });
    queryClient.setQueryData(taskKeys.list(userId, filters), [task]);

    const moved = { ...task, plannedDate: tomorrow };
    synchronizeTaskCaches(queryClient, userId, moved, {
      ensurePlanning: { plannedDate: tomorrow, type: 'day' },
    });
    expect(queryClient.getQueryData<Task[]>(taskKeys.list(userId, filters))).toEqual([moved]);

    const resized = { ...moved, estimatedMinutes: 75 };
    synchronizeTaskCaches(queryClient, userId, resized);
    expect(queryClient.getQueryData<Task[]>(taskKeys.list(userId, filters))?.[0]?.estimatedMinutes).toBe(75);

    const completed = { ...resized, completedAt: '2026-08-15T09:00:00.000Z', status: 'completed' as const };
    synchronizeTaskCaches(queryClient, userId, completed);
    expect(queryClient.getQueryData<Task[]>(taskKeys.list(userId, filters))?.[0]?.status).toBe('completed');

    synchronizeTaskCaches(queryClient, userId, { ...completed, completedAt: null, status: 'cancelled' });
    expect(queryClient.getQueryData<Task[]>(taskKeys.list(userId, filters))).toEqual([]);
    queryClient.clear();
  });

  it('retains cached UI data when a mutation fails', async () => {
    const queryClient = makeQueryClient();
    const task = makeTask({ plannedDate: today });
    const key = taskKeys.list(userId, { plannedDate: today });
    queryClient.setQueryData(key, [task]);
    updateTaskMock.mockRejectedValueOnce(new Error('offline'));

    function MutationHarness() {
      const mutation = useUpdateTask();
      const [failed, setFailed] = useState(false);
      return (
        <>
          <Pressable
            accessibilityLabel="נסה עדכון"
            onPress={() => void mutation.mutateAsync({
              id: task.id,
              input: { status: 'completed' },
            }).catch(() => setFailed(true))}
          >
            <Text>עדכון</Text>
          </Pressable>
          {failed ? <Text>העדכון נכשל</Text> : null}
        </>
      );
    }

    await render(
      <QueryClientProvider client={queryClient}>
        <TaskQueryScopeProvider userId={userId}><MutationHarness /></TaskQueryScopeProvider>
      </QueryClientProvider>,
    );
    await userEvent.setup().press(screen.getByLabelText('נסה עדכון'));
    await waitFor(() => expect(screen.getByText('העדכון נכשל')).toBeTruthy());

    expect(queryClient.getQueryData(key)).toEqual([task]);
    queryClient.clear();
  });
});

it('moves across years and back to Inbox with exact day/range membership, aggregates, and user isolation', () => {
  const client = makeQueryClient();
  const source = { plannedDateFrom: '2026-12-28', plannedDateTo: '2027-01-03' };
  const destination = { plannedDateFrom: '2027-02-01', plannedDateTo: '2027-02-07' };
  const task = makeTask({ plannedDate: '2026-12-31', estimatedMinutes: 45, description: 'retain', dueDate: '2027-06-01' });
  const other = makeTask({ id: 'other', plannedDate: '2026-12-31', estimatedMinutes: 15 });
  client.setQueryData(taskKeys.list(userId, source), [task, other]);
  client.setQueryData(taskKeys.list(userId, destination), []);
  client.setQueryData(taskKeys.list(userId, { plannedDate: '2026-12-31' }), [task, other]);
  client.setQueryData(taskKeys.list(userId, { weekStart: '2026-12-28' }), []);
  client.setQueryData(taskKeys.list(userId, { placement: 'inbox' }), []);
  client.setQueryData(taskKeys.list('another-user', source), [task]);
  const moved = { ...task, plannedDate: '2027-02-02' };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    synchronizeTaskCaches(client, userId, moved, { ensurePlanning: { type: 'day', plannedDate: '2027-02-02' } });
  }
  expect(ids(client, { plannedDate: '2026-12-31' })).toEqual(['other']);
  expect(ids(client, { plannedDate: '2027-02-02' })).toEqual([task.id]);
  expect(ids(client, source)).toEqual(['other']);
  expect(ids(client, destination)).toEqual([task.id]);
  expect(ids(client, { weekStart: '2026-12-28' })).toEqual([]);
  const sourceTasks = client.getQueryData<Task[]>(taskKeys.list(userId, source))!;
  const destinationTasks = client.getQueryData<Task[]>(taskKeys.list(userId, destination))!;
  expect(tasksByPlannedDate(sourceTasks, ['2026-12-31']).get('2026-12-31')).toEqual({ plannedMinutes: 15, tasks: [other] });
  expect(tasksByPlannedDate(destinationTasks, ['2027-02-02']).get('2027-02-02')).toEqual({ plannedMinutes: 45, tasks: [moved] });
  expect(client.getQueryData(taskKeys.list('another-user', source))).toEqual([task]);
  synchronizeTaskCaches(client, userId, { ...moved, plannedDate: null }, { ensurePlanning: { type: 'inbox' } });
  expect(ids(client, destination)).toEqual([]);
  expect(ids(client, { plannedDate: '2027-02-02' })).toEqual([]);
  expect(ids(client, { placement: 'inbox' })).toEqual([task.id]);
  expect(client.getQueryData<Task[]>(taskKeys.list(userId, { placement: 'inbox' }))?.[0]).toEqual({ ...task, plannedDate: null });
  // A planning-only move does not reopen completed work or put it in open Inbox.
  synchronizeTaskCaches(client, userId, { ...task, plannedDate: null, status: 'completed', completedAt: '2026-12-31T13:00:00Z' }, { ensurePlanning: { type: 'inbox' } });
  expect(ids(client, { placement: 'inbox' })).toEqual([]);
  client.clear();
});
