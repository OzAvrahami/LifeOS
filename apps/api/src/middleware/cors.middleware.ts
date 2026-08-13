import { NextFunction, Request, Response } from 'express';

function configuredOrigins() {
  return new Set(
    (process.env.CORS_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

export function isCorsOriginAllowed(
  origin: string,
  environment = process.env.NODE_ENV,
  allowedOrigins = configuredOrigins(),
) {
  if (allowedOrigins.has(origin)) return true;
  if (environment === 'production') return false;

  try {
    const url = new URL(origin);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
}

export function localDevelopmentCors(request: Request, response: Response, next: NextFunction) {
  const origin = request.header('origin');

  if (!origin) {
    next();
    return;
  }

  if (!isCorsOriginAllowed(origin)) {
    response.status(403).json({ error: 'Origin not allowed' });
    return;
  }

  response.vary('Origin');
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }

  next();
}
