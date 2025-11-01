export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MealLog {
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface WorkoutLog {
  name?: string;
  duration?: number;
  type?: 'cardio' | 'strength' | 'flexibility';
  intensity?: 'low' | 'moderate' | 'high';
  caloriesBurned?: number;
}

export interface SleepLog {
  duration?: number;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
}

export type LogMetrics = MealLog | WorkoutLog | SleepLog;

export interface Log {
  id: string;
  userId: string;
  type: 'meal' | 'workout' | 'sleep';
  date: string;
  metrics: LogMetrics;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogsResponse {
  data: Log[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}
