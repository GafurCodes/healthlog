import sgMail from "@sendgrid/mail";
import { getEnv } from "../config/env.js";

export function initializeEmailService(): void {
  const env = getEnv();

  sgMail.setApiKey(env.SENDGRID_API_KEY);

  console.log('SendGrid email service initialized');
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const env = getEnv();

  const verificationUrl = `${env.APP_BASE_URL}/verify-email?token=${token}`;

  try {
    await sgMail.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Verify your Nibble account",
      html: `
        <h1>Welcome to Nibble, ${name}!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>Or copy this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `,
    });

    console.log(`Verification email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send verification email to ${to}`, error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const env = getEnv();

  const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${token}`;

  try {
    await sgMail.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Reset your Nibble password",
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

    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send password reset email to ${to}`, error);
    throw new Error("Failed to send password reset email");
  }
}
