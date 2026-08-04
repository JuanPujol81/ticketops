import type { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.js';

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const findUserById = (id: string) =>
  prisma.user.findUnique({ where: { id }, select: publicSelect });

export const listUsers = async (where: { role?: UserRole }, page: number, limit: number) => {
  const visibleUsers = { ...where, id: { not: '00000000-0000-0000-0000-000000000000' } };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: visibleUsers,
      select: publicSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where: visibleUsers }),
  ]);
  return { items, total };
};

export const updateUserRole = (id: string, role: UserRole) =>
  prisma.user.update({ where: { id }, data: { role }, select: publicSelect });
