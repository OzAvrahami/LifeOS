import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { Router } from 'express';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { createCommitmentRouter } from '../src/features/commitments/commitment.routes.js';
import type {
  Commitment,
  CommitmentListFilters,
  CommitmentServiceContract,
  CreateCommitmentInput,
  UpdateCommitmentInput,
} from '../src/features/commitments/commitment.types.js';
import {
  CommitmentApiError,
  validateCommitmentTimeRange,
} from '../src/features/commitments/commitment.validation.js';
import { createRequireAuth } from '../src/middleware/auth.middleware.js';

const userA = { email: 'a@example.com', id: '11111111-1111-4111-8111-111111111111' } as User;
const userB = { email: 'b@example.com', id: '22222222-2222-4222-8222-222222222222' } as User;

type OwnedCommitment = Commitment & { userId: string };
type MemoryDatabase = { commitments: OwnedCommitment[]; nextId: number };

function uuid(sequence: number) {
  return `00000000-0000-4000-8000-${sequence.toString().padStart(12, '0')}`;
}

function withoutOwnership(item: OwnedCommitment): Commitment {
  const commitment = { ...item } as Partial<OwnedCommitment>;
  delete commitment.userId;
  return commitment as Commitment;
}

class MemoryCommitmentService implements CommitmentServiceContract {
  constructor(
    private readonly database: MemoryDatabase,
    private readonly userId: string,
  ) {}

  async list(filters: CommitmentListFilters) {
    return this.database.commitments
      .filter((item) => item.userId === this.userId)
      .filter((item) => !filters.date || item.date === filters.date)
      .filter((item) => !filters.dateFrom || item.date >= filters.dateFrom)
      .filter((item) => !filters.dateTo || item.date <= filters.dateTo)
      .sort((left, right) => left.date.localeCompare(right.date)
        || left.startTime.localeCompare(right.startTime))
      .map(withoutOwnership);
  }

  async create(input: CreateCommitmentInput) {
    const timestamp = new Date().toISOString();
    const item: OwnedCommitment = {
      ...input,
      createdAt: timestamp,
      id: uuid(this.database.nextId++),
      updatedAt: timestamp,
      userId: this.userId,
    };
    this.database.commitments.push(item);
    return withoutOwnership(item);
  }

  async update(id: string, input: UpdateCommitmentInput) {
    const item = this.database.commitments.find(
      (candidate) => candidate.id === id && candidate.userId === this.userId,
    );
    if (!item) throw new CommitmentApiError(404, 'Commitment not found');
    validateCommitmentTimeRange(input.startTime ?? item.startTime, input.endTime === undefined
      ? item.endTime
      : input.endTime);
    Object.assign(item, input, { updatedAt: new Date().toISOString() });
    return withoutOwnership(item);
  }

  async delete(id: string) {
    const index = this.database.commitments.findIndex(
      (candidate) => candidate.id === id && candidate.userId === this.userId,
    );
    if (index < 0) throw new CommitmentApiError(404, 'Commitment not found');
    const [item] = this.database.commitments.splice(index, 1);
    return withoutOwnership(item!);
  }
}

function createCommitmentTestApp(database: MemoryDatabase) {
  const requireAuth = createRequireAuth({
    createUserClient: () => ({}) as SupabaseClient,
    verifyToken: async (token) => token === 'token-a' ? userA : token === 'token-b' ? userB : null,
  });
  const commitments = createCommitmentRouter(
    requireAuth,
    (_client, userId) => new MemoryCommitmentService(database, userId),
  );
  return createApp({ auth: Router(), commitments, planning: Router(), tasks: Router() });
}

function authenticated(app: ReturnType<typeof createApp>, token = 'token-a') {
  return {
    delete: (path: string) => request(app).delete(path).set('Authorization', `Bearer ${token}`),
    get: (path: string) => request(app).get(path).set('Authorization', `Bearer ${token}`),
    patch: (path: string) => request(app).patch(path).set('Authorization', `Bearer ${token}`),
    post: (path: string) => request(app).post(path).set('Authorization', `Bearer ${token}`),
  };
}

function database(): MemoryDatabase {
  return { commitments: [], nextId: 1 };
}

