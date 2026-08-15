import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { Router } from 'express';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { createPlanningRouter } from '../src/features/planning/planning.routes.js';
import type {
  DailyPlan,
  DailyPlanInput,
  PlanningServiceContract,
  WeeklyFocus,
} from '../src/features/planning/planning.types.js';
import { PlanningApiError } from '../src/features/planning/planning.validation.js';
import { createRequireAuth } from '../src/middleware/auth.middleware.js';

const userA = { email: 'a@example.com', id: '11111111-1111-4111-8111-111111111111' } as User;
const userB = { email: 'b@example.com', id: '22222222-2222-4222-8222-222222222222' } as User;
const today = '2026-08-14';

type MemoryPlanningDatabase = {
  plans: Map<string, DailyPlan>;
  focuses: Map<string, WeeklyFocus[]>;
  tasks: Array<{ id: string; userId: string; plannedDate: string; status: string }>;
};

function planKey(userId: string, date: string) {
  return `${userId}:${date}`;
}

class MemoryPlanningService implements PlanningServiceContract {
  constructor(
    private readonly database: MemoryPlanningDatabase,
    private readonly userId: string,
  ) {}

  async getDailyPlan(date: string) {
    return this.database.plans.get(planKey(this.userId, date)) ?? null;
  }

  async putDailyPlan(date: string, input: DailyPlanInput) {
    if (input.focusTaskId) {
      const task = this.database.tasks.find((candidate) => (
        candidate.id === input.focusTaskId &&
        candidate.userId === this.userId &&
        candidate.plannedDate === date &&
        ['open', 'in_progress'].includes(candidate.status)
      ));
      if (!task) throw new PlanningApiError(400, 'Focus Task must be active and planned for this day');
    }
    const key = planKey(this.userId, date);
    if (input.focusTaskId === null && input.availableMinutes === null) {
      this.database.plans.delete(key);
      return null;
    }
    const existing = this.database.plans.get(key);
    const timestamp = new Date().toISOString();
    const plan: DailyPlan = {
      availableMinutes: input.availableMinutes,
      createdAt: existing?.createdAt ?? timestamp,
      date,
      focusTaskId: input.focusTaskId,
      id: existing?.id ?? `plan-${this.database.plans.size + 1}`,
      updatedAt: timestamp,
    };
    this.database.plans.set(key, plan);
    return plan;
  }

  async getWeeklyFocuses(weekStart: string) {
    return this.database.focuses.get(planKey(this.userId, weekStart)) ?? [];
  }

  async replaceWeeklyFocuses(weekStart: string, titles: string[]) {
    const timestamp = new Date().toISOString();
    const focuses = titles.map((title, position): WeeklyFocus => ({
      createdAt: timestamp,
      id: `focus-${this.userId}-${position}`,
      position,
      title,
      updatedAt: timestamp,
      weekPlanId: `week-${this.userId}-${weekStart}`,
    }));
    this.database.focuses.set(planKey(this.userId, weekStart), focuses);
    return focuses;
  }
}

