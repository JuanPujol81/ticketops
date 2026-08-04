import type { Request, Response } from 'express';
import { loginSchema, registerSchema } from './auth.schema.js';
import * as authService from './auth.service.js';

export const register = async (request: Request, response: Response) => {
  const result = await authService.register(registerSchema.parse(request.body));
  response.status(201).json({ data: result });
};

export const login = async (request: Request, response: Response) => {
  response.json({ data: await authService.login(loginSchema.parse(request.body)) });
};
