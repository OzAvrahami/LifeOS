import { Text } from 'react-native';
import { SettingsPage } from '@/features/settings/settings.components';
import { TaskQueryNotice } from './task-query-notice';
import { useCancelTask, useTasks, useUpdateTask } from './task.queries';
import { TaskDetails } from './task-details';

export function TaskDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const query = useTasks({ id }, valid);
  const update = useUpdateTask();
  const cancel = useCancelTask();
  const task = query.data?.find(task => task.id === id && task.status !== 'cancelled');
  return <SettingsPage title="משימה" onBack={onBack}>
    <TaskQueryNotice loading={valid && query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
    {(!valid || (query.isSuccess && !task)) ? <Text accessibilityRole="alert">המשימה אינה זמינה עוד.</Text> : null}
    {task ? <TaskDetails task={task} key={task.id} backLabel="חזרה" onClose={onBack}
      onUpdate={async input => { await update.mutateAsync({ id, input }); }}
      onDelete={async () => { await cancel.mutateAsync(id); }} /> : null}
  </SettingsPage>;
}
