import { initializeEnv } from '../config/env.js';

// Simple test setup - only set environment variables needed for JWT utilities
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-purposes-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only';
  process.env.JWT_ACCESS_EXPIRES = '15m';
  process.env.JWT_REFRESH_EXPIRES = '7d';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  process.env.EMAIL_FROM = 'test@test.com';
  process.env.SENDGRID_API_KEY = 'test-key';
  process.env.FRONTEND_URL = 'http://localhost:3000';

  initializeEnv();
});
