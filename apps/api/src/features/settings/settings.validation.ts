import type { PutUserSettingsInput } from './settings.types.js';

export class SettingsApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly responseMessage: string,
  ) {
    super(responseMessage);
  }
}

function invalid(message = 'Invalid Settings input'): never {
  throw new SettingsApiError(400, message);
}

export function isIanaTimezone(value: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function parsePutSettings(value: unknown): PutUserSettingsInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  const body = value as Record<string, unknown>;
  const allowed = new Set(['defaultDailyCapacityMinutes', 'weekStartDay', 'timezone']);
  if (Object.keys(body).some((key) => !allowed.has(key))) invalid();
  if (Object.keys(body).length !== allowed.size || [...allowed].some((key) => !(key in body))) {
    invalid('All Settings fields are required');
  }

  if (
    !Number.isInteger(body.defaultDailyCapacityMinutes)
    || (body.defaultDailyCapacityMinutes as number) < 0
    || (body.defaultDailyCapacityMinutes as number) > 1440
  ) invalid('Invalid defaultDailyCapacityMinutes');
  if (
    !Number.isInteger(body.weekStartDay)
    || (body.weekStartDay as number) < 0
    || (body.weekStartDay as number) > 6
  ) invalid('Invalid weekStartDay');
  if (typeof body.timezone !== 'string') invalid('Invalid timezone');
  const timezone = body.timezone.trim();
  if (!timezone || timezone.length > 100 || !isIanaTimezone(timezone)) invalid('Invalid timezone');

  return {
    defaultDailyCapacityMinutes: body.defaultDailyCapacityMinutes as number,
    timezone,
    weekStartDay: body.weekStartDay as number,
  };
}
