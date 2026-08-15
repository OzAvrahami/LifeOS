import { getSettings, putSettings } from '@/features/settings/settings.api';
import type { UserSettings } from '@/features/settings/settings.types';
import { apiRequest } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({ apiRequest: jest.fn() }));

const request = jest.mocked(apiRequest);
const settings: UserSettings = {
  defaultDailyCapacityMinutes: 480,
  persisted: true,
  timezone: 'Europe/London',
  weekStartDay: 1,
};

beforeEach(() => request.mockReset());

describe('Settings API client', () => {
  it('uses the authenticated Node API and preserves the absent-timezone distinction', async () => {
    const defaults: UserSettings = {
      defaultDailyCapacityMinutes: 360,
      persisted: false,
      timezone: null,
      weekStartDay: 0,
    };
    request.mockResolvedValueOnce({ settings: defaults });
    await expect(getSettings()).resolves.toEqual(defaults);
    expect(request).toHaveBeenCalledWith('/settings', { auth: 'required' });
  });

  it('sends one complete settings object without ownership fields', async () => {
    request.mockResolvedValueOnce({ settings });
    await expect(putSettings({
      defaultDailyCapacityMinutes: 480,
      timezone: 'Europe/London',
      weekStartDay: 1,
    })).resolves.toEqual(settings);
    expect(request).toHaveBeenCalledWith('/settings', {
      auth: 'required',
      body: JSON.stringify({
        defaultDailyCapacityMinutes: 480,
        timezone: 'Europe/London',
        weekStartDay: 1,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });
  });
});
