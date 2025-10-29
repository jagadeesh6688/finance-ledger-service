/**
 * @fileoverview Unit tests for authentication middleware
 * @module tests/unit/middleware/auth
 */

const { authenticate, optionalAuth, buildAuthContext } = require('../../../src/middleware/auth');
const { AuthenticationError } = require('../../../src/handles/errors');
const jwt = require('../../../src/utils/jwt');

// Mock modules
jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../../src/utils/jwt');

const logger = require('../../../src/config/logger');

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    const mockToken = 'valid.jwt.token';
    const mockDecoded = {
      userId: 'user123',
      employeeId: 'emp456',
      designation: 'Admin'
    };

    it('should authenticate valid token from Authorization header', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockReturnValue(mockDecoded);

      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      authenticate(req, res, next);

      expect(jwt.extractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${mockToken}`);
      expect(jwt.verifyAccessToken).toHaveBeenCalledWith(mockToken);
      expect(req.user).toEqual({
        userId: 'user123',
        employeeId: 'emp456',
        designation: 'Admin'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate with lowercase authorization header', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockReturnValue(mockDecoded);

      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });

    it('should throw AuthenticationError when no token provided', () => {
      jwt.extractTokenFromHeader.mockReturnValue(null);

      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
      expect(() => authenticate(req, res, next)).toThrow('No token provided');
    });

    it('should throw AuthenticationError for invalid token', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
      expect(() => authenticate(req, res, next)).toThrow('Invalid or expired token');
    });

    it('should throw AuthenticationError for expired token', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
    });

    it('should log warning on authentication failure', () => {
      jwt.extractTokenFromHeader.mockReturnValue(null);

      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      try {
        authenticate(req, res, next);
      } catch (error) {
        expect(logger.warn).toHaveBeenCalled();
      }
    });

    it('should handle missing headers object', () => {
      const req = {};
      const res = {};
      const next = jest.fn();

      jwt.extractTokenFromHeader.mockReturnValue(null);

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
    });

    it('should attach all user fields to request', () => {
      const fullDecoded = {
        userId: 'user123',
        employeeId: 'emp456',
        designation: 'BranchManager'
      };

      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockReturnValue(fullDecoded);

      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      authenticate(req, res, next);

      expect(req.user).toEqual(fullDecoded);
    });
  });

  describe('optionalAuth middleware', () => {
    const mockToken = 'valid.jwt.token';
    const mockDecoded = {
      userId: 'user123',
      employeeId: 'emp456',
      designation: 'Employee'
    };

    it('should authenticate when valid token is provided', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockReturnValue(mockDecoded);

      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      optionalAuth(req, res, next);

      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
    });

    it('should continue without user when no token provided', () => {
      jwt.extractTokenFromHeader.mockReturnValue(null);

      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without user when token is invalid', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should log debug message on optional auth failure', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      optionalAuth(req, res, next);

      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle both Authorization header cases', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockReturnValue(mockDecoded);

      const req1 = {
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      };
      const req2 = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      optionalAuth(req1, res, next);
      expect(req1.user).toBeDefined();

      jest.clearAllMocks();
      
      optionalAuth(req2, res, next);
      expect(req2.user).toBeDefined();
    });

    it('should not throw errors unlike authenticate', () => {
      jwt.extractTokenFromHeader.mockReturnValue(null);

      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      expect(() => optionalAuth(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('buildAuthContext function', () => {
    const mockToken = 'valid.jwt.token';
    const mockDecoded = {
      userId: 'user123',
      employeeId: 'emp456',
      designation: 'Admin'
    };

    it('should build context with authenticated user', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockReturnValue(mockDecoded);

      const event = {
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      };

      const context = buildAuthContext(event);

      expect(context.user).toEqual(mockDecoded);
      expect(context.isAuthenticated).toBe(true);
    });

    it('should build context without user when no token', () => {
      jwt.extractTokenFromHeader.mockReturnValue(null);

      const event = {
        headers: {}
      };

      const context = buildAuthContext(event);

      expect(context.user).toBeNull();
      expect(context.isAuthenticated).toBe(false);
    });

    it('should build context without user when token is invalid', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const event = {
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      };

      const context = buildAuthContext(event);

      expect(context.user).toBeNull();
      expect(context.isAuthenticated).toBe(false);
    });

    it('should handle lowercase authorization header', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockReturnValue(mockDecoded);

      const event = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };

      const context = buildAuthContext(event);

      expect(context.user).toEqual(mockDecoded);
      expect(context.isAuthenticated).toBe(true);
    });

    it('should handle missing headers', () => {
      const event = {};

      const context = buildAuthContext(event);

      expect(context.user).toBeNull();
      expect(context.isAuthenticated).toBe(false);
    });

    it('should log debug message on context build failure', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      const event = {
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      };

      buildAuthContext(event);

      expect(logger.debug).toHaveBeenCalledWith(
        'Auth context build failed:',
        expect.any(String)
      );
    });

    it('should return default context structure on any error', () => {
      jwt.extractTokenFromHeader.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const event = {
        headers: {
          Authorization: 'Bearer token'
        }
      };

      const context = buildAuthContext(event);

      expect(context).toHaveProperty('user');
      expect(context).toHaveProperty('isAuthenticated');
      expect(context.user).toBeNull();
      expect(context.isAuthenticated).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    const mockToken = 'valid.jwt.token';
    const mockDecoded = {
      userId: 'user123',
      employeeId: 'emp456',
      designation: 'Admin'
    };

    it('should handle complete authentication flow', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockReturnValue(mockDecoded);

      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('user123');
      expect(next).toHaveBeenCalled();
    });

    it('should differentiate between required and optional auth', () => {
      jwt.extractTokenFromHeader.mockReturnValue(null);

      const req1 = { headers: {} };
      const req2 = { headers: {} };
      const res = {};
      const next = jest.fn();

      // Required auth should throw
      expect(() => authenticate(req1, res, next)).toThrow();

      // Optional auth should not throw
      expect(() => optionalAuth(req2, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it('should handle Lambda event and Express request consistently', () => {
      jwt.extractTokenFromHeader.mockReturnValue(mockToken);
      jwt.verifyAccessToken.mockReturnValue(mockDecoded);

      // Express request
      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };
      const res = {};
      const next = jest.fn();

      authenticate(req, res, next);

      // Lambda event
      const event = {
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      };

      const context = buildAuthContext(event);

      expect(req.user).toEqual(mockDecoded);
      expect(context.user).toEqual(mockDecoded);
    });
  });
});