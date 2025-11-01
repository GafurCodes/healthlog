import argon2 from 'argon2';
import { Types } from 'mongoose';
import { User, IUser } from '../models/User.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { generateToken, hashToken, getTokenExpirationDate } from '../utils/tokens.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../utils/validation.js';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export async function register(data: RegisterInput): Promise<{ message: string }> {
  const { email, password, name } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  const hashedPassword = await argon2.hash(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    emailVerified: true, // Auto-verify for development
  });

  sendVerificationEmail(user.email, user.name, '').catch((error) => {
    console.error('Failed to send verification email:', error);
  });

  return {
    message: 'Registration successful. You can now log in.',
  };
}

export async function login(data: LoginInput): Promise<AuthResponse> {
  const { email, password } = data;

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await argon2.verify(user.password, password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const tokens = generateTokens({
    userId: (user._id as Types.ObjectId).toString(),
    email: user.email,
  });

  return {
    user: {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    },
    tokens,
  };
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiresAt = undefined;
  await user.save();

  return { message: 'Email verified successfully. You can now log in.' };
}

export async function forgotPassword(data: ForgotPasswordInput): Promise<{ message: string }> {
  const { email } = data;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists
    return { message: 'If an account exists with this email, a password reset link has been sent.' };
  }

  const resetToken = generateToken();
  const hashedResetToken = hashToken(resetToken);

  user.passwordResetToken = hashedResetToken;
  user.passwordResetTokenExpiresAt = getTokenExpirationDate(1); // 1 hour
  await user.save();

  await sendPasswordResetEmail(user.email, user.name, resetToken);

  return { message: 'If an account exists with this email, a password reset link has been sent.' };
}

export async function resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
  const { token, password } = data;

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const hashedPassword = await argon2.hash(password);

  user.password = hashedPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  await user.save();

  return { message: 'Password reset successful. You can now log in with your new password.' };
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new Error('User not found');
  }

  const tokens = generateTokens({
    userId: (user._id as Types.ObjectId).toString(),
    email: user.email,
  });

  return {
    user: {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    },
    tokens,
  };
}
