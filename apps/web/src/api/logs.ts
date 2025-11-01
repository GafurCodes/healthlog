import type { Log, LogsResponse, LogMetrics } from '../types';
import { apiClient } from './client';

export interface LogsQuery {
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export const logsApi = {
  list: (query?: LogsQuery) =>
    apiClient.get<LogsResponse>('/logs', { params: query }),

  get: (id: string) =>
    apiClient.get<{ data: Log }>(`/logs/${id}`),

  create: (metrics: LogMetrics, date: string, notes?: string) => {
    const { type, ...metricsWithoutType } = metrics;
    return apiClient.post<{ data: Log }>('/logs', { 
      type, 
      metrics: metricsWithoutType, 
      date, 
      notes 
    });
  },

  update: (id: string, metrics: LogMetrics, date: string, notes?: string) => {
    const { type, ...metricsWithoutType } = metrics;
    return apiClient.put<{ data: Log }>(`/logs/${id}`, { 
      type, 
      metrics: metricsWithoutType, 
      date, 
      notes 
    });
  },

  delete: (id: string) =>
    apiClient.delete(`/logs/${id}`),
};
