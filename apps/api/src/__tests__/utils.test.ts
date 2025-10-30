import { generateToken, hashToken } from '../utils/tokens.js';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js';

describe('Token utilities', () => {
  test('generateToken creates a 64-character hex string', () => {
    const token = generateToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(token.length).toBe(64);
  });

  test('hashToken is deterministic', () => {
    const token = 'test-token-123';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
  });

  test('different tokens produce different hashes', () => {
    const hash1 = hashToken('token1');
    const hash2 = hashToken('token2');
    expect(hash1).not.toBe(hash2);
  });

  test('hashToken produces consistent length output', () => {
    const hash = hashToken('test');
    expect(hash.length).toBe(64); // SHA256 produces 64 hex characters
  });
});

describe('JWT utilities', () => {
  const testPayload = {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
  };

  test('generateTokens creates valid access and refresh tokens', () => {
    const { accessToken, refreshToken } = generateTokens(testPayload);
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
    expect(accessToken.split('.')).toHaveLength(3); // JWT has 3 parts
    expect(refreshToken.split('.')).toHaveLength(3);
  });

  test('verifyAccessToken decodes token correctly', () => {
    const { accessToken } = generateTokens(testPayload);
    const payload = verifyAccessToken(accessToken);
    expect(payload.userId).toBe(testPayload.userId);
    expect(payload.email).toBe(testPayload.email);
  });

  test('verifyRefreshToken decodes token correctly', () => {
    const { refreshToken } = generateTokens(testPayload);
    const payload = verifyRefreshToken(refreshToken);
    expect(payload.userId).toBe(testPayload.userId);
    expect(payload.email).toBe(testPayload.email);
  });

  test('verifyAccessToken throws on invalid token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });

  test('verifyRefreshToken throws on invalid token', () => {
    expect(() => verifyRefreshToken('invalid-token')).toThrow();
  });
});
