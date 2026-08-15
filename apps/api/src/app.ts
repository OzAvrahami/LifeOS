import express, { NextFunction, Request, Response, Router } from 'express';

import { commitmentRouter } from './features/commitments/commitment.routes.js';
import { planningRouter } from './features/planning/planning.routes.js';
import { settingsRouter } from './features/settings/settings.routes.js';
import { taskRouter } from './features/tasks/task.routes.js';
import { localDevelopmentCors } from './middleware/cors.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';

export function createApp({
  auth = authRouter,
  commitments = commitmentRouter,
  planning = planningRouter,
  settings = settingsRouter,
  tasks = taskRouter,
}: { auth?: Router; commitments?: Router; planning?: Router; settings?: Router; tasks?: Router } = {}) {
  const application = express();

  application.disable('x-powered-by');
  application.use(localDevelopmentCors);
  application.use(express.json());
  application.use('/health', healthRouter);
  application.use('/auth', auth);
  application.use('/commitments', commitments);
  application.use(planning);
  application.use('/settings', settings);
  application.use('/tasks', tasks);

  application.use(
    (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
      void _next;
      if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
        response.status(400).json({ error: 'Invalid JSON' });
        return;
      }
      response.status(500).json({ error: 'Internal server error' });
    },
  );

  return application;
}

export const app = createApp();
