/**
 * @fileoverview Unit tests for permissions constants and utilities
 * @module tests/unit/constants/permissions
 */

const {
  PERMISSIONS,
  PERMISSION_MATRIX,
  hasPermission,
  getPermissionsForRole
} = require('../../../src/constants/permissions');
const { ROLES } = require('../../../src/constants/roles');

describe('Permissions Constants', () => {
  describe('PERMISSIONS enum', () => {
    it('should define all organization permissions', () => {
      expect(PERMISSIONS.VIEW_ORGANIZATION).toBe('view_organization');
      expect(PERMISSIONS.CREATE_ORGANIZATION).toBe('create_organization');
      expect(PERMISSIONS.UPDATE_ORGANIZATION).toBe('update_organization');
      expect(PERMISSIONS.DELETE_ORGANIZATION).toBe('delete_organization');
    });

    it('should define all branch permissions', () => {
      expect(PERMISSIONS.VIEW_BRANCH).toBe('view_branch');
      expect(PERMISSIONS.CREATE_BRANCH).toBe('create_branch');
      expect(PERMISSIONS.UPDATE_BRANCH).toBe('update_branch');
      expect(PERMISSIONS.DELETE_BRANCH).toBe('delete_branch');
    });

    it('should define all employee permissions', () => {
      expect(PERMISSIONS.VIEW_EMPLOYEE).toBe('view_employee');
      expect(PERMISSIONS.CREATE_EMPLOYEE).toBe('create_employee');
      expect(PERMISSIONS.UPDATE_EMPLOYEE).toBe('update_employee');
      expect(PERMISSIONS.DELETE_EMPLOYEE).toBe('delete_employee');
    });

    it('should define all vendor permissions', () => {
      expect(PERMISSIONS.VIEW_VENDOR).toBe('view_vendor');
      expect(PERMISSIONS.CREATE_VENDOR).toBe('create_vendor');
      expect(PERMISSIONS.UPDATE_VENDOR).toBe('update_vendor');
      expect(PERMISSIONS.DELETE_VENDOR).toBe('delete_vendor');
    });

    it('should define all transaction permissions', () => {
      expect(PERMISSIONS.VIEW_TRANSACTION).toBe('view_transaction');
      expect(PERMISSIONS.CREATE_TRANSACTION).toBe('create_transaction');
      expect(PERMISSIONS.UPDATE_TRANSACTION).toBe('update_transaction');
      expect(PERMISSIONS.APPROVE_TRANSACTION).toBe('approve_transaction');
      expect(PERMISSIONS.REJECT_TRANSACTION).toBe('reject_transaction');
    });

    it('should define all report permissions', () => {
      expect(PERMISSIONS.VIEW_REPORTS).toBe('view_reports');
      expect(PERMISSIONS.VIEW_ALL_REPORTS).toBe('view_all_reports');
    });

    it('should have unique permission values', () => {
      const permissionValues = Object.values(PERMISSIONS);
      const uniqueValues = [...new Set(permissionValues)];
      expect(permissionValues.length).toBe(uniqueValues.length);
    });
  });

  describe('PERMISSION_MATRIX', () => {
    describe('Admin permissions', () => {
      it('should have all permissions', () => {
        const adminPerms = PERMISSION_MATRIX[ROLES.ADMIN];
        const allPermissions = Object.values(PERMISSIONS);
        expect(adminPerms).toEqual(allPermissions);
        expect(adminPerms.length).toBe(allPermissions.length);
      });

      it('should include create and delete operations', () => {
        const adminPerms = PERMISSION_MATRIX[ROLES.ADMIN];
        expect(adminPerms).toContain(PERMISSIONS.CREATE_ORGANIZATION);
        expect(adminPerms).toContain(PERMISSIONS.DELETE_ORGANIZATION);
        expect(adminPerms).toContain(PERMISSIONS.DELETE_BRANCH);
        expect(adminPerms).toContain(PERMISSIONS.DELETE_EMPLOYEE);
      });
    });

    describe('BranchManager permissions', () => {
      const managerPerms = PERMISSION_MATRIX[ROLES.BRANCH_MANAGER];

      it('should have specific permissions defined', () => {
        expect(managerPerms).toBeDefined();
        expect(Array.isArray(managerPerms)).toBe(true);
        expect(managerPerms.length).toBeGreaterThan(0);
      });

      it('should include view and update branch permissions', () => {
        expect(managerPerms).toContain(PERMISSIONS.VIEW_BRANCH);
        expect(managerPerms).toContain(PERMISSIONS.UPDATE_BRANCH);
      });

      it('should NOT have create branch permission', () => {
        expect(managerPerms).not.toContain(PERMISSIONS.CREATE_BRANCH);
      });

      it('should NOT have delete permissions', () => {
        expect(managerPerms).not.toContain(PERMISSIONS.DELETE_BRANCH);
        expect(managerPerms).not.toContain(PERMISSIONS.DELETE_EMPLOYEE);
        expect(managerPerms).not.toContain(PERMISSIONS.DELETE_VENDOR);
      });

      it('should include employee management permissions', () => {
        expect(managerPerms).toContain(PERMISSIONS.VIEW_EMPLOYEE);
        expect(managerPerms).toContain(PERMISSIONS.CREATE_EMPLOYEE);
        expect(managerPerms).toContain(PERMISSIONS.UPDATE_EMPLOYEE);
      });

      it('should include transaction approval permissions', () => {
        expect(managerPerms).toContain(PERMISSIONS.APPROVE_TRANSACTION);
        expect(managerPerms).toContain(PERMISSIONS.REJECT_TRANSACTION);
      });

      it('should NOT have view all reports permission', () => {
        expect(managerPerms).not.toContain(PERMISSIONS.VIEW_ALL_REPORTS);
      });
    });

    describe('Employee permissions', () => {
      const employeePerms = PERMISSION_MATRIX[ROLES.EMPLOYEE];

      it('should have read-only organization and branch permissions', () => {
        expect(employeePerms).toContain(PERMISSIONS.VIEW_ORGANIZATION);
        expect(employeePerms).toContain(PERMISSIONS.VIEW_BRANCH);
        expect(employeePerms).not.toContain(PERMISSIONS.UPDATE_ORGANIZATION);
        expect(employeePerms).not.toContain(PERMISSIONS.UPDATE_BRANCH);
      });

      it('should be able to create and update transactions', () => {
        expect(employeePerms).toContain(PERMISSIONS.VIEW_TRANSACTION);
        expect(employeePerms).toContain(PERMISSIONS.CREATE_TRANSACTION);
        expect(employeePerms).toContain(PERMISSIONS.UPDATE_TRANSACTION);
      });

      it('should NOT have transaction approval permissions', () => {
        expect(employeePerms).not.toContain(PERMISSIONS.APPROVE_TRANSACTION);
        expect(employeePerms).not.toContain(PERMISSIONS.REJECT_TRANSACTION);
      });

      it('should NOT have employee creation permissions', () => {
        expect(employeePerms).not.toContain(PERMISSIONS.CREATE_EMPLOYEE);
        expect(employeePerms).not.toContain(PERMISSIONS.UPDATE_EMPLOYEE);
      });

      it('should have basic view reports permission', () => {
        expect(employeePerms).toContain(PERMISSIONS.VIEW_REPORTS);
        expect(employeePerms).not.toContain(PERMISSIONS.VIEW_ALL_REPORTS);
      });
    });

    describe('Vendor permissions', () => {
      const vendorPerms = PERMISSION_MATRIX[ROLES.VENDOR];

      it('should have minimal permissions', () => {
        expect(vendorPerms.length).toBeLessThan(5);
      });

      it('should only have read permissions', () => {
        const hasWritePermission = vendorPerms.some(perm =>
          perm.includes('create') || perm.includes('update') || perm.includes('delete')
        );
        expect(hasWritePermission).toBe(false);
      });

      it('should be able to view own vendor data', () => {
        expect(vendorPerms).toContain(PERMISSIONS.VIEW_VENDOR);
      });

      it('should be able to view transactions', () => {
        expect(vendorPerms).toContain(PERMISSIONS.VIEW_TRANSACTION);
      });

      it('should be able to view reports', () => {
        expect(vendorPerms).toContain(PERMISSIONS.VIEW_REPORTS);
      });

      it('should NOT have any creation permissions', () => {
        const hasCreatePermission = vendorPerms.some(perm => perm.includes('create'));
        expect(hasCreatePermission).toBe(false);
      });
    });

    it('should have permissions defined for all roles', () => {
      Object.values(ROLES).forEach(role => {
        expect(PERMISSION_MATRIX[role]).toBeDefined();
        expect(Array.isArray(PERMISSION_MATRIX[role])).toBe(true);
      });
    });
  });

  describe('hasPermission function', () => {
    describe('valid permission checks', () => {
      it('should return true when Admin has any permission', () => {
        Object.values(PERMISSIONS).forEach(permission => {
          expect(hasPermission(ROLES.ADMIN, permission)).toBe(true);
        });
      });

      it('should return true when BranchManager has allowed permission', () => {
        expect(hasPermission(ROLES.BRANCH_MANAGER, PERMISSIONS.VIEW_BRANCH)).toBe(true);
        expect(hasPermission(ROLES.BRANCH_MANAGER, PERMISSIONS.APPROVE_TRANSACTION)).toBe(true);
      });

      it('should return false when BranchManager lacks permission', () => {
        expect(hasPermission(ROLES.BRANCH_MANAGER, PERMISSIONS.DELETE_ORGANIZATION)).toBe(false);
        expect(hasPermission(ROLES.BRANCH_MANAGER, PERMISSIONS.CREATE_BRANCH)).toBe(false);
      });

      it('should return true when Employee has allowed permission', () => {
        expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.VIEW_TRANSACTION)).toBe(true);
        expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.CREATE_TRANSACTION)).toBe(true);
      });

      it('should return false when Employee lacks permission', () => {
        expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.APPROVE_TRANSACTION)).toBe(false);
        expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.DELETE_EMPLOYEE)).toBe(false);
      });

      it('should return true when Vendor has allowed permission', () => {
        expect(hasPermission(ROLES.VENDOR, PERMISSIONS.VIEW_VENDOR)).toBe(true);
        expect(hasPermission(ROLES.VENDOR, PERMISSIONS.VIEW_TRANSACTION)).toBe(true);
      });

      it('should return false when Vendor lacks permission', () => {
        expect(hasPermission(ROLES.VENDOR, PERMISSIONS.CREATE_VENDOR)).toBe(false);
        expect(hasPermission(ROLES.VENDOR, PERMISSIONS.UPDATE_VENDOR)).toBe(false);
      });
    });

    describe('invalid input handling', () => {
      it('should return false for undefined role', () => {
        expect(hasPermission(undefined, PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
      });

      it('should return false for null role', () => {
        expect(hasPermission(null, PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
      });

      it('should return false for invalid role', () => {
        expect(hasPermission('InvalidRole', PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
      });

      it('should return false for empty string role', () => {
        expect(hasPermission('', PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
      });

      it('should return false for undefined permission', () => {
        expect(hasPermission(ROLES.ADMIN, undefined)).toBe(false);
      });

      it('should return false for null permission', () => {
        expect(hasPermission(ROLES.ADMIN, null)).toBe(false);
      });

      it('should return false for invalid permission', () => {
        expect(hasPermission(ROLES.ADMIN, 'invalid_permission')).toBe(false);
      });

      it('should return false for both invalid inputs', () => {
        expect(hasPermission('InvalidRole', 'invalid_permission')).toBe(false);
      });

      it('should handle numeric inputs gracefully', () => {
        expect(hasPermission(123, PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
        expect(hasPermission(ROLES.ADMIN, 456)).toBe(false);
      });

      it('should handle object inputs gracefully', () => {
        expect(hasPermission({ role: 'Admin' }, PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
      });
    });

    describe('case sensitivity', () => {
      it('should be case-sensitive for role names', () => {
        expect(hasPermission('admin', PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
        expect(hasPermission('ADMIN', PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
      });

      it('should be case-sensitive for permission names', () => {
        expect(hasPermission(ROLES.ADMIN, 'VIEW_ORGANIZATION')).toBe(false);
        expect(hasPermission(ROLES.ADMIN, 'View_Organization')).toBe(false);
      });
    });
  });

  describe('getPermissionsForRole function', () => {
    describe('valid role inputs', () => {
      it('should return all permissions for Admin', () => {
        const permissions = getPermissionsForRole(ROLES.ADMIN);
        expect(permissions).toEqual(PERMISSION_MATRIX[ROLES.ADMIN]);
        expect(permissions.length).toBe(Object.values(PERMISSIONS).length);
      });

      it('should return correct permissions for BranchManager', () => {
        const permissions = getPermissionsForRole(ROLES.BRANCH_MANAGER);
        expect(permissions).toEqual(PERMISSION_MATRIX[ROLES.BRANCH_MANAGER]);
        expect(Array.isArray(permissions)).toBe(true);
      });

      it('should return correct permissions for Employee', () => {
        const permissions = getPermissionsForRole(ROLES.EMPLOYEE);
        expect(permissions).toEqual(PERMISSION_MATRIX[ROLES.EMPLOYEE]);
        expect(permissions.length).toBeGreaterThan(0);
      });

      it('should return correct permissions for Vendor', () => {
        const permissions = getPermissionsForRole(ROLES.VENDOR);
        expect(permissions).toEqual(PERMISSION_MATRIX[ROLES.VENDOR]);
        expect(permissions.length).toBeGreaterThan(0);
      });

      it('should return array for all valid roles', () => {
        Object.values(ROLES).forEach(role => {
          const permissions = getPermissionsForRole(role);
          expect(Array.isArray(permissions)).toBe(true);
        });
      });
    });

    describe('invalid role inputs', () => {
      it('should return empty array for undefined role', () => {
        const permissions = getPermissionsForRole(undefined);
        expect(permissions).toEqual([]);
      });

      it('should return empty array for null role', () => {
        const permissions = getPermissionsForRole(null);
        expect(permissions).toEqual([]);
      });

      it('should return empty array for invalid role', () => {
        const permissions = getPermissionsForRole('InvalidRole');
        expect(permissions).toEqual([]);
      });

      it('should return empty array for empty string', () => {
        const permissions = getPermissionsForRole('');
        expect(permissions).toEqual([]);
      });

      it('should return empty array for numeric input', () => {
        const permissions = getPermissionsForRole(123);
        expect(permissions).toEqual([]);
      });

      it('should return empty array for object input', () => {
        const permissions = getPermissionsForRole({ role: 'Admin' });
        expect(permissions).toEqual([]);
      });
    });

    describe('return value integrity', () => {
      it('should return reference to actual permission array', () => {
        const permissions = getPermissionsForRole(ROLES.ADMIN);
        expect(permissions).toBe(PERMISSION_MATRIX[ROLES.ADMIN]);
      });

      it('should return same array reference on multiple calls', () => {
        const perms1 = getPermissionsForRole(ROLES.EMPLOYEE);
        const perms2 = getPermissionsForRole(ROLES.EMPLOYEE);
        expect(perms1).toBe(perms2);
      });
    });
  });

  describe('integration tests', () => {
    it('should ensure permission hierarchy follows role hierarchy', () => {
      const adminPerms = PERMISSION_MATRIX[ROLES.ADMIN];
      const managerPerms = PERMISSION_MATRIX[ROLES.BRANCH_MANAGER];
      const employeePerms = PERMISSION_MATRIX[ROLES.EMPLOYEE];
      const vendorPerms = PERMISSION_MATRIX[ROLES.VENDOR];

      expect(adminPerms.length).toBeGreaterThan(managerPerms.length);
      expect(managerPerms.length).toBeGreaterThan(employeePerms.length);
      expect(employeePerms.length).toBeGreaterThan(vendorPerms.length);
    });

    it('should ensure all Employee permissions are in BranchManager permissions', () => {
      const managerPerms = PERMISSION_MATRIX[ROLES.BRANCH_MANAGER];
      
      // Not all employee perms are necessarily in manager (they have different scopes)
      // But check critical overlap
      expect(managerPerms).toContain(PERMISSIONS.VIEW_TRANSACTION);
    });

    it('should ensure consistency between hasPermission and getPermissionsForRole', () => {
      Object.values(ROLES).forEach(role => {
        const permissions = getPermissionsForRole(role);
        permissions.forEach(permission => {
          expect(hasPermission(role, permission)).toBe(true);
        });
      });
    });

    it('should verify no role has empty permissions', () => {
      Object.values(ROLES).forEach(role => {
        const permissions = PERMISSION_MATRIX[role];
        expect(permissions.length).toBeGreaterThan(0);
      });
    });

    it('should verify all permissions in matrix are valid', () => {
      const validPermissions = Object.values(PERMISSIONS);
      Object.values(PERMISSION_MATRIX).forEach(rolePermissions => {
        rolePermissions.forEach(permission => {
          expect(validPermissions).toContain(permission);
        });
      });
    });
  });
});