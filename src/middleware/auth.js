/**
 * @fileoverview JWT authentication middleware
 * @module middleware/auth
 */

const logger = require('../config/logger');
const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');
const { AuthenticationError } = require('../handles/errors');

/**
 * JWT authentication middleware for GraphQL
 * Extracts and verifies JWT token from request headers
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 * @returns {Function} Middleware function
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyAccessToken(token);
    
    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      employeeId: decoded.employeeId,
      designation: decoded.designation
    };

    next();
  } catch (error) {
    logger.warn('Authentication failed:', error.message);
    throw new AuthenticationError('Invalid or expired token');
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if token is missing
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 * @returns {Function} Middleware function
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        employeeId: decoded.employeeId,
        designation: decoded.designation
      };
    }
  } catch (error) {
    logger.debug('Optional authentication failed:', error.message);
    // Don't throw error, just continue without user
  }

  next();
};

/**
 * GraphQL context builder for authentication
 * @param {Object} event - Lambda event
 * @returns {Object} GraphQL context
 */
const buildAuthContext = (event) => {
  const context = { user: null, isAuthenticated: false };

  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return context;
    }

    const decoded = verifyAccessToken(token);
    
    context.user = {
      userId: decoded.userId,
      employeeId: decoded.employeeId,
      designation: decoded.designation
    };
    context.isAuthenticated = true;

    return context;
  } catch (error) {
    logger.debug('Auth context build failed:', error.message);
    return context;
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  buildAuthContext
};

