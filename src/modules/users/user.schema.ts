import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  role: z.enum(UserRole).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserRoleSchema = z.object({ role: z.enum(UserRole) });
export const userIdSchema = z.string().uuid();
