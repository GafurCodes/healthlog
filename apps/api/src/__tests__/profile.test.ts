import request from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { generateTokens } from '../utils/jwt.js';

let app: ReturnType<typeof createApp>;
let token: string;
let userId: string;

describe('/api/profile', () => {
  beforeAll(async () => {
    app = createApp();
    const user = await User.create({
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
      emailVerified: true,
    });
    userId = (user as any)._id.toString();
    token = generateTokens({ userId, email: 'test@example.com' }).accessToken;
  });

  describe('POST /api/profile', () => {
    it('should create a new profile for the user', async () => {
      const goals = {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fats: 60,
      };

      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ goals });

      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe(userId);
      expect(res.body.data.goals).toEqual(goals);
    });
  });

  describe('GET /api/profile', () => {
    it('should retrieve the user profile', async () => {
      const goals = {
        calories: 2200,
        protein: 160,
        carbs: 260,
        fats: 70,
      };

      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ goals });

      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe(userId);
      expect(res.body.data.goals).toEqual(goals);
    });

    it('should return 404 if profile does not exist', async () => {
        // A new user without a profile
        const newUser = await User.create({
            email: 'new@example.com',
            password: 'Password123',
            name: 'New User',
            emailVerified: true,
        });
        const newUserId = (newUser as any)._id.toString();
        const newToken = generateTokens({ userId: newUserId, email: 'new@example.com' }).accessToken;

        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${newToken}`);

        expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update the user profile', async () => {
      const initialGoals = {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fats: 60,
      };

      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ goals: initialGoals });

      const updatedGoals = {
        calories: 2500,
        protein: 180,
        carbs: 300,
        fats: 80,
      };

      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ goals: updatedGoals });

      expect(res.status).toBe(200);
      expect(res.body.data.goals).toEqual(updatedGoals);
    });
  });

  describe('DELETE /api/profile', () => {
    it('should delete the user profile', async () => {
        const goals = {
            calories: 2000,
            protein: 150,
            carbs: 250,
            fats: 60,
        };

        await request(app)
            .post('/api/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ goals });

        const res = await request(app)
            .delete('/api/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const getRes = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(getRes.status).toBe(404);
    });
  });
});
