import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { colors } from '@/theme/tokens';

import type { TaskDateControlProps } from './task-date-control.types';
import { localDateKey, planningDateToLocalDate } from './task-dates';

export function TaskDateControl({ value, onChange, onConfirm, onCancel }: TaskDateControlProps) {
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const ios = Platform.OS === 'ios';
  return (
    <DateTimePicker
      accessibilityLabel="תאריך לתכנון"
      display={ios ? 'spinner' : 'default'}
      mode="date"
      onValueChange={(_event, selected) => {
        if (!active.current) return;
        const date = localDateKey(selected);
        if (ios) onChange(date);
        else { active.current = false; onConfirm(date); }
      }}
      onDismiss={() => {
        if (!active.current) return;
        active.current = false;
        onCancel();
      }}
      {...(ios ? { textColor: colors.text } : {
        positiveButton: { label: 'אישור' }, negativeButton: { label: 'ביטול' },
      })}
      style={{ alignSelf: 'stretch', width: '100%' }}
      value={planningDateToLocalDate(value)}
    />
  );
}
