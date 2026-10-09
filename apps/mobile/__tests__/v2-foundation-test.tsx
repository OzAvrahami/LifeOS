import { render, screen, userEvent } from '@testing-library/react-native';
import { V2TaskRow } from '@/components/v2';
import { todayTaskUnion } from '@/features/today/v2-today-screen';
import type { Task } from '@/features/tasks/task.types';

function task(id: string, status: Task['status'] = 'open'): Task {
  return { id, title: `Task ${id}`, status, description: null, plannedDate: '2026-10-08', dueDate: null, estimatedMinutes: null, priority: 'normal', weekPlanId: null, position: 0, createdAt: '', updatedAt: '', completedAt: null };
}
it('preserves one task identity and selection order without inferring time or cloning carried work', () => {
  const a = task('a'); const b = task('b'); const cancelled = task('c', 'cancelled');
  expect(todayTaskUnion([a, b], [a, cancelled], ['c', 'a'])).toEqual([a, b]);
  expect(a).toEqual(task('a'));
});
it('uses refreshed task state when a selected task also appears in dated tasks', () => {
  expect(todayTaskUnion([task('a', 'completed')], [task('a')], ['a', 'deleted'])).toEqual([task('a', 'completed')]);
});
it('keeps completion, starting and details as separate explicit actions', async () => {
  const user = userEvent.setup(); const onStatus = jest.fn(); const onOpen = jest.fn();
  await render(<V2TaskRow task={task('a')} context="תוכננה לתאריך של היום" onStatus={onStatus} onOpen={onOpen} />);
  await user.press(screen.getByRole('button', { name: 'פרטי משימה: Task a' }));
  expect(onOpen).toHaveBeenCalledTimes(1); expect(onStatus).not.toHaveBeenCalled();
  await user.press(screen.getByRole('checkbox', { name: 'סימון כהושלמה: Task a' }));
  await user.press(screen.getByRole('button', { name: 'התחל משימה: Task a' }));
  expect(onStatus.mock.calls).toEqual([['completed'], ['in_progress']]);
});
it('blocks duplicate pending mutations and supports explicit reopening', async () => {
  const user = userEvent.setup(); const onStatus = jest.fn();
  const view = await render(<V2TaskRow task={task('a', 'completed')} context="נבחרה לתכנון היום" pending onStatus={onStatus} onOpen={jest.fn()} />);
  await user.press(screen.getByRole('checkbox')); expect(onStatus).not.toHaveBeenCalled();
  await view.rerender(<V2TaskRow task={task('a', 'completed')} context="נבחרה לתכנון היום" onStatus={onStatus} onOpen={jest.fn()} />);
  await user.press(screen.getByRole('checkbox')); expect(onStatus).toHaveBeenCalledWith('open');
});
