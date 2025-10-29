/**
 * @fileoverview MongoDB database connection configuration
 * @module config/database
 */

const mongoose = require('mongoose');
const logger = require('./logger');

let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Establishes connection to MongoDB with retry logic
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolves when connection is established
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-ledger';
  
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('MongoDB connected successfully');
    connectionAttempts = 0;
  } catch (error) {
    connectionAttempts++;
    logger.error(`MongoDB connection failed (attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS}):`, error);
    
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      logger.info(`Retrying connection in ${RETRY_DELAY_MS}ms...`);
      setTimeout(() => connectDB(), RETRY_DELAY_MS);
    } else {
      logger.error('Max connection retry attempts reached');
      throw error;
    }
  }
};

/**
 * Closes MongoDB connection gracefully
 * @async
 * @function disconnectDB
 * @returns {Promise<void>} Resolves when connection is closed
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = { connectDB, disconnectDB };

