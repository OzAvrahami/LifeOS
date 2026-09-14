import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Router } from 'express';
import request from 'supertest';
import type { SupabaseClient, User } from '@supabase/supabase-js';

import { createApp } from '../src/app.js';
import { createSettingsRouter } from '../src/features/settings/settings.routes.js';
import { SupabaseSettingsService } from '../src/features/settings/settings.service.js';
import { defaultNotificationPreferences, parseNotificationPatch } from '../src/features/settings/notification-preferences.js';
import { createRequireAuth } from '../src/middleware/auth.middleware.js';

// Exercise the real route/service mapping with a small PostgREST storage double.
// The disposable database gate separately verifies real constraints and RLS.
function fixture() {
  const rows = new Map<string, Record<string, unknown>>();
  const client = { from: () => {
    let userId = '';
    let update: Record<string, unknown> | undefined;
    const query = {
      select: () => query,
      eq: (_key: string, id: string) => { userId = id; return query; },
      update: (values: Record<string, unknown>) => { update = values; return query; },
      upsert: (values: Record<string, unknown>, options: { ignoreDuplicates?: boolean }) => {
        userId = String(values.user_id);
        const old = rows.get(userId);
        if (!old || !options.ignoreDuplicates) rows.set(userId, { default_daily_capacity_minutes: 360, week_start_day: 0, ...old, ...values });
        return query;
      },
      maybeSingle: async () => ({ data: rows.get(userId) ?? null, error: null }),
      single: async () => {
        if (update) rows.set(userId, { ...rows.get(userId), ...update });
        return { data: rows.get(userId), error: null };
      },
    };
    return query;
  } } as unknown as SupabaseClient;
  const auth = createRequireAuth({ createUserClient: () => client, verifyToken: async token =>
    ['a', 'b'].includes(token) ? { id: token } as User : null });
  const app = createApp({ auth: Router(), tasks: Router(), settings: createSettingsRouter(auth) });
  return { rows, client, app };
}
const enabled = { ...defaultNotificationPreferences, enabled: true, taskRemindersEnabled: true,
  weeklyPlanningEnabled: true, weeklyPlanningWeekday: 0, weeklyPlanningTime: '09:17' };

describe('Notification settings', () => {
  it('maps missing/old rows to safe defaults without creating a row', async () => {
    const { rows, client } = fixture();
    const service = new SupabaseSettingsService(client, 'a');
    assert.deepEqual((await service.get()).notifications, defaultNotificationPreferences);
    assert.equal(rows.size, 0);
    rows.set('a', { user_id: 'a', timezone: 'Asia/Jerusalem', week_start_day: 1, default_daily_capacity_minutes: 480 });
    assert.deepEqual((await service.get()).notifications, defaultNotificationPreferences);
  });
  it('persists a caller-scoped patch and preserves unrelated settings in both update directions', async () => {
    const { app, client } = fixture();
    const patch = (token: string, notifications = enabled) => request(app).patch('/settings').set('Authorization', `Bearer ${token}`).send({ notifications, timezone: 'Asia/Jerusalem' });
    await request(app).patch('/settings').send({ notifications: enabled }).expect(401);
    const service = new SupabaseSettingsService(client, 'a');
    await service.put({ timezone: 'Europe/London', weekStartDay: 1, defaultDailyCapacityMinutes: 480, dayStartTime: '08:00', dayEndTime: '23:00' });
    const before = await service.get();
    const saved = (await patch('a').expect(200)).body.settings;
    assert.deepEqual(saved, { ...before, notifications: enabled });
    assert.deepEqual((await service.get()).notifications, enabled);
    const oldClient = await service.put({ timezone: 'Europe/London', weekStartDay: 6, defaultDailyCapacityMinutes: 300 });
    assert.deepEqual(oldClient.notifications, enabled);
    assert.equal(oldClient.dayStartTime, '08:00');
    const off = { ...enabled, enabled: false, taskRemindersEnabled: false, weeklyPlanningEnabled: false };
    assert.deepEqual((await patch('a', off).expect(200)).body.settings.notifications, off);
    const other = new SupabaseSettingsService(client, 'b');
    assert.deepEqual((await other.get()).notifications, defaultNotificationPreferences);
    await patch('b').expect(200);
    assert.deepEqual((await service.get()).notifications, off);
  });
  it('validates complete notification preferences and timezone without accepting unrelated patch fields', async () => {
    for (const change of [{ enabled: 'yes' }, { weeklyPlanningWeekday: 7 }, { weeklyPlanningWeekday: -1 },
      { weeklyPlanningWeekday: 1.5 }, { weeklyPlanningTime: '24:00' }, { weeklyPlanningTime: '09:17:20' },
      { weeklyPlanningTime: null }, { weeklyPlanningWeekday: null }, { futureCategory: true }]) {
      assert.throws(() => parseNotificationPatch({ notifications: { ...enabled, ...change }, timezone: 'Asia/Jerusalem' }));
    }
    assert.throws(() => parseNotificationPatch({ notifications: enabled, timezone: 'invalid' }));
    assert.throws(() => parseNotificationPatch({ notifications: enabled, timezone: 'UTC', weekStartDay: 6 }));
    assert.throws(() => parseNotificationPatch({ notifications: { enabled: true }, timezone: 'UTC' }));
    assert.deepEqual(parseNotificationPatch({ notifications: enabled, timezone: 'Asia/Jerusalem' }).notifications, enabled);
    assert.deepEqual(parseNotificationPatch({ notifications: defaultNotificationPreferences, timezone: 'UTC' }).notifications, defaultNotificationPreferences);
    const { app } = fixture();
    await request(app).patch('/settings').set('Authorization', 'Bearer a').send({ notifications: enabled, timezone: 'invalid' }).expect(400);
  });
});
