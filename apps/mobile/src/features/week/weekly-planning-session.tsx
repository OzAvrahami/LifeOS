import { useRef, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSaveWeeklyPlan, useWeeklyPlan } from '@/features/planning/planning.queries';
import type { WeeklyPlanningInput } from '@/features/planning/planning.types';
import { hebrewSelectedWeekRange } from '@/features/tasks/task-dates';

import { DayAction } from './week-day-view';
import { WeeklyFocusEditor } from './weekly-focus-editor';
import { WeeklyPlanningReview } from './weekly-planning-review';
import { planningStyles as styles } from './weekly-planning.styles';

const titles = ['מה נשאר מהשבוע הקודם?', 'מה כבר קבוע השבוע?', 'מה חשוב שיקרה השבוע?', 'סקירה וסיום התכנון'];

export function WeeklyPlanningSession({ weekStart, onClose }: { weekStart: string; onClose: () => void }) {
  const query = useWeeklyPlan(weekStart);
  const save = useSaveWeeklyPlan();
  const [step, setStep] = useState(() => Math.max(1, query.data?.weekPlan?.resumeStep ?? 1));
  const [editingFocus, setEditingFocus] = useState(false);
  const [reviewReady, setReviewReady] = useState(false);
  const [error, setError] = useState(false);
  const busy = useRef(false);
  const completed = query.data?.weekPlan?.status === 'completed';
  const shownStep = completed ? 4 : step;
  const close = () => { if (!busy.current && !editingFocus) onClose(); };
  const persist = async (input: WeeklyPlanningInput) => {
    if (busy.current) return;
    busy.current = true;
    setError(false);
    try {
      const result = await save.mutateAsync({ weekStart, input });
      if (input.action === 'save' && input.advance) {
        setReviewReady(false);
        setStep(Math.min(4, step + 1));
      }
      return result;
    } catch (cause) {
      setError(true);
      throw cause;
    } finally { busy.current = false; }
  };
  return <Modal visible animationType="slide" onRequestClose={close}>
    {editingFocus && query.data ? <WeeklyFocusEditor
      focuses={query.data.focuses} dateRange={hebrewSelectedWeekRange(weekStart)}
      contextLabel={completed ? 'עריכת תכנון שהושלם · השמירה משאירה את התכנון במצב הושלם' : 'שלב 3 מתוך 4 · המיקודים נשמרים בלחיצה על שמירת מיקודים'}
      onCancel={() => setEditingFocus(false)} onSaved={() => setEditingFocus(false)}
      onSave={async titles => {
        const result = await persist({ action: 'save', step: 3, advance: false, titles });
        if (!result) throw new Error('Planning save is already pending');
        return result.focuses;
      }} /> : <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <ScrollView accessibilityLabel="תכנון שבועי שמור" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <DayAction label="סגירת התכנון וחזרה לשבוע" onPress={close} disabled={save.isPending} />
        <Text style={styles.text}>{hebrewSelectedWeekRange(weekStart)}</Text>
        {query.isPending ? <Text style={styles.text}>טוען את התכנון…</Text>
          : query.isError || !query.data?.weekPlan ? <>
            <Text accessibilityRole="alert" style={styles.error}>לא הצלחנו לטעון את התכנון השמור.</Text>
            <DayAction label="נסה שוב תכנון שמור" onPress={() => { void query.refetch(); }} />
          </> : <>
            <Text style={styles.heading}>{completed ? 'סקירת התכנון שהושלם' : titles[step - 1]}</Text>
            {!completed ? <Text style={styles.text}>שלב {step} מתוך 4</Text> : null}
            <Text style={styles.text}>{completed
              ? 'זהו התכנון הקיים לשבוע הזה. עריכת מיקודים אינה מתחילה תכנון חדש.'
              : 'המשך שומר את ההתקדמות. מיקודים נשמרים בכפתור השמירה בעורך; ביטול בעורך מוותר רק על השינויים שלא נשמרו.'}</Text>
            {shownStep === 1 ? <Text style={styles.text}>סקירה בלבד: משימות לא מועברות אוטומטית. שינוי תאריך נעשה במסך השבוע והיום.</Text> : null}
            {shownStep !== 3 ? <WeeklyPlanningReview weekStart={weekStart} step={shownStep} onReady={setReviewReady} /> : null}
            {shownStep >= 3 ? <View style={styles.card}>
              <Text style={styles.heading}>מיקודים לשבוע · לא משימות</Text>
              {query.data.focuses.length ? query.data.focuses.map(f => <Text key={f.id} style={styles.text}>{f.title}</Text>)
                : <Text style={styles.text}>לא נבחרו מיקודים. אפשר להמשיך גם ללא מיקודים.</Text>}
              {shownStep === 3 || completed ? <DayAction label={completed ? 'עריכת התכנון' : 'בחירת מיקודים'}
                disabled={save.isPending} onPress={() => { setError(false); setEditingFocus(true); }} /> : null}
            </View> : null}
            {error ? <Text accessibilityRole="alert" style={styles.error}>לא הצלחנו לשמור את התכנון. אפשר לנסות שוב; השלמה מוצגת רק אחרי אישור מהשרת.</Text> : null}
            {!completed ? <>
              <DayAction label={step === 4 ? 'סיום תכנון' : 'שמירה והמשך'} disabled={save.isPending || (step !== 3 && !reviewReady)}
                onPress={() => { void persist(step === 4 ? { action: 'complete' } : { action: 'save', step, advance: true }).catch(() => {}); }} />
              {step > 1 ? <DayAction label="השלב הקודם" disabled={save.isPending} onPress={() => { setError(false); setReviewReady(false); setStep(step - 1); }} /> : null}
            </> : null}
            {shownStep === 4 ? <DayAction label="חזרה לשבוע לצפייה ולשיבוץ משימות" disabled={save.isPending} onPress={close} /> : null}
          </>}
      </ScrollView>
    </SafeAreaView>}
  </Modal>;
}
