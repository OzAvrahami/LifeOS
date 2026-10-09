import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, use, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors as legacyColors } from './tokens';

export const palettes = {
  light: { ...legacyColors, background: '#F7F7F2', surface: '#FFFFFF', surfaceMuted: '#ECEFE9', text: '#203C35', textSoft: '#203C35', textMuted: '#6C7E76', textSubtle: '#6C7E76', textFaint: '#6C7E76', border: '#E3E9E1', divider: '#E3E9E1', accent: '#1F6250', accentText: '#1F6250', accentWeak: '#EAF2E9', onAccent: '#FFFFFF', completedSurface: '#ECEFE9', warningBadge: '#FBF1D9', warningAction: '#A44E3D', warningMuted: '#A44E3D', warningSurface: '#FBF1D9', warningText: '#A44E3D', gold: '#E8B85E' },
  dark: { ...legacyColors, background: '#17221F', surface: '#23312D', surfaceMuted: '#314B3C', text: '#ECF1E9', textSoft: '#ECF1E9', textMuted: '#ACBCB3', textSubtle: '#ACBCB3', textFaint: '#ACBCB3', border: '#394B43', divider: '#394B43', accent: '#B6DFC2', accentText: '#B6DFC2', accentWeak: '#314B3C', onAccent: '#17372B', completedSurface: '#314B3C', warningBadge: '#4D422B', warningAction: '#F2AA94', warningMuted: '#F2AA94', warningSurface: '#4D422B', warningText: '#F2AA94', gold: '#E8B85E' },
};
export type Palette = typeof palettes.light;
export type AppearancePreference = 'system' | 'light' | 'dark';
const key = 'lifeos.appearance'; // Device preference; never contains account data.
const ThemeContext = createContext({ colors: palettes.light, mode: 'light' as 'light' | 'dark', preference: 'system' as AppearancePreference, setPreference: async (_: AppearancePreference) => {} });

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, setValue] = useState<AppearancePreference>('system');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(key).then(value => {
      if (active && (value === 'light' || value === 'dark' || value === 'system')) setValue(value);
    }).catch(() => undefined).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const mode = preference === 'system' ? system === 'dark' ? 'dark' : 'light' : preference;
  const value = useMemo(() => ({ colors: palettes[mode], mode, preference, setPreference: async (next: AppearancePreference) => {
    await AsyncStorage.setItem(key, next);
    setValue(next);
  } }), [mode, preference]);
  return <ThemeContext value={value}>{ready ? children : null}</ThemeContext>;
}
export function useTheme() { return use(ThemeContext); }
