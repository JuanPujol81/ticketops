import express, { type Express, type Request, type Response } from 'express';
import { verifyDatabaseConnection } from './shared/db/prisma.js';

type AppDependencies = {
  verifyDatabaseConnection: () => Promise<void>;
};

const defaultDependencies: AppDependencies = {
  verifyDatabaseConnection,
};

export const createApp = (dependencies: AppDependencies = defaultDependencies): Express => {
  const app = express();

  app.use(express.json());

  app.get('/health', (_request: Request, response: Response) => {
    response.json({ status: 'ok' });
  });

  app.get('/ready', async (_request: Request, response: Response) => {
    try {
      await dependencies.verifyDatabaseConnection();
      response.json({ status: 'ready' });
    } catch {
      response.status(503).json({ status: 'unavailable' });
    }
  });

  return app;
};
