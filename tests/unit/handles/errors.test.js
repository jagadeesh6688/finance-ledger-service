/**
 * @fileoverview Unit tests for error handling utilities
 * @module tests/unit/handles/errors
 */

const {
  CustomError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  errorHandler,
  asyncHandler
} = require('../../../src/handles/errors');

// Mock logger
jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const logger = require('../../../src/config/logger');

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CustomError class', () => {
    it('should create error with message, status code, and error code', () => {
      const error = new CustomError('Test error', 500, 'TEST_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('CustomError');
    });

    it('should use default values when not provided', () => {
      const error = new CustomError('Test error');
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    it('should capture stack trace', () => {
      const error = new CustomError('Test error');
      
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should be throwable', () => {
      expect(() => {
        throw new CustomError('Test error');
      }).toThrow('Test error');
    });
  });

  describe('ValidationError class', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('Invalid input', 'email');
      
      expect(error).toBeInstanceOf(CustomError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('email');
    });

    it('should work without field parameter', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.field).toBeNull();
      expect(error.statusCode).toBe(400);
    });

    it('should have correct error name', () => {
      const error = new ValidationError('Invalid input');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('AuthenticationError class', () => {
    it('should create authentication error with default message', () => {
      const error = new AuthenticationError();
      
      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should accept custom message', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });

    it('should have correct error name', () => {
      const error = new AuthenticationError();
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('AuthorizationError class', () => {
    it('should create authorization error with default message', () => {
      const error = new AuthorizationError();
      
      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should accept custom message', () => {
      const error = new AuthorizationError('Access denied');
      
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });

    it('should have correct error name', () => {
      const error = new AuthorizationError();
      expect(error.name).toBe('AuthorizationError');
    });
  });

  describe('NotFoundError class', () => {
    it('should create not found error with default resource', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.resource).toBe('Resource');
    });

    it('should accept custom resource name', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User not found');
      expect(error.resource).toBe('User');
    });

    it('should have correct error name', () => {
      const error = new NotFoundError();
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ConflictError class', () => {
    it('should create conflict error with default message', () => {
      const error = new ConflictError();
      
      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT_ERROR');
    });

    it('should accept custom message', () => {
      const error = new ConflictError('Duplicate entry');
      
      expect(error.message).toBe('Duplicate entry');
      expect(error.statusCode).toBe(409);
    });

    it('should have correct error name', () => {
      const error = new ConflictError();
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('DatabaseError class', () => {
    it('should create database error with default message', () => {
      const error = new DatabaseError();
      
      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe('Database operation failed');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
    });

    it('should accept custom message', () => {
      const error = new DatabaseError('Connection lost');
      
      expect(error.message).toBe('Connection lost');
      expect(error.statusCode).toBe(500);
    });

    it('should have correct error name', () => {
      const error = new DatabaseError();
      expect(error.name).toBe('DatabaseError');
    });
  });

  describe('errorHandler function', () => {
    it('should handle CustomError correctly', () => {
      const error = new ValidationError('Invalid email', 'email');
      const result = errorHandler(error);
      
      expect(result).toEqual({
        message: 'Invalid email',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        field: 'email'
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle AuthenticationError', () => {
      const error = new AuthenticationError('Token expired');
      const result = errorHandler(error);
      
      expect(result.message).toBe('Token expired');
      expect(result.code).toBe('AUTHENTICATION_ERROR');
      expect(result.statusCode).toBe(401);
    });

    it('should handle NotFoundError with resource', () => {
      const error = new NotFoundError('Employee');
      const result = errorHandler(error);
      
      expect(result.resource).toBe('Employee');
      expect(result.statusCode).toBe(404);
    });

    it('should handle MongoDB errors', () => {
      const mongoError = new Error('Mongo operation failed');
      mongoError.name = 'MongoError';
      
      const result = errorHandler(mongoError);
      
      expect(result.message).toBe('Database operation failed');
      expect(result.code).toBe('DATABASE_ERROR');
      expect(result.statusCode).toBe(500);
    });

    it('should handle Mongoose errors', () => {
      const mongooseError = new Error('Validation failed');
      mongooseError.name = 'MongooseError';
      
      const result = errorHandler(mongooseError);
      
      expect(result.code).toBe('DATABASE_ERROR');
      expect(result.statusCode).toBe(500);
    });

    it('should handle ValidationError from Mongoose', () => {
      const validationError = new Error('Path required');
      validationError.name = 'ValidationError';
      
      const result = errorHandler(validationError);
      
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.statusCode).toBe(400);
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');
      const result = errorHandler(error);
      
      expect(result.message).toBe('Something went wrong');
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.statusCode).toBe(500);
    });

    it('should handle errors without message', () => {
      const error = new Error();
      const result = errorHandler(error);
      
      expect(result.message).toBe('Internal server error');
      expect(result.code).toBe('INTERNAL_ERROR');
    });

    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      errorHandler(error, context);
      
      expect(logger.error).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          message: 'Test error',
          context
        })
      );
    });

    it('should include stack trace in log', () => {
      const error = new Error('Test error');
      errorHandler(error);
      
      expect(logger.error).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          stack: expect.any(String)
        })
      );
    });
  });

  describe('asyncHandler function', () => {
    it('should wrap async function and handle success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();
      
      const wrapped = asyncHandler(mockFn);
      await wrapped(mockReq, mockRes, mockNext);
      
      expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch errors and pass to next', async () => {
      const error = new Error('Async error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();
      
      const wrapped = asyncHandler(mockFn);
      await wrapped(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous errors', async () => {
      const error = new Error('Sync error');
      const mockFn = jest.fn(() => {
        throw error;
      });
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();
      
      const wrapped = asyncHandler(mockFn);
      await wrapped(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should preserve function arguments', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const mockReq = { body: { test: 'data' } };
      const mockRes = { send: jest.fn() };
      const mockNext = jest.fn();
      
      const wrapped = asyncHandler(mockFn);
      await wrapped(mockReq, mockRes, mockNext);
      
      expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should handle custom errors', async () => {
      const error = new ValidationError('Invalid input', 'email');
      const mockFn = jest.fn().mockRejectedValue(error);
      const mockNext = jest.fn();
      
      const wrapped = asyncHandler(mockFn);
      await wrapped({}, {}, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('error hierarchy and inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const validationError = new ValidationError('test');
      
      expect(validationError instanceof Error).toBe(true);
      expect(validationError instanceof CustomError).toBe(true);
      expect(validationError instanceof ValidationError).toBe(true);
    });

    it('should differentiate between error types', () => {
      const authError = new AuthenticationError();
      const validError = new ValidationError('test');
      
      expect(authError instanceof AuthenticationError).toBe(true);
      expect(authError instanceof ValidationError).toBe(false);
      expect(validError instanceof ValidationError).toBe(true);
      expect(validError instanceof AuthenticationError).toBe(false);
    });

    it('should all inherit from CustomError', () => {
      const errors = [
        new ValidationError('test'),
        new AuthenticationError(),
        new AuthorizationError(),
        new NotFoundError(),
        new ConflictError(),
        new DatabaseError()
      ];
      
      errors.forEach(error => {
        expect(error instanceof CustomError).toBe(true);
        expect(error instanceof Error).toBe(true);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete error flow with asyncHandler and errorHandler', async () => {
      const error = new ValidationError('Invalid email', 'email');
      const mockFn = jest.fn().mockRejectedValue(error);
      const mockNext = jest.fn();
      
      const wrapped = asyncHandler(mockFn);
      await wrapped({}, {}, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      
      const result = errorHandler(error);
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.field).toBe('email');
    });

    it('should preserve error details through handler chain', () => {
      const originalError = new NotFoundError('User');
      const handledError = errorHandler(originalError);
      
      expect(handledError.message).toBe('User not found');
      expect(handledError.resource).toBe('User');
      expect(handledError.statusCode).toBe(404);
    });
  });
});