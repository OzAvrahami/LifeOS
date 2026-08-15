import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import {
  DEFAULT_DAILY_CAPACITY_MINUTES,
  DEFAULT_WEEK_START_DAY,
  type PutUserSettingsInput,
  type SettingsServiceContract,
  type UserSettings,
  type UserSettingsRow,
} from './settings.types.js';
import { SettingsApiError } from './settings.validation.js';

function defaults(): UserSettings {
  return {
    defaultDailyCapacityMinutes: DEFAULT_DAILY_CAPACITY_MINUTES,
    persisted: false,
    timezone: null,
    weekStartDay: DEFAULT_WEEK_START_DAY,
  };
}

function mapSettings(row: UserSettingsRow): UserSettings {
  return {
    defaultDailyCapacityMinutes: row.default_daily_capacity_minutes,
    persisted: true,
    timezone: row.timezone,
    weekStartDay: row.week_start_day,
  };
}

function dataError(error: PostgrestError): never {
  if (['22P02', '23503', '23514', '42501'].includes(error.code)) {
    throw new SettingsApiError(400, 'Invalid Settings input');
  }
  throw new SettingsApiError(500, 'Settings operation failed');
}

export class SupabaseSettingsService implements SettingsServiceContract {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async get() {
    const { data, error } = await this.client
      .from('user_settings')
      .select('*')
      .eq('user_id', this.userId)
      .maybeSingle();
    if (error) dataError(error);
    return data ? mapSettings(data as UserSettingsRow) : defaults();
  }

  async put(input: PutUserSettingsInput) {
    const { data, error } = await this.client
      .from('user_settings')
      .upsert({
        default_daily_capacity_minutes: input.defaultDailyCapacityMinutes,
        timezone: input.timezone,
        user_id: this.userId,
        week_start_day: input.weekStartDay,
      }, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) dataError(error);
    return mapSettings(data as UserSettingsRow);
  }
}

export function createSettingsService(client: SupabaseClient, userId: string) {
  return new SupabaseSettingsService(client, userId);
}
