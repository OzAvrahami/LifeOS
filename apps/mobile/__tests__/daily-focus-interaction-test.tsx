import { render, screen, userEvent } from '@testing-library/react-native';

import { TaskList } from '@/features/today/today.components';

describe('Daily Focus task interaction', () => {
  it('uses long press to select or clear focus without also starting the Task', async () => {
    const task = {
      durationMinutes: 45,
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      lifeArea: 'work' as const,
      title: 'משימת מיקוד אמיתית',
    };
    const onStart = jest.fn();
    const onToggleFocus = jest.fn();
    await render(
      <TaskList
        onStartTask={onStart}
        onToggleFocus={onToggleFocus}
        tasks={[task]}
      />,
    );
    const row = screen.getByLabelText(`התחל משימה: ${task.title}`);
    await userEvent.setup().longPress(row);
    expect(onToggleFocus).toHaveBeenCalledWith(task.id);
    expect(onToggleFocus).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });
});
