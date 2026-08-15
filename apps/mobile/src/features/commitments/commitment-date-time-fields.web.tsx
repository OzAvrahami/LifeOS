import type { ChangeEvent, CSSProperties } from 'react';

import { colors, radius, typography } from '@/theme/tokens';

export function CommitmentDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
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
}: {
  accessibilityLabel: string;
  onChange: (value: string | null) => void;
  optional?: boolean;
  placeholder: string;
  value: string | null;
}) {
  return (
    <div style={styles.timeContainer}>
      <input
        aria-label={accessibilityLabel}
        dir="ltr"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value || null)}
        placeholder={placeholder}
        step={900}
        style={{ ...styles.field, ...styles.time }}
        type="time"
        value={value ?? ''}
      />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  field: {
    backgroundColor: colors.completedSurface,
    border: 0,
    borderRadius: radius.md,
    boxSizing: 'border-box',
    color: colors.textSoft,
    colorScheme: 'light',
    fontFamily: typography.family.semibold,
    minHeight: 50,
    outlineColor: colors.accent,
    paddingInline: 16,
    width: '100%',
  },
  date: { fontSize: typography.size.button, textAlign: 'right' },
  timeContainer: { flex: 1 },
  time: { fontFamily: typography.family.bold, fontSize: 18, textAlign: 'center' },
};
