import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { authenticate, authorize } from '../../shared/http/auth.js';
import * as controller from './ticket.controller.js';

export const ticketRouter = Router();

ticketRouter.use(authenticate);
ticketRouter.get('/', asyncHandler(controller.list));
ticketRouter.post('/', asyncHandler(controller.create));
ticketRouter.get('/:id', asyncHandler(controller.getById));
ticketRouter.patch('/:id', asyncHandler(controller.update));
ticketRouter.patch('/:id/status', asyncHandler(controller.changeStatus));
ticketRouter.patch('/:id/assignee', authorize('AGENT', 'ADMIN'), asyncHandler(controller.assign));
ticketRouter.delete('/:id', authorize('ADMIN'), asyncHandler(controller.remove));
