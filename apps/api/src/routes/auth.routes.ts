import { Router } from 'express';

import { requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.get('/me', requireAuth, (request, response) => {
  response.json({
    email: request.auth.user.email ?? null,
    id: request.auth.user.id,
  });
});
