import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../utils/validation.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('🔵 Register request body:', req.body);
    const data = registerSchema.parse(req.body);
    console.log('🔵 Validated data:', data);
    const result = await authService.register(data);
    console.log('🔵 Register result:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('🔴 Register error:', error);
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = verifyEmailSchema.parse(req.body);
    const result = await authService.verifyEmail(token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
