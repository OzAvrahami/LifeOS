import express, { NextFunction, Request, Response } from 'express';

import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use('/health', healthRouter);
app.use('/auth', authRouter);

app.use((_error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  void _next;
  response.status(500).json({ error: 'Internal server error' });
});
