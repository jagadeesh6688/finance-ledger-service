/**
 * @fileoverview Database setup utilities for tests
 * @module helpers/dbSetup
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to in-memory MongoDB instance
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

/**
 * Close database connection
 * @returns {Promise<void>}
 */
const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Clear all collections
 * @returns {Promise<void>}
 */
const clearDB = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

module.exports = {
  connectDB,
  closeDB,
  clearDB
};

