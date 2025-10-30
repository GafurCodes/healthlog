import type { AuthResponse, User } from '../types';
import { apiClient } from './client';

export const authApi = {
  register: (email: string, password: string, name: string) =>
    apiClient.post<AuthResponse>('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }),

  verifyEmail: (token: string) =>
    apiClient.post<AuthResponse>('/auth/verify-email', { token }),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword }),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),

  getProfile: () =>
    apiClient.get<{ data: User }>('/auth/profile'),
};
