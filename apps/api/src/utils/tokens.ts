import crypto from 'crypto';

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getTokenExpirationDate(expiresInHours: number = 24): Date {
  return new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
}
