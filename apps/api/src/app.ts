import express, { NextFunction, Request, Response, Router } from 'express';

import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { localDevelopmentCors } from './middleware/cors.middleware.js';

export function createApp({ auth = authRouter }: { auth?: Router } = {}) {
  const application = express();

  application.disable('x-powered-by');
  application.use(localDevelopmentCors);
  application.use(express.json());
  application.use('/health', healthRouter);
  application.use('/auth', auth);

  application.use(
    (_error: unknown, _request: Request, response: Response, _next: NextFunction) => {
      void _next;
      response.status(500).json({ error: 'Internal server error' });
    },
  );

  return application;
}

export const app = createApp();
