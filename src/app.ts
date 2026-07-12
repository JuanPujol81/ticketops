import express, { type Express, type Request, type Response } from 'express';

export const createApp = (): Express => {
  const app = express();

  app.use(express.json());

  app.get('/health', (_request: Request, response: Response) => {
    response.json({ status: 'ok' });
  });

  return app;
};
