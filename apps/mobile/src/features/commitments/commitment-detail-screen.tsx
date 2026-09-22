import { Text } from 'react-native';
import { SettingsPage } from '@/features/settings/settings.components';
import { useEffectiveSettings } from '@/features/settings/settings.queries';
import { TaskQueryNotice } from '@/features/tasks/task-query-notice';
import { CommitmentEditor } from './commitment-editor';
import { useCommitments, useDeleteCommitment, useUpdateCommitment } from './commitment.queries';

// Resolve by identity, never by a notification's stale date/title payload.
export function CommitmentDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const query = useCommitments({ id }, valid);
  const { query: settings } = useEffectiveSettings();
  const update = useUpdateCommitment();
  const remove = useDeleteCommitment();
  const item = query.data?.find(item => item.id === id);
  return <SettingsPage title="התחייבות" onBack={onBack}>
    <TaskQueryNotice loading={valid && (query.isPending || settings.isPending)} error={query.isError || settings.isError} onRetry={() => void Promise.all([query.refetch(), settings.refetch()])} />
    {(!valid || (query.isSuccess && !item)) ? <Text accessibilityRole="alert">ההתחייבות אינה זמינה עוד.</Text> : null}
    {item && settings.isSuccess ? <CommitmentEditor key={item.id} visible commitment={item} initialDate={item.date} notificationPreferences={settings.data.notifications} onClose={onBack}
      onSave={async input => { await update.mutateAsync({ id, input }); }}
      onDelete={async () => { await remove.mutateAsync(id); }} /> : null}
  </SettingsPage>;
}
