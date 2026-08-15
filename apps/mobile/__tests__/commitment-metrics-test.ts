import {
  commitmentDurationMinutes,
  formatMinutes,
  plannedMinutes,
  workloadState,
} from '@/features/commitments/commitment.metrics';

describe('Commitment workload calculation', () => {
  it('combines Task estimates with ranged Commitments without double counting point events', () => {
    const ranged = { endTime: '11:00', startTime: '09:30' };
    const point = { endTime: null, startTime: '13:30' };
    expect(commitmentDurationMinutes(ranged)).toBe(90);
    expect(commitmentDurationMinutes(point)).toBe(0);
    expect(plannedMinutes([{ estimatedMinutes: 60 }, { estimatedMinutes: null }], [ranged, point])).toBe(150);
    expect(formatMinutes(200)).toBe('3:20');
  });

  it('uses the approved capacity thresholds and handles zero capacity safely', () => {
    expect(workloadState(180, 360)).toBe('פנוי');
    expect(workloadState(200, 360)).toBe('מאוזן');
    expect(workloadState(300, 360)).toBe('עמוס');
    expect(workloadState(361, 360)).toBe('עמוס מדי');
    expect(workloadState(0, 0)).toBe('פנוי');
    expect(workloadState(1, 0)).toBe('עמוס מדי');
  });
});
