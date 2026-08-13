import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { SupabaseClient, User } from '@supabase/supabase-js';
import { Router } from 'express';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { TaskService } from '../src/features/tasks/task.service.js';
import {
  TaskListFilters,
  TaskRow,
  TaskStore,
} from '../src/features/tasks/task.types.js';
import { TaskApiError } from '../src/features/tasks/task.validation.js';
import { createTaskRouter } from '../src/features/tasks/task.routes.js';
import { createRequireAuth } from '../src/middleware/auth.middleware.js';

const userA = { email: 'a@example.com', id: '11111111-1111-4111-8111-111111111111' } as User;
const userB = { email: 'b@example.com', id: '22222222-2222-4222-8222-222222222222' } as User;

type MemoryDatabase = {
  nextTask: number;
  nextWeek: number;
  tasks: TaskRow[];
  weeks: { id: string; userId: string; weekStart: string }[];
};

function uuid(sequence: number) {
  return `00000000-0000-4000-8000-${sequence.toString().padStart(12, '0')}`;
}

class MemoryTaskStore implements TaskStore {
  constructor(
    private readonly database: MemoryDatabase,
    private readonly userId: string,
  ) {}

  async findWeekPlan(weekStart: string) {
    return this.database.weeks.find(
      (week) => week.userId === this.userId && week.weekStart === weekStart,
    )?.id ?? null;
  }

  async ensureWeekPlan(weekStart: string) {
    const existing = await this.findWeekPlan(weekStart);
    if (existing) return existing;
    const id = uuid(10_000 + this.database.nextWeek++);
    this.database.weeks.push({ id, userId: this.userId, weekStart });
    return id;
  }

  async list(filters: TaskListFilters & { weekPlanId?: string | null }) {
    return this.database.tasks.filter((task) => {
      if (task.user_id !== this.userId) return false;
      if (filters.status ? task.status !== filters.status : task.status === 'cancelled') return false;
      if (filters.plannedDate && task.planned_date !== filters.plannedDate) return false;
      if (filters.weekPlanId && task.week_plan_id !== filters.weekPlanId) return false;
      if (
        filters.placement === 'inbox' &&
        (task.status !== 'open' || task.planned_date !== null || task.week_plan_id !== null)
      ) return false;
      return true;
    });
  }

  async create(values: Record<string, unknown>) {
    const now = new Date().toISOString();
    const task: TaskRow = {
      completed_at: null,
      created_at: now,
      description: null,
      due_date: null,
      estimated_minutes: null,
      id: uuid(this.database.nextTask++),
      planned_date: null,
      position: 0,
      priority: 'normal',
      status: 'open',
      title: '',
      updated_at: now,
      user_id: this.userId,
      week_plan_id: null,
      ...values,
    } as TaskRow;
    this.database.tasks.push(task);
    return task;
  }

  async update(id: string, values: Record<string, unknown>) {
    const task = this.database.tasks.find(
      (candidate) => candidate.id === id && candidate.user_id === this.userId,
    );
    if (!task) return null;
    Object.assign(task, values, { updated_at: new Date().toISOString() });
    return task;
  }

  async start(id: string) {
    const task = this.database.tasks.find(
      (candidate) => candidate.id === id && candidate.user_id === this.userId,
    );
    if (!task) throw new TaskApiError(404, 'Task not found');
    if (task.status !== 'open' && task.status !== 'in_progress') {
      throw new TaskApiError(409, 'Task state conflict');
    }
    for (const candidate of this.database.tasks) {
      if (candidate.user_id === this.userId && candidate.status === 'in_progress') {
        candidate.status = 'open';
        candidate.completed_at = null;
      }
    }
    task.status = 'in_progress';
    task.completed_at = null;
    task.updated_at = new Date().toISOString();
    return task;
  }

  cancel(id: string) {
    return this.update(id, { completed_at: null, status: 'cancelled' });
  }
}

function createTaskTestApp(database: MemoryDatabase) {
  const verifyToken = async (token: string) => {
    if (token === 'token-a') return userA;
    if (token === 'token-b') return userB;
    return null;
  };
  const requireAuth = createRequireAuth({
    createUserClient: () => ({}) as SupabaseClient,
    verifyToken,
  });
  const tasks = createTaskRouter(
    requireAuth,
    (_client, userId) => new TaskService(new MemoryTaskStore(database, userId)),
  );
  return createApp({ auth: Router(), tasks });
}

function database(): MemoryDatabase {
  return { nextTask: 1, nextWeek: 1, tasks: [], weeks: [] };
}

