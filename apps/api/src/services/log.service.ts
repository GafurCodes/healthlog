import { Log, ILog } from '../models/Log.js';
import { CreateLogInput, UpdateLogInput, SearchLogsInput } from '../utils/validation.js';

export interface PaginatedLogs {
  logs: ILog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function createLog(userId: string, data: CreateLogInput): Promise<ILog> {
  const log = await Log.create({
    userId,
    type: data.type,
    metrics: data.metrics,
    date: data.date ? new Date(data.date) : new Date(),
  });

  return log;
}

export async function getLogById(userId: string, logId: string): Promise<ILog> {
  const log = await Log.findOne({ _id: logId, userId });

  if (!log) {
    throw new Error('Log not found');
  }

  return log;
}

export async function updateLog(
  userId: string,
  logId: string,
  data: UpdateLogInput
): Promise<ILog> {
  const log = await Log.findOne({ _id: logId, userId });

  if (!log) {
    throw new Error('Log not found');
  }

  if (data.type !== undefined) {
    log.type = data.type;
  }
  if (data.metrics !== undefined) {
    log.metrics = data.metrics;
  }
  if (data.date !== undefined) {
    log.date = new Date(data.date);
  }

  await log.save();

  return log;
}

export async function deleteLog(userId: string, logId: string): Promise<void> {
  const result = await Log.deleteOne({ _id: logId, userId });

  if (result.deletedCount === 0) {
    throw new Error('Log not found');
  }
}

export async function searchLogs(userId: string, query: SearchLogsInput): Promise<PaginatedLogs> {
  const { type, startDate, endDate, page, pageSize } = query;

  // Build filter
  const filter: any = { userId };

  if (type) {
    filter.type = type;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }

  // Count total documents
  const total = await Log.countDocuments(filter);

  // Calculate pagination
  const totalPages = Math.ceil(total / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch logs
  const logs = await Log.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(pageSize);

  return {
    logs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
