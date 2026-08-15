import { useState } from 'react';

import { RadioOption, SettingsChoiceSheet } from './settings.components';
import { useEffectiveSettings, usePutSettings } from './settings.queries';
import { type EffectiveUserSettings, weekdayLabels } from './settings.types';

export function WeekStartScreen({ onClose }: { onClose: () => void }) {
  const { effective, query } = useEffectiveSettings();
  if (query.isPending) return null;
  return <WeekStartForm key={effective.weekStartDay} onClose={onClose} settings={effective} />;
}

function WeekStartForm({ onClose, settings }: { onClose: () => void; settings: EffectiveUserSettings }) {
  const [selected, setSelected] = useState(settings.weekStartDay);
  const [error, setError] = useState<string | null>(null);
  const mutation = usePutSettings();
  const save = async () => {
    setError(null);
    try {
      await mutation.mutateAsync({
        defaultDailyCapacityMinutes: settings.defaultDailyCapacityMinutes,
        timezone: settings.timezone,
        weekStartDay: selected,
      });
      onClose();
    } catch {
      setError('לא הצלחנו לשמור. אפשר לנסות שוב.');
    }
  };
  return (
    <SettingsChoiceSheet
      description="היום שממנו מתחיל השבוע בתצוגת השבוע ובטווחי התכנון."
      error={error}
      onCancel={onClose}
      onSave={() => void save()}
      saving={mutation.isPending}
      title="תחילת שבוע"
    >
      {weekdayLabels.map((label, day) => (
        <RadioOption
          current={day === settings.weekStartDay}
          key={label}
          label={label}
          onPress={() => setSelected(day)}
          selected={day === selected}
        />
      ))}
    </SettingsChoiceSheet>
  );
}
