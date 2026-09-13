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
  WeeklyPlan,
  WeeklyPlanningInput,
} from '../src/features/planning/planning.types.js';
import { PlanningApiError } from '../src/features/planning/planning.validation.js';
import { createRequireAuth } from '../src/middleware/auth.middleware.js';

const userA = { email: 'a@example.com', id: '11111111-1111-4111-8111-111111111111' } as User;
const userB = { email: 'b@example.com', id: '22222222-2222-4222-8222-222222222222' } as User;
const today = '2026-08-14';

type MemoryPlanningDatabase = {
  plans: Map<string, DailyPlan>;
  weeks: Map<string, WeeklyPlan>;
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

  ensureWeek(weekStart: string) {
    const key = planKey(this.userId, weekStart);
    if (!this.database.weeks.has(key)) this.database.weeks.set(key, {
      id: `week-${this.userId}-${weekStart}`, weekStart, status: 'not_started', resumeStep: 0,
      completedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    return this.database.weeks.get(key)!;
  }

  async getWeeklyPlan(weekStart: string) {
    return { weekPlan: this.database.weeks.get(planKey(this.userId, weekStart)) ?? null,
      focuses: await this.getWeeklyFocuses(weekStart) };
  }

  // Disposable route fixture; actual locking/constraints/RLS are tested by the local DB harness.
  async saveWeeklyPlan(weekStart: string, input: WeeklyPlanningInput) {
    const plan = input.action === 'start' ? this.ensureWeek(weekStart)
      : this.database.weeks.get(planKey(this.userId, weekStart));
    if (!plan) throw new PlanningApiError(409, 'Start weekly planning first');
    if (input.action === 'start' && plan.status === 'not_started') {
      plan.status = 'in_progress'; plan.resumeStep = 1;
    } else if (input.action === 'save') {
      if (plan.status === 'not_started' || input.step > plan.resumeStep) throw new PlanningApiError(409, 'Complete preceding planning steps first');
      if (input.titles) await this.replaceWeeklyFocuses(weekStart, input.titles);
      plan.resumeStep = Math.max(plan.resumeStep, Math.min(4, input.step + (input.advance ? 1 : 0)));
    } else if (input.action === 'complete' && plan.status !== 'completed') {
      if (plan.status !== 'in_progress' || plan.resumeStep !== 4) throw new PlanningApiError(409, 'Complete preceding planning steps first');
      plan.status = 'completed'; plan.completedAt = new Date().toISOString();
    }
    return this.getWeeklyPlan(weekStart);
  }

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
    this.ensureWeek(weekStart);
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
    weeks: new Map(),
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

  it('preserves capacity semantics when Daily Focus changes and supports explicit zero and inheritance', async () => {
    const data = database();
    const app = createPlanningTestApp(data);
    const path = `/daily-plans/${today}`;
    const taskId = data.tasks[0]!.id;
    await authenticated(app).put(path).send({
      availableMinutes: 431,
      focusTaskId: taskId,
    }).expect(200);
    const clearedFocus = await authenticated(app).put(path).send({
      availableMinutes: 431,
      focusTaskId: null,
    }).expect(200);
    assert.equal(clearedFocus.body.dailyPlan.availableMinutes, 431);

    const zero = await authenticated(app).put(path).send({
      availableMinutes: 0,
      focusTaskId: taskId,
    }).expect(200);
    assert.equal(zero.body.dailyPlan.availableMinutes, 0);

    const inherited = await authenticated(app).put(path).send({
      availableMinutes: null,
      focusTaskId: taskId,
    }).expect(200);
    assert.equal(inherited.body.dailyPlan.availableMinutes, null);
    assert.equal(inherited.body.dailyPlan.focusTaskId, taskId);
  });

  it('persists ordered WeeklyFocus rows, replaces atomically, and caps the list at three', async () => {
    const data = database();
    const originalTasks = structuredClone(data.tasks);
    const app = createPlanningTestApp(data);
    const path = '/week-plans/2026-08-09/focuses';
    const otherWeekPath = '/week-plans/2026-08-16/focuses';
    const titles = ['Focus one', 'Focus two', 'Focus three'];
    const saved = await authenticated(app).put(path).send({ titles }).expect(200);
    assert.deepEqual(saved.body.focuses.map((focus: WeeklyFocus) => focus.position), [0, 1, 2]);
    assert.deepEqual(
      (await authenticated(app).get(path).expect(200)).body.focuses.map((focus: WeeklyFocus) => focus.title),
      titles,
    );
    await authenticated(app).put(path).send({ titles: [...titles, 'Focus four'] }).expect(400);
    assert.deepEqual(data.focuses.get(planKey(userA.id, '2026-08-09'))?.map((focus) => focus.title), titles);
    await authenticated(app).put(otherWeekPath).send({ titles: ['Other week'] }).expect(200);
    await authenticated(app).put(path).send({ titles: [] }).expect(200);
    assert.deepEqual((await authenticated(app).get(path).expect(200)).body.focuses, []);
    assert.deepEqual(
      (await authenticated(app).get(otherWeekPath).expect(200)).body.focuses.map((focus: WeeklyFocus) => focus.title),
      ['Other week'],
    );
    assert.deepEqual(data.tasks, originalTasks);
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


describe('Weekly Planning lifecycle HTTP contract (isolated store)', () => {
  const path = '/week-plans/2026-09-21';
  it('returns untouched state without creating a row and requires authentication', async () => {
    const data = database(); const app = createPlanningTestApp(data);
    await request(app).get(path).expect(401);
    await request(app).put(path).send({ action: 'start' }).expect(401);
    assert.deepEqual((await authenticated(app).get(path).expect(200)).body, { weekPlan: null, focuses: [] });
    assert.equal(data.weeks.size, 0);
    await authenticated(app).put(path).send({ action: 'complete' }).expect(409);
    assert.equal(data.weeks.size, 0);
  });

  it('starts once, persists/resumes ordered progress in a fresh app, completes idempotently and edits the same completed owner', async () => {
    const data = database(); const app = createPlanningTestApp(data);
    const starts = await Promise.all([1,2,3].map(() => authenticated(app).put(path).send({ action: 'start' }).expect(200)));
    const id = starts[0]!.body.weekPlan.id;
    for (const response of starts) assert.deepEqual([response.body.weekPlan.status, response.body.weekPlan.resumeStep, response.body.weekPlan.id], ['in_progress',1,id]);
    assert.equal(data.weeks.size, 1);
    await authenticated(app).put(path).send({ action: 'complete' }).expect(409);
    await authenticated(app).put(path).send({ action: 'save', step: 3, advance: true }).expect(409);
    for (const step of [1,2]) await authenticated(app).put(path).send({ action: 'save', step, advance: true }).expect(200);
    await authenticated(app).put(path).send({ action: 'save', step: 3, titles: ['Persisted focus'] }).expect(200);
    const restored = (await authenticated(createPlanningTestApp(data)).get(path).expect(200)).body;
    assert.equal(restored.weekPlan.resumeStep, 3);
    assert.equal(restored.focuses[0].title, 'Persisted focus');
    const back = await authenticated(app).put(path).send({ action: 'save', step: 1, advance: true }).expect(200);
    assert.equal(back.body.weekPlan.resumeStep, 3);
    await authenticated(app).put(path).send({ action: 'save', step: 3, advance: true }).expect(200);
    const completed = (await authenticated(app).put(path).send({ action: 'complete' }).expect(200)).body.weekPlan;
    assert.equal(completed.status, 'completed'); assert.ok(completed.completedAt);
    const repeat = await authenticated(app).put(path).send({ action: 'complete' }).expect(200);
    assert.deepEqual(repeat.body.weekPlan, completed);
    const edit = await authenticated(app).put(path).send({ action: 'save', step: 3, titles: ['Edited focus'] }).expect(200);
    assert.equal(edit.body.weekPlan.id, id); assert.equal(edit.body.weekPlan.status, 'completed');
    assert.equal(edit.body.weekPlan.completedAt, completed.completedAt);
    assert.equal(edit.body.focuses[0].title, 'Edited focus');
    const restarted = await authenticated(app).put(path).send({ action: 'start' }).expect(200);
    assert.equal(restarted.body.weekPlan.status, 'completed'); assert.equal(data.weeks.size, 1);
  });

  it('keeps independent weeks/users and preserves existing focus-only and empty owner rows', async () => {
    const data = database(); const app = createPlanningTestApp(data);
    const original = await authenticated(app).put(`${path}/focuses`).send({ titles: ['Legacy focus'] }).expect(200);
    const before = await authenticated(app).get(path).expect(200);
    assert.equal(before.body.weekPlan.status, 'not_started');
    assert.equal(before.body.weekPlan.resumeStep, 0);
    const started = await authenticated(app).put(path).send({ action: 'start' }).expect(200);
    assert.equal(started.body.weekPlan.id, original.body.focuses[0].weekPlanId);
    assert.deepEqual(started.body.focuses, original.body.focuses);
    assert.equal((await authenticated(app, 'token-b').get(path).expect(200)).body.weekPlan, null);
    const b = await authenticated(app, 'token-b').put(path).send({ action: 'start' }).expect(200);
    assert.notEqual(b.body.weekPlan.id, started.body.weekPlan.id);
    const other = '/week-plans/2026-09-28';
    await authenticated(app).put(`${other}/focuses`).send({ titles: [] }).expect(200);
    assert.equal((await authenticated(app).get(other).expect(200)).body.weekPlan.status, 'not_started');
    assert.equal((await authenticated(app).get(path).expect(200)).body.weekPlan.status, 'in_progress');
  });

  for (const date of ['2026-02-29','2026-13-01','2026-9-1','not-a-date','2026-09-13T00:00:00Z']) {
    it(`rejects invalid lifecycle date ${date}`, async () => {
      const app = createPlanningTestApp(database());
      await authenticated(app).get(`/week-plans/${date}`).expect(400);
      await authenticated(app).put(`/week-plans/${date}`).send({ action: 'start' }).expect(400);
    });
  }
  for (const input of [{}, { action: 'completed' }, { action: 'start', step: 1 }, { action: 'save', step: 0 },
    { action: 'save', step: 5 }, { action: 'save', step: 2.5 }, { action: 'save', step: 1, advance: 'true' },
    { action: 'save', step: 2, titles: [] }, { action: 'save', step: 3, titles: ['same','same'] },
    { action: 'save', step: 3, titles: ['a','b','c','d'] }, { action: 'start', userId: userB.id },
    { action: 'save', step: 3, titles: null }]) {
    it(`rejects invalid transition payload ${JSON.stringify(input)} without mutation`, async () => {
      const data = database(); const app = createPlanningTestApp(data);
      await authenticated(app).put(path).send(input).expect(400);
      assert.equal(data.weeks.size, 0);
    });
  }
});
