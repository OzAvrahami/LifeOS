import type { SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_DAILY_CAPACITY_MINUTES = 360;
export const DEFAULT_WEEK_START_DAY = 0;

export type UserSettingsRow = {
  user_id: string;
  day_end_time?: string | null;
  day_start_time?: string | null;
  default_daily_capacity_minutes: number;
  week_start_day: number;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type UserSettings = {
  dayEndTime: string | null;
  dayStartTime: string | null;
  defaultDailyCapacityMinutes: number;
  persisted: boolean;
  timezone: string | null;
  weekStartDay: number;
};

export type PutUserSettingsInput = {
  dayEndTime?: string | null;
  dayStartTime?: string | null;
  defaultDailyCapacityMinutes: number;
  timezone: string;
  weekStartDay: number;
};

export type SettingsServiceContract = {
  get(): Promise<UserSettings>;
  put(input: PutUserSettingsInput): Promise<UserSettings>;
};

export type SettingsServiceFactory = (
  client: SupabaseClient,
  userId: string,
) => SettingsServiceContract;