function authenticated(app: ReturnType<typeof createApp>, token = 'token-a') {
  return {
    delete: (path: string) => request(app).delete(path).set('Authorization', `Bearer ${token}`),
    get: (path: string) => request(app).get(path).set('Authorization', `Bearer ${token}`),
    patch: (path: string) => request(app).patch(path).set('Authorization', `Bearer ${token}`),
    post: (path: string) => request(app).post(path).set('Authorization', `Bearer ${token}`),
  };
}

describe('Task API', () => {
  it('requires authentication for every Task route', async () => {
    const app = createTaskTestApp(database());
    await request(app).get('/tasks').expect(401);
    await request(app).post('/tasks').send({ title: 'private' }).expect(401);
  });

  it('creates a title-only Inbox Task with server-owned defaults', async () => {
    const data = database();
    const app = createTaskTestApp(data);
    const response = await authenticated(app).post('/tasks').send({ title: '  לקבוע טיפול לרכב  ' }).expect(201);

    assert.equal(response.body.task.title, 'לקבוע טיפול לרכב');
    assert.equal(response.body.task.status, 'open');
    assert.equal(response.body.task.plannedDate, null);
    assert.equal(response.body.task.weekPlanId, null);
    assert.equal(response.body.task.completedAt, null);
    assert.equal('userId' in response.body.task, false);
    assert.equal(data.tasks[0]?.user_id, userA.id);
  });

  it('validates title, duration, status, dates, UUIDs, and rejects client ownership', async () => {
    const app = createTaskTestApp(database());
    await authenticated(app).post('/tasks').send({ title: '   ' }).expect(400);
    await authenticated(app).post('/tasks').send({ title: 'x', estimatedMinutes: -1 }).expect(400);
    await authenticated(app).post('/tasks').send({ title: 'x', userId: userB.id }).expect(400);
    await authenticated(app).patch('/tasks/not-a-uuid').send({ status: 'open' }).expect(400);
    await authenticated(app).patch(`/tasks/${uuid(1)}`).send({ status: 'today' }).expect(400);
    await authenticated(app).post('/tasks').send({ title: 'x', planning: { type: 'day', plannedDate: '2026-02-30' } }).expect(400);
    await request(app)
      .post('/tasks')
      .set('Authorization', 'Bearer token-a')
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400, { error: 'Invalid JSON' });
  });

  it('lists only the caller Tasks and cannot read or update another user Task', async () => {
    const data = database();
    const app = createTaskTestApp(data);
    const taskA = (await authenticated(app).post('/tasks').send({ title: 'A' }).expect(201)).body.task;
    const taskB = (await authenticated(app, 'token-b').post('/tasks').send({ title: 'B' }).expect(201)).body.task;

    const listA = await authenticated(app).get('/tasks').expect(200);
    assert.deepEqual(listA.body.tasks.map((task: { id: string }) => task.id), [taskA.id]);
    await authenticated(app).patch(`/tasks/${taskB.id}`).send({ title: 'stolen' }).expect(404);
    await authenticated(app).delete(`/tasks/${taskB.id}`).expect(404);
  });

  it('moves the same Task Inbox → Week → Today without creating duplicates', async () => {
    const data = database();
    const app = createTaskTestApp(data);
    const task = (await authenticated(app).post('/tasks').send({ title: 'Flow' }).expect(201)).body.task;

    const weekly = await authenticated(app)
      .patch(`/tasks/${task.id}`)
      .send({ planning: { type: 'week', weekStart: '2026-08-09' } })
      .expect(200);
    assert.equal(weekly.body.task.id, task.id);
    assert.ok(weekly.body.task.weekPlanId);
    assert.equal(weekly.body.task.plannedDate, null);

    const weekList = await authenticated(app).get('/tasks?weekStart=2026-08-09').expect(200);
    assert.deepEqual(weekList.body.tasks.map((item: { id: string }) => item.id), [task.id]);

    const today = await authenticated(app)
      .patch(`/tasks/${task.id}`)
      .send({ planning: { type: 'day', plannedDate: '2026-08-13' } })
      .expect(200);
    assert.equal(today.body.task.id, task.id);
    assert.equal(today.body.task.plannedDate, '2026-08-13');
    assert.equal(today.body.task.weekPlanId, null);
    assert.equal(data.tasks.length, 1);
    assert.equal(data.weeks.length, 1);
  });

  it('moves Inbox directly to Today while preserving identity', async () => {
    const data = database();
    const app = createTaskTestApp(data);
    const task = (await authenticated(app).post('/tasks').send({ title: 'Today' }).expect(201)).body.task;
    const moved = await authenticated(app)
      .patch(`/tasks/${task.id}`)
      .send({ planning: { type: 'day', plannedDate: '2026-08-13' } })
      .expect(200);
    assert.equal(moved.body.task.id, task.id);
    assert.equal(data.tasks.length, 1);
  });

  it('starts, stops, completes, and reopens one stable Task with correct completedAt semantics', async () => {
    const data = database();
    const app = createTaskTestApp(data);
    const task = (await authenticated(app).post('/tasks').send({ title: 'Execute' }).expect(201)).body.task;

    const started = await authenticated(app).patch(`/tasks/${task.id}`).send({ status: 'in_progress' }).expect(200);
    assert.equal(started.body.task.id, task.id);
    assert.equal(started.body.task.status, 'in_progress');

    const stopped = await authenticated(app).patch(`/tasks/${task.id}`).send({ status: 'open' }).expect(200);
    assert.equal(stopped.body.task.status, 'open');
    assert.equal(stopped.body.task.completedAt, null);

    const completed = await authenticated(app).patch(`/tasks/${task.id}`).send({ status: 'completed' }).expect(200);
    assert.equal(completed.body.task.status, 'completed');
    assert.ok(completed.body.task.completedAt);

    const reopened = await authenticated(app).patch(`/tasks/${task.id}`).send({ status: 'open' }).expect(200);
    assert.equal(reopened.body.task.id, task.id);
    assert.equal(reopened.body.task.completedAt, null);
    assert.equal(data.tasks.length, 1);
  });

  it('starting B atomically returns A to open and leaves only B active', async () => {
    const data = database();
    const app = createTaskTestApp(data);
    const first = (await authenticated(app).post('/tasks').send({ title: 'A' }).expect(201)).body.task;
    const second = (await authenticated(app).post('/tasks').send({ title: 'B' }).expect(201)).body.task;

    await authenticated(app).patch(`/tasks/${first.id}`).send({ status: 'in_progress' }).expect(200);
    await authenticated(app).patch(`/tasks/${second.id}`).send({ status: 'in_progress' }).expect(200);

    const active = data.tasks.filter((task) => task.user_id === userA.id && task.status === 'in_progress');
    assert.deepEqual(active.map((task) => task.id), [second.id]);
    assert.equal(data.tasks.find((task) => task.id === first.id)?.status, 'open');
  });

  it('rejects starting a completed Task until it is explicitly reopened', async () => {
    const data = database();
    const app = createTaskTestApp(data);
    const task = (await authenticated(app).post('/tasks').send({ title: 'Done' }).expect(201)).body.task;
    await authenticated(app).patch(`/tasks/${task.id}`).send({ status: 'completed' }).expect(200);
    await authenticated(app).patch(`/tasks/${task.id}`).send({ status: 'in_progress' }).expect(409);
    assert.equal(data.tasks[0]?.status, 'completed');
  });

  it('DELETE is a retained cancellation, not physical deletion', async () => {
    const data = database();
    const app = createTaskTestApp(data);
    const task = (await authenticated(app).post('/tasks').send({ title: 'Mistake' }).expect(201)).body.task;
    const cancelled = await authenticated(app).delete(`/tasks/${task.id}`).expect(200);
    assert.equal(cancelled.body.task.status, 'cancelled');
    assert.equal(data.tasks.length, 1);
    assert.equal((await authenticated(app).get('/tasks').expect(200)).body.tasks.length, 0);
    assert.equal((await authenticated(app).get('/tasks?status=cancelled').expect(200)).body.tasks.length, 1);
  });

  it('statically records RLS, ownership checks, and database active-task protection', () => {
    const migration = readFileSync(
      new URL('../../../supabase/migrations/20260813180329_create_task_foundation.sql', import.meta.url),
      'utf8',
    );
    assert.match(migration, /alter table public\.tasks enable row level security/i);
    assert.match(migration, /alter table public\.week_plans enable row level security/i);
    assert.match(migration, /to authenticated[\s\S]*using \(\(select auth\.uid\(\)\) = user_id\)/i);
    assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/i);
    assert.match(migration, /unique index tasks_one_in_progress_per_user_idx/i);
    assert.match(migration, /security invoker/i);
    assert.match(migration, /pg_advisory_xact_lock/i);
    assert.doesNotMatch(migration, /service_role/i);
  });
});
