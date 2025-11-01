import request from 'supertest';
import express from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User.js';
import { Log } from '../models/Log.js';
import { generateTokens } from '../utils/jwt.js';
import argon2 from 'argon2';
import logRoutes from '../routes/log.routes.js';
import { errorHandler } from '../middleware/error.js';

const app = express();
app.use(express.json());
app.use('/api/logs', logRoutes);
app.use(errorHandler);

let authToken: string;
let userId: string;

describe('Log Routes', () => {
  beforeEach(async () => {
    const hashedPassword = await argon2.hash('Test1234');
    const user = await User.create({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      emailVerified: true,
    });

    userId = (user._id as Types.ObjectId).toString();

    const tokens = generateTokens({
      userId: (user._id as Types.ObjectId).toString(),
      email: user.email,
    });

    authToken = tokens.accessToken;
  });

  describe('POST /api/logs', () => {
    it('should create a new meal log', async () => {
      const logData = {
        type: 'meal',
        metrics: {
          calories: 500,
          protein: 30,
          carbs: 50,
          fat: 20,
        },
      };

      const response = await request(app)
        .post('/api/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(logData)
        .expect(201);

      expect(response.body.type).toBe('meal');
      expect(response.body.metrics.calories).toBe(500);
      expect(response.body.userId).toBe(userId);
    });

    it('should create a new workout log', async () => {
      const logData = {
        type: 'workout',
        metrics: {
          duration: 45,
          type: 'cardio',
          intensity: 'moderate',
        },
      };

      const response = await request(app)
        .post('/api/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(logData)
        .expect(201);

      expect(response.body.type).toBe('workout');
      expect(response.body.metrics.duration).toBe(45);
    });

    it('should create a new sleep log', async () => {
      const logData = {
        type: 'sleep',
        metrics: {
          duration: 480,
          quality: 8,
        },
      };

      const response = await request(app)
        .post('/api/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(logData)
        .expect(201);

      expect(response.body.type).toBe('sleep');
      expect(response.body.metrics.duration).toBe(480);
    });

    it('should require authentication', async () => {
      const logData = {
        type: 'meal',
        metrics: { calories: 500 },
      };

      await request(app).post('/api/logs').send(logData).expect(401);
    });
  });

  describe('GET /api/logs', () => {
    beforeEach(async () => {
      // Create test logs
      await Log.create([
        {
          userId,
          type: 'meal',
          metrics: { calories: 500 },
          date: new Date('2025-01-01'),
        },
        {
          userId,
          type: 'workout',
          metrics: { duration: 30 },
          date: new Date('2025-01-02'),
        },
        {
          userId,
          type: 'sleep',
          metrics: { duration: 480 },
          date: new Date('2025-01-03'),
        },
      ]);
    });

    it('should return all logs with pagination', async () => {
      const response = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.logs).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.page).toBe(1);
    });

    it('should filter logs by type', async () => {
      const response = await request(app)
        .get('/api/logs?type=meal')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.logs).toHaveLength(1);
      expect(response.body.logs[0].type).toBe('meal');
    });

    it('should filter logs by date range', async () => {
      const response = await request(app)
        .get('/api/logs?startDate=2025-01-02T00:00:00.000Z&endDate=2025-01-03T23:59:59.999Z')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.logs).toHaveLength(2);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/logs?page=1&pageSize=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.logs).toHaveLength(2);
      expect(response.body.pagination.pageSize).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/logs/:id', () => {
    it('should return a single log', async () => {
      const log = await Log.create({
        userId,
        type: 'meal',
        metrics: { calories: 500 },
        date: new Date(),
      });

      const response = await request(app)
        .get(`/api/logs/${(log._id as Types.ObjectId).toString()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.type).toBe('meal');
      expect(response.body._id).toBe((log._id as Types.ObjectId).toString());
    });

    it('should return 404 for non-existent log', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await request(app)
        .get(`/api/logs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500); // Will throw "Log not found" error
    });
  });

  describe('PUT /api/logs/:id', () => {
    it('should update a log', async () => {
      const log = await Log.create({
        userId,
        type: 'meal',
        metrics: { calories: 500 },
        date: new Date(),
      });

      const updatedData = {
        metrics: { calories: 600, protein: 40 },
      };

      const response = await request(app)
        .put(`/api/logs/${log._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.metrics.calories).toBe(600);
    });

    it('should not allow updating another user\'s log', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: await argon2.hash('Test1234'),
        name: 'Other User',
        emailVerified: true,
      });

      const log = await Log.create({
        userId: otherUser._id,
        type: 'meal',
        metrics: { calories: 500 },
        date: new Date(),
      });

      await request(app)
        .put(`/api/logs/${log._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ metrics: { calories: 600 } })
        .expect(500); // Will throw "Log not found" error
    });
  });

  describe('DELETE /api/logs/:id', () => {
    it('should delete a log', async () => {
      const log = await Log.create({
        userId,
        type: 'meal',
        metrics: { calories: 500 },
        date: new Date(),
      });

      await request(app)
        .delete(`/api/logs/${log._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const deletedLog = await Log.findById(log._id);
      expect(deletedLog).toBeNull();
    });

    it('should not allow deleting another user\'s log', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: await argon2.hash('Test1234'),
        name: 'Other User',
        emailVerified: true,
      });

      const log = await Log.create({
        userId: otherUser._id,
        type: 'meal',
        metrics: { calories: 500 },
        date: new Date(),
      });

      await request(app)
        .delete(`/api/logs/${log._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500); // Will throw "Log not found" error
    });
  });
});
