import { effectiveUserSettings, timezoneOffsetLabel } from '@/features/settings/settings-time';
import {
  currentWeekDateKeys,
  currentWeekStart,
  localDateKey,
} from '@/features/tasks/task-dates';

describe('effective planning date and timezone utilities', () => {
  it('uses deterministic capacity/week defaults while keeping device timezone client-side', () => {
    const effective = effectiveUserSettings({
      defaultDailyCapacityMinutes: 360,
      persisted: false,
      timezone: null,
      weekStartDay: 0,
    });
    expect(effective.defaultDailyCapacityMinutes).toBe(360);
    expect(effective.weekStartDay).toBe(0);
    expect(effective.timezone).toBeTruthy();
  });

  it('derives Today in the chosen IANA timezone', () => {
    const instant = new Date('2026-08-15T21:30:00.000Z');
    expect(localDateKey(instant, 'Asia/Jerusalem')).toBe('2026-08-16');
    expect(localDateKey(instant, 'America/New_York')).toBe('2026-08-15');
  });

  it('calculates Sunday and Monday week boundaries without rewriting either identity', () => {
    const instant = new Date('2026-08-15T12:00:00.000Z');
    expect(currentWeekStart(instant, { timeZone: 'UTC', weekStartDay: 0 })).toBe('2026-08-09');
    expect(currentWeekStart(instant, { timeZone: 'UTC', weekStartDay: 1 })).toBe('2026-08-10');
    expect(currentWeekDateKeys(instant, { timeZone: 'UTC', weekStartDay: 1 })).toEqual([
      '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13',
      '2026-08-14', '2026-08-15', '2026-08-16',
    ]);
  });

  it('calculates GMT offsets dynamically across daylight-saving changes', () => {
    expect(timezoneOffsetLabel('Asia/Jerusalem', new Date('2026-01-15T12:00:00Z'))).toBe('GMT+2');
    expect(timezoneOffsetLabel('Asia/Jerusalem', new Date('2026-08-15T12:00:00Z'))).toBe('GMT+3');
    expect(timezoneOffsetLabel('America/New_York', new Date('2026-01-15T12:00:00Z'))).toBe('GMT−5');
    expect(timezoneOffsetLabel('America/New_York', new Date('2026-08-15T12:00:00Z'))).toBe('GMT−4');
  });
});
