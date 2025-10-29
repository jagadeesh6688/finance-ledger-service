/**
 * @fileoverview Test data fixtures
 * @module helpers/fixtures
 */

/**
 * Generate test organization data
 * @returns {Object} Organization fixture
 */
const createOrganizationFixture = () => ({
  name: 'Test Organization'
});

/**
 * Generate test branch data
 * @param {string} organizationId - Organization ID
 * @returns {Object} Branch fixture
 */
const createBranchFixture = (organizationId) => ({
  name: 'Test Branch',
  organization: organizationId
});

/**
 * Generate test employee data
 * @param {string} branchId - Branch ID
 * @param {string} designation - Employee designation
 * @returns {Object} Employee fixture
 */
const createEmployeeFixture = (branchId, designation = 'Employee') => ({
  userId: `user_${Date.now()}`,
  name: 'Test Employee',
  branch: branchId,
  designation,
  permissions: []
});

/**
 * Generate test vendor data
 * @returns {Object} Vendor fixture
 */
const createVendorFixture = () => ({
  name: 'Test Vendor',
  contactInfo: {
    email: 'vendor@test.com',
    phone: '123-456-7890',
    address: '123 Test St'
  }
});

/**
 * Generate test user data
 * @param {string} employeeId - Employee ID
 * @returns {Object} User fixture
 */
const createUserFixture = (employeeId) => ({
  username: `testuser_${Date.now()}`,
  password: 'testpassword123',
  employee: employeeId
});

module.exports = {
  createOrganizationFixture,
  createBranchFixture,
  createEmployeeFixture,
  createVendorFixture,
  createUserFixture
};

