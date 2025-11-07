import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authLimiter, emailLimiter } from '../config/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', authLimiter, authController.register);

router.post('/login', authLimiter, authController.login);

router.post('/verify-email', emailLimiter, authController.verifyEmail);

router.post('/resend-verification-email', emailLimiter, authController.resendVerificationEmail);

router.post('/forgot-password', emailLimiter, authController.forgotPassword);

router.post('/reset-password', authLimiter, authController.resetPassword);

router.post('/change-password', authLimiter, requireAuth, authController.changePassword);

router.patch('/me', authLimiter, requireAuth, authController.updateAccount);

router.post('/refresh', authController.refreshToken);

export default router;
