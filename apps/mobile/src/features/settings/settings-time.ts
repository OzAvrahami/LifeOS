import {
  DEFAULT_DAILY_CAPACITY_MINUTES,
  DEFAULT_WEEK_START_DAY,
  type EffectiveUserSettings,
  type UserSettings,
} from './settings.types';

export function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function effectiveUserSettings(settings?: UserSettings): EffectiveUserSettings {
  return {
    defaultDailyCapacityMinutes:
      settings?.defaultDailyCapacityMinutes ?? DEFAULT_DAILY_CAPACITY_MINUTES,
    persisted: settings?.persisted ?? false,
    timezone: settings?.timezone ?? deviceTimezone(),
    weekStartDay: settings?.weekStartDay ?? DEFAULT_WEEK_START_DAY,
  };
}

export function timezoneOffsetLabel(timezone: string, date = new Date()) {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  }).formatToParts(date).find((value) => value.type === 'timeZoneName')?.value ?? 'GMT';
  if (part === 'GMT' || part === 'UTC') return 'GMT+0';
  const match = part.match(/GMT([+-])(\d{2}):?(\d{2})/);
  if (!match) return part;
  const sign = match[1] === '-' ? '−' : '+';
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return `GMT${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`;
}

export function hoursLabel(minutes: number) {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} שעות` : `${hours.toFixed(1)} שעות`;
}
