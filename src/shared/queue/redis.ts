import { Redis } from 'ioredis';
import { config } from '../../config/env.js';

const parseRedisUrl = (url: string) => {
  const parsedUrl = new URL(url);

  return {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 6379),
    username: parsedUrl.username || undefined,
    password: parsedUrl.password || undefined,
    db: parsedUrl.pathname ? Number(parsedUrl.pathname.slice(1)) || 0 : 0,
  };
};

export const redisConnectionOptions = parseRedisUrl(config.REDIS_URL);

export const redisConnection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});
