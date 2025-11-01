import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { initializeEnv } from '../config/env.js';
import { initializeEmailService } from '../services/email.service.js';

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  process.env.NODE_ENV = 'test';
  process.env.PORT = '4000';
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-purposes-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only';
  process.env.JWT_ACCESS_EXPIRES = '15m';
  process.env.JWT_REFRESH_EXPIRES = '7d';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.EMAIL_FROM = 'noreply@healthlog.test';
  process.env.SMTP_HOST = 'localhost';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'test@test.com';
  process.env.SMTP_PASSWORD = 'password';
  process.env.APP_BASE_URL = 'http://localhost:3000';
  process.env.API_BASE_URL = 'http://localhost:4000/api';

  initializeEnv();
  initializeEmailService();

  await mongoose.connect(mongoUri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
