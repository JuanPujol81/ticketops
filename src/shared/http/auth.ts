import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { HttpError } from '../errors/http-error.js';

export type AuthUser = {
  id: string;
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN';
};

declare global {
  // Express exposes request augmentation through this namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate: RequestHandler = (request, _response, next) => {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    next(new HttpError(401, 'Authentication required', 'AUTHENTICATION_REQUIRED'));
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    if (typeof payload === 'string' || !payload.sub || typeof payload.role !== 'string') {
      throw new Error('Invalid token payload');
    }
    request.user = { id: payload.sub, role: payload.role as AuthUser['role'] };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token', 'INVALID_TOKEN'));
  }
};

export const authorize =
  (...roles: AuthUser['role'][]): RequestHandler =>
  (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      next(new HttpError(403, 'Insufficient permissions', 'FORBIDDEN'));
      return;
    }
    next();
  };
