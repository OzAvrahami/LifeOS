import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import * as Native from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarConnectionScreen } from '@/features/settings/calendar-connection-screen';
import { NotificationDeliveryScreen } from '@/features/notifications/notification-delivery-screen';
import { V2SettingsSwitch } from '@/features/settings/v2-settings';
import { ThemeProvider } from '@/theme/theme-provider';
import { TestProviders } from '../test-utils/test-providers';

jest.mock('expo-notifications', () => ({}));

it.each(['google', 'apple'] as const)('keeps %s unavailable without fabricated connect/select/disconnect actions', async provider => {
  const back = jest.fn();
  await render(<TestProviders><CalendarConnectionScreen provider={provider} onBack={back} /></TestProviders>);
  expect(screen.getByText('החיבור עדיין אינו זמין')).toBeTruthy();
  expect(screen.getAllByRole('button')).toHaveLength(2);
  expect(screen.queryAllByRole('switch')).toHaveLength(0);
  await fireEvent.press(screen.getByRole('button', { name: 'חזרה להגדרות' }));
  expect(back).toHaveBeenCalledTimes(1);
});

it('keeps unsupported sound/vibration read-only and exposes the existing iOS settings action with retry', async () => {
  const open = jest.spyOn(Linking, 'openSettings').mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue();
  await render(<TestProviders><NotificationDeliveryScreen onBack={jest.fn()} /></TestProviders>);
  expect(screen.queryAllByRole('switch')).toHaveLength(0);
  await fireEvent.press(screen.getByRole('button', { name: 'פתיחת הגדרות iPhone' }));
  await screen.findByText('לא הצלחנו לפתוח את הגדרות המכשיר. אפשר לנסות שוב.');
  await fireEvent.press(screen.getByRole('button', { name: 'פתיחת הגדרות iPhone' }));
  expect(open).toHaveBeenCalledTimes(2); open.mockRestore();
});

it.each([['light', 440], ['dark', 320]] as const)('keeps %s narrow/standard switch labels RTL, wrapping and accessible (%s)', async (mode, width) => {
  await AsyncStorage.setItem('lifeos.appearance', mode);
  const dimensions = jest.spyOn(Native, 'useWindowDimensions').mockReturnValue({ width, height: 956, scale: 1, fontScale: 1 });
  const change = jest.fn(); const label = 'תזכורת לתכנון השבוע עם טקסט עברי ארוך';
  await render(<ThemeProvider><V2SettingsSwitch label={label} value onChange={change} /></ThemeProvider>);
  const control = await screen.findByRole('switch', { name: label });
  expect(control).toBeChecked();
  expect(screen.getByText(label)).toHaveStyle({ textAlign: 'right', writingDirection: 'rtl' });
  expect(screen.getByText(label).props.numberOfLines).toBeUndefined();
  await fireEvent.press(control); expect(change).toHaveBeenCalledWith(false);
  dimensions.mockRestore();
});
