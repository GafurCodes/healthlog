import {
  registerSchema,
  loginSchema,
  createLogSchema,
  searchLogsSchema,
} from '../utils/validation.js';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'Password123',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'Pass1',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'Password',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'anypassword',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createLogSchema', () => {
    it('should validate meal log', () => {
      const validData = {
        type: 'meal',
        metrics: {
          name: 'Breakfast',
          calories: 500,
          protein: 20,
        },
        date: new Date().toISOString(),
      };

      const result = createLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate workout log', () => {
      const validData = {
        type: 'workout',
        metrics: {
          name: 'Morning Run',
          duration: 30,
          workoutType: 'cardio',
          intensity: 'moderate',
        },
        date: new Date().toISOString(),
      };

      const result = createLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate sleep log', () => {
      const validData = {
        type: 'sleep',
        metrics: {
          duration: 8,
          quality: 'good',
        },
        date: new Date().toISOString(),
      };

      const result = createLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid log type', () => {
      const invalidData = {
        type: 'invalid',
        metrics: {},
      };

      const result = createLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('searchLogsSchema', () => {
    it('should validate search with default values', () => {
      const result = searchLogsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('should validate search with type filter', () => {
      const validData = {
        type: 'meal',
        page: '2',
        pageSize: '20',
      };

      const result = searchLogsSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('meal');
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('should reject page less than 1', () => {
      const invalidData = {
        page: 0,
      };

      const result = searchLogsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject pageSize greater than 100', () => {
      const invalidData = {
        pageSize: 101,
      };

      const result = searchLogsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