function database(): MemoryPlanningDatabase {
  return {
    focuses: new Map(),
    plans: new Map(),
    tasks: [
      { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', plannedDate: today, status: 'open', userId: userA.id },
      { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', plannedDate: today, status: 'open', userId: userB.id },
    ],
  };
}

function createPlanningTestApp(data: MemoryPlanningDatabase) {
  const requireAuth = createRequireAuth({
    createUserClient: () => ({}) as SupabaseClient,
    verifyToken: async (token) => token === 'token-a' ? userA : token === 'token-b' ? userB : null,
  });
  const planning = createPlanningRouter(
    requireAuth,
    (_client, userId) => new MemoryPlanningService(data, userId),
  );
  return createApp({ auth: Router(), planning, tasks: Router() });
}

function authenticated(app: ReturnType<typeof createApp>, token = 'token-a') {
  return {
    get: (path: string) => request(app).get(path).set('Authorization', `Bearer ${token}`),
    put: (path: string) => request(app).put(path).set('Authorization', `Bearer ${token}`),
  };
}

describe('Planning API', () => {
  it('requires authentication and rejects client-owned or malformed input', async () => {
    const app = createPlanningTestApp(database());
    await request(app).get(`/daily-plans/${today}`).expect(401);
    await request(app).put(`/week-plans/${today}/focuses`).send({ titles: [] }).expect(401);
    await authenticated(app).put('/daily-plans/2026-02-30').send({ focusTaskId: null }).expect(400);
    await authenticated(app).put(`/daily-plans/${today}`).send({ userId: userB.id }).expect(400);
    await authenticated(app).put(`/daily-plans/${today}`).send({ availableMinutes: 1441 }).expect(400);
  });

  it('upserts one DailyPlan per user/date and survives a fresh read', async () => {
    const data = database();
    const app = createPlanningTestApp(data);
    const path = `/daily-plans/${today}`;
    const created = await authenticated(app).put(path).send({
      availableMinutes: 360,
      focusTaskId: data.tasks[0]!.id,
    }).expect(200);
    const updated = await authenticated(app).put(path).send({
      availableMinutes: 420,
      focusTaskId: data.tasks[0]!.id,
    }).expect(200);

    assert.equal(created.body.dailyPlan.id, updated.body.dailyPlan.id);
    assert.equal(data.plans.size, 1);
    assert.equal((await authenticated(app).get(path).expect(200)).body.dailyPlan.availableMinutes, 420);
  });

  it('enforces focus Task ownership and planning date without changing Tasks', async () => {
    const data = database();
    const app = createPlanningTestApp(data);
    const originalTasks = structuredClone(data.tasks);
    await authenticated(app).put(`/daily-plans/${today}`).send({
      focusTaskId: data.tasks[1]!.id,
    }).expect(400);
    await authenticated(app, 'token-b').put(`/daily-plans/${today}`).send({
      focusTaskId: data.tasks[0]!.id,
    }).expect(400);
    assert.deepEqual(data.tasks, originalTasks);
  });

  it('clears Daily Focus and removes a plan that has no remaining unique data', async () => {
    const data = database();
    const app = createPlanningTestApp(data);
    const path = `/daily-plans/${today}`;
    await authenticated(app).put(path).send({ focusTaskId: data.tasks[0]!.id }).expect(200);
    const cleared = await authenticated(app).put(path).send({ focusTaskId: null }).expect(200);
    assert.equal(cleared.body.dailyPlan, null);
    assert.equal(data.plans.size, 0);
  });

  it('persists ordered WeeklyFocus rows, replaces atomically, and caps the list at three', async () => {
    const data = database();
    const app = createPlanningTestApp(data);
    const path = '/week-plans/2026-08-09/focuses';
    const titles = ['Focus one', 'Focus two', 'Focus three'];
    const saved = await authenticated(app).put(path).send({ titles }).expect(200);
    assert.deepEqual(saved.body.focuses.map((focus: WeeklyFocus) => focus.position), [0, 1, 2]);
    assert.deepEqual(
      (await authenticated(app).get(path).expect(200)).body.focuses.map((focus: WeeklyFocus) => focus.title),
      titles,
    );
    await authenticated(app).put(path).send({ titles: [...titles, 'Focus four'] }).expect(400);
    assert.deepEqual(data.focuses.get(planKey(userA.id, '2026-08-09'))?.map((focus) => focus.title), titles);
  });

  it('keeps WeeklyFocus collections isolated by authenticated owner', async () => {
    const data = database();
    const app = createPlanningTestApp(data);
    const path = '/week-plans/2026-08-09/focuses';
    await authenticated(app).put(path).send({ titles: ['A focus'] }).expect(200);
    assert.deepEqual((await authenticated(app, 'token-b').get(path).expect(200)).body.focuses, []);
    await authenticated(app, 'token-b').put(path).send({ titles: ['B focus'] }).expect(200);
    assert.equal(data.focuses.size, 2);
  });

  it('statically records DailyPlan and WeekPlan-derived WeeklyFocus RLS constraints', () => {
    const migration = readFileSync(
      new URL('../../../supabase/migrations/20260814182107_create_daily_and_weekly_focus.sql', import.meta.url),
      'utf8',
    );
    assert.match(migration, /unique \(user_id, date\)/i);
    assert.match(migration, /focus_task_id uuid references public\.tasks\(id\)/i);
    assert.match(migration, /tasks\.user_id = \(select auth\.uid\(\)\)/i);
    assert.match(migration, /tasks\.planned_date = daily_plans\.date/i);
    assert.match(migration, /alter table public\.daily_plans enable row level security/i);
    assert.match(migration, /alter table public\.weekly_focuses enable row level security/i);
    assert.match(migration, /week_plans\.user_id = \(select auth\.uid\(\)\)/i);
    assert.match(migration, /position between 0 and 2/i);
    assert.match(migration, /security invoker/i);
    assert.doesNotMatch(migration, /service_role/i);
  });
});
