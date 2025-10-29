/**
 * @fileoverview RBAC middleware for GraphQL resolvers
 * @module middleware/rbac
 */

const logger = require('../config/logger');
const { isAuthorized, isOwner, isManager } = require('../handles/permissions');
const { AuthorizationError } = require('../handles/errors');

/**
 * Middleware to wrap resolver with permission checks
 * @param {string} permission - Required permission
 * @param {Function} resolver - Resolver function
 * @param {Object} options - Additional options
 * @returns {Function} Wrapped resolver
 */
const withPermission = (permission, resolver, options = {}) => {
  return async (parent, args, context, info) => {
    const { user } = context;

    // Check authentication
    if (!user || !user.isAuthenticated) {
      throw new AuthorizationError('Authentication required');
    }

    // Check permission
    if (!isAuthorized(user, permission)) {
      logger.warn(`Permission denied: ${user.userId} attempted ${permission}`);
      throw new AuthorizationError(`Insufficient permissions. Required: ${permission}`);
    }

    // Check ownership if required
    if (options.requireOwnership && args.id) {
      // This would need to be implemented per resolver
      // as each resource type has different ownership checks
      logger.debug('Ownership check not implemented in general middleware');
    }

    try {
      return await resolver(parent, args, context, info);
    } catch (error) {
      logger.error('Resolver error:', error);
      throw error;
    }
  };
};

/**
 * Require user to be owner of the resource
 * @param {Function} getResource - Function to fetch resource
 * @param {Function} resolver - Resolver function
 * @returns {Function} Wrapped resolver
 */
const withOwnershipCheck = (getResource, resolver) => {
  return async (parent, args, context, info) => {
    const { user } = context;
    const resource = await getResource(args.id);

    if (!resource) {
      throw new Error('Resource not found');
    }

    if (!isOwner(user, resource)) {
      throw new AuthorizationError('You do not own this resource');
    }

    return resolver(parent, args, context, info);
  };
};

/**
 * Require user to manage the resource
 * @param {Function} getResource - Function to fetch resource
 * @param {Function} resolver - Resolver function
 * @returns {Function} Wrapped resolver
 */
const withManagementCheck = (getResource, resolver) => {
  return async (parent, args, context, info) => {
    const { user } = context;
    const resource = await getResource(args.id);

    if (!resource) {
      throw new Error('Resource not found');
    }

    if (!isManager(user, resource)) {
      throw new AuthorizationError('You do not manage this resource');
    }

    return resolver(parent, args, context, info);
  };
};

module.exports = {
  withPermission,
  withOwnershipCheck,
  withManagementCheck
};

