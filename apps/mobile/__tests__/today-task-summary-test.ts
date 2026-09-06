import { formatTaskMinutesHebrew, summarizePlannedTaskTime, unknownEstimateLabel } from '@/features/today/today-task-summary';

describe('Today planned Task-time summary', () => {
  it('includes open, active, and completed Task estimates and excludes cancelled Tasks', () => {
    expect(summarizePlannedTaskTime([
      { estimatedMinutes: 60, status: 'open' },
      { estimatedMinutes: 45, status: 'in_progress' },
      { estimatedMinutes: 120, status: 'completed' },
      { estimatedMinutes: 500, status: 'cancelled' },
    ])).toEqual({ knownMinutes: 225, unknownEstimateCount: 0 });
  });

  it('does not invent durations for Tasks without estimates', () => {
    expect(summarizePlannedTaskTime([
      { estimatedMinutes: null, status: 'open' },
      { estimatedMinutes: 165, status: 'completed' },
    ])).toEqual({ knownMinutes: 165, unknownEstimateCount: 1 });
    expect(formatTaskMinutesHebrew(165)).toBe('שעתיים ו־45 דקות');
    expect(unknownEstimateLabel(1)).toBe('למשימה אחת אין הערכת זמן');
  });

  it.each([
    [0, '0 דקות'], [1, 'דקה'], [2, 'שתי דקות'], [60, 'שעה'],
    [120, 'שעתיים'], [180, '3 שעות'], [195, '3 שעות ו־15 דקות'],
  ])('formats %i minutes as %s', (minutes, label) => {
    expect(formatTaskMinutesHebrew(minutes)).toBe(label);
  });
});
