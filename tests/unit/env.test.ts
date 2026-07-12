import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { loadConfig } from '../../src/config/env.js';

describe('environment configuration', () => {
  const validEnvironment = {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: 'postgresql://ticketops:ticketops@localhost:5433/ticketops?schema=public',
    REDIS_URL: 'redis://localhost:6379',
  };

  it('loads valid configuration', () => {
    expect(loadConfig(validEnvironment)).toEqual({
      NODE_ENV: 'test',
      PORT: 3000,
      DATABASE_URL: 'postgresql://ticketops:ticketops@localhost:5433/ticketops?schema=public',
      REDIS_URL: 'redis://localhost:6379',
    });
  });

  it('rejects an invalid PORT', () => {
    expect(() =>
      loadConfig({
        ...validEnvironment,
        PORT: 'not-a-port',
      }),
    ).toThrow(ZodError);
  });
});
