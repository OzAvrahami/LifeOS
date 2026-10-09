import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as Native from 'react-native';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { AppearanceSetting } from '@/features/settings/appearance-setting';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';

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

it('follows system changes and preserves the device preference across account switches', async () => {
  await AsyncStorage.setItem('lifeos.appearance', 'system');
  const scheme = jest.spyOn(Native, 'useColorScheme').mockReturnValue('light');
  const tree = (userId: string) => <ThemeProvider><TaskQueryScopeProvider userId={userId}><Probe /></TaskQueryScopeProvider></ThemeProvider>;
  const view = await render(tree('account-a'));
  await screen.findByText('light');
  scheme.mockReturnValue('dark');
  await view.rerender(tree('account-a')); expect(screen.getByText('dark')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'בהיר' }));
  await screen.findByText('light');
  await view.rerender(tree('account-b')); expect(screen.getByText('light')).toBeTruthy();
  expect(await AsyncStorage.getItem('lifeos.appearance')).toBe('light');
  scheme.mockRestore();
});

it('retains the saved mode on storage failure and supports an explicit retry', async () => {
  await AsyncStorage.setItem('lifeos.appearance', 'light');
  await render(<ThemeProvider><Probe /></ThemeProvider>);
  await screen.findByText('light');
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('storage unavailable'));
  await fireEvent.press(screen.getByRole('radio', { name: 'כהה' }));
  await screen.findByRole('alert'); expect(screen.getByText('light')).toBeTruthy();
  expect(await AsyncStorage.getItem('lifeos.appearance')).toBe('light');
  await fireEvent.press(screen.getByRole('radio', { name: 'כהה' }));
  await screen.findByText('dark');
  expect(await AsyncStorage.getItem('lifeos.appearance')).toBe('dark');
});
