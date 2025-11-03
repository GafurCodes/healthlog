import type { Log, LogsResponse, LogMetrics } from '../types';
import { apiClient } from './client';

export interface LogsQuery {
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

function isDateOnly(s?: string) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function toStartOfDayISO(dateOnly: string) {
  return new Date(dateOnly + 'T00:00:00.000Z').toISOString();
}
function toEndOfDayISO(dateOnly: string) {
  return new Date(dateOnly + 'T23:59:59.999Z').toISOString();
}

function normalizeListResponse(payload: any, query?: LogsQuery): LogsResponse {
  const data: Log[] = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
    ? payload
    : [];
  const page = Number(payload?.page ?? query?.page ?? 1);
  const pageSize = Number(payload?.pageSize ?? query?.pageSize ?? 10);
  const total = Number(payload?.total ?? data.length ?? 0);
  const totalPages = Number(
    payload?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  );
  return { data, page, pageSize, total, totalPages };
}

function emptyListResponse(query?: LogsQuery): LogsResponse {
  const page = Number(query?.page ?? 1);
  const pageSize = Number(query?.pageSize ?? 10);
  return { data: [], page, pageSize, total: 0, totalPages: 1 };
}

export const logsApi = {
  list: async (query?: LogsQuery) => {
    const params: any = { ...(query || {}) };
    if (isDateOnly(params.startDate))
      params.startDate = toStartOfDayISO(params.startDate);
    if (isDateOnly(params.endDate))
      params.endDate = toEndOfDayISO(params.endDate);

    try {
      const res = await apiClient.get<any>('/logs', { params });
      const body = normalizeListResponse(res.data, query);
      return { ...res, data: body } as typeof res & { data: LogsResponse };
    } catch {
      const body = emptyListResponse(query);
      return { data: body } as { data: LogsResponse };
    }
  },

  get: async (id: string) => {
    const res = await apiClient.get<{ data?: Log } | Log>(`/logs/${id}`);
    const log: Log = (res.data as any)?.data ?? (res.data as any);
    return { ...res, data: { data: log } } as typeof res & {
      data: { data: Log };
    };
  },

  create: async (metrics: LogMetrics, date: string, notes?: string) => {
    const { type, ...metricsWithoutType } = metrics as any;
    const isoDate = isDateOnly(date) ? toStartOfDayISO(date) : date;
    const res = await apiClient.post<{ data?: Log } | Log>('/logs', {
      type,
      metrics: metricsWithoutType,
      date: isoDate,
      notes,
    });
    const log: Log = (res.data as any)?.data ?? (res.data as any);
    return { ...res, data: { data: log } } as typeof res & {
      data: { data: Log };
    };
  },

  update: async (
    id: string,
    metrics: LogMetrics,
    date: string,
    notes?: string
  ) => {
    const { type, ...metricsWithoutType } = metrics as any;
    const isoDate = isDateOnly(date) ? toStartOfDayISO(date) : date;
    const res = await apiClient.put<{ data?: Log } | Log>(`/logs/${id}`, {
      type,
      metrics: metricsWithoutType,
      date: isoDate,
      notes,
    });
    const log: Log = (res.data as any)?.data ?? (res.data as any);
    return { ...res, data: { data: log } } as typeof res & {
      data: { data: Log };
    };
  },

  delete: async (id: string) => {
    try {
      const res = await apiClient.delete<{ success: boolean; id: string }>(
        `/logs/${id}`
      );
      return res.data;
    } catch {
      return { success: false, id };
    }
  },
};
