import { RequestHandler, Router } from 'express';

import { requireAuth } from '../middleware/auth.middleware.js';

export function createAuthRouter(authMiddleware: RequestHandler = requireAuth) {
  const router = Router();

  router.get('/me', authMiddleware, (request, response) => {
    response.json({
      email: request.auth.user.email ?? null,
      id: request.auth.user.id,
    });
  });

  return router;
}

export const authRouter = createAuthRouter();
