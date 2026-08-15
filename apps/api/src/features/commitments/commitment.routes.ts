import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { createCommitmentService } from './commitment.service.js';
import type { CommitmentServiceFactory } from './commitment.types.js';
import {
  CommitmentApiError,
  parseCommitmentFilters,
  parseCommitmentId,
  parseCreateCommitment,
  parseUpdateCommitment,
} from './commitment.validation.js';

export function createCommitmentRouter(
  authMiddleware: RequestHandler = requireAuth,
  serviceFactory: CommitmentServiceFactory = createCommitmentService,
) {
  const router = Router();

  router.get('/', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    response.json({ commitments: await service.list(parseCommitmentFilters(request.query)) });
  });

  router.post('/', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const commitment = await service.create(parseCreateCommitment(request.body));
    response.status(201).json({ commitment });
  });

  router.patch('/:id', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const commitment = await service.update(
      parseCommitmentId(request.params.id),
      parseUpdateCommitment(request.body),
    );
    response.json({ commitment });
  });

  router.delete('/:id', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const commitment = await service.delete(parseCommitmentId(request.params.id));
    response.json({ commitment });
  });

  router.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (error instanceof CommitmentApiError) {
      response.status(error.statusCode).json({ error: error.responseMessage });
      return;
    }
    next(error);
  });

  return router;
}

export const commitmentRouter = createCommitmentRouter();
