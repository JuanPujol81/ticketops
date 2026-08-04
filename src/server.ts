import { createApp } from './app.js';
import { config } from './config/env.js';
import { prisma } from './shared/db/prisma.js';
import { redisConnection } from './shared/queue/redis.js';
import { ticketEventsQueue } from './shared/queue/ticket-events.queue.js';
import { logger } from './shared/logger/logger.js';

const app = createApp();
const server = app.listen(config.PORT, () => {
  logger.info(`TicketOps listening on port ${config.PORT}`);
});

let shuttingDown = false;
const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal}; shutting down`);
  server.close(async () => {
    await Promise.allSettled([
      ticketEventsQueue.close(),
      redisConnection.quit(),
      prisma.$disconnect(),
    ]);
    process.exit(0);
  });
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
