import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('*'),

  EMAIL_FROM: z.string().email('Invalid EMAIL_FROM address'),
  SENDGRID_API_KEY: z.string().min(1, 'SENDGRID_API_KEY is required'),

  FRONTEND_URL: z.string().url('Invalid FRONTEND_URL'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function initializeEnv(): Env {
  try {
    env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || [];
      const formatted = issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${formatted}`);
    }
    throw error;
  }
}

export function getEnv(): Env {
  if (!env) {
    throw new Error('Environment not initialized. Call initializeEnv() first.');
  }
  return env;
}