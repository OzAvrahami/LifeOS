import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useTheme, type AppearancePreference } from '@/theme/theme-provider';
import { V2Text } from '@/components/v2';
import { RadioOption } from './settings.components';
import { V2SettingsHeading as SettingsSectionLabel } from './v2-settings';

export function AppearanceSetting() {
  const { preference, setPreference } = useTheme();
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const options: [AppearancePreference, string][] = [['system', 'לפי המכשיר'], ['light', 'בהיר'], ['dark', 'כהה']];
  return <><SettingsSectionLabel>מראה</SettingsSectionLabel><View style={{ gap: 8 }}>
    {options.map(([value, label]) => <RadioOption key={value} label={label} selected={value === preference} disabled={pending} onPress={async () => {
      if (saving.current) return;
      saving.current = true; setPending(true); setError(false);
      try { await setPreference(value); } catch { setError(true); } finally { saving.current = false; setPending(false); }
    }} />)}
    {error ? <V2Text accessibilityRole="alert">לא הצלחנו לשמור את המראה. אפשר לנסות שוב.</V2Text> : null}
  </View></>;
}
