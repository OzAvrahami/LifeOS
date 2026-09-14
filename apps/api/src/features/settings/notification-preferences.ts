import { isClockTime, isIanaTimezone, SettingsApiError } from './settings.validation.js';

export type NotificationPreferences = {
  enabled: boolean;
  taskRemindersEnabled: boolean;
  weeklyPlanningEnabled: boolean;
  weeklyPlanningWeekday: number | null; // Sunday = 0, independent of week-start setting.
  weeklyPlanningTime: string | null;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: false, taskRemindersEnabled: false, weeklyPlanningEnabled: false,
  weeklyPlanningWeekday: null, weeklyPlanningTime: null,
};

export function parseNotificationPatch(value: unknown): { notifications: NotificationPreferences; timezone: string } {
  const invalid = (): never => { throw new SettingsApiError(400, 'Invalid notification preferences'); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some(key => !['notifications', 'timezone'].includes(key))) invalid();
  if (typeof body.timezone !== 'string' || body.timezone.length > 100 || !isIanaTimezone(body.timezone)) invalid();
  if (!body.notifications || typeof body.notifications !== 'object' || Array.isArray(body.notifications)) invalid();
  const prefs = body.notifications as Record<string, unknown>;
  if (Object.keys(prefs).length !== 5 || Object.keys(prefs).some(key => !(key in defaultNotificationPreferences))) invalid();
  for (const key of ['enabled', 'taskRemindersEnabled', 'weeklyPlanningEnabled']) if (typeof prefs[key] !== 'boolean') invalid();
  if (prefs.weeklyPlanningWeekday !== null && (!Number.isInteger(prefs.weeklyPlanningWeekday) || Number(prefs.weeklyPlanningWeekday) < 0 || Number(prefs.weeklyPlanningWeekday) > 6)) invalid();
  if (prefs.weeklyPlanningTime !== null && (typeof prefs.weeklyPlanningTime !== 'string' || !isClockTime(prefs.weeklyPlanningTime))) invalid();
  if (prefs.weeklyPlanningEnabled && (prefs.weeklyPlanningTime === null || prefs.weeklyPlanningWeekday === null)) invalid();
  return { notifications: prefs as NotificationPreferences, timezone: body.timezone as string };
}
