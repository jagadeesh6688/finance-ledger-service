/**
 * @fileoverview Unit tests for RBAC middleware
 * @module tests/unit/middleware/rbac
 */

const {
  withPermission,
  withOwnershipCheck,
  withManagementCheck
} = require('../../../src/middleware/rbac');
const { AuthorizationError } = require('../../../src/handles/errors');
const { PERMISSIONS } = require('../../../src/constants/permissions');
const { ROLES } = require('../../../src/constants/roles');

// Mock modules
jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../../src/handles/permissions');

const permissionsModule = require('../../../src/handles/permissions');
const logger = require('../../../src/config/logger');

describe('RBAC Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withPermission middleware', () => {
    const mockResolver = jest.fn().mockResolvedValue({ id: '123', name: 'Test' });
    const mockContext = {
      user: {
        userId: 'user123',
        employeeId: 'emp123',
        designation: ROLES.ADMIN,
        isAuthenticated: true
      }
    };

    it('should allow access when user has required permission', async () => {
      permissionsModule.isAuthorized.mockReturnValue(true);

      const wrapped = withPermission(PERMISSIONS.VIEW_ORGANIZATION, mockResolver);
      const result = await wrapped(null, { id: '123' }, mockContext, {});

      expect(permissionsModule.isAuthorized).toHaveBeenCalledWith(
        mockContext.user,
        PERMISSIONS.VIEW_ORGANIZATION
      );
      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ id: '123', name: 'Test' });
    });

    it('should throw AuthorizationError when user lacks permission', async () => {
      permissionsModule.isAuthorized.mockReturnValue(false);

      const wrapped = withPermission(PERMISSIONS.DELETE_ORGANIZATION, mockResolver);

      await expect(wrapped(null, {}, mockContext, {}))
        .rejects.toThrow(AuthorizationError);

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it('should throw AuthorizationError when user is not authenticated', async () => {
      const unauthContext = {
        user: null
      };

      const wrapped = withPermission(PERMISSIONS.VIEW_ORGANIZATION, mockResolver);

      await expect(wrapped(null, {}, unauthContext, {}))
        .rejects.toThrow('Authentication required');

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it('should throw AuthorizationError with correct message', async () => {
      permissionsModule.isAuthorized.mockReturnValue(false);

      const wrapped = withPermission(PERMISSIONS.DELETE_ORGANIZATION, mockResolver);

      await expect(wrapped(null, {}, mockContext, {}))
        .rejects.toThrow(`Insufficient permissions. Required: ${PERMISSIONS.DELETE_ORGANIZATION}`);
    });

    it('should pass all parameters to resolver', async () => {
      permissionsModule.isAuthorized.mockReturnValue(true);

      const parent = { parentId: 'parent123' };
      const args = { id: '123', filter: 'test' };
      const info = { fieldName: 'testField' };

      const wrapped = withPermission(PERMISSIONS.VIEW_ORGANIZATION, mockResolver);
      await wrapped(parent, args, mockContext, info);

      expect(mockResolver).toHaveBeenCalledWith(parent, args, mockContext, info);
    });

    it('should log warning when permission is denied', async () => {
      permissionsModule.isAuthorized.mockReturnValue(false);

      const wrapped = withPermission(PERMISSIONS.DELETE_ORGANIZATION, mockResolver);

      try {
        await wrapped(null, {}, mockContext, {});
      } catch (error) {
        expect(logger.warn).toHaveBeenCalled();
      }
    });

    it('should handle resolver errors and log them', async () => {
      permissionsModule.isAuthorized.mockReturnValue(true);
      const error = new Error('Resolver failed');
      mockResolver.mockRejectedValueOnce(error);

      const wrapped = withPermission(PERMISSIONS.VIEW_ORGANIZATION, mockResolver);

      await expect(wrapped(null, {}, mockContext, {}))
        .rejects.toThrow('Resolver failed');

      expect(logger.error).toHaveBeenCalledWith('Resolver error:', error);
    });

    it('should handle options parameter', async () => {
      permissionsModule.isAuthorized.mockReturnValue(true);

      const options = { requireOwnership: true };
      const wrapped = withPermission(PERMISSIONS.VIEW_ORGANIZATION, mockResolver, options);

      await wrapped(null, { id: '123' }, mockContext, {});

      expect(mockResolver).toHaveBeenCalled();
    });

    it('should check user.isAuthenticated flag', async () => {
      const contextNoAuth = {
        user: {
          userId: 'user123',
          isAuthenticated: false
        }
      };

      const wrapped = withPermission(PERMISSIONS.VIEW_ORGANIZATION, mockResolver);

      await expect(wrapped(null, {}, contextNoAuth, {}))
        .rejects.toThrow('Authentication required');
    });
  });

  describe('withOwnershipCheck middleware', () => {
    const mockGetResource = jest.fn();
    const mockResolver = jest.fn().mockResolvedValue({ success: true });
    const mockUser = {
      userId: 'user123',
      employeeId: 'emp123'
    };
    const mockContext = { user: mockUser };

    it('should allow access when user owns the resource', async () => {
      const resource = { userId: 'user123', name: 'Test Resource' };
      mockGetResource.mockResolvedValue(resource);
      permissionsModule.isOwner.mockReturnValue(true);

      const wrapped = withOwnershipCheck(mockGetResource, mockResolver);
      const result = await wrapped(null, { id: 'res123' }, mockContext, {});

      expect(mockGetResource).toHaveBeenCalledWith('res123');
      expect(permissionsModule.isOwner).toHaveBeenCalledWith(mockUser, resource);
      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should throw error when resource not found', async () => {
      mockGetResource.mockResolvedValue(null);

      const wrapped = withOwnershipCheck(mockGetResource, mockResolver);

      await expect(wrapped(null, { id: 'res123' }, mockContext, {}))
        .rejects.toThrow('Resource not found');

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it('should throw AuthorizationError when user does not own resource', async () => {
      const resource = { userId: 'different123', name: 'Test Resource' };
      mockGetResource.mockResolvedValue(resource);
      permissionsModule.isOwner.mockReturnValue(false);

      const wrapped = withOwnershipCheck(mockGetResource, mockResolver);

      await expect(wrapped(null, { id: 'res123' }, mockContext, {}))
        .rejects.toThrow('You do not own this resource');

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it('should pass args to resolver after ownership check', async () => {
      const resource = { userId: 'user123' };
      mockGetResource.mockResolvedValue(resource);
      permissionsModule.isOwner.mockReturnValue(true);

      const parent = { parentId: '456' };
      const args = { id: 'res123', data: 'test' };
      const info = { fieldName: 'test' };

      const wrapped = withOwnershipCheck(mockGetResource, mockResolver);
      await wrapped(parent, args, mockContext, info);

      expect(mockResolver).toHaveBeenCalledWith(parent, args, mockContext, info);
    });

    it('should handle getResource errors', async () => {
      mockGetResource.mockRejectedValue(new Error('Database error'));

      const wrapped = withOwnershipCheck(mockGetResource, mockResolver);

      await expect(wrapped(null, { id: 'res123' }, mockContext, {}))
        .rejects.toThrow('Database error');
    });
  });

  describe('withManagementCheck middleware', () => {
    const mockGetResource = jest.fn();
    const mockResolver = jest.fn().mockResolvedValue({ success: true });
    const mockUser = {
      userId: 'manager123',
      employeeId: 'empManager',
      designation: ROLES.BRANCH_MANAGER
    };
    const mockContext = { user: mockUser };

    it('should allow access when user manages the resource', async () => {
      const employee = { userId: 'emp123', manager: 'empManager' };
      mockGetResource.mockResolvedValue(employee);
      permissionsModule.isManager.mockReturnValue(true);

      const wrapped = withManagementCheck(mockGetResource, mockResolver);
      const result = await wrapped(null, { id: 'emp123' }, mockContext, {});

      expect(mockGetResource).toHaveBeenCalledWith('emp123');
      expect(permissionsModule.isManager).toHaveBeenCalledWith(mockUser, employee);
      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should throw error when resource not found', async () => {
      mockGetResource.mockResolvedValue(null);

      const wrapped = withManagementCheck(mockGetResource, mockResolver);

      await expect(wrapped(null, { id: 'emp123' }, mockContext, {}))
        .rejects.toThrow('Resource not found');

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it('should throw AuthorizationError when user does not manage resource', async () => {
      const employee = { userId: 'emp123', manager: 'differentManager' };
      mockGetResource.mockResolvedValue(employee);
      permissionsModule.isManager.mockReturnValue(false);

      const wrapped = withManagementCheck(mockGetResource, mockResolver);

      await expect(wrapped(null, { id: 'emp123' }, mockContext, {}))
        .rejects.toThrow('You do not manage this resource');

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it('should pass all parameters to resolver', async () => {
      const employee = { userId: 'emp123', manager: 'empManager' };
      mockGetResource.mockResolvedValue(employee);
      permissionsModule.isManager.mockReturnValue(true);

      const parent = { parentId: '789' };
      const args = { id: 'emp123', action: 'update' };
      const info = { fieldName: 'updateEmployee' };

      const wrapped = withManagementCheck(mockGetResource, mockResolver);
      await wrapped(parent, args, mockContext, info);

      expect(mockResolver).toHaveBeenCalledWith(parent, args, mockContext, info);
    });

    it('should handle getResource errors', async () => {
      mockGetResource.mockRejectedValue(new Error('Fetch failed'));

      const wrapped = withManagementCheck(mockGetResource, mockResolver);

      await expect(wrapped(null, { id: 'emp123' }, mockContext, {}))
        .rejects.toThrow('Fetch failed');
    });
  });

  describe('integration scenarios', () => {
    it('should chain permission and ownership checks', async () => {
      const mockResolver = jest.fn().mockResolvedValue({ data: 'success' });
      const mockGetResource = jest.fn().mockResolvedValue({ userId: 'user123' });
      
      permissionsModule.isAuthorized.mockReturnValue(true);
      permissionsModule.isOwner.mockReturnValue(true);

      const context = {
        user: {
          userId: 'user123',
          designation: ROLES.EMPLOYEE,
          isAuthenticated: true
        }
      };

      const withPerm = withPermission(PERMISSIONS.VIEW_TRANSACTION, mockResolver);
      const withOwn = withOwnershipCheck(mockGetResource, withPerm);

      const result = await withOwn(null, { id: '123' }, context, {});

      expect(result).toEqual({ data: 'success' });
      expect(permissionsModule.isAuthorized).toHaveBeenCalled();
      expect(permissionsModule.isOwner).toHaveBeenCalled();
    });

    it('should enforce all checks in order', async () => {
      const mockResolver = jest.fn().mockResolvedValue({ data: 'success' });
      const mockGetResource = jest.fn().mockResolvedValue({ userId: 'different' });
      
      permissionsModule.isAuthorized.mockReturnValue(true);
      permissionsModule.isOwner.mockReturnValue(false);

      const context = {
        user: {
          userId: 'user123',
          designation: ROLES.EMPLOYEE,
          isAuthenticated: true
        }
      };

      const withPerm = withPermission(PERMISSIONS.VIEW_TRANSACTION, mockResolver);
      const withOwn = withOwnershipCheck(mockGetResource, withPerm);

      await expect(withOwn(null, { id: '123' }, context, {}))
        .rejects.toThrow('You do not own this resource');

      expect(mockResolver).not.toHaveBeenCalled();
    });
  });
});