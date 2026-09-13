import { apiRequest } from '@/lib/api/client';

import {
  getWeeklyPlan,
  saveWeeklyPlan,
  getDailyPlan,
  getWeeklyFocuses,
  putDailyPlan,
  replaceWeeklyFocuses,
} from '@/features/planning/planning.api';
import type { DailyPlan, WeeklyFocus } from '@/features/planning/planning.types';

jest.mock('@/lib/api/client', () => ({ apiRequest: jest.fn() }));

const request = jest.mocked(apiRequest);
const date = '2026-08-14';
const weekStart = '2026-08-09';
const dailyPlan: DailyPlan = {
  availableMinutes: 420,
  createdAt: '2026-08-14T08:00:00.000Z',
  date,
  focusTaskId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  id: 'daily-plan-1',
  updatedAt: '2026-08-14T08:00:00.000Z',
};
const focus: WeeklyFocus = {
  createdAt: '2026-08-14T08:00:00.000Z',
  id: 'weekly-focus-1',
  position: 0,
  title: 'לסיים את ההצעה',
  updatedAt: '2026-08-14T08:00:00.000Z',
  weekPlanId: 'week-plan-1',
};

beforeEach(() => request.mockReset());

describe('Planning API client', () => {
  it('loads and replaces DailyPlan through the authenticated Node API', async () => {
    request
      .mockResolvedValueOnce({ dailyPlan })
      .mockResolvedValueOnce({ dailyPlan: { ...dailyPlan, focusTaskId: null } });

    await expect(getDailyPlan(date)).resolves.toEqual(dailyPlan);
    await putDailyPlan({
      date,
      input: { availableMinutes: 420, focusTaskId: null },
    });

    expect(request).toHaveBeenNthCalledWith(1, `/daily-plans/${date}`, {
      auth: 'required',
    });
    expect(request).toHaveBeenNthCalledWith(2, `/daily-plans/${date}`, {
      auth: 'required',
      body: JSON.stringify({ availableMinutes: 420, focusTaskId: null }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });
  });

  it('loads and atomically replaces ordered WeeklyFocus titles', async () => {
    request
      .mockResolvedValueOnce({ focuses: [focus] })
      .mockResolvedValueOnce({ focuses: [focus] });

    await expect(getWeeklyFocuses(weekStart)).resolves.toEqual([focus]);
    await replaceWeeklyFocuses({ titles: [focus.title], weekStart });

    expect(request).toHaveBeenNthCalledWith(1, `/week-plans/${weekStart}/focuses`, {
      auth: 'required',
    });
    expect(request).toHaveBeenNthCalledWith(2, `/week-plans/${weekStart}/focuses`, {
      auth: 'required',
      body: JSON.stringify({ titles: [focus.title] }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });
  });
});


it('loads/saves an explicit weekly lifecycle through authenticated selected-week endpoints', async () => {
  const state = { weekPlan: { id: 'stable', weekStart: '2026-09-21', status: 'in_progress', resumeStep: 3 }, focuses: [focus] };
  request.mockResolvedValue(state);
  await expect(getWeeklyPlan('2026-09-21')).resolves.toEqual(state);
  expect(request).toHaveBeenLastCalledWith('/week-plans/2026-09-21', { auth: 'required' });
  await expect(saveWeeklyPlan({ weekStart: '2026-09-21', input: { action: 'save', step: 3, advance: false, titles: ['Direction'] } })).resolves.toEqual(state);
  expect(request).toHaveBeenLastCalledWith('/week-plans/2026-09-21', {
    auth: 'required', method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save', step: 3, advance: false, titles: ['Direction'] }),
  });
});

it('propagates lifecycle load/completion errors without synthesizing a successful plan', async () => {
  request.mockRejectedValue(new Error('migration required'));
  await expect(getWeeklyPlan('2026-09-21')).rejects.toThrow('migration required');
  await expect(saveWeeklyPlan({ weekStart: '2026-09-21', input: { action: 'complete' } })).rejects.toThrow('migration required');
});
