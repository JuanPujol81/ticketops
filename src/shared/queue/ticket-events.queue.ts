import { Queue } from 'bullmq';
import { redisConnectionOptions } from './redis.js';

export const ticketEventsQueue = new Queue('ticket-events', {
  connection: redisConnectionOptions,
});
