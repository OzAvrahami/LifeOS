import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { MobileShell } from '@/components/mobile-shell';
import { V2Button, V2Card, V2Notice, V2Text } from '@/components/v2';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { useCommitments } from '@/features/commitments/commitment.queries';
import { useEffectiveSettings } from '@/features/settings/settings.queries';
import { useTaskCapture } from '@/features/tasks/use-task-capture';
import { localDateKey } from '@/features/tasks/task-dates';
import { spacing } from '@/theme/tokens';
import { useTaskQueryScope } from '@/features/tasks/task-query-scope';

export default function CalendarRoute() {
  const scope = useTaskQueryScope();
  return <CalendarScreen key={scope} />;
}
function CalendarScreen() {
  const router = useRouter();
  const { effective, query: settingsQuery } = useEffectiveSettings();
  const date = localDateKey(undefined, effective.timezone);
  const query = useCommitments({ date }, settingsQuery.data !== undefined);
  const [capture, setCapture] = useState(false);
  const { captureTask, defaultDate } = useTaskCapture('server');
  return <><MobileShell selected="calendar" onQuickCapture={() => setCapture(true)}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
      <V2Text variant="title">היומן שלי</V2Text>
      <V2Text muted>ההתחייבויות שלי להיום · {date}</V2Text>
      <V2Notice title="מוצגות התחייבויות מ־LifeOS בלבד. חיבורי Google ו־Apple יתווספו בהמשך." />
      {settingsQuery.isError ? <V2Notice error title="לא הצלחנו לטעון את הגדרות היום." onRetry={() => { void settingsQuery.refetch(); }} /> : null}
      {query.data === undefined && !query.isError ? <V2Text>טוען…</V2Text> : null}
      {query.isError ? <V2Notice error title="לא הצלחנו לרענן את היומן." onRetry={() => { void query.refetch(); }} /> : null}
      {query.data?.length === 0 ? <V2Text>אין התחייבויות שמורות להיום.</V2Text> : null}
      {query.data?.map(item => <V2Card key={item.id}><V2Text muted>{item.startTime}{item.endTime ? `–${item.endTime}` : ''}</V2Text><V2Button secondary title={item.title} onPress={() => router.push({ pathname: '/commitment', params: { id: item.id } })} /></V2Card>)}
      <V2Button title="ימים נוספים ותכנון שבועי" onPress={() => router.navigate('/week')} />
    </ScrollView>
  </MobileShell><QuickCaptureSheet defaultDate={defaultDate} visible={capture} onClose={() => setCapture(false)} onSave={captureTask} /></>;
}
