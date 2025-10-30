import nodemailer from 'nodemailer';
import { getEnv } from '../config/env.js';
import { getLogger } from '../config/logger.js';

let transporter: nodemailer.Transporter;

export function initializeEmailService(): void {
  const env = getEnv();

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const env = getEnv();
  const logger = getLogger();

  const verificationUrl = `${env.APP_BASE_URL}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: 'Verify your HealthLog account',
      html: `
        <h1>Welcome to HealthLog, ${name}!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>Or copy this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `,
    });

    logger.info(`Verification email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send verification email to ${to}`, error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const env = getEnv();
  const logger = getLogger();

  const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: 'Reset your HealthLog password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>Or copy this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      `,
    });

    logger.info(`Password reset email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send password reset email to ${to}`, error);
    throw new Error('Failed to send password reset email');
  }
}
