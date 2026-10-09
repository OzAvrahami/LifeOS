import type { ChangeEvent, CSSProperties, ReactNode } from 'react';

import { radius, typography } from '@/theme/tokens';
import { useTheme, type Palette } from '@/theme/theme-provider';

// Web retains its native HTML fields; no separate selection surface is needed.
export function CommitmentTimePickerProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function CommitmentTimePicker() { return null; }

export function CommitmentDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { colors, mode } = useTheme();
  const styles = createStyles(colors, mode);
  return (
    <input
      aria-label="תאריך ההתחייבות"
      dir="ltr"
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      style={{ ...styles.field, ...styles.date }}
      type="date"
      value={value}
    />
  );
}

export function CommitmentTimeField({
  accessibilityLabel,
  onChange,
  placeholder,
  value,
  webMinuteStep = 15,
}: {
  accessibilityLabel: string;
  onChange: (value: string | null) => void;
  optional?: boolean;
  placeholder: string;
  value: string | null;
  webMinuteStep?: 1 | 15;
}) {
  const { colors, mode } = useTheme();
  const styles = createStyles(colors, mode);
  return (
    <div style={styles.timeContainer}>
      <input
        aria-label={accessibilityLabel}
        dir="ltr"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value || null)}
        placeholder={placeholder}
        step={webMinuteStep * 60}
        style={{ ...styles.field, ...styles.time }}
        type="time"
        value={value ?? ''}
      />
    </div>
  );
}

const createStyles = (colors: Palette, mode: 'light' | 'dark'): Record<string, CSSProperties> => ({
  field: {
    backgroundColor: colors.completedSurface,
    border: 0,
    borderRadius: radius.md,
    boxSizing: 'border-box',
    color: colors.textSoft,
    colorScheme: mode,
    fontFamily: typography.family.semibold,
    minHeight: 50,
    outlineColor: colors.accent,
    paddingInline: 16,
    width: '100%',
  },
  date: { fontSize: typography.size.button, textAlign: 'right' },
  timeContainer: { flex: 1 },
  time: { fontFamily: typography.family.bold, fontSize: 18, textAlign: 'center' },
});
