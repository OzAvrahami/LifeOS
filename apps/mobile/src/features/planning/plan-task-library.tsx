import { useState } from 'react';
import { FlatList, Modal, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { V2Button, V2Card, V2Notice, V2Text } from '@/components/v2';
import { TaskDetailScreen } from '@/features/tasks/task-detail-screen';
import { useTheme } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';
import { useDailyFlow } from './daily-flow.queries';

// Minimal discovery for unselected dated/week-only work; the full #33 migration
// remains separate. Uses the complete caller snapshot, not the Inbox-only filter.
export function PlanTaskLibrary({ date, onClose }: { date: string; onClose: () => void }) {
  const { colors } = useTheme(); const { query } = useDailyFlow(date);
  const [details, setDetails] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const tasks = (query.data?.tasks ?? []).filter(t => completed ? t.status === 'completed' : ['open', 'in_progress'].includes(t.status));
  return <Modal visible animationType="slide" onRequestClose={onClose}>
    {details ? <TaskDetailScreen id={details} onBack={() => setDetails(null)} /> : <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList data={tasks} keyExtractor={task => task.id} contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListHeaderComponent={<View style={{ gap: spacing.md }}>
          <V2Button secondary title="חזרה" onPress={onClose} />
          <V2Text variant="title">כל המשימות</V2Text>
          <V2Text muted>גם משימות מתאריכים קודמים, מימים עתידיים וללא תאריך. בחירה בתוכנית אינה יוצרת עותק.</V2Text>
          <V2Button secondary title={completed ? 'הצגת משימות פתוחות' : 'הצגת משימות שהושלמו'} onPress={() => setCompleted(value => !value)} />
          {query.isError ? <V2Notice error title="לא הצלחנו לרענן את רשימת המשימות." onRetry={() => { void query.refetch(); }} /> : null}
        </View>}
        ListEmptyComponent={<V2Text muted>{query.data ? completed ? 'אין משימות שהושלמו.' : 'אין משימות פתוחות.' : query.isError ? 'הרשימה אינה זמינה.' : 'טוען משימות…'}</V2Text>}
        renderItem={({ item }) => <V2Card><V2Button secondary title={item.title} onPress={() => setDetails(item.id)} />
          <V2Text variant="caption" muted>{item.plannedDate ? `תאריך המשימה: ${item.plannedDate}` : item.weekPlanId ? 'בתכנון שבועי · ללא יום' : 'ללא תאריך'}{item.dueDate ? ` · יעד: ${item.dueDate}` : ''}</V2Text>
        </V2Card>} />
    </SafeAreaView>}
  </Modal>;
}
