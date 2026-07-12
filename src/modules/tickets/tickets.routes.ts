import { Router } from 'express';

export const ticketsRouter = Router();

ticketsRouter.get('/', (_request, response) => {
  response.json({ data: [] });
});
