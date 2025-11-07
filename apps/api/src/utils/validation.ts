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

export const resendVerificationEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const updateAccountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const mealMetricsSchema = z
  .object({
    name: z.string().optional(),
    calories: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    protein: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
  })
  .passthrough();

const workoutMetricsSchema = z
  .object({
    name: z.string().optional(),
    duration: z.number().min(0).optional(),
    workoutType: z.enum(['cardio', 'strength', 'flexibility']).optional(),
    intensity: z.enum(['low', 'moderate', 'high']).optional(),
    caloriesBurned: z.number().min(0).optional(),
  })
  .passthrough();

const sleepMetricsSchema = z
  .object({
    duration: z.number().min(0).optional(),
    quality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
  })
  .passthrough();

export const createLogSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('meal'),
    metrics: mealMetricsSchema,
    date: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
  z.object({
    type: z.literal('workout'),
    metrics: workoutMetricsSchema,
    date: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
  z.object({
    type: z.literal('sleep'),
    metrics: sleepMetricsSchema,
    date: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
]);

export const updateLogSchema = z
  .object({
    type: z.enum(['meal', 'workout', 'sleep']).optional(),
    metrics: z
      .union([mealMetricsSchema, workoutMetricsSchema, sleepMetricsSchema])
      .optional(),
    date: z.string().datetime().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (val) => {
      if (!val.type || !val.metrics) return true;
      if (val.type === 'meal')
        return mealMetricsSchema.safeParse(val.metrics).success;
      if (val.type === 'workout')
        return workoutMetricsSchema.safeParse(val.metrics).success;
      if (val.type === 'sleep')
        return sleepMetricsSchema.safeParse(val.metrics).success;
      return false;
    },
    { message: 'metrics do not match the provided type', path: ['metrics'] }
  );

export const searchLogsSchema = z.object({
  type: z.enum(['meal', 'workout', 'sleep']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
});

export const dailyCaloriesSchema = z.object({
  startDate: z.string().pipe(z.coerce.date()),
  endDate: z.string().pipe(z.coerce.date()),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationEmailInput = z.infer<typeof resendVerificationEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateLogInput = z.infer<typeof createLogSchema>;
export type UpdateLogInput = z.infer<typeof updateLogSchema>;
export type SearchLogsInput = z.infer<typeof searchLogsSchema>;
export type DailyCaloriesInput = z.infer<typeof dailyCaloriesSchema>;
