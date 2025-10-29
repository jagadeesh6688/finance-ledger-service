/**
 * @fileoverview Permission matrix and definitions
 * @module constants/permissions
 */

const { ROLES } = require('./roles');

/**
 * Available permissions in the system
 * @enum {string}
 */
const PERMISSIONS = {
  // Organization permissions
  VIEW_ORGANIZATION: 'view_organization',
  CREATE_ORGANIZATION: 'create_organization',
  UPDATE_ORGANIZATION: 'update_organization',
  DELETE_ORGANIZATION: 'delete_organization',

  // Branch permissions
  VIEW_BRANCH: 'view_branch',
  CREATE_BRANCH: 'create_branch',
  UPDATE_BRANCH: 'update_branch',
  DELETE_BRANCH: 'delete_branch',

  // Employee permissions
  VIEW_EMPLOYEE: 'view_employee',
  CREATE_EMPLOYEE: 'create_employee',
  UPDATE_EMPLOYEE: 'update_employee',
  DELETE_EMPLOYEE: 'delete_employee',

  // Vendor permissions
  VIEW_VENDOR: 'view_vendor',
  CREATE_VENDOR: 'create_vendor',
  UPDATE_VENDOR: 'update_vendor',
  DELETE_VENDOR: 'delete_vendor',

  // Transaction permissions
  VIEW_TRANSACTION: 'view_transaction',
  CREATE_TRANSACTION: 'create_transaction',
  UPDATE_TRANSACTION: 'update_transaction',
  APPROVE_TRANSACTION: 'approve_transaction',
  REJECT_TRANSACTION: 'reject_transaction',

  // Report permissions
  VIEW_REPORTS: 'view_reports',
  VIEW_ALL_REPORTS: 'view_all_reports'
};

/**
 * Permission matrix - what each role can do
 * @type {Object}
 */
const PERMISSION_MATRIX = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.BRANCH_MANAGER]: [
    PERMISSIONS.VIEW_ORGANIZATION,
    PERMISSIONS.VIEW_BRANCH,
    PERMISSIONS.UPDATE_BRANCH,
    PERMISSIONS.VIEW_EMPLOYEE,
    PERMISSIONS.CREATE_EMPLOYEE,
    PERMISSIONS.UPDATE_EMPLOYEE,
    PERMISSIONS.VIEW_VENDOR,
    PERMISSIONS.CREATE_VENDOR,
    PERMISSIONS.UPDATE_VENDOR,
    PERMISSIONS.VIEW_TRANSACTION,
    PERMISSIONS.APPROVE_TRANSACTION,
    PERMISSIONS.REJECT_TRANSACTION,
    PERMISSIONS.VIEW_REPORTS
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.VIEW_ORGANIZATION,
    PERMISSIONS.VIEW_BRANCH,
    PERMISSIONS.VIEW_EMPLOYEE,
    PERMISSIONS.VIEW_VENDOR,
    PERMISSIONS.VIEW_TRANSACTION,
    PERMISSIONS.CREATE_TRANSACTION,
    PERMISSIONS.UPDATE_TRANSACTION,
    PERMISSIONS.VIEW_REPORTS
  ],
  [ROLES.VENDOR]: [
    PERMISSIONS.VIEW_VENDOR,
    PERMISSIONS.VIEW_TRANSACTION,
    PERMISSIONS.VIEW_REPORTS
  ]
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
const hasPermission = (role, permission) => {
  return PERMISSION_MATRIX[role]?.includes(permission) || false;
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {Array<string>} Array of permissions
 */
const getPermissionsForRole = (role) => {
  return PERMISSION_MATRIX[role] || [];
};

module.exports = {
  PERMISSIONS,
  PERMISSION_MATRIX,
  hasPermission,
  getPermissionsForRole
};

