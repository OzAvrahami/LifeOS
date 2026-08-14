import { apiRequest } from '@/lib/api/client';

import {
  cancelTask,
  createTask,
  listTasks,
  updateTask,
} from '@/features/tasks/task.api';
import { Task } from '@/features/tasks/task.types';

jest.mock('@/lib/api/client', () => ({ apiRequest: jest.fn() }));

const request = jest.mocked(apiRequest);

const task: Task = {
  completedAt: null,
  createdAt: '2026-08-13T08:00:00.000Z',
  description: null,
  dueDate: null,
  estimatedMinutes: null,
  id: 'task-1',
  plannedDate: null,
  position: 0,
  priority: 'normal',
  status: 'open',
  title: 'משימה אמיתית',
  updatedAt: '2026-08-13T08:00:00.000Z',
  weekPlanId: null,
};

beforeEach(() => request.mockReset());

describe('Task API client', () => {
  it('maps list filters and always uses the authenticated API client', async () => {
    request.mockResolvedValueOnce({ tasks: [task] });

    await expect(listTasks({ placement: 'inbox' })).resolves.toEqual([task]);

    expect(request).toHaveBeenCalledWith('/tasks?placement=inbox', {
      auth: 'required',
    });
  });

  it('creates, updates, and cancels through the Node REST contract', async () => {
    request
      .mockResolvedValueOnce({ task })
      .mockResolvedValueOnce({ task: { ...task, plannedDate: '2026-08-13' } })
      .mockResolvedValueOnce({ task: { ...task, status: 'cancelled' } });

    await createTask({ title: task.title });
    await updateTask({
      id: task.id,
      input: { planning: { plannedDate: '2026-08-13', type: 'day' } },
    });
    await cancelTask(task.id);

    expect(request).toHaveBeenNthCalledWith(1, '/tasks', {
      auth: 'required',
      body: JSON.stringify({ title: task.title }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(request).toHaveBeenNthCalledWith(2, `/tasks/${task.id}`, {
      auth: 'required',
      body: JSON.stringify({ planning: { plannedDate: '2026-08-13', type: 'day' } }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    });
    expect(request).toHaveBeenNthCalledWith(3, `/tasks/${task.id}`, {
      auth: 'required',
      method: 'DELETE',
    });
  });
});
