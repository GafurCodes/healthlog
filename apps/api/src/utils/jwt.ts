import jwt, { SignOptions } from 'jsonwebtoken';
import { getEnv } from '../config/env.js';

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateTokens(payload: JWTPayload): TokenPair {
  const env = getEnv();

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  } as SignOptions);

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  } as SignOptions);

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JWTPayload {
  const env = getEnv();
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  const env = getEnv();
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
}

export function decodeToken(token: string): JWTPayload | null {
  return jwt.decode(token) as JWTPayload | null;
}
