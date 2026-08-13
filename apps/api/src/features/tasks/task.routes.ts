import { NextFunction, Request, RequestHandler, Response, Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { createTaskService } from './task.service.js';
import { TaskServiceFactory } from './task.types.js';
import {
  parseCreateTask,
  parseTaskFilters,
  parseTaskId,
  parseUpdateTask,
  TaskApiError,
} from './task.validation.js';

export function createTaskRouter(
  authMiddleware: RequestHandler = requireAuth,
  serviceFactory: TaskServiceFactory = createTaskService,
) {
  const router = Router();
  router.use(authMiddleware);

  router.get('/', async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const tasks = await service.list(parseTaskFilters(request.query));
    response.json({ tasks });
  });

  router.post('/', async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const task = await service.create(parseCreateTask(request.body));
    response.status(201).json({ task });
  });

  router.patch('/:id', async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const task = await service.update(parseTaskId(request.params.id), parseUpdateTask(request.body));
    response.json({ task });
  });

  router.delete('/:id', async (request, response) => {
    const service = serviceFactory(request.auth.supabase, request.auth.user.id);
    const task = await service.cancel(parseTaskId(request.params.id));
    response.json({ task });
  });

  router.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (error instanceof TaskApiError) {
      response.status(error.statusCode).json({ error: error.responseMessage });
      return;
    }
    next(error);
  });

  return router;
}

export const taskRouter = createTaskRouter();
