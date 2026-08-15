import { apiRequest } from '@/lib/api/client';

import type { PutUserSettingsInput, UserSettings } from './settings.types';

export async function getSettings() {
  const response = await apiRequest<{ settings: UserSettings }>('/settings', { auth: 'required' });
  return response.settings;
}

export async function putSettings(input: PutUserSettingsInput) {
  const response = await apiRequest<{ settings: UserSettings }>('/settings', {
    auth: 'required',
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  });
  return response.settings;
}
