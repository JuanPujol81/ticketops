import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    JWT_SECRET: z.string().min(32).default('development-only-secret-change-me'),
    JWT_EXPIRES_IN: z.string().default('1h'),
    CORS_ORIGIN: z.string().default('*'),
  })
  .superRefine((environment, context) => {
    if (
      environment.NODE_ENV === 'production' &&
      environment.JWT_SECRET === 'development-only-secret-change-me'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be explicitly configured in production',
      });
    }
  });

export type AppConfig = z.infer<typeof envSchema>;

export const loadConfig = (environment: NodeJS.ProcessEnv): AppConfig => {
  return envSchema.parse(environment);
};

export const config = loadConfig(process.env);
