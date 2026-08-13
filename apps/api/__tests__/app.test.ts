import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import request from 'supertest';
import { SupabaseClient, User } from '@supabase/supabase-js';

import { app, createApp } from '../src/app.js';
import { createRequireAuth } from '../src/middleware/auth.middleware.js';
import { isCorsOriginAllowed } from '../src/middleware/cors.middleware.js';
import { createAuthRouter } from '../src/routes/auth.routes.js';

function createTestAuthApp(user: User | null) {
  const verifyToken = async () => user;
  const createUserClient = () => ({}) as SupabaseClient;
  const requireAuth = createRequireAuth({ createUserClient, verifyToken });
  return createApp({ auth: createAuthRouter(requireAuth) });
}

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

  it('rejects malformed and invalid Bearer tokens', async () => {
    const invalidTokenApp = createTestAuthApp(null);

    await request(invalidTokenApp)
      .get('/auth/me')
      .set('Authorization', 'Basic credentials')
      .expect(401);
    await request(invalidTokenApp)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('returns only the safe verified identity for a valid user', async () => {
    const verifiedUser = {
      email: 'person@example.com',
      id: 'verified-user-id',
    } as User;
    const response = await request(createTestAuthApp(verifiedUser))
      .get('/auth/me')
      .set('Authorization', 'Bearer verified-test-token')
      .expect(200);

    assert.deepEqual(response.body, {
      email: 'person@example.com',
      id: 'verified-user-id',
    });
    assert.equal(JSON.stringify(response.body).includes('verified-test-token'), false);
    assert.equal('access_token' in response.body, false);
    assert.equal('refresh_token' in response.body, false);
  });

  it('allows local Expo Web origins only outside production by default', () => {
    assert.equal(isCorsOriginAllowed('http://localhost:8081', 'development'), true);
    assert.equal(isCorsOriginAllowed('http://127.0.0.1:8098', 'test'), true);
    assert.equal(isCorsOriginAllowed('https://example.com', 'development'), false);
    assert.equal(isCorsOriginAllowed('http://localhost:8081', 'production'), false);
    assert.equal(
      isCorsOriginAllowed(
        'https://app.lifeos.example',
        'production',
        new Set(['https://app.lifeos.example']),
      ),
      true,
    );
  });
});
