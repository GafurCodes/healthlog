import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/log.service.js';
import { createLogSchema, updateLogSchema, searchLogsSchema } from '../utils/validation.js';

export async function createLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = createLogSchema.parse(req.body);
    const log = await logService.createLog(userId, data);
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
}

export async function getLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const log = await logService.getLogById(userId, id);
    res.status(200).json(log);
  } catch (error) {
    next(error);
  }
}

export async function updateLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const data = updateLogSchema.parse(req.body);
    const log = await logService.updateLog(userId, id, data);
    res.status(200).json(log);
  } catch (error) {
    next(error);
  }
}

export async function deleteLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    await logService.deleteLog(userId, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function searchLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const query = searchLogsSchema.parse(req.query);
    const result = await logService.searchLogs(userId, query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
