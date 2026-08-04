import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { HttpError } from '../../shared/errors/http-error.js';
import { createUser, findUserByEmail } from './auth.repository.js';

const publicUser = (user: {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const issueToken = (user: { id: string; role: string }) =>
  jwt.sign({ role: user.role }, config.JWT_SECRET, {
    subject: user.id,
    expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

export const register = async (data: { name: string; email: string; password: string }) => {
  if (await findUserByEmail(data.email)) {
    throw new HttpError(409, 'Email is already registered', 'EMAIL_ALREADY_EXISTS');
  }
  const user = await createUser({
    name: data.name,
    email: data.email,
    passwordHash: await bcrypt.hash(data.password, 12),
  });
  return { user: publicUser(user), token: issueToken(user) };
};

export const login = async (data: { email: string; password: string }) => {
  const user = await findUserByEmail(data.email);
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }
  return { user: publicUser(user), token: issueToken(user) };
};
