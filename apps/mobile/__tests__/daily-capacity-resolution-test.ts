import { formatMinutes } from '@/features/commitments/commitment.metrics';
import { resolveDailyCapacity } from '@/features/planning/daily-capacity';
import { localDateKey } from '@/features/tasks/task-dates';

describe('Daily capacity resolution', () => {
  it.each([
    [360, '6:00'],
    [450, '7:30'],
    [480, '8:00'],
    [600, '10:00'],
  ])('inherits and formats %i configured minutes as %s', (defaultMinutes, expected) => {
    const capacity = resolveDailyCapacity(undefined, defaultMinutes);
    expect(capacity).toEqual({ minutes: defaultMinutes, source: 'default' });
    expect(formatMinutes(capacity.minutes)).toBe(expected);
  });

  it('treats an absent or null override as inherited and preserves explicit zero', () => {
    expect(resolveDailyCapacity(undefined, 480)).toEqual({ minutes: 480, source: 'default' });
    expect(resolveDailyCapacity(null, 480)).toEqual({ minutes: 480, source: 'default' });
    expect(resolveDailyCapacity(0, 480)).toEqual({ minutes: 0, source: 'override' });
    expect(formatMinutes(resolveDailyCapacity(0, 480).minutes)).toBe('0:00');
  });

  it('follows default changes only for inherited days', () => {
    expect(resolveDailyCapacity(null, 360).minutes).toBe(360);
    expect(resolveDailyCapacity(null, 480).minutes).toBe(480);
    expect(resolveDailyCapacity(431, 360)).toEqual({ minutes: 431, source: 'override' });
    expect(resolveDailyCapacity(431, 480)).toEqual({ minutes: 431, source: 'override' });
  });

  it('uses timezone only to scope the date and never to convert capacity duration', () => {
    const instant = new Date('2026-08-15T00:30:00.000Z');
    expect(localDateKey(instant, 'Asia/Jerusalem')).toBe('2026-08-15');
    expect(localDateKey(instant, 'America/Los_Angeles')).toBe('2026-08-14');
    expect(formatMinutes(resolveDailyCapacity(431, 480).minutes)).toBe('7:11');
  });
});
