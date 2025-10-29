/**
 * @fileoverview JWT token generation, validation, and refresh utilities
 * @module utils/jwt
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Generate JWT access token
 * @param {Object} payload - Payload to encode
 * @param {string} payload.userId - User ID
 * @param {string} payload.employeeId - Employee ID
 * @param {string} payload.designation - User designation
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  try {
    return jwt.sign(
      {
        userId: payload.userId,
        employeeId: payload.employeeId,
        designation: payload.designation
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRY
      }
    );
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw error;
  }
};

/**
 * Generate JWT refresh token
 * @param {string} userId - User ID
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (userId) => {
  try {
    return jwt.sign(
      { userId, type: 'refresh' },
      JWT_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRY
      }
    );
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    logger.error('Error verifying access token:', error);
    throw error;
  }
};

/**
 * Verify JWT refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token is a refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    logger.error('Error verifying refresh token:', error);
    throw error;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header
 * @returns {string|null} Token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader
};

