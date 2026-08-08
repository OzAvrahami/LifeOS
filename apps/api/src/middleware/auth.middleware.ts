import { NextFunction, Request, Response } from 'express';

import { createUserSupabaseClient, verifyAccessToken } from '../lib/supabase.js';

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  const match = authorizationHeader?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const accessToken = extractBearerToken(request.header('authorization'));

  if (!accessToken) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await verifyAccessToken(accessToken);

    if (!user) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    request.auth = {
      accessToken,
      supabase: createUserSupabaseClient(accessToken),
      user,
    };
    next();
  } catch (error) {
    next(error);
  }
}
