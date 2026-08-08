import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import request from 'supertest';

import { app } from '../src/app.js';

describe('LifeOS API', () => {
  it('reports service health', async () => {
    const response = await request(app).get('/health').expect(200);

    assert.deepEqual(response.body, {
      service: 'lifeos-api',
      status: 'ok',
    });
  });

  it('rejects an unauthenticated identity request', async () => {
    const response = await request(app).get('/auth/me').expect(401);

    assert.deepEqual(response.body, { error: 'Unauthorized' });
  });
});
