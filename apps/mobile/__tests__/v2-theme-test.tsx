import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { AppearanceSetting } from '@/features/settings/appearance-setting';

function Probe() { const { mode } = useTheme(); return <><Text>{mode}</Text><AppearanceSetting /></>; }
it('restores appearance and persists a changed preference across remounts', async () => {
  await AsyncStorage.setItem('lifeos.appearance', 'dark');
  const view = await render(<ThemeProvider><Probe /></ThemeProvider>);
  await screen.findByText('dark');
  await fireEvent.press(screen.getByRole('radio', { name: 'בהיר' }));
  await screen.findByText('light');
  expect(await AsyncStorage.getItem('lifeos.appearance')).toBe('light');
  await view.unmount();
  await render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(await screen.findByText('light')).toBeTruthy();
});
