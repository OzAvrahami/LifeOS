import { apiRequest } from '@/lib/api/client';

import type { PutUserSettingsInput, UserSettings } from './settings.types';
import type { NotificationPreferences } from '@/features/notifications/notification.types';

export async function patchNotificationPreferences(notifications: NotificationPreferences, timezone: string) {
  const response = await apiRequest<{ settings: unknown }>('/settings', { auth: 'required',
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notifications, timezone }) });
  const settings = normalizeSettings(response.settings);
  if (!settings.notifications) throw new Error('Server did not persist notification preferences');
  return settings;
}

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
    ...(settings.notifications ? { notifications: settings.notifications } : {}),
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
