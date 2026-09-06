import { render, screen } from '@testing-library/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { AppVersionFooter } from '@/features/settings/app-version-footer';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '7.8.9', ios: { buildNumber: '99' } },
    platform: { ios: { buildNumber: '12' } },
  },
}));

afterEach(() => jest.restoreAllMocks());

it('shows metadata version and the actual iOS binary build even when config differs', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.replaceProperty(globalThis as typeof globalThis & { __DEV__: boolean }, '__DEV__', false);
  await render(<AppVersionFooter />);
  expect(screen.getByText('גרסה 7.8.9 · בנייה 12')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});

it('labels development version metadata while retaining the actual native build', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  await render(<AppVersionFooter />);
  expect(screen.getByText('גרסת פיתוח 7.8.9 · בנייה 12')).toBeTruthy();
});

it('does not substitute a configured build when native metadata is unavailable', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.replaceProperty(Constants, 'platform', { ios: { buildNumber: null } } as typeof Constants.platform);
  await render(<AppVersionFooter />);
  expect(screen.getByText('גרסת פיתוח 7.8.9 · מספר בנייה לא זמין')).toBeTruthy();
});

it('labels web honestly and ignores iOS build metadata', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  await render(<AppVersionFooter />);
  expect(screen.getByText('גרסת דפדפן 7.8.9 · מספר בנייה לא זמין')).toBeTruthy();
});

it('handles missing app and platform metadata without inventing a version or build', async () => {
  jest.replaceProperty(Constants, 'expoConfig', null);
  jest.replaceProperty(Constants, 'platform', undefined);
  await render(<AppVersionFooter />);
  expect(screen.getByText('גרסת פיתוח לא זמינה · מספר בנייה לא זמין')).toBeTruthy();
});
