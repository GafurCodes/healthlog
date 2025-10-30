import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Log validation schemas
const mealMetricsSchema = z.object({
  calories: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const workoutMetricsSchema = z.object({
  duration: z.number().min(0).optional(),
  type: z.enum(['cardio', 'strength', 'flexibility']).optional(),
  intensity: z.enum(['low', 'moderate', 'high']).optional(),
  notes: z.string().optional(),
});

const sleepMetricsSchema = z.object({
  duration: z.number().min(0).optional(),
  quality: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export const createLogSchema = z.object({
  type: z.enum(['meal', 'workout', 'sleep']),
  metrics: z.union([mealMetricsSchema, workoutMetricsSchema, sleepMetricsSchema]),
  date: z.string().datetime().optional(),
});

export const updateLogSchema = z.object({
  type: z.enum(['meal', 'workout', 'sleep']).optional(),
  metrics: z.union([mealMetricsSchema, workoutMetricsSchema, sleepMetricsSchema]).optional(),
  date: z.string().datetime().optional(),
});

export const searchLogsSchema = z.object({
  type: z.enum(['meal', 'workout', 'sleep']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateLogInput = z.infer<typeof createLogSchema>;
export type UpdateLogInput = z.infer<typeof updateLogSchema>;
export type SearchLogsInput = z.infer<typeof searchLogsSchema>;
