import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../src/shared/errors/http-error.js';
import { errorHandler } from '../../src/shared/http/error-handler.js';

describe('error handler', () => {
  it('serializes operational errors consistently', () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const response = { status, json } as unknown as Response;

    errorHandler(
      new HttpError(404, 'Ticket not found', 'TICKET_NOT_FOUND'),
      {} as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found', details: undefined },
    });
  });
});
