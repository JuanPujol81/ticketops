import type { Request, Response } from 'express';
import { listUsersQuerySchema, updateUserRoleSchema, userIdSchema } from './user.schema.js';
import * as service from './user.service.js';

export const getMe = async (request: Request, response: Response) => {
  response.json({ data: await service.getProfile(request.user!.id) });
};

export const list = async (request: Request, response: Response) => {
  const result = await service.listUsers(listUsersQuerySchema.parse(request.query));
  response.json({ data: result.items, meta: result.meta });
};

export const updateRole = async (request: Request, response: Response) => {
  const { role } = updateUserRoleSchema.parse(request.body);
  response.json({
    data: await service.updateRole(request.user!.id, userIdSchema.parse(request.params.id), role),
  });
};
