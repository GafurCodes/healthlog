import { Log, ILog } from '../models/Log.js';
import {
  CreateLogInput,
  UpdateLogInput,
  SearchLogsInput,
} from '../utils/validation.js';

export interface LogDTO {
  id: string;
  userId: string;
  type: 'meal' | 'workout' | 'sleep';
  metrics: ILog['metrics'];
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogsResponse {
  data: LogDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function mapLog(doc: ILog): LogDTO {
  return {
    id: (doc as any)._id.toString(),
    userId: (doc.userId as any).toString(),
    type: doc.type,
    metrics: doc.metrics,
    date: new Date(doc.date).toISOString(),
    notes: doc.notes,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function createLog(
  userId: string,
  data: CreateLogInput
): Promise<{ data: LogDTO }> {
  const doc = await Log.create({
    userId,
    type: data.type,
    metrics: data.metrics,
    date: data.date ? new Date(data.date) : new Date(),
    notes: data.notes,
  });
  return { data: mapLog(doc) };
}

export async function getLogById(
  userId: string,
  logId: string
): Promise<{ data: LogDTO }> {
  const doc = await Log.findOne({ _id: logId, userId });
  if (!doc) {
    throw new Error('Log not found');
  }
  return { data: mapLog(doc) };
}

export async function updateLog(
  userId: string,
  logId: string,
  data: UpdateLogInput
): Promise<{ data: LogDTO }> {
  const doc = await Log.findOne({ _id: logId, userId });
  if (!doc) {
    throw new Error('Log not found');
  }
  if (data.type !== undefined) doc.type = data.type;
  if (data.metrics !== undefined) doc.metrics = data.metrics;
  if (data.date !== undefined) doc.date = new Date(data.date);
  if (data.notes !== undefined) doc.notes = data.notes;
  await doc.save();
  return { data: mapLog(doc) };
}

export async function deleteLog(
  userId: string,
  logId: string
): Promise<{ deleted: boolean; id: string }> {
  const result = await Log.deleteOne({ _id: logId, userId });
  return { deleted: result.deletedCount === 1, id: logId };
}

export async function searchLogs(
  userId: string,
  query: SearchLogsInput
): Promise<LogsResponse> {
  const { type, startDate, endDate, page, pageSize } = query;
  const filter: Record<string, any> = { userId };

  if (type) filter.type = type;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const total = await Log.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const skip = (page - 1) * pageSize;

  const docs = await Log.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  return {
    data: docs.map(mapLog),
    page,
    pageSize,
    total,
    totalPages,
  };
}
