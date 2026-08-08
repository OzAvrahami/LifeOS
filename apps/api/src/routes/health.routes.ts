import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json({
    service: 'lifeos-api',
    status: 'ok',
  });
});
