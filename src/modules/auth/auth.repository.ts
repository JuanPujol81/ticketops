import { prisma } from '../../shared/db/prisma.js';

export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });

export const createUser = (data: { name: string; email: string; passwordHash: string }) =>
  prisma.user.create({ data });
