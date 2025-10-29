/**
 * @fileoverview Centralized error handling with custom error classes
 * @module handles/errors
 */

const logger = require('../config/logger');

/**
 * Base error class for all custom errors
 * @class CustomError
 * @extends Error
 */
class CustomError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - input validation failures
 * @class ValidationError
 * @extends CustomError
 */
class ValidationError extends CustomError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

/**
 * Authentication error - auth failures
 * @class AuthenticationError
 * @extends CustomError
 */
class AuthenticationError extends CustomError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization error - permission denied
 * @class AuthorizationError
 * @extends CustomError
 */
class AuthorizationError extends CustomError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not found error - resource not found
 * @class NotFoundError
 * @extends CustomError
 */
class NotFoundError extends CustomError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.resource = resource;
  }
}

/**
 * Conflict error - duplicate/conflict
 * @class ConflictError
 * @extends CustomError
 */
class ConflictError extends CustomError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * Database error - DB operation failures
 * @class DatabaseError
 * @extends CustomError
 */
class DatabaseError extends CustomError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * Format and handle errors for GraphQL
 * @param {Error} error - The error to handle
 * @param {Object} context - Additional context
 * @returns {Object} Formatted error response
 */
const errorHandler = (error, context = {}) => {
  // Log the error with context
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    context
  });

  // Handle known error types
  if (error instanceof CustomError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      ...(error.field && { field: error.field }),
      ...(error.resource && { resource: error.resource })
    };
  }

  // Handle MongoDB errors
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return {
      message: 'Database operation failed',
      code: 'DATABASE_ERROR',
      statusCode: 500
    };
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
      statusCode: 400
    };
  }

  // Default error handling
  return {
    message: error.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500
  };
};

/**
 * Wrapper for async functions to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  CustomError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  errorHandler,
  asyncHandler
};

