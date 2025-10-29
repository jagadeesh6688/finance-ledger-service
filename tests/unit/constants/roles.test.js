/**
 * @fileoverview Unit tests for roles constants and utilities
 * @module tests/unit/constants/roles
 */

const { ROLES, ROLE_HIERARCHY, isRoleHigher, getRolesAtOrBelow } = require('../../../src/constants/roles');

describe('Roles Constants', () => {
  describe('ROLES enum', () => {
    it('should define all required roles', () => {
      expect(ROLES.ADMIN).toBe('Admin');
      expect(ROLES.BRANCH_MANAGER).toBe('BranchManager');
      expect(ROLES.EMPLOYEE).toBe('Employee');
      expect(ROLES.VENDOR).toBe('Vendor');
    });

    it('should have exactly 4 roles', () => {
      expect(Object.keys(ROLES)).toHaveLength(4);
    });

    it('should not allow role values to be modified', () => {
      const originalValue = ROLES.ADMIN;
      ROLES.ADMIN = 'ModifiedAdmin';
      expect(ROLES.ADMIN).toBe(originalValue);
    });
  });

  describe('ROLE_HIERARCHY array', () => {
    it('should define roles in correct hierarchical order', () => {
      expect(ROLE_HIERARCHY).toEqual([
        'Vendor',
        'Employee',
        'BranchManager',
        'Admin'
      ]);
    });

    it('should have Vendor as lowest role', () => {
      expect(ROLE_HIERARCHY[0]).toBe(ROLES.VENDOR);
    });

    it('should have Admin as highest role', () => {
      expect(ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1]).toBe(ROLES.ADMIN);
    });

    it('should contain all defined roles', () => {
      const rolesValues = Object.values(ROLES);
      rolesValues.forEach(role => {
        expect(ROLE_HIERARCHY).toContain(role);
      });
    });
  });

  describe('isRoleHigher function', () => {
    describe('valid role comparisons', () => {
      it('should return true when Admin is compared to BranchManager', () => {
        expect(isRoleHigher(ROLES.ADMIN, ROLES.BRANCH_MANAGER)).toBe(true);
      });

      it('should return true when Admin is compared to Employee', () => {
        expect(isRoleHigher(ROLES.ADMIN, ROLES.EMPLOYEE)).toBe(true);
      });

      it('should return true when Admin is compared to Vendor', () => {
        expect(isRoleHigher(ROLES.ADMIN, ROLES.VENDOR)).toBe(true);
      });

      it('should return true when BranchManager is compared to Employee', () => {
        expect(isRoleHigher(ROLES.BRANCH_MANAGER, ROLES.EMPLOYEE)).toBe(true);
      });

      it('should return true when BranchManager is compared to Vendor', () => {
        expect(isRoleHigher(ROLES.BRANCH_MANAGER, ROLES.VENDOR)).toBe(true);
      });

      it('should return true when Employee is compared to Vendor', () => {
        expect(isRoleHigher(ROLES.EMPLOYEE, ROLES.VENDOR)).toBe(true);
      });

      it('should return false when Vendor is compared to Employee', () => {
        expect(isRoleHigher(ROLES.VENDOR, ROLES.EMPLOYEE)).toBe(false);
      });

      it('should return false when Employee is compared to BranchManager', () => {
        expect(isRoleHigher(ROLES.EMPLOYEE, ROLES.BRANCH_MANAGER)).toBe(false);
      });

      it('should return false when BranchManager is compared to Admin', () => {
        expect(isRoleHigher(ROLES.BRANCH_MANAGER, ROLES.ADMIN)).toBe(false);
      });

      it('should return false when comparing same roles', () => {
        expect(isRoleHigher(ROLES.ADMIN, ROLES.ADMIN)).toBe(false);
        expect(isRoleHigher(ROLES.EMPLOYEE, ROLES.EMPLOYEE)).toBe(false);
      });
    });

    describe('invalid role handling', () => {
      it('should return false for invalid first role', () => {
        expect(isRoleHigher('InvalidRole', ROLES.EMPLOYEE)).toBe(false);
      });

      it('should return false for invalid second role', () => {
        expect(isRoleHigher(ROLES.ADMIN, 'InvalidRole')).toBe(false);
      });

      it('should return false for both invalid roles', () => {
        expect(isRoleHigher('InvalidRole1', 'InvalidRole2')).toBe(false);
      });

      it('should return false for null first role', () => {
        expect(isRoleHigher(null, ROLES.EMPLOYEE)).toBe(false);
      });

      it('should return false for undefined first role', () => {
        expect(isRoleHigher(undefined, ROLES.EMPLOYEE)).toBe(false);
      });

      it('should return false for empty string roles', () => {
        expect(isRoleHigher('', ROLES.EMPLOYEE)).toBe(false);
        expect(isRoleHigher(ROLES.ADMIN, '')).toBe(false);
      });
    });
  });

  describe('getRolesAtOrBelow function', () => {
    describe('valid role inputs', () => {
      it('should return all roles for Admin', () => {
        const roles = getRolesAtOrBelow(ROLES.ADMIN);
        expect(roles).toEqual([
          ROLES.VENDOR,
          ROLES.EMPLOYEE,
          ROLES.BRANCH_MANAGER,
          ROLES.ADMIN
        ]);
        expect(roles).toHaveLength(4);
      });

      it('should return Vendor, Employee, and BranchManager for BranchManager', () => {
        const roles = getRolesAtOrBelow(ROLES.BRANCH_MANAGER);
        expect(roles).toEqual([
          ROLES.VENDOR,
          ROLES.EMPLOYEE,
          ROLES.BRANCH_MANAGER
        ]);
        expect(roles).toHaveLength(3);
      });

      it('should return Vendor and Employee for Employee', () => {
        const roles = getRolesAtOrBelow(ROLES.EMPLOYEE);
        expect(roles).toEqual([
          ROLES.VENDOR,
          ROLES.EMPLOYEE
        ]);
        expect(roles).toHaveLength(2);
      });

      it('should return only Vendor for Vendor', () => {
        const roles = getRolesAtOrBelow(ROLES.VENDOR);
        expect(roles).toEqual([ROLES.VENDOR]);
        expect(roles).toHaveLength(1);
      });

      it('should maintain hierarchy order in returned array', () => {
        const roles = getRolesAtOrBelow(ROLES.BRANCH_MANAGER);
        expect(roles[0]).toBe(ROLES.VENDOR);
        expect(roles[roles.length - 1]).toBe(ROLES.BRANCH_MANAGER);
      });
    });

    describe('invalid role inputs', () => {
      it('should return empty array for invalid role', () => {
        const roles = getRolesAtOrBelow('InvalidRole');
        expect(roles).toEqual([]);
        expect(roles).toHaveLength(0);
      });

      it('should return empty array for null', () => {
        const roles = getRolesAtOrBelow(null);
        expect(roles).toEqual([]);
      });

      it('should return empty array for undefined', () => {
        const roles = getRolesAtOrBelow(undefined);
        expect(roles).toEqual([]);
      });

      it('should return empty array for empty string', () => {
        const roles = getRolesAtOrBelow('');
        expect(roles).toEqual([]);
      });

      it('should return empty array for numeric input', () => {
        const roles = getRolesAtOrBelow(123);
        expect(roles).toEqual([]);
      });

      it('should return empty array for object input', () => {
        const roles = getRolesAtOrBelow({ role: 'Admin' });
        expect(roles).toEqual([]);
      });
    });

    describe('edge cases', () => {
      it('should not modify original hierarchy array', () => {
        const originalLength = ROLE_HIERARCHY.length;
        getRolesAtOrBelow(ROLES.ADMIN);
        expect(ROLE_HIERARCHY).toHaveLength(originalLength);
      });

      it('should return new array instance each time', () => {
        const result1 = getRolesAtOrBelow(ROLES.ADMIN);
        const result2 = getRolesAtOrBelow(ROLES.ADMIN);
        expect(result1).not.toBe(result2);
        expect(result1).toEqual(result2);
      });

      it('should handle case-sensitive role names', () => {
        expect(getRolesAtOrBelow('admin')).toEqual([]);
        expect(getRolesAtOrBelow('ADMIN')).toEqual([]);
      });
    });
  });

  describe('integration tests', () => {
    it('should maintain consistency between isRoleHigher and hierarchy', () => {
      for (let i = 0; i < ROLE_HIERARCHY.length; i++) {
        for (let j = 0; j < ROLE_HIERARCHY.length; j++) {
          const role1 = ROLE_HIERARCHY[i];
          const role2 = ROLE_HIERARCHY[j];
          const expected = i > j;
          expect(isRoleHigher(role1, role2)).toBe(expected);
        }
      }
    });

    it('should ensure getRolesAtOrBelow includes the role itself', () => {
      Object.values(ROLES).forEach(role => {
        const rolesBelow = getRolesAtOrBelow(role);
        if (rolesBelow.length > 0) {
          expect(rolesBelow).toContain(role);
        }
      });
    });
  });
});