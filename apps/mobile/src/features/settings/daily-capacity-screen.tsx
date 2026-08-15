import { useState } from 'react';

import { RadioOption, SettingsChoiceSheet } from './settings.components';
import { useEffectiveSettings, usePutSettings } from './settings.queries';
import { hoursLabel } from './settings-time';
import { capacityOptions, type EffectiveUserSettings } from './settings.types';

export function DailyCapacityScreen({ onClose }: { onClose: () => void }) {
  const { effective, query } = useEffectiveSettings();
  if (query.isPending) return null;
  return <DailyCapacityForm key={effective.defaultDailyCapacityMinutes} onClose={onClose} settings={effective} />;
}

function DailyCapacityForm({ onClose, settings }: { onClose: () => void; settings: EffectiveUserSettings }) {
  const [selected, setSelected] = useState(settings.defaultDailyCapacityMinutes);
  const [error, setError] = useState<string | null>(null);
  const mutation = usePutSettings();
  const save = async () => {
    setError(null);
    try {
      await mutation.mutateAsync({
        defaultDailyCapacityMinutes: selected,
        timezone: settings.timezone,
        weekStartDay: settings.weekStartDay,
      });
      onClose();
    } catch {
      setError('לא הצלחנו לשמור. אפשר לנסות שוב.');
    }
  };
  return (
    <SettingsChoiceSheet
      description="«זמן זמין» הוא הזמן שבדרך כלל תרצה להקדיש למשימות ולהתחייבויות ביום רגיל."
      error={error}
      onCancel={onClose}
      onSave={() => void save()}
      saving={mutation.isPending}
      title="זמן זמין ביום"
    >
      {capacityOptions.map((minutes) => (
        <RadioOption
          current={minutes === settings.defaultDailyCapacityMinutes}
          key={minutes}
          label={hoursLabel(minutes)}
          onPress={() => setSelected(minutes)}
          selected={minutes === selected}
        />
      ))}
    </SettingsChoiceSheet>
  );
}
