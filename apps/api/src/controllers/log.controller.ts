import { Request, Response, NextFunction } from "express";
import * as logService from "../services/log.service.js";
import {
  createLogSchema,
  updateLogSchema,
  searchLogsSchema,
  dailyCaloriesSchema,
} from "../utils/validation.js";

export async function createLog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = createLogSchema.parse(req.body);
    const result = await logService.createLog(userId, data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getLog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const result = await logService.getLogById(userId, id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateLog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const data = updateLogSchema.parse(req.body);
    const result = await logService.updateLog(userId, id, data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteLog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const result = await logService.deleteLog(userId, id);
    res.status(200).json({ success: result.deleted, id });
  } catch (error) {
    next(error);
  }
}

export async function searchLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const query = searchLogsSchema.parse(req.query);
    const result = await logService.searchLogs(userId, query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDailyCalories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const query = dailyCaloriesSchema.parse(req.query);
    const result = await logService.getDailyCaloriesConsumed(
      userId,
      query.startDate,
      query.endDate
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDishInfoFromImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { image_b64 } = req.body;
    if (!image_b64 || typeof image_b64 !== 'string') {
      res.status(400).json({ message: 'image_b64 is required in request body' });
      return;
    }
    const result = await logService.getDishInfoFromImage(image_b64);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
