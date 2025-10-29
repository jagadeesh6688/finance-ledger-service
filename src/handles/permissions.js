/**
 * @fileoverview RBAC permission checking utilities
 * @module handles/permissions
 */

const logger = require('../config/logger');
const { AuthorizationError } = require('./errors');
const { hasPermission } = require('../constants/permissions');

/**
 * Check if user is authorized to perform an action
 * @param {Object} user - User object from context
 * @param {string} permission - Permission to check
 * @param {string} resourceId - Resource ID for ownership checks (optional)
 * @returns {boolean} True if authorized
 */
const isAuthorized = (user, permission, resourceId = null) => {
  if (!user || !user.designation) {
    logger.warn('Unauthorized: No user or designation');
    return false;
  }

  // Check if user has the permission
  if (!hasPermission(user.designation, permission)) {
    logger.warn(`Unauthorized: ${user.userId} lacks permission: ${permission}`);
    return false;
  }

  return true;
};

/**
 * Middleware to require a specific permission
 * @param {string} permission - Required permission
 * @param {Function} resolver - GraphQL resolver function
 * @returns {Function} Wrapped resolver
 */
const requirePermission = (permission) => {
  return (parent, args, context, info) => {
    const { user } = context;

    if (!isAuthorized(user, permission)) {
      throw new AuthorizationError(
        `Insufficient permissions. Required: ${permission}`
      );
    }

    // Call the original resolver
    return info.fieldName;
  };
};

/**
 * Check if user owns the resource
 * @param {Object} user - User object
 * @param {Object} resource - Resource object (with userId or employeeId)
 * @returns {boolean} True if user owns the resource
 */
const isOwner = (user, resource) => {
  if (!user || !resource) {
    return false;
  }

  // Check if user is the owner
  if (resource.userId && resource.userId === user.userId) {
    return true;
  }

  if (resource.employeeId && resource.employeeId === user.employeeId) {
    return true;
  }

  return false;
};

/**
 * Check if user manages the employee
 * @param {Object} user - User object
 * @param {Object} employee - Employee object
 * @returns {boolean} True if user manages the employee
 */
const isManager = (user, employee) => {
  if (!user || !employee) {
    return false;
  }

  // Admin manages everyone
  if (user.designation === 'Admin') {
    return true;
  }

  // User is the manager of the employee
  if (employee.manager && employee.manager.toString() === user.employeeId) {
    return true;
  }

  return false;
};

module.exports = {
  isAuthorized,
  requirePermission,
  isOwner,
  isManager
};

