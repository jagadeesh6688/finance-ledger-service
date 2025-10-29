/**
 * @fileoverview Role definitions for RBAC
 * @module constants/roles
 */

/**
 * Available roles in the system
 * @enum {string}
 */
const ROLES = {
  ADMIN: 'Admin',
  BRANCH_MANAGER: 'BranchManager',
  EMPLOYEE: 'Employee',
  VENDOR: 'Vendor'
};

/**
 * Role hierarchy - roles with higher index have more permissions
 * @type {Array<string>}
 */
const ROLE_HIERARCHY = [
  ROLES.VENDOR,
  ROLES.EMPLOYEE,
  ROLES.BRANCH_MANAGER,
  ROLES.ADMIN
];

/**
 * Check if a role is higher than another in hierarchy
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean} True if role1 is higher than role2
 */
const isRoleHigher = (role1, role2) => {
  const index1 = ROLE_HIERARCHY.indexOf(role1);
  const index2 = ROLE_HIERARCHY.indexOf(role2);
  
  if (index1 === -1 || index2 === -1) {
    return false;
  }
  
  return index1 > index2;
};

/**
 * Get all roles at or below a given role
 * @param {string} role - Base role
 * @returns {Array<string>} Array of roles
 */
const getRolesAtOrBelow = (role) => {
  const index = ROLE_HIERARCHY.indexOf(role);
  if (index === -1) {
    return [];
  }
  return ROLE_HIERARCHY.slice(0, index + 1);
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  isRoleHigher,
  getRolesAtOrBelow
};

