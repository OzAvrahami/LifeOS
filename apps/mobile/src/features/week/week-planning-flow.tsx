import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

import { planningCarryover, unplannedWeekCommitments, weeklyFocuses } from './week.fixture';

const steps = [
  { title: 'מה נשאר מהשבוע הקודם?', subtitle: 'בחר מה עדיין נכון לקחת איתך לשבוע החדש.' },
  { title: 'מה כבר קבוע השבוע?', subtitle: 'עוברים לרגע על ההתחייבויות שכבר נמצאות ביומן.' },
  { title: 'מה חשוב שיקרה השבוע?', subtitle: 'בחר עד שלושה מיקודים. אפשר גם לכתוב חדש.' },
  { title: 'מתי נכון לעשות כל דבר?', subtitle: 'בחר יום מתאים לדברים החשובים — בלי למלא כל שעה.' },
] as const;

export function WeekPlanningFlow({ initialStep = 0, onDone }: { initialStep?: number; onDone: () => void }) {
  const [step, setStep] = useState(initialStep);
  const [selectedFocuses, setSelectedFocuses] = useState<string[]>(weeklyFocuses.slice(0, 2).map((focus) => focus.id));
  const [newFocus, setNewFocus] = useState('');

  const next = () => {
    if (step === steps.length - 1) onDone();
    else setStep((current) => current + 1);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View accessibilityLabel="תכנון השבוע" style={styles.container}>
        <View style={styles.topRow}>
          <Pressable accessibilityLabel="חזרה לשבוע" accessibilityRole="button" onPress={onDone} style={styles.close}>
            <Ionicons color={colors.textSoft} name="close" size={22} />
          </Pressable>
          <Text style={styles.flowTitle}>תכנון השבוע</Text>
          <Text style={styles.stepLabel}>שלב {step + 1} מתוך 4</Text>
        </View>
        <View accessibilityLabel={`התקדמות תכנון: שלב ${step + 1} מתוך 4`} style={styles.progress}>
          {steps.map((_, index) => <View key={index} style={[styles.progressSegment, index <= step && styles.progressComplete]} />)}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>{steps[step].title}</Text>
          <Text style={styles.subtitle}>{steps[step].subtitle}</Text>
          {step === 0 ? <CarryoverStep /> : null}
          {step === 1 ? <CommitmentsStep /> : null}
          {step === 2 ? (
            <FocusStep
              newFocus={newFocus}
              onChangeNewFocus={setNewFocus}
              onToggle={(id) => setSelectedFocuses((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current)}
              selected={selectedFocuses}
            />
          ) : null}
          {step === 3 ? <ScheduleStep /> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable accessibilityRole="button" onPress={next} style={styles.continueButton}>
            <Text style={styles.continueText}>{step === 3 ? 'סיום התכנון' : 'המשך'}</Text>
          </Pressable>
          {step > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => setStep((current) => current - 1)} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>חזרה</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={next} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>דלג לשלב הבא</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function CarryoverStep() {
  return <View style={styles.options}>{planningCarryover.map((title) => <SelectableRow key={title} selected title={title} />)}</View>;
}

function CommitmentsStep() {
  return (
    <View style={styles.options}>
      {unplannedWeekCommitments.map((item) => (
        <View key={item.id} style={styles.commitmentRow}>
          <Text style={styles.commitmentDay}>{item.weekday}</Text>
          <Text style={styles.optionTitle}>{item.title}</Text>
          <Text style={styles.commitmentTime}>{item.time}</Text>
        </View>
      ))}
    </View>
  );
}

function FocusStep({ newFocus, onChangeNewFocus, onToggle, selected }: { newFocus: string; onChangeNewFocus: (value: string) => void; onToggle: (id: string) => void; selected: string[] }) {
  return (
    <View style={styles.options}>
      {weeklyFocuses.slice(0, 2).map((focus) => (
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(focus.id) }} key={focus.id} onPress={() => onToggle(focus.id)}>
          <SelectableRow selected={selected.includes(focus.id)} title={focus.title} />
        </Pressable>
      ))}
      <SelectableRow selected={false} title="נשאר משבוע שעבר · להכין הצעת מחיר" />
      <View style={styles.newFocusRow}>
        <Text style={styles.plus}>+</Text>
        <TextInput accessibilityLabel="מיקוד חדש" onChangeText={onChangeNewFocus} placeholder="מיקוד חדש…" placeholderTextColor={colors.textFaint} style={styles.newFocusInput} textAlign="right" value={newFocus} />
      </View>
    </View>
  );
}

function ScheduleStep() {
  return (
    <View style={styles.options}>
      {weeklyFocuses.slice(0, 3).map((focus, index) => (
        <View key={focus.id} style={styles.scheduleRow}>
          <Text style={styles.optionTitle}>{focus.title}</Text>
          <View style={styles.dayChoice}><Text style={styles.dayChoiceText}>{['שלישי', 'חמישי', 'שישי'][index]}</Text></View>
        </View>
      ))}
    </View>
  );
}

function SelectableRow({ selected, title }: { selected: boolean; title: string }) {
  return (
    <View style={[styles.selectableRow, selected && styles.selectedRow]}>
      <View style={[styles.checkbox, selected && styles.checked]}>
        {selected ? <Ionicons color={colors.white} name="checkmark" size={14} /> : null}
      </View>
      <Text style={styles.optionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: spacing.xs },
  topRow: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  close: { alignItems: 'center', height: 44, justifyContent: 'center', width: 38 },
  flowTitle: { color: colors.text, fontFamily: typography.family.bold, fontSize: typography.size.body, writingDirection: 'rtl' },
  stepLabel: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: typography.size.meta, minWidth: 86, textAlign: 'left', writingDirection: 'rtl' },
  progress: { flexDirection: 'row-reverse', gap: 6, marginTop: spacing.xs },
  progressSegment: { backgroundColor: '#E4DED2', borderRadius: 3, flex: 1, height: 5 },
  progressComplete: { backgroundColor: colors.accent },
  content: { paddingBottom: spacing.lg },
  heading: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 24, lineHeight: 32, marginTop: 26, textAlign: 'right', writingDirection: 'rtl' },
  subtitle: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: typography.size.body, lineHeight: 23, marginTop: spacing.xs, textAlign: 'right', writingDirection: 'rtl' },
  options: { gap: spacing.xs, marginTop: spacing.lg },
  selectableRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row-reverse', gap: 11, minHeight: 52, padding: 14 },
  selectedRow: { backgroundColor: colors.accentWeak, borderColor: colors.accentWeak },
  checkbox: { alignItems: 'center', borderColor: '#C9C3B5', borderRadius: 7, borderWidth: 1.75, height: 22, justifyContent: 'center', width: 22 },
  checked: { backgroundColor: colors.accent, borderColor: colors.accent },
  optionTitle: { color: colors.text, flex: 1, fontFamily: typography.family.semibold, fontSize: typography.size.button, textAlign: 'right', writingDirection: 'rtl' },
  commitmentRow: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, flexDirection: 'row-reverse', gap: spacing.sm, minHeight: 54, padding: 14 },
  commitmentDay: { color: colors.textSubtle, fontFamily: typography.family.bold, fontSize: typography.size.label, writingDirection: 'rtl' },
  commitmentTime: { color: colors.textFaint, fontFamily: typography.family.regular, fontSize: typography.size.label, writingDirection: 'ltr' },
  newFocusRow: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, flexDirection: 'row-reverse', gap: 11, minHeight: 52, paddingHorizontal: 14 },
  plus: { color: colors.accent, fontFamily: typography.family.regular, fontSize: 20 },
  newFocusInput: { color: colors.text, flex: 1, fontFamily: typography.family.regular, fontSize: typography.size.button, writingDirection: 'rtl' },
  scheduleRow: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, flexDirection: 'row-reverse', gap: spacing.sm, minHeight: 58, padding: 14 },
  dayChoice: { backgroundColor: colors.accentWeak, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  dayChoiceText: { color: colors.accent, fontFamily: typography.family.bold, fontSize: typography.size.label, writingDirection: 'rtl' },
  footer: { gap: spacing.xs, paddingBottom: spacing.sm },
  continueButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 15, height: 52, justifyContent: 'center' },
  continueText: { color: colors.white, fontFamily: typography.family.bold, fontSize: typography.size.button, writingDirection: 'rtl' },
  secondaryButton: { alignItems: 'center', minHeight: 32, justifyContent: 'center' },
  secondaryText: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.body, writingDirection: 'rtl' },
});
