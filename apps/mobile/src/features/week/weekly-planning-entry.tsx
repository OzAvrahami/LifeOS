import { useState } from 'react';
import { Text, View } from 'react-native';

import { useSaveWeeklyPlan, useWeeklyPlan } from '@/features/planning/planning.queries';

import { DayAction } from './week-day-view';
import { WeeklyPlanningSession } from './weekly-planning-session';
import { planningStyles as styles } from './weekly-planning.styles';

export function WeeklyPlanningEntry({ weekStart, enabled = true }: { weekStart: string; enabled?: boolean }) {
  const query = useWeeklyPlan(weekStart, enabled);
  const save = useSaveWeeklyPlan();
  const [opened, setOpened] = useState(false);
  const [failed, setFailed] = useState(false);
  const plan = query.data?.weekPlan;
  const begin = async () => {
    if (save.isPending) return;
    setFailed(false);
    try {
      await save.mutateAsync({ weekStart, input: { action: 'start' } });
      setOpened(true);
    } catch { setFailed(true); }
  };
  return <View accessibilityLabel="מצב התכנון השבועי" style={styles.card}>
    <Text style={styles.heading}>תכנון שבועי</Text>
    {!enabled || query.isPending ? <Text style={styles.text}>טוען את מצב התכנון…</Text>
      : query.isError ? <>
        <Text accessibilityRole="alert" style={styles.error}>לא הצלחנו לטעון את התכנון השבועי. ייתכן שנדרש עדכון שרת.</Text>
        <DayAction label="נסה שוב טעינת תכנון" onPress={() => { void query.refetch(); }} />
      </> : <>
        {!plan || plan.status === 'not_started' ? <>
          <Text style={styles.text}>כמה דקות לסקירת המשימות וההתחייבויות ולבחירת מה שחשוב השבוע.</Text>
          <DayAction label="תכנן את השבוע" disabled={save.isPending} onPress={() => { void begin(); }} />
        </> : plan.status === 'in_progress' ? <>
          <Text style={styles.text}>תכנון שבועי בתהליך · שלב {plan.resumeStep} מתוך 4</Text>
          <DayAction label="המשך תכנון" onPress={() => { setFailed(false); setOpened(true); }} />
        </> : <>
          <Text style={styles.text}>התכנון השבועי הושלם</Text>
          <DayAction label="סקירת התכנון" onPress={() => setOpened(true)} />
        </>}
        {failed && (!plan || plan.status === 'not_started') ? <Text accessibilityRole="alert" style={styles.error}>לא הצלחנו להתחיל את התכנון. אפשר לנסות שוב.</Text> : null}
      </>}
    {opened ? <WeeklyPlanningSession weekStart={weekStart} onClose={() => setOpened(false)} /> : null}
  </View>;
}
