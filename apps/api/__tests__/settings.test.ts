import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { Router } from 'express';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { createSettingsRouter } from '../src/features/settings/settings.routes.js';
import {
  DEFAULT_DAILY_CAPACITY_MINUTES,
  DEFAULT_WEEK_START_DAY,
  type PutUserSettingsInput,
  type SettingsServiceContract,
  type UserSettings,
} from '../src/features/settings/settings.types.js';
import { createRequireAuth } from '../src/middleware/auth.middleware.js';

const userA = { email: 'a@example.com', id: '11111111-1111-4111-8111-111111111111' } as User;
const userB = { email: 'b@example.com', id: '22222222-2222-4222-8222-222222222222' } as User;

class MemorySettingsService implements SettingsServiceContract {
  constructor(
    private readonly rows: Map<string, UserSettings>,
    private readonly userId: string,
  ) {}

  async get() {
    return this.rows.get(this.userId) ?? {
      defaultDailyCapacityMinutes: DEFAULT_DAILY_CAPACITY_MINUTES,
      persisted: false,
      timezone: null,
      weekStartDay: DEFAULT_WEEK_START_DAY,
    };
  }

  async put(input: PutUserSettingsInput) {
    const settings = { ...input, persisted: true } satisfies UserSettings;
    this.rows.set(this.userId, settings);
    return settings;
  }
}

function createSettingsTestApp(rows = new Map<string, UserSettings>()) {
  const requireAuth = createRequireAuth({
    createUserClient: () => ({}) as SupabaseClient,
    verifyToken: async (token) => token === 'token-a' ? userA : token === 'token-b' ? userB : null,
  });
  const settings = createSettingsRouter(
    requireAuth,
    (_client, userId) => new MemorySettingsService(rows, userId),
  );
  return { app: createApp({
    auth: Router(),
    commitments: Router(),
    planning: Router(),
    settings,
    tasks: Router(),
  }), rows };
}

function auth(app: ReturnType<typeof createApp>, token = 'token-a') {
  return {
    get: () => request(app).get('/settings').set('Authorization', `Bearer ${token}`),
    put: (body: Record<string, unknown>) => request(app).put('/settings').set('Authorization', `Bearer ${token}`).send(body),
  };
}

const savedSettings = {
  defaultDailyCapacityMinutes: 480,
  timezone: 'Europe/London',
  weekStartDay: 1,
};

describe('Settings API', () => {
  it('requires authentication', async () => {
    const { app } = createSettingsTestApp();
    await request(app).get('/settings').expect(401);
    await request(app).put('/settings').send(savedSettings).expect(401);
  });

  it('returns deterministic defaults without creating a row', async () => {
    const { app, rows } = createSettingsTestApp();
    const response = await auth(app).get().expect(200);
    assert.deepEqual(response.body.settings, {
      defaultDailyCapacityMinutes: 360,
      persisted: false,
      timezone: null,
      weekStartDay: 0,
    });
    assert.equal(rows.size, 0);
  });

  it('upserts exactly one caller-owned row and survives a fresh read', async () => {
    const { app, rows } = createSettingsTestApp();
    await auth(app).put(savedSettings).expect(200);
    await auth(app).put({ ...savedSettings, defaultDailyCapacityMinutes: 420 }).expect(200);
    assert.equal(rows.size, 1);
    const response = await auth(app).get().expect(200);
    assert.deepEqual(response.body.settings, {
      ...savedSettings,
      defaultDailyCapacityMinutes: 420,
      persisted: true,
    });
    assert.equal('userId' in response.body.settings, false);
  });

  it('keeps user settings isolated by the verified identity', async () => {
    const { app } = createSettingsTestApp();
    await auth(app, 'token-a').put(savedSettings).expect(200);
    const userBResponse = await auth(app, 'token-b').get().expect(200);
    assert.equal(userBResponse.body.settings.persisted, false);
    await auth(app, 'token-b').put({ ...savedSettings, timezone: 'America/New_York' }).expect(200);
    const userAResponse = await auth(app, 'token-a').get().expect(200);
    assert.equal(userAResponse.body.settings.timezone, 'Europe/London');
  });

  it('rejects invalid capacity, weekday, timezone, missing fields, and ownership input', async () => {
    const { app } = createSettingsTestApp();
    await auth(app).put({ ...savedSettings, defaultDailyCapacityMinutes: 1441 }).expect(400);
    await auth(app).put({ ...savedSettings, weekStartDay: 7 }).expect(400);
    await auth(app).put({ ...savedSettings, timezone: 'Not/A_Real_Zone' }).expect(400);
    await auth(app).put({ defaultDailyCapacityMinutes: 360 }).expect(400);
    await auth(app).put({ ...savedSettings, userId: userB.id }).expect(400);
  });

  it('records one-row ownership, constraints, trigger, grants, and RLS in the migration', () => {
    const migration = readFileSync(
      new URL('../../../supabase/migrations/20260815173000_create_user_settings.sql', import.meta.url),
      'utf8',
    );
    assert.match(migration, /user_id uuid primary key references auth\.users\(id\)/);
    assert.match(migration, /default_daily_capacity_minutes between 0 and 1440/);
    assert.match(migration, /week_start_day between 0 and 6/);
    assert.match(migration, /alter table public\.user_settings enable row level security/);
    assert.equal((migration.match(/\(select auth\.uid\(\)\) = user_id/g) ?? []).length, 5);
    assert.match(migration, /user_settings_set_updated_at/);
    assert.match(migration, /revoke all on table public\.user_settings from anon/);
  });
});
