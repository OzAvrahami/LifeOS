import { apiRequest } from '@/lib/api/client';

import type { PutUserSettingsInput, UserSettings } from './settings.types';

export async function getSettings() {
  const response = await apiRequest<{ settings: unknown }>('/settings', { auth: 'required' });
  return normalizeSettings(response.settings);
}

export async function putSettings(input: PutUserSettingsInput) {
  const response = await apiRequest<{ settings: unknown }>('/settings', {
    auth: 'required',
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  });
  return normalizeSettings(response.settings);
}

export function normalizeSettings(value: unknown): UserSettings {
  const settings = value as Omit<UserSettings, 'dayWindowSupported'> & Record<string, unknown>;
  const dayWindowSupported = Object.prototype.hasOwnProperty.call(settings, 'dayStartTime')
    && Object.prototype.hasOwnProperty.call(settings, 'dayEndTime');
  return {
    dayEndTime: dayWindowSupported && typeof settings.dayEndTime === 'string'
      ? settings.dayEndTime.slice(0, 5)
      : null,
    dayStartTime: dayWindowSupported && typeof settings.dayStartTime === 'string'
      ? settings.dayStartTime.slice(0, 5)
      : null,
    dayWindowSupported,
    defaultDailyCapacityMinutes: settings.defaultDailyCapacityMinutes,
    persisted: settings.persisted,
    timezone: settings.timezone,
    weekStartDay: settings.weekStartDay,
  };
}
