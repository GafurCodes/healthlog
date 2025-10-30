import crypto from 'crypto';

/**
 * Generate a random token suitable for email verification or password reset
 * @returns A random token string
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for secure storage
 * @param token The token to hash
 * @returns The hashed token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate token expiration date
 * @param expiresInHours Number of hours until expiration
 * @returns Date object representing expiration
 */
export function getTokenExpirationDate(expiresInHours: number = 24): Date {
  return new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
}
