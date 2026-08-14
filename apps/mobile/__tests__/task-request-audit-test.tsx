import { Pressable, Text, View } from 'react-native';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useState } from 'react';

import * as taskApi from '@/features/tasks/task.api';
import { localDateKey } from '@/features/tasks/task-dates';
import {
  useCancelTask,
  useCreateTask,
  useTasks,
  useUpdateTask,
} from '@/features/tasks/task.queries';
import { Task } from '@/features/tasks/task.types';

import { TestProviders } from '../test-utils/test-providers';

jest.mock('@/features/tasks/task.api', () => ({
  cancelTask: jest.fn(),
  createTask: jest.fn(),
  listTasks: jest.fn(),
  updateTask: jest.fn(),
}));

const listTasksMock = jest.mocked(taskApi.listTasks);
const createTaskMock = jest.mocked(taskApi.createTask);
const updateTaskMock = jest.mocked(taskApi.updateTask);
const cancelTaskMock = jest.mocked(taskApi.cancelTask);

const task: Task = {
  completedAt: null,
  createdAt: '2026-08-14T08:00:00.000Z',
  description: null,
  dueDate: null,
  estimatedMinutes: null,
  id: 'audit-task',
  plannedDate: localDateKey(),
  position: 0,
  priority: 'normal',
  status: 'open',
  title: 'משימת מדידה',
  updatedAt: '2026-08-14T08:00:00.000Z',
  weekPlanId: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

function ActiveTaskConsumers() {
  useTasks({ placement: 'inbox' });
  useTasks({ plannedDate: localDateKey() });
  useTasks({ weekStart: '2026-08-09' });
  const create = useCreateTask();
  const update = useUpdateTask();
  const cancel = useCancelTask();

  return (
    <View>
      <Pressable
        accessibilityLabel="צור משימת מדידה"
        onPress={() => void create.mutateAsync({ title: 'משימה חדשה' })}
      >
        <Text>יצירה</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="עדכן משימת מדידה"
        onPress={() => void update.mutateAsync({ id: task.id, input: { status: 'completed' } })}
      >
        <Text>עדכון</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="בטל משימת מדידה"
        onPress={() => void cancel.mutateAsync(task.id)}
      >
        <Text>ביטול</Text>
      </Pressable>
      <Text>{create.isSuccess ? 'היצירה הושלמה' : 'ממתין ליצירה'}</Text>
      <Text>{update.isSuccess ? 'העדכון הושלם' : 'ממתין'}</Text>
      <Text>{cancel.isSuccess ? 'הביטול הושלם' : 'ממתין לביטול'}</Text>
    </View>
  );
}

it('does not refetch unrelated Task collections after create, update, or cancel', async () => {
  listTasksMock.mockResolvedValue([]);
  createTaskMock.mockResolvedValue({ ...task, id: 'created-task', plannedDate: null });
  updateTaskMock.mockResolvedValue({ ...task, completedAt: '2026-08-14T09:00:00.000Z', status: 'completed' });
  cancelTaskMock.mockResolvedValue({ ...task, status: 'cancelled' });
  await render(<TestProviders><ActiveTaskConsumers /></TestProviders>);

  await waitFor(() => expect(listTasksMock).toHaveBeenCalledTimes(3));
  const user = userEvent.setup();
  await user.press(screen.getByLabelText('צור משימת מדידה'));
  expect(await screen.findByText('היצירה הושלמה')).toBeTruthy();
  expect(createTaskMock).toHaveBeenCalledTimes(1);
  expect(listTasksMock).toHaveBeenCalledTimes(3);

  await user.press(screen.getByLabelText('עדכן משימת מדידה'));
  await waitFor(() => expect(updateTaskMock).toHaveBeenCalledTimes(1));
  expect(await screen.findByText('העדכון הושלם')).toBeTruthy();
  expect(listTasksMock).toHaveBeenCalledTimes(3);

  await user.press(screen.getByLabelText('בטל משימת מדידה'));
  expect(await screen.findByText('הביטול הושלם')).toBeTruthy();
  expect(cancelTaskMock).toHaveBeenCalledTimes(1);
  expect(listTasksMock).toHaveBeenCalledTimes(3);
});

function InboxQueryConsumer() {
  const query = useTasks({ placement: 'inbox' });
  return <Text>{query.isSuccess ? 'Inbox נטען' : 'טוען'}</Text>;
}

function RouteRemountHarness() {
  const [mounted, setMounted] = useState(true);
  return (
    <View>
      <Pressable accessibilityLabel="החלף מסך" onPress={() => setMounted((value) => !value)}>
        <Text>ניווט</Text>
      </Pressable>
      {mounted ? <InboxQueryConsumer /> : null}
    </View>
  );
}

it('reuses fresh Task data when a route remounts', async () => {
  listTasksMock.mockResolvedValue([]);
  await render(<TestProviders><RouteRemountHarness /></TestProviders>);
  await waitFor(() => expect(listTasksMock).toHaveBeenCalledTimes(1));
  const user = userEvent.setup();

  await user.press(screen.getByLabelText('החלף מסך'));
  expect(screen.queryByText('Inbox נטען')).toBeNull();
  await user.press(screen.getByLabelText('החלף מסך'));

  expect(await screen.findByText('Inbox נטען')).toBeTruthy();
  expect(listTasksMock).toHaveBeenCalledTimes(1);
});
