import { useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { V2Button, V2Notice, V2TaskRow, V2Text } from '@/components/v2';
import { MobileShell } from '@/components/mobile-shell';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { useDailyFlow } from '@/features/planning/daily-flow.queries';
import { getTaskMemberships } from '@/features/planning/week-allocation.api';
import { useEffectiveSettings } from '@/features/settings/settings.queries';
import { useTheme } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';
import { TaskDetailScreen } from './task-detail-screen';
import { localDateKey } from './task-dates';
import { useUpdateTask } from './task.queries';
import { useTaskQueryScope } from './task-query-scope';
import { useTaskCapture } from './use-task-capture';

type Props = { onNavigateToday?: () => void; onNavigateMore?: () => void; onNavigateWeek?: () => void };
export function V2TaskList(props: Props) {
  const owner = useTaskQueryScope();
  return <TaskList key={owner} {...props} />;
}
function TaskList(props: Props) {
  const { colors } = useTheme();
  const { effective: settings, query: settingsQuery } = useEffectiveSettings();
  const date = localDateKey(undefined, settings.timezone);
  const { query, userId } = useDailyFlow(date, settingsQuery.data !== undefined);
  const memberships = useQuery({ queryKey: ['task-memberships', userId, date],
    queryFn: ({ signal }) => getTaskMemberships(userId, date, signal), enabled: settingsQuery.data !== undefined, staleTime: 0 });
  const update = useUpdateTask();
  const { captureTask, defaultDate } = useTaskCapture('server');
  const [capture, setCapture] = useState(false);
  const [details, setDetails] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'unplanned' | 'done'>('open');
  const [failure, setFailure] = useState(false);
  const datesFor = (id: string) => memberships.data?.days.filter(day => day.ids.includes(id)).map(day => day.date) ?? [];
  const ready = !!query.data && !!memberships.data;
  const tasks = (query.data?.tasks ?? []).filter(task => filter === 'done' ? task.status === 'completed'
    : ['open', 'in_progress'].includes(task.status) && (filter !== 'unplanned' || (!task.plannedDate && datesFor(task.id).length === 0)));
  const failed = query.isError || memberships.isError || settingsQuery.isError;
  return <>
    <MobileShell selected="inbox" {...props} onQuickCapture={() => setCapture(true)}>
      <FlatList data={ready ? tasks : []} keyExtractor={task => task.id} contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, gap: spacing.md, paddingBottom: 40, width: '100%', maxWidth: 640, alignSelf: 'center' }}
        ListHeaderComponent={<View style={{ gap: spacing.md }}>
          <V2Text variant="caption" muted>כל מה שצריך לעשות</V2Text>
          <V2Text variant="title" accessibilityRole="header">המשימות שלי</V2Text>
          <V2Text muted>הכול במקום אחד. בלי חובה לתכנן מיד.</V2Text>
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs }}>
            {([['open', 'פתוחות'], ['unplanned', 'ללא יום'], ['done', 'הושלמו']] as const).map(([id, label]) =>
              <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: filter === id }} onPress={() => setFilter(id)}
                style={{ padding: 12, minHeight: 48, borderRadius: 16, backgroundColor: filter === id ? colors.accentWeak : colors.surface }}><V2Text>{label}</V2Text></Pressable>)}
          </View>
          {ready ? <V2Text variant="caption" muted>{tasks.length} משימות ברשימה</V2Text> : null}
          {failed ? <V2Notice error title="לא הצלחנו לרענן את המשימות והתוכניות." onRetry={() => { void Promise.all([query.refetch(), memberships.refetch(), settingsQuery.refetch()]); }} /> : null}
          {failure ? <V2Notice error title="העדכון לא נשמר. אפשר לנסות שוב מהמשימה." /> : null}
          <V2Button title="משימה חדשה" onPress={() => setCapture(true)} />
        </View>}
        ListEmptyComponent={<V2Notice title={!ready ? failed ? 'הרשימה אינה זמינה כרגע.' : 'טוען משימות ותוכניות…' : 'אין כאן משימות כרגע. משימות מתאימות יופיעו כאן.'} />}
        renderItem={({ item }) => {
          const dates = datesFor(item.id);
          const context = dates.length ? 'בתוכנית: ' + dates.join(' · ') : item.plannedDate ? 'תאריך המשימה: ' + item.plannedDate : item.weekPlanId ? 'בתכנון שבועי · ללא יום' : 'ללא יום';
          return <V2TaskRow task={item} context={context + (item.priority === 'important' ? ' · חשובה' : '') + (item.dueDate ? ' · יעד: ' + item.dueDate : '')}
            pending={update.isPending} onOpen={() => setDetails(item.id)} onStatus={status => {
              setFailure(false); update.mutate({ id: item.id, input: { status } }, { onError: () => setFailure(true) });
            }} />;
        }} />
    </MobileShell>
    {details ? <Modal visible animationType="slide" onRequestClose={() => setDetails(null)}><TaskDetailScreen id={details} onBack={() => setDetails(null)} /></Modal> : null}
    <QuickCaptureSheet visible={capture} defaultDate={defaultDate} onSave={captureTask} onClose={() => setCapture(false)} />
  </>;
}
