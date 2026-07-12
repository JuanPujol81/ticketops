import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../errors/http-error.js';
import { logger } from '../logger/logger.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  logger.error('Unhandled request error', error);
  response.status(500).json({ message: 'Internal server error' });
};
