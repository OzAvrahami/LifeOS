import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { V2Button, V2Notice } from '@/components/v2';
import { useTheme } from '@/theme/theme-provider';
import { useTaskQueryScope } from './task-query-scope';
import { TaskQueryNotice } from './task-query-notice';
import { useCancelTask, useTasks, useUpdateTask } from './task.queries';
import { TaskDetails } from './task-details';

export function TaskDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const { colors } = useTheme();
  const owner = useTaskQueryScope();
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const query = useTasks({ id }, valid);
  const update = useUpdateTask();
  const cancel = useCancelTask();
  const task = query.data?.find(task => task.id === id && task.status !== 'cancelled');
  return <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 22, gap: 16, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
    {!task ? <V2Button secondary title="חזרה" onPress={onBack} /> : null}
    <TaskQueryNotice loading={valid && query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
    {(!valid || (query.isSuccess && !task)) ? <V2Notice title="המשימה אינה זמינה עוד." /> : null}
    {task ? <TaskDetails task={task} key={owner + ':' + task.id} backLabel="חזרה" onClose={onBack}
      onUpdate={async input => { await update.mutateAsync({ id, input }); }}
      onDelete={async () => { await cancel.mutateAsync(id); }} /> : null}
    </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
