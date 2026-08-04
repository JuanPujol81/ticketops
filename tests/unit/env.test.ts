import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { loadConfig } from '../../src/config/env.js';

describe('environment configuration', () => {
  const validEnvironment = {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: 'postgresql://ticketops:ticketops@localhost:5433/ticketops?schema=public',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'a-secure-test-secret-with-32-characters',
  };

  it('loads valid configuration', () => {
    expect(loadConfig(validEnvironment)).toEqual({
      NODE_ENV: 'test',
      PORT: 3000,
      DATABASE_URL: 'postgresql://ticketops:ticketops@localhost:5433/ticketops?schema=public',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'a-secure-test-secret-with-32-characters',
      JWT_EXPIRES_IN: '1h',
      CORS_ORIGIN: '*',
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
