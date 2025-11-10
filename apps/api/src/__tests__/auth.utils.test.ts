import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  type JWTPayload,
} from '../utils/jwt.js';

describe('JWT Utilities', () => {
  const testPayload: JWTPayload = {
    userId: 'user123',
    email: 'test@example.com',
  };

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(testPayload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken.length).toBeGreaterThan(0);
      expect(tokens.refreshToken.length).toBeGreaterThan(0);
    });

    it('should generate different access and refresh tokens', () => {
      const tokens = generateTokens(testPayload);

      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const { accessToken } = generateTokens(testPayload);
      const decoded = verifyAccessToken(accessToken);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const { refreshToken } = generateTokens(testPayload);
      const decoded = verifyRefreshToken(refreshToken);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const { accessToken } = generateTokens(testPayload);
      const decoded = decodeToken(accessToken);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
    });

    it('should return null for invalid token format', () => {
      const decoded = decodeToken('not-a-jwt');
      expect(decoded).toBeNull();
    });
  });
});
