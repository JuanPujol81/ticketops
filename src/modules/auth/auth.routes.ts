import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import * as controller from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(controller.register));
authRouter.post('/login', asyncHandler(controller.login));
