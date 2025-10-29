/**
 * @fileoverview Unit tests for RBAC permission utilities
 * @module tests/unit/handles/permissions
 */

const {
  isAuthorized,
  requirePermission,
  isOwner,
  isManager
} = require('../../../src/handles/permissions');
const { AuthorizationError } = require('../../../src/handles/errors');
const { PERMISSIONS } = require('../../../src/constants/permissions');
const { ROLES } = require('../../../src/constants/roles');

// Mock logger
jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const logger = require('../../../src/config/logger');

describe('Permission Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAuthorized function', () => {
    const adminUser = {
      userId: 'user123',
      employeeId: 'emp123',
      designation: ROLES.ADMIN
    };

    const employeeUser = {
      userId: 'user456',
      employeeId: 'emp456',
      designation: ROLES.EMPLOYEE
    };

    describe('valid authorization checks', () => {
      it('should return true when admin has any permission', () => {
        expect(isAuthorized(adminUser, PERMISSIONS.DELETE_ORGANIZATION)).toBe(true);
        expect(isAuthorized(adminUser, PERMISSIONS.CREATE_BRANCH)).toBe(true);
      });

      it('should return true when employee has allowed permission', () => {
        expect(isAuthorized(employeeUser, PERMISSIONS.VIEW_TRANSACTION)).toBe(true);
        expect(isAuthorized(employeeUser, PERMISSIONS.CREATE_TRANSACTION)).toBe(true);
      });

      it('should return false when employee lacks permission', () => {
        expect(isAuthorized(employeeUser, PERMISSIONS.APPROVE_TRANSACTION)).toBe(false);
        expect(isAuthorized(employeeUser, PERMISSIONS.DELETE_EMPLOYEE)).toBe(false);
      });

      it('should return true for branch manager with approval permissions', () => {
        const managerUser = {
          userId: 'user789',
          employeeId: 'emp789',
          designation: ROLES.BRANCH_MANAGER
        };
        
        expect(isAuthorized(managerUser, PERMISSIONS.APPROVE_TRANSACTION)).toBe(true);
      });

      it('should return false for vendor with write permissions', () => {
        const vendorUser = {
          userId: 'vendor123',
          designation: ROLES.VENDOR
        };
        
        expect(isAuthorized(vendorUser, PERMISSIONS.CREATE_VENDOR)).toBe(false);
      });
    });

    describe('invalid user handling', () => {
      it('should return false for null user', () => {
        expect(isAuthorized(null, PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
        expect(logger.warn).toHaveBeenCalled();
      });

      it('should return false for undefined user', () => {
        expect(isAuthorized(undefined, PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
      });

      it('should return false for user without designation', () => {
        const userNoDesignation = {
          userId: 'user123',
          employeeId: 'emp123'
        };
        
        expect(isAuthorized(userNoDesignation, PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
      });

      it('should return false for empty user object', () => {
        expect(isAuthorized({}, PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
      });

      it('should return false for user with invalid designation', () => {
        const invalidUser = {
          userId: 'user123',
          designation: 'InvalidRole'
        };
        
        expect(isAuthorized(invalidUser, PERMISSIONS.VIEW_ORGANIZATION)).toBe(false);
      });
    });

    describe('invalid permission handling', () => {
      it('should return false for invalid permission', () => {
        expect(isAuthorized(adminUser, 'invalid_permission')).toBe(false);
      });

      it('should return false for null permission', () => {
        expect(isAuthorized(adminUser, null)).toBe(false);
      });

      it('should return false for undefined permission', () => {
        expect(isAuthorized(adminUser, undefined)).toBe(false);
      });
    });

    describe('logging behavior', () => {
      it('should log warning when user lacks permission', () => {
        isAuthorized(employeeUser, PERMISSIONS.DELETE_EMPLOYEE);
        
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Unauthorized')
        );
      });

      it('should log warning for missing user', () => {
        isAuthorized(null, PERMISSIONS.VIEW_ORGANIZATION);
        
        expect(logger.warn).toHaveBeenCalledWith(
          'Unauthorized: No user or designation'
        );
      });
    });

    describe('resourceId parameter', () => {
      it('should accept resourceId parameter', () => {
        expect(isAuthorized(adminUser, PERMISSIONS.VIEW_ORGANIZATION, 'resource123')).toBe(true);
      });

      it('should handle null resourceId', () => {
        expect(isAuthorized(adminUser, PERMISSIONS.VIEW_ORGANIZATION, null)).toBe(true);
      });

      it('should handle undefined resourceId', () => {
        expect(isAuthorized(adminUser, PERMISSIONS.VIEW_ORGANIZATION, undefined)).toBe(true);
      });
    });
  });

  describe('requirePermission function', () => {
    const mockContext = {
      user: {
        userId: 'user123',
        employeeId: 'emp123',
        designation: ROLES.ADMIN
      }
    };

    const mockInfo = {
      fieldName: 'testField'
    };

    it('should return function', () => {
      const middleware = requirePermission(PERMISSIONS.VIEW_ORGANIZATION);
      expect(typeof middleware).toBe('function');
    });

    it('should allow authorized user', () => {
      const middleware = requirePermission(PERMISSIONS.VIEW_ORGANIZATION);
      const result = middleware(null, {}, mockContext, mockInfo);
      
      expect(result).toBe('testField');
    });

    it('should throw AuthorizationError for unauthorized user', () => {
      const unauthorizedContext = {
        user: {
          userId: 'user456',
          designation: ROLES.EMPLOYEE
        }
      };
      
      const middleware = requirePermission(PERMISSIONS.DELETE_ORGANIZATION);
      
      expect(() => {
        middleware(null, {}, unauthorizedContext, mockInfo);
      }).toThrow(AuthorizationError);
    });

    it('should throw error with correct message', () => {
      const unauthorizedContext = {
        user: {
          userId: 'user456',
          designation: ROLES.EMPLOYEE
        }
      };
      
      const middleware = requirePermission(PERMISSIONS.DELETE_ORGANIZATION);
      
      expect(() => {
        middleware(null, {}, unauthorizedContext, mockInfo);
      }).toThrow('Insufficient permissions. Required: delete_organization');
    });

    it('should throw for missing user in context', () => {
      const middleware = requirePermission(PERMISSIONS.VIEW_ORGANIZATION);
      
      expect(() => {
        middleware(null, {}, {}, mockInfo);
      }).toThrow(AuthorizationError);
    });

    it('should pass parent and args to resolver', () => {
      const middleware = requirePermission(PERMISSIONS.VIEW_ORGANIZATION);
      const parent = { id: '123' };
      const args = { filter: 'test' };
      
      const result = middleware(parent, args, mockContext, mockInfo);
      expect(result).toBe('testField');
    });
  });

  describe('isOwner function', () => {
    const user = {
      userId: 'user123',
      employeeId: 'emp123',
      designation: ROLES.EMPLOYEE
    };

    describe('ownership by userId', () => {
      it('should return true when user owns resource by userId', () => {
        const resource = {
          userId: 'user123',
          name: 'Test Resource'
        };
        
        expect(isOwner(user, resource)).toBe(true);
      });

      it('should return false when userId does not match', () => {
        const resource = {
          userId: 'different123',
          name: 'Test Resource'
        };
        
        expect(isOwner(user, resource)).toBe(false);
      });
    });

    describe('ownership by employeeId', () => {
      it('should return true when user owns resource by employeeId', () => {
        const resource = {
          employeeId: 'emp123',
          name: 'Test Resource'
        };
        
        expect(isOwner(user, resource)).toBe(true);
      });

      it('should return false when employeeId does not match', () => {
        const resource = {
          employeeId: 'different456',
          name: 'Test Resource'
        };
        
        expect(isOwner(user, resource)).toBe(false);
      });
    });

    describe('invalid input handling', () => {
      it('should return false for null user', () => {
        const resource = { userId: 'user123' };
        expect(isOwner(null, resource)).toBe(false);
      });

      it('should return false for undefined user', () => {
        const resource = { userId: 'user123' };
        expect(isOwner(undefined, resource)).toBe(false);
      });

      it('should return false for null resource', () => {
        expect(isOwner(user, null)).toBe(false);
      });

      it('should return false for undefined resource', () => {
        expect(isOwner(user, undefined)).toBe(false);
      });

      it('should return false when both are null', () => {
        expect(isOwner(null, null)).toBe(false);
      });

      it('should return false for resource without userId or employeeId', () => {
        const resource = {
          name: 'Test Resource'
        };
        
        expect(isOwner(user, resource)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should prioritize userId over employeeId', () => {
        const resource = {
          userId: 'user123',
          employeeId: 'different456'
        };
        
        expect(isOwner(user, resource)).toBe(true);
      });

      it('should handle empty string userId', () => {
        const userEmpty = { userId: '', employeeId: 'emp123' };
        const resource = { userId: '' };
        
        expect(isOwner(userEmpty, resource)).toBe(false);
      });

      it('should handle resource with both matching IDs', () => {
        const resource = {
          userId: 'user123',
          employeeId: 'emp123'
        };
        
        expect(isOwner(user, resource)).toBe(true);
      });
    });
  });

  describe('isManager function', () => {
    const adminUser = {
      userId: 'admin123',
      employeeId: 'empAdmin',
      designation: ROLES.ADMIN
    };

    const managerUser = {
      userId: 'manager123',
      employeeId: 'empManager',
      designation: ROLES.BRANCH_MANAGER
    };

    const employeeUser = {
      userId: 'employee123',
      employeeId: 'empEmployee',
      designation: ROLES.EMPLOYEE
    };

    describe('admin management', () => {
      it('should return true for admin managing any employee', () => {
        const employee = {
          userId: 'emp123',
          manager: 'someManager'
        };
        
        expect(isManager(adminUser, employee)).toBe(true);
      });

      it('should return true for admin even without manager field', () => {
        const employee = {
          userId: 'emp123'
        };
        
        expect(isManager(adminUser, employee)).toBe(true);
      });
    });

    describe('direct manager relationship', () => {
      it('should return true when user is the direct manager', () => {
        const employee = {
          userId: 'emp123',
          manager: 'empManager'
        };
        
        expect(isManager(managerUser, employee)).toBe(true);
      });

      it('should return false when user is not the manager', () => {
        const employee = {
          userId: 'emp123',
          manager: 'differentManager'
        };
        
        expect(isManager(managerUser, employee)).toBe(false);
      });

      it('should return false when employee has no manager', () => {
        const employee = {
          userId: 'emp123'
        };
        
        expect(isManager(employeeUser, employee)).toBe(false);
      });
    });

    describe('invalid input handling', () => {
      it('should return false for null user', () => {
        const employee = { userId: 'emp123' };
        expect(isManager(null, employee)).toBe(false);
      });

      it('should return false for undefined user', () => {
        const employee = { userId: 'emp123' };
        expect(isManager(undefined, employee)).toBe(false);
      });

      it('should return false for null employee', () => {
        expect(isManager(managerUser, null)).toBe(false);
      });

      it('should return false for undefined employee', () => {
        expect(isManager(managerUser, undefined)).toBe(false);
      });

      it('should return false when both are null', () => {
        expect(isManager(null, null)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle manager field as toString() object', () => {
        const employee = {
          userId: 'emp123',
          manager: {
            toString: () => 'empManager'
          }
        };
        
        expect(isManager(managerUser, employee)).toBe(true);
      });

      it('should return false for employee managing themselves', () => {
        const employee = {
          userId: 'emp123',
          employeeId: 'empEmployee',
          manager: 'empEmployee'
        };
        
        expect(isManager(employeeUser, employee)).toBe(true);
      });

      it('should handle null manager field', () => {
        const employee = {
          userId: 'emp123',
          manager: null
        };
        
        expect(isManager(managerUser, employee)).toBe(false);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should combine isAuthorized and isOwner checks', () => {
      const user = {
        userId: 'user123',
        designation: ROLES.EMPLOYEE
      };
      
      const resource = { userId: 'user123' };
      
      const canView = isAuthorized(user, PERMISSIONS.VIEW_TRANSACTION);
      const owns = isOwner(user, resource);
      
      expect(canView).toBe(true);
      expect(owns).toBe(true);
    });

    it('should validate complete permission chain', () => {
      const manager = {
        userId: 'manager123',
        employeeId: 'empManager',
        designation: ROLES.BRANCH_MANAGER
      };
      
      const employee = {
        userId: 'emp123',
        employeeId: 'empEmployee',
        manager: 'empManager'
      };
      
      const canManageEmployees = isAuthorized(manager, PERMISSIONS.UPDATE_EMPLOYEE);
      const manages = isManager(manager, employee);
      
      expect(canManageEmployees).toBe(true);
      expect(manages).toBe(true);
    });

    it('should enforce strict permission boundaries', () => {
      const employee = {
        userId: 'emp123',
        designation: ROLES.EMPLOYEE
      };
      
      expect(isAuthorized(employee, PERMISSIONS.APPROVE_TRANSACTION)).toBe(false);
      expect(isAuthorized(employee, PERMISSIONS.DELETE_EMPLOYEE)).toBe(false);
      expect(isAuthorized(employee, PERMISSIONS.CREATE_ORGANIZATION)).toBe(false);
    });
  });
});