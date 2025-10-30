import {
  registerSchema,
  loginSchema,
  createLogSchema,
  searchLogsSchema,
} from '../utils/validation.js';

describe('Validation schemas', () => {
  describe('registerSchema', () => {
    test('accepts valid registration data', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      };
      const result = registerSchema.parse(data);
      expect(result).toEqual(data);
    });

    test('rejects invalid email', () => {
      const data = {
        email: 'not-an-email',
        password: 'Password123',
        name: 'Test User',
      };
      expect(() => registerSchema.parse(data)).toThrow();
    });

    test('rejects short password', () => {
      const data = {
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      };
      expect(() => registerSchema.parse(data)).toThrow();
    });

    test('rejects missing name', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123',
      };
      expect(() => registerSchema.parse(data)).toThrow();
    });

    test('rejects empty email', () => {
      const data = {
        email: '',
        password: 'Password123',
        name: 'Test User',
      };
      expect(() => registerSchema.parse(data)).toThrow();
    });

    test('rejects password without uppercase letter', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      expect(() => registerSchema.parse(data)).toThrow();
    });

    test('rejects password without number', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password',
        name: 'Test User',
      };
      expect(() => registerSchema.parse(data)).toThrow();
    });
  });

  describe('loginSchema', () => {
    test('accepts valid login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = loginSchema.parse(data);
      expect(result).toEqual(data);
    });

    test('rejects invalid email', () => {
      const data = {
        email: 'not-an-email',
        password: 'password123',
      };
      expect(() => loginSchema.parse(data)).toThrow();
    });

    test('rejects missing password', () => {
      const data = {
        email: 'test@example.com',
      };
      expect(() => loginSchema.parse(data)).toThrow();
    });
  });

  describe('createLogSchema', () => {
    test('accepts valid meal log data', () => {
      const data = {
        type: 'meal' as const,
        metrics: { calories: 400 },
      };
      const result = createLogSchema.parse(data);
      expect(result.type).toBe('meal');
    });

    test('accepts valid workout log data', () => {
      const data = {
        type: 'workout' as const,
        metrics: { duration: 30 },
      };
      const result = createLogSchema.parse(data);
      expect(result.type).toBe('workout');
    });

    test('accepts valid sleep log data', () => {
      const data = {
        type: 'sleep' as const,
        metrics: { duration: 7.5 },
      };
      const result = createLogSchema.parse(data);
      expect(result.type).toBe('sleep');
    });

    test('rejects invalid type', () => {
      const data = {
        type: 'invalid',
      };
      expect(() => createLogSchema.parse(data)).toThrow();
    });
  });

  describe('searchLogsSchema', () => {
    test('applies defaults for pagination', () => {
      const result = searchLogsSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    test('coerces string numbers to integers', () => {
      const result = searchLogsSchema.parse({ page: '5', pageSize: '20' });
      expect(result.page).toBe(5);
      expect(result.pageSize).toBe(20);
    });

    test('accepts valid type filter', () => {
      const result = searchLogsSchema.parse({ type: 'meal' });
      expect(result.type).toBe('meal');
    });

    test('rejects invalid type filter', () => {
      const data = { type: 'invalid' };
      expect(() => searchLogsSchema.parse(data)).toThrow();
    });

    test('rejects pageSize greater than maximum', () => {
      expect(() => searchLogsSchema.parse({ pageSize: '1000' })).toThrow();
    });

    test('requires pageSize to be at least 1', () => {
      expect(() => searchLogsSchema.parse({ pageSize: '0' })).toThrow();
    });
  });
});
