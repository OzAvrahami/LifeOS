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
