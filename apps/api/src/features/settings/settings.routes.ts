import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { createSettingsService } from './settings.service.js';
import type { SettingsServiceFactory } from './settings.types.js';
import { parsePutSettings, SettingsApiError } from './settings.validation.js';

export function createSettingsRouter(
  authMiddleware: RequestHandler = requireAuth,
  serviceFactory: SettingsServiceFactory = createSettingsService,
) {
  const router = Router();

  router.get('/', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    response.json({ settings: await service.get() });
  });

  router.put('/', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    response.json({ settings: await service.put(parsePutSettings(request.body)) });
  });

  router.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (error instanceof SettingsApiError) {
      response.status(error.statusCode).json({ error: error.responseMessage });
      return;
    }
    next(error);
  });

  return router;
}

export const settingsRouter = createSettingsRouter();
