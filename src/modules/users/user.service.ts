import type { UserRole } from '@prisma/client';
import { HttpError } from '../../shared/errors/http-error.js';
import * as repository from './user.repository.js';

export const getProfile = async (id: string) => {
  const user = await repository.findUserById(id);
  if (!user) throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
  return user;
};

export const listUsers = async (query: { role?: UserRole; page: number; limit: number }) => {
  const { items, total } = await repository.listUsers(
    query.role ? { role: query.role } : {},
    query.page,
    query.limit,
  );
  return {
    items,
    meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
  };
};

export const updateRole = async (actorId: string, id: string, role: UserRole) => {
  if (actorId === id)
    throw new HttpError(400, 'Administrators cannot change their own role', 'SELF_ROLE_CHANGE');
  if (!(await repository.findUserById(id)))
    throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
  return repository.updateUserRole(id, role);
};
