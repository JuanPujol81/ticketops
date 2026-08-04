import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';

describe('ready route', () => {
  it('returns ready when the database is reachable', async () => {
    const verifyDatabaseConnection = vi.fn(async () => undefined);
    const verifyRedisConnection = vi.fn(async () => undefined);
    const response = await request(
      createApp({ verifyDatabaseConnection, verifyRedisConnection }),
    ).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ready', checks: { database: 'up', redis: 'up' } });
    expect(verifyDatabaseConnection).toHaveBeenCalledOnce();
    expect(verifyRedisConnection).toHaveBeenCalledOnce();
  });

  it('returns unavailable when the database is unreachable', async () => {
    const verifyDatabaseConnection = vi.fn(async () => {
      throw new Error('Database unavailable');
    });
    const response = await request(createApp({ verifyDatabaseConnection })).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'unavailable' });
    expect(verifyDatabaseConnection).toHaveBeenCalledOnce();
  });
});
