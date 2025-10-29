/**
 * @fileoverview Test setup and configuration
 * @module helpers/setup
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/finance-ledger-test';

// Increase Jest timeout
jest.setTimeout(30000);

// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

