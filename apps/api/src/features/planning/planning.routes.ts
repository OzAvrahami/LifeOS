import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { DailyPlanningService, parseDailyPlanning } from './daily-planning.js';
import { DailyFlowService, parseFlowCommand } from './daily-flow.js';
import { createPlanningService } from './planning.service.js';
import type { PlanningServiceFactory } from './planning.types.js';
import {
  parseDailyPlan,
  parsePlanningDate,
  parseWeeklyFocuses,
  parseWeeklyPlanning,
  PlanningApiError,
} from './planning.validation.js';

export function createPlanningRouter(
  authMiddleware: RequestHandler = requireAuth,
  serviceFactory: PlanningServiceFactory = createPlanningService,
  dailyFactory: (client: Parameters<PlanningServiceFactory>[0], userId: string) => Pick<DailyPlanningService, 'get' | 'save' | 'tasks'>
    = (client, userId) => new DailyPlanningService(client, userId),
) {
  const router = Router();

  router.get('/week-plans/:weekStart/days', authMiddleware, async (request, response) => {
    response.json(await new DailyFlowService(request.auth.supabase).week(parsePlanningDate(request.params.weekStart, 'weekStart')));
  });

  router.get('/daily-plans/:date/flow', authMiddleware, async (request, response) => {
    response.json(await new DailyFlowService(request.auth.supabase).get(parsePlanningDate(request.params.date, 'date')));
  });
  router.put('/daily-plans/:date/flow', authMiddleware, async (request, response) => {
    response.json(await new DailyFlowService(request.auth.supabase).save(parsePlanningDate(request.params.date, 'date'), parseFlowCommand(request.body)));
  });

  router.get('/daily-plans/:date/planning', authMiddleware, async (request, response) => {
    const service = dailyFactory(request.auth.supabase, request.auth.user.id);
    response.json({ plan: await service.get(parsePlanningDate(request.params.date, 'date')) });
  });
  router.put('/daily-plans/:date/planning', authMiddleware, async (request, response) => {
    const service = dailyFactory(request.auth.supabase, request.auth.user.id);
    response.json({ plan: await service.save(parsePlanningDate(request.params.date, 'date'), parseDailyPlanning(request.body)) });
  });
  router.get('/daily-plans/:date/tasks', authMiddleware, async (request, response) => {
    const service = dailyFactory(request.auth.supabase, request.auth.user.id);
    response.json({ tasks: await service.tasks(parsePlanningDate(request.params.date, 'date')) });
  });

  router.get('/week-plans/:weekStart', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    response.json(await service.getWeeklyPlan(parsePlanningDate(request.params.weekStart, 'weekStart')));
  });

  router.put('/week-plans/:weekStart', authMiddleware, async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    response.json(await service.saveWeeklyPlan(
      parsePlanningDate(request.params.weekStart, 'weekStart'), parseWeeklyPlanning(request.body),
    ));
  });

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
