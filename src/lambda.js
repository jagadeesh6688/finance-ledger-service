/**
 * @fileoverview AWS Lambda handler for GraphQL API
 * @module lambda
 */

const { ApolloServer } = require('apollo-server-lambda');
const { buildAuthContext } = require('./middleware/auth');
const { errorHandler } = require('./handles/errors');
const logger = require('./config/logger');
const { connectDB } = require('./config/database');

// Import GraphQL schema and resolvers
// Note: These will be created in Phase 3
// const { typeDefs, resolvers } = require('./graphql');

// Temporary schema until Phase 3
const typeDefs = `
  type Query {
    health: String
  }
`;

const resolvers = {
  Query: {
    health: () => 'OK'
  }
};

/**
 * AWS Lambda handler
 * @param {Object} event - Lambda event
 * @param {Object} context - Lambda context
 * @returns {Promise<Object>} Lambda response
 */
const handler = async (event, context) => {
  // Ensure DB connection is reused
  if (!context.mongooseConnection) {
    await connectDB();
    context.mongooseConnection = true;
  }

  // Build GraphQL context
  const graphQLContext = buildAuthContext(event);

  // Initialize Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => graphQLContext,
    formatError: (err) => {
      logger.error('GraphQL error:', err);
      return errorHandler(err, { event });
    }
  });

  // Handle GraphQL request
  const apolloHandler = server.createHandler({
    cors: {
      origin: '*',
      credentials: true
    }
  });

  return apolloHandler(event, context);
};

module.exports = { handler };

