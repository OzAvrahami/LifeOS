import { NextFunction, Request, RequestHandler, Response } from 'express';
import { SupabaseClient, User } from '@supabase/supabase-js';

import { createUserSupabaseClient, verifyAccessToken } from '../lib/supabase.js';

export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  const match = authorizationHeader?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

type AuthDependencies = {
  createUserClient: (accessToken: string) => SupabaseClient;
  verifyToken: (accessToken: string) => Promise<User | null>;
};

export function createRequireAuth({
  createUserClient = createUserSupabaseClient,
  verifyToken = verifyAccessToken,
}: Partial<AuthDependencies> = {}): RequestHandler {
  return async function authMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    const accessToken = extractBearerToken(request.header('authorization'));

    if (!accessToken) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const user = await verifyToken(accessToken);

      if (!user) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      request.auth = {
        accessToken,
        supabase: createUserClient(accessToken),
        user,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const requireAuth = createRequireAuth();
