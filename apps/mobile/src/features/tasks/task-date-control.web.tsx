import type { TaskDateControlProps } from './task-date-control.types';
import { colors, radius, typography } from '@/theme/tokens';

export function TaskDateControl({ value, onChange }: TaskDateControlProps) {
  return (
    <input
      aria-label="תאריך לתכנון"
      autoFocus
      dir="ltr"
      type="date"
      min="0100-01-01"
      max="9999-12-31"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{ backgroundColor: colors.completedSurface, border: 0, borderRadius: radius.md,
        color: colors.text, colorScheme: 'light', fontFamily: typography.family.regular,
        fontSize: 18, minHeight: 50, paddingInline: 16, boxSizing: 'border-box', width: '100%' }}
    />
  );
}