describe('Commitment API', () => {
  it('requires authentication for every route', async () => {
    const app = createCommitmentTestApp(database());
    await request(app).get('/commitments').expect(401);
    await request(app).post('/commitments').send({}).expect(401);
    await request(app).patch(`/commitments/${uuid(1)}`).send({ title: 'x' }).expect(401);
    await request(app).delete(`/commitments/${uuid(1)}`).expect(401);
  });

  it('creates the minimal one-time Commitment with server ownership and camelCase output', async () => {
    const data = database();
    const app = createCommitmentTestApp(data);
    const response = await authenticated(app).post('/commitments').send({
      date: '2026-08-17',
      startTime: '09:30',
      title: '  תור לרופא  ',
    }).expect(201);

    assert.equal(response.body.commitment.title, 'תור לרופא');
    assert.equal(response.body.commitment.endTime, null);
    assert.equal(response.body.commitment.lifeArea, null);
    assert.equal('userId' in response.body.commitment, false);
    assert.equal(data.commitments[0]?.userId, userA.id);
  });

  it('rejects invalid fields, ownership, life areas, dates, and time ranges', async () => {
    const app = createCommitmentTestApp(database());
    await authenticated(app).post('/commitments').send({ date: '2026-08-17', startTime: '09:30', title: ' ' }).expect(400);
    await authenticated(app).post('/commitments').send({ date: '2026-02-30', startTime: '09:30', title: 'x' }).expect(400);
    await authenticated(app).post('/commitments').send({ date: '2026-08-17', startTime: '24:00', title: 'x' }).expect(400);
    await authenticated(app).post('/commitments').send({ date: '2026-08-17', endTime: '09:00', startTime: '09:30', title: 'x' }).expect(400);
    await authenticated(app).post('/commitments').send({ date: '2026-08-17', lifeArea: 'other', startTime: '09:30', title: 'x' }).expect(400);
    await authenticated(app).post('/commitments').send({ date: '2026-08-17', startTime: '09:30', title: 'x', userId: userB.id }).expect(400);
    await authenticated(app).get('/commitments?anything=true').expect(400);
  });

  it('lists exact dates and date ranges in chronological order', async () => {
    const app = createCommitmentTestApp(database());
    for (const input of [
      { date: '2026-08-18', startTime: '11:00', title: 'Tuesday later' },
      { date: '2026-08-17', startTime: '14:00', title: 'Monday later' },
      { date: '2026-08-17', startTime: '08:00', title: 'Monday first' },
    ]) await authenticated(app).post('/commitments').send(input).expect(201);

    const day = await authenticated(app).get('/commitments?date=2026-08-17').expect(200);
    assert.deepEqual(day.body.commitments.map((item: Commitment) => item.title), ['Monday first', 'Monday later']);
    const range = await authenticated(app)
      .get('/commitments?dateFrom=2026-08-17&dateTo=2026-08-18')
      .expect(200);
    assert.deepEqual(range.body.commitments.map((item: Commitment) => item.title), [
      'Monday first',
      'Monday later',
      'Tuesday later',
    ]);
  });

  it('updates the complete resulting schedule while preserving stable identity', async () => {
    const data = database();
    const app = createCommitmentTestApp(data);
    const created = (await authenticated(app).post('/commitments').send({
      date: '2026-08-17', endTime: '10:30', startTime: '09:30', title: 'Doctor',
    }).expect(201)).body.commitment;
    await authenticated(app).patch(`/commitments/${created.id}`).send({ endTime: '09:00' }).expect(400);
    const updated = await authenticated(app).patch(`/commitments/${created.id}`).send({
      endTime: '11:00', lifeArea: 'health', startTime: '10:00', title: 'Doctor updated',
    }).expect(200);
    assert.equal(updated.body.commitment.id, created.id);
    assert.equal(updated.body.commitment.lifeArea, 'health');
    assert.equal(data.commitments.length, 1);
  });

  it('keeps users isolated and returns 404 for cross-user writes', async () => {
    const app = createCommitmentTestApp(database());
    const commitmentA = (await authenticated(app).post('/commitments').send({
      date: '2026-08-17', startTime: '09:30', title: 'A only',
    }).expect(201)).body.commitment;
    await authenticated(app, 'token-b').post('/commitments').send({
      date: '2026-08-17', startTime: '10:30', title: 'B only',
    }).expect(201);
    assert.deepEqual(
      (await authenticated(app).get('/commitments').expect(200)).body.commitments.map((item: Commitment) => item.title),
      ['A only'],
    );
    await authenticated(app, 'token-b').patch(`/commitments/${commitmentA.id}`).send({ title: 'stolen' }).expect(404);
    await authenticated(app, 'token-b').delete(`/commitments/${commitmentA.id}`).expect(404);
  });

  it('physically deletes a Commitment', async () => {
    const data = database();
    const app = createCommitmentTestApp(data);
    const created = (await authenticated(app).post('/commitments').send({
      date: '2026-08-17', startTime: '09:30', title: 'Delete me',
    }).expect(201)).body.commitment;
    const deleted = await authenticated(app).delete(`/commitments/${created.id}`).expect(200);
    assert.equal(deleted.body.commitment.id, created.id);
    assert.equal(data.commitments.length, 0);
  });

  it('records ownership RLS and database constraints in the migration', () => {
    const migration = readFileSync(
      new URL('../../../supabase/migrations/20260815120000_create_commitments.sql', import.meta.url),
      'utf8',
    );
    assert.match(migration, /alter table public\.commitments enable row level security/i);
    assert.match(migration, /to authenticated[\s\S]*using \(\(select auth\.uid\(\)\) = user_id\)/i);
    assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/i);
    assert.match(migration, /end_time is null or end_time > start_time/i);
    assert.match(migration, /commitments_user_date_start_time_idx/i);
    assert.match(migration, /on delete cascade/i);
    assert.doesNotMatch(migration, /service_role/i);
  });
});
