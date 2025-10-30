import rateLimit from 'express-rate-limit';

// General API rate limiter: 500 requests per hour
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints: 20 requests per hour
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Email verification limiter: 10 requests per hour
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many email verification requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
