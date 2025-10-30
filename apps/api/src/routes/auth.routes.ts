import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authLimiter, emailLimiter } from '../config/rateLimiter.js';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/register', authLimiter, authController.register);

// POST /api/auth/login - Login user
router.post('/login', authLimiter, authController.login);

// POST /api/auth/verify-email - Verify email
router.post('/verify-email', emailLimiter, authController.verifyEmail);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', emailLimiter, authController.forgotPassword);

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', authLimiter, authController.resetPassword);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', authController.refreshToken);

export default router;
