/**
 * @fileoverview Unit tests for JWT utility functions
 * @module tests/unit/utils/jwt
 */

const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader
} = require('../../../src/utils/jwt');

// Mock logger to prevent console output during tests
jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('JWT Utility Functions', () => {
  const mockPayload = {
    userId: 'user123',
    employeeId: 'emp456',
    designation: 'Admin'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRY = '1h';
    process.env.JWT_REFRESH_EXPIRY = '7d';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token with correct payload', () => {
      const token = generateAccessToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.employeeId).toBe(mockPayload.employeeId);
      expect(decoded.designation).toBe(mockPayload.designation);
    });

    it('should include expiry time in token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should only include specified fields in payload', () => {
      const extendedPayload = {
        ...mockPayload,
        extraField: 'shouldNotBeIncluded',
        password: 'secret'
      };
      
      const token = generateAccessToken(extendedPayload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.userId).toBe(extendedPayload.userId);
      expect(decoded.employeeId).toBe(extendedPayload.employeeId);
      expect(decoded.designation).toBe(extendedPayload.designation);
      expect(decoded.extraField).toBeUndefined();
      expect(decoded.password).toBeUndefined();
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateAccessToken(mockPayload);
      const token2 = generateAccessToken({
        ...mockPayload,
        userId: 'different123'
      });
      
      expect(token1).not.toBe(token2);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalPayload = {
        userId: 'user123'
      };
      
      const token = generateAccessToken(minimalPayload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.userId).toBe('user123');
      expect(decoded.employeeId).toBeUndefined();
      expect(decoded.designation).toBeUndefined();
    });

    it('should throw error for invalid secret', () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = '';
      
      expect(() => generateAccessToken(mockPayload)).toThrow();
      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const userId = 'user123';
      const token = generateRefreshToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('refresh');
    });

    it('should include type field as refresh', () => {
      const token = generateRefreshToken('user123');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.type).toBe('refresh');
    });

    it('should have longer expiry than access token', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload.userId);
      
      const accessDecoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      const accessLifetime = accessDecoded.exp - accessDecoded.iat;
      const refreshLifetime = refreshDecoded.exp - refreshDecoded.iat;
      
      expect(refreshLifetime).toBeGreaterThan(accessLifetime);
    });

    it('should generate different tokens for different user IDs', () => {
      const token1 = generateRefreshToken('user1');
      const token2 = generateRefreshToken('user2');
      
      expect(token1).not.toBe(token2);
    });

    it('should handle empty user ID', () => {
      const token = generateRefreshToken('');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.userId).toBe('');
      expect(decoded.type).toBe('refresh');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.employeeId).toBe(mockPayload.employeeId);
      expect(decoded.designation).toBe(mockPayload.designation);
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        mockPayload,
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      
      // Wait a moment to ensure token expires
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        expect(() => verifyAccessToken(expiredToken)).toThrow('Token expired');
      });
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow('Invalid token');
    });

    it('should throw error for token with wrong secret', () => {
      const wrongToken = jwt.sign(mockPayload, 'wrong-secret', { expiresIn: '1h' });
      
      expect(() => verifyAccessToken(wrongToken)).toThrow('Invalid token');
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyAccessToken('not-a-jwt')).toThrow();
    });

    it('should throw error for empty token', () => {
      expect(() => verifyAccessToken('')).toThrow();
    });

    it('should throw error for null token', () => {
      expect(() => verifyAccessToken(null)).toThrow();
    });

    it('should throw error for undefined token', () => {
      expect(() => verifyAccessToken(undefined)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode valid refresh token', () => {
      const userId = 'user123';
      const token = generateRefreshToken(userId);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error for access token used as refresh token', () => {
      const accessToken = generateAccessToken(mockPayload);
      
      expect(() => verifyRefreshToken(accessToken)).toThrow('Invalid refresh token');
    });

    it('should throw error for token without type field', () => {
      const tokenWithoutType = jwt.sign(
        { userId: 'user123' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      expect(() => verifyRefreshToken(tokenWithoutType)).toThrow('Invalid refresh token');
    });

    it('should throw error for token with wrong type', () => {
      const wrongTypeToken = jwt.sign(
        { userId: 'user123', type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      expect(() => verifyRefreshToken(wrongTypeToken)).toThrow('Invalid refresh token');
    });

    it('should throw error for expired refresh token', () => {
      const expiredToken = jwt.sign(
        { userId: 'user123', type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        expect(() => verifyRefreshToken(expiredToken)).toThrow('Refresh token expired');
      });
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid.token')).toThrow();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const header = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      expect(extractTokenFromHeader(null)).toBeNull();
      expect(extractTokenFromHeader(undefined)).toBeNull();
    });

    it('should return null for empty header', () => {
      expect(extractTokenFromHeader('')).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      expect(extractTokenFromHeader(token)).toBeNull();
    });

    it('should return null for header with wrong prefix', () => {
      const header = 'Basic dXNlcjpwYXNz';
      expect(extractTokenFromHeader(header)).toBeNull();
    });

    it('should return null for malformed Bearer header', () => {
      expect(extractTokenFromHeader('Bearer')).toBeNull();
      expect(extractTokenFromHeader('Bearer ')).toBeNull();
    });

    it('should return null for header with extra parts', () => {
      const header = 'Bearer token extra';
      expect(extractTokenFromHeader(header)).toBeNull();
    });

    it('should handle case-sensitive Bearer keyword', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      expect(extractTokenFromHeader(`bearer ${token}`)).toBeNull();
      expect(extractTokenFromHeader(`BEARER ${token}`)).toBeNull();
    });

    it('should handle tokens with special characters', () => {
      const token = 'eyJhbGci_OiJIUz-I1NiIsInR5cCI6IkpXVCJ9.test-token_123';
      const header = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should handle very long tokens', () => {
      const longToken = 'a'.repeat(500);
      const header = `Bearer ${longToken}`;
      
      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(longToken);
    });
  });

  describe('integration tests', () => {
    it('should complete full access token lifecycle', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.employeeId).toBe(mockPayload.employeeId);
      expect(decoded.designation).toBe(mockPayload.designation);
    });

    it('should complete full refresh token lifecycle', () => {
      const userId = 'user123';
      const token = generateRefreshToken(userId);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('refresh');
    });

    it('should extract and verify token from header', () => {
      const token = generateAccessToken(mockPayload);
      const header = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(header);
      const decoded = verifyAccessToken(extracted);
      
      expect(decoded.userId).toBe(mockPayload.userId);
    });

    it('should ensure refresh and access tokens are different', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload.userId);
      
      expect(accessToken).not.toBe(refreshToken);
      
      const accessDecoded = verifyAccessToken(accessToken);
      const refreshDecoded = verifyRefreshToken(refreshToken);
      
      expect(accessDecoded.type).toBeUndefined();
      expect(refreshDecoded.type).toBe('refresh');
    });
  });

  describe('edge cases and security', () => {
    it('should not allow token reuse with different secret', () => {
      const token = generateAccessToken(mockPayload);
      process.env.JWT_SECRET = 'different-secret';
      
      expect(() => verifyAccessToken(token)).toThrow();
    });

    it('should handle tokens with missing required fields', () => {
      const incompleteToken = jwt.sign(
        { userId: 'user123' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const decoded = verifyAccessToken(incompleteToken);
      expect(decoded.userId).toBe('user123');
      expect(decoded.employeeId).toBeUndefined();
    });

    it('should handle very short expiry times', () => {
      process.env.JWT_EXPIRY = '1s';
      const token = generateAccessToken(mockPayload);
      
      expect(token).toBeDefined();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(1);
    });

    it('should handle special characters in payload', () => {
      const specialPayload = {
        userId: 'user@123!#$',
        employeeId: 'emp_456-789',
        designation: 'Admin/Manager'
      };
      
      const token = generateAccessToken(specialPayload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe(specialPayload.userId);
      expect(decoded.employeeId).toBe(specialPayload.employeeId);
      expect(decoded.designation).toBe(specialPayload.designation);
    });
  });
});