import { dayWindowError, dayWindowKind } from '@/features/settings/day-window';
import { effectiveUserSettings } from '@/features/settings/settings-time';

describe('Day Window clock-time semantics', () => {
  it.each([
    [null, null, 'unset'],
    ['08:00', '23:30', 'same-day'],
    ['06:30', '00:00', 'overnight'],
    ['07:00', '01:00', 'overnight'],
    ['08:00', '08:00', 'equal'],
    ['08:00', null, 'incomplete'],
    [null, '23:30', 'incomplete'],
    ['8:00', '23:30', 'incomplete'],
    ['24:00', '01:00', 'incomplete'],
  ])('classifies %s → %s as %s', (start, end, expected) => {
    expect(dayWindowKind(start, end)).toBe(expected);
  });

  it('rejects incomplete and equal pairs while allowing unset and overnight pairs', () => {
    expect(dayWindowError(null, null)).toBeNull();
    expect(dayWindowError('07:00', '01:00')).toBeNull();
    expect(dayWindowError('08:00', '08:00')).toMatch(/חייבות להיות שונות/);
    expect(dayWindowError('08:00', null)).toMatch(/גם שעת התחלה וגם שעת סיום/);
  });

  it('keeps recurring clock times unchanged when the account timezone changes', () => {
    const base = {
      dayEndTime: '01:00', dayStartTime: '07:00', dayWindowSupported: true,
      defaultDailyCapacityMinutes: 360, persisted: true, weekStartDay: 0,
    };
    expect(effectiveUserSettings({ ...base, timezone: 'Asia/Jerusalem' })).toEqual(expect.objectContaining({
      dayEndTime: '01:00', dayStartTime: '07:00', timezone: 'Asia/Jerusalem',
    }));
    expect(effectiveUserSettings({ ...base, timezone: 'America/New_York' })).toEqual(expect.objectContaining({
      dayEndTime: '01:00', dayStartTime: '07:00', timezone: 'America/New_York',
    }));
  });
});
