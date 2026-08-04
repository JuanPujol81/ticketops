import express, { type Express, type Request, type Response } from 'express';
import { verifyDatabaseConnection } from './shared/db/prisma.js';
import { verifyRedisConnection } from './shared/queue/redis.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { ticketRouter } from './modules/tickets/ticket.routes.js';
import { errorHandler } from './shared/http/error-handler.js';
import { HttpError } from './shared/errors/http-error.js';
import { config } from './config/env.js';

type AppDependencies = {
  verifyDatabaseConnection: () => Promise<void>;
  verifyRedisConnection?: () => Promise<void>;
};

const defaultDependencies: AppDependencies = {
  verifyDatabaseConnection,
  verifyRedisConnection,
};

export const createApp = (dependencies: AppDependencies = defaultDependencies): Express => {
  const app = express();

  app.use(express.json());
  app.disable('x-powered-by');
  app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', config.CORS_ORIGIN);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (request.method === 'OPTIONS') {
      response.status(204).send();
      return;
    }
    next();
  });

  app.get('/health', (_request: Request, response: Response) => {
    response.json({ status: 'ok' });
  });

  app.get('/ready', async (_request: Request, response: Response) => {
    try {
      await dependencies.verifyDatabaseConnection();
      if (dependencies.verifyRedisConnection) await dependencies.verifyRedisConnection();
      response.json({ status: 'ready', checks: { database: 'up', redis: 'up' } });
    } catch {
      response.status(503).json({ status: 'unavailable' });
    }
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/tickets', ticketRouter);

  app.use((_request, _response, next) =>
    next(new HttpError(404, 'Route not found', 'ROUTE_NOT_FOUND')),
  );
  app.use(errorHandler);

  return app;
};
