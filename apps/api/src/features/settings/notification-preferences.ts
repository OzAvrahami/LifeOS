import { isClockTime, isIanaTimezone, SettingsApiError } from './settings.validation.js';

export type NotificationPreferences = {
  enabled: boolean;
  taskRemindersEnabled: boolean;
  commitmentRemindersEnabled: boolean;
  commitmentDefaultReminderMinutes: number;
  weeklyPlanningEnabled: boolean;
  weeklyPlanningWeekday: number | null; // Sunday = 0, independent of week-start setting.
  weeklyPlanningTime: string | null;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: false, taskRemindersEnabled: false, weeklyPlanningEnabled: false,
  commitmentRemindersEnabled: false, commitmentDefaultReminderMinutes: 15,
  weeklyPlanningWeekday: null, weeklyPlanningTime: null,
};

export type NotificationPreferencePatch = Omit<NotificationPreferences, 'commitmentRemindersEnabled' | 'commitmentDefaultReminderMinutes'> & Partial<Pick<NotificationPreferences, 'commitmentRemindersEnabled' | 'commitmentDefaultReminderMinutes'>>;

export function parseNotificationPatch(value: unknown): { notifications: NotificationPreferencePatch; timezone: string } {
  const invalid = (): never => { throw new SettingsApiError(400, 'Invalid notification preferences'); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some(key => !['notifications', 'timezone'].includes(key))) invalid();
  if (typeof body.timezone !== 'string' || body.timezone.length > 100 || !isIanaTimezone(body.timezone)) invalid();
  if (!body.notifications || typeof body.notifications !== 'object' || Array.isArray(body.notifications)) invalid();
  const prefs = body.notifications as Record<string, unknown>;
  if (Object.keys(prefs).some(key => !(key in defaultNotificationPreferences))) invalid();
  for (const key of ['enabled', 'taskRemindersEnabled', 'weeklyPlanningEnabled']) if (typeof prefs[key] !== 'boolean') invalid();
  if (prefs.weeklyPlanningWeekday !== null && (!Number.isInteger(prefs.weeklyPlanningWeekday) || Number(prefs.weeklyPlanningWeekday) < 0 || Number(prefs.weeklyPlanningWeekday) > 6)) invalid();
  if (prefs.weeklyPlanningTime !== null && (typeof prefs.weeklyPlanningTime !== 'string' || !isClockTime(prefs.weeklyPlanningTime))) invalid();
  if (prefs.weeklyPlanningEnabled && (prefs.weeklyPlanningTime === null || prefs.weeklyPlanningWeekday === null)) invalid();
  if ('commitmentRemindersEnabled' in prefs && typeof prefs.commitmentRemindersEnabled !== 'boolean') invalid();
  if ('commitmentDefaultReminderMinutes' in prefs && (!Number.isInteger(prefs.commitmentDefaultReminderMinutes) || Number(prefs.commitmentDefaultReminderMinutes) < 0 || Number(prefs.commitmentDefaultReminderMinutes) > 1440)) invalid();
  return { notifications: prefs as NotificationPreferencePatch, timezone: body.timezone as string };
}
