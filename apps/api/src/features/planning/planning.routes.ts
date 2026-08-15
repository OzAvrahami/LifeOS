import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { createPlanningService } from './planning.service.js';
import type { PlanningServiceFactory } from './planning.types.js';
import {
  parseDailyPlan,
  parsePlanningDate,
  parseWeeklyFocuses,
  PlanningApiError,
} from './planning.validation.js';

export function createPlanningRouter(
  authMiddleware: RequestHandler = requireAuth,
  serviceFactory: PlanningServiceFactory = createPlanningService,
) {
  const router = Router();

  router.get('/daily-plans/:date', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const dailyPlan = await service.getDailyPlan(
      parsePlanningDate(request.params.date, 'date'),
    );
    response.json({ dailyPlan });
  });

  router.put('/daily-plans/:date', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const dailyPlan = await service.putDailyPlan(
      parsePlanningDate(request.params.date, 'date'),
      parseDailyPlan(request.body),
    );
    response.json({ dailyPlan });
  });

  router.get('/week-plans/:weekStart/focuses', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const focuses = await service.getWeeklyFocuses(
      parsePlanningDate(request.params.weekStart, 'weekStart'),
    );
    response.json({ focuses });
  });

  router.put('/week-plans/:weekStart/focuses', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const focuses = await service.replaceWeeklyFocuses(
      parsePlanningDate(request.params.weekStart, 'weekStart'),
      parseWeeklyFocuses(request.body),
    );
    response.json({ focuses });
  });

  router.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (error instanceof PlanningApiError) {
      response.status(error.statusCode).json({ error: error.responseMessage });
      return;
    }
    next(error);
  });

  return router;
}

export const planningRouter = createPlanningRouter();
