import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profile.service.js';

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await profileService.getProfileByUserId(userId);
    if (!result.data) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createOrUpdateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    // TODO: Add validation for the request body
    const { goals } = req.body;
    const result = await profileService.createOrUpdateProfile(userId, goals);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await profileService.deleteProfile(userId);
      res.status(200).json({ success: result.deleted, userId });
    } catch (error) {
      next(error);
    }
  }
  