import { z } from 'zod';

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

const mealMetricsSchema = z.object({
  name: z.string().optional(),
  calories: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
});

const workoutMetricsSchema = z.object({
  name: z.string().optional(),
  duration: z.number().min(0).optional(),
  workoutType: z.enum(['cardio', 'strength', 'flexibility']).optional(),
  intensity: z.enum(['low', 'moderate', 'high']).optional(),
  caloriesBurned: z.number().positive().optional(),
});

const sleepMetricsSchema = z.object({
  duration: z.number().min(0).optional(),
  quality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
});

const isDateOnly = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

const dateString = z
  .string()
  .refine((v) => isDateOnly(v) || !Number.isNaN(Date.parse(v)), {
    message: 'Invalid date format. Use YYYY-MM-DD or ISO datetime.',
  });

export const createLogSchema = z
  .object({
    type: z.enum(['meal', 'workout', 'sleep']),
    metrics: z.union([
      mealMetricsSchema,
      workoutMetricsSchema,
      sleepMetricsSchema,
    ]),
    date: dateString.optional(),
    notes: z.string().optional(),
  })
  .transform((q) => {
    if (!q.date) return q;
    const d = new Date(q.date);
    if (isDateOnly(q.date)) d.setUTCHours(0, 0, 0, 0);
    return { ...q, date: d.toISOString() };
  });

export const updateLogSchema = z
  .object({
    type: z.enum(['meal', 'workout', 'sleep']).optional(),
    metrics: z
      .union([mealMetricsSchema, workoutMetricsSchema, sleepMetricsSchema])
      .optional(),
    date: dateString.optional(),
    notes: z.string().optional(),
  })
  .transform((q) => {
    if (!q.date) return q;
    const d = new Date(q.date);
    if (isDateOnly(q.date)) d.setUTCHours(0, 0, 0, 0);
    return { ...q, date: d.toISOString() };
  });

export const searchLogsSchema = z
  .object({
    type: z.enum(['meal', 'workout', 'sleep']).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .superRefine((q, ctx) => {
    if ((q.startDate && !q.endDate) || (!q.startDate && q.endDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide both startDate and endDate, or neither',
        path: ['startDate'],
      });
    }
    if (q.startDate && q.endDate) {
      const s = new Date(q.startDate);
      const e = new Date(q.endDate);
      if (e.getTime() < s.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endDate must be on/after startDate',
          path: ['endDate'],
        });
      }
    }
  })
  .transform((q) => {
    if (!q.startDate || !q.endDate) return q;
    const s = new Date(q.startDate);
    const e = new Date(q.endDate);
    if (isDateOnly(q.startDate)) s.setUTCHours(0, 0, 0, 0);
    if (isDateOnly(q.endDate)) e.setUTCHours(23, 59, 59, 999);
    return { ...q, startDate: s.toISOString(), endDate: e.toISOString() };
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateLogInput = z.infer<typeof createLogSchema>;
export type UpdateLogInput = z.infer<typeof updateLogSchema>;
export type SearchLogsInput = z.infer<typeof searchLogsSchema>;
