import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse, ApiError } from '../types';

const API_BASE_URL =
  (process.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:4000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const getToken = () => localStorage.getItem('accessToken');

const setTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post<AuthResponse>(
          `${API_BASE_URL}/auth/refresh`,
          {
            refreshToken,
          }
        );

        const { tokens } = response.data;
        setTokens(tokens.accessToken, tokens.refreshToken);

        (
          originalRequest.headers as any
        ).Authorization = `Bearer ${tokens.accessToken}`;
        return client(originalRequest);
      } catch {
        clearTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const apiClient = client;

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    return {
      message:
        (error.response?.data as any)?.message ||
        error.message ||
        'An error occurred',
      code: error.code,
      details: (error.response?.data as any)?.details,
    };
  }
  return { message: 'An unexpected error occurred' };
};

export { setTokens, clearTokens, getToken };
