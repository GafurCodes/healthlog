import { Types } from 'mongoose';
import { User } from '../models/User.js';
import { hashToken } from '../utils/tokens.js';

let authService: any;
let emailService: any;

beforeAll(async () => {
  // Mock email service functions before importing
  jest.doMock('../services/email.service.js', () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  }));

  // Import modules after mock
  const auth = await import('../services/auth.service.js');
  const email = await import('../services/email.service.js');

  authService = auth;
  emailService = email;
});

describe('Auth Service', () => {
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      const result = await authService.register(userData);

      expect(result.message).toContain('Registration successful');

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user?.email).toBe(userData.email);
      expect(user?.name).toBe(userData.name);
      expect(user?.password).not.toBe(userData.password); // Password should be hashed
      expect(user?.emailVerified).toBe(false);
      expect(user?.emailVerificationToken).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow(
        'User already exists with this email'
      );
    });

    it('should send verification email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      await authService.register(userData);

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        userData.email,
        userData.name,
        expect.any(String)
      );
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Create and verify user
      const userData = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      await authService.register(userData);

      const user = await User.findOne({ email: userData.email });
      user!.emailVerified = true;
      await user!.save();

      const result = await authService.login({
        email: userData.email,
        password: userData.password,
      });

      expect(result.user.email).toBe(userData.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error if email is not verified', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      await authService.register(userData);

      await expect(
        authService.login({ email: userData.email, password: userData.password })
      ).rejects.toThrow('Please verify your email');
    });

    it('should throw error with invalid password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      await authService.register(userData);

      const user = await User.findOne({ email: userData.email });
      user!.emailVerified = true;
      await user!.save();

      await expect(
        authService.login({ email: userData.email, password: 'WrongPassword123' })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email with valid token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      await authService.register(userData);

      // Get the plain token from the email mock
      const emailCall = (emailService.sendVerificationEmail as jest.Mock).mock.calls[0];
      const plainToken = emailCall[2];

      const result = await authService.verifyEmail(plainToken);

      expect(result.message).toContain('Email verified');

      const user = await User.findOne({ email: userData.email });
      expect(user?.emailVerified).toBe(true);
      expect(user?.emailVerificationToken).toBeUndefined();
    });

    it('should throw error with invalid token', async () => {
      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid or expired verification token'
      );
    });
  });

  describe('forgotPassword', () => {
    it('should create password reset token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      await authService.register(userData);

      const result = await authService.forgotPassword({ email: userData.email });

      expect(result.message).toContain('password reset link');

      const user = await User.findOne({ email: userData.email });
      expect(user?.passwordResetToken).toBeDefined();
      expect(user?.passwordResetTokenExpiresAt).toBeDefined();
    });

    it('should not reveal if user does not exist', async () => {
      const result = await authService.forgotPassword({ email: 'nonexistent@example.com' });

      expect(result.message).toContain('password reset link');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      await authService.register(userData);
      await authService.forgotPassword({ email: userData.email });

      // Get the plain token from the email mock
      const emailCall = (emailService.sendPasswordResetEmail as jest.Mock).mock.calls[0];
      const plainToken = emailCall[2];

      const newPassword = 'NewTest1234';
      const result = await authService.resetPassword({ token: plainToken, password: newPassword });

      expect(result.message).toContain('Password reset successful');

      const user = await User.findOne({ email: userData.email });
      expect(user?.passwordResetToken).toBeUndefined();
    });

    it('should throw error with invalid token', async () => {
      await expect(
        authService.resetPassword({ token: 'invalid-token', password: 'NewTest1234' })
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });
});
