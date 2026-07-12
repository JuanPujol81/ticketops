import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const verifyDatabaseConnection = async (): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
};
