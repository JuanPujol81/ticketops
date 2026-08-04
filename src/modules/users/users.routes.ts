import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { authenticate, authorize } from '../../shared/http/auth.js';
import * as controller from './user.controller.js';

export const usersRouter = Router();

usersRouter.use(authenticate);
usersRouter.get('/me', asyncHandler(controller.getMe));
usersRouter.get('/', authorize('AGENT', 'ADMIN'), asyncHandler(controller.list));
usersRouter.patch('/:id/role', authorize('ADMIN'), asyncHandler(controller.updateRole));
