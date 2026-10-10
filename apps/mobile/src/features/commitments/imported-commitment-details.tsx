import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { V2Button, V2Card, V2Text } from '@/components/v2';
import { useTheme } from '@/theme/theme-provider';
import type { Commitment } from './commitment.types';
import { commitmentTimeLabel, commitmentSourceLabel } from './commitment-presentation';

export function ImportedCommitmentDetails({ commitment: item, onClose }: { commitment: Commitment; onClose: () => void }) {
  const { colors } = useTheme();
  return <Modal visible animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 18, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <V2Button secondary title="חזרה" onPress={onClose} />
        <V2Text variant="title">{item.title}</V2Text>
        <V2Card><V2Text>{commitmentTimeLabel(item)}</V2Text><V2Text muted>{item.date}</V2Text>
          <V2Text muted>{commitmentSourceLabel(item)}</V2Text>
          {!item.calendarSource?.allDay ? <V2Text muted>אזור זמן לתצוגה: {item.calendarSource?.displayTimeZone}</V2Text> : null}
        </V2Card>
        {item.location ? <View><V2Text variant="heading">מיקום</V2Text><V2Text selectable>{item.location}</V2Text></View> : null}
        {item.description ? <View><V2Text variant="heading">תיאור</V2Text><V2Text selectable>{item.description}</V2Text></View> : null}
        <V2Text muted>האירוע מיובא לקריאה בלבד. שינויים מבצעים ב־Google ולאחר מכן מייבאים מחדש דרך הגדרות היומן. לא נשלחות תזכורות LifeOS לאירועים מיובאים.</V2Text>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
