/**
 * @fileoverview Unit tests for User model
 * @module tests/unit/models/User
 */

const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const { connectDB, closeDB, clearDB } = require('../../helpers/dbSetup');

describe('User Model', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  afterEach(async () => {
    await clearDB();
  });

  describe('Schema validation', () => {
    it('should create user with valid data', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        employee: new mongoose.Types.ObjectId()
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe('testuser');
      expect(savedUser.employee).toEqual(userData.employee);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should require username field', async () => {
      const user = new User({
        password: 'password123',
        employee: new mongoose.Types.ObjectId()
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require password field', async () => {
      const user = new User({
        username: 'testuser',
        employee: new mongoose.Types.ObjectId()
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require employee field', async () => {
      const user = new User({
        username: 'testuser',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique username', async () => {
      const employeeId = new mongoose.Types.ObjectId();
      
      await User.create({
        username: 'duplicate',
        password: 'password123',
        employee: employeeId
      });

      const duplicateUser = new User({
        username: 'duplicate',
        password: 'password456',
        employee: new mongoose.Types.ObjectId()
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should trim and lowercase username', async () => {
      const user = await User.create({
        username: '  TestUser  ',
        password: 'password123',
        employee: new mongoose.Types.ObjectId()
      });

      expect(user.username).toBe('testuser');
    });

    it('should set default values for timestamps', async () => {
      const user = await User.create({
        username: 'testuser',
        password: 'password123',
        employee: new mongoose.Types.ObjectId()
      });

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should set refreshToken to null by default', async () => {
      const user = await User.create({
        username: 'testuser',
        password: 'password123',
        employee: new mongoose.Types.ObjectId()
      });

      expect(user.refreshToken).toBeNull();
    });
  });

  describe('Password hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'mySecretPassword';
      const user = await User.create({
        username: 'hashtest',
        password: plainPassword,
        employee: new mongoose.Types.ObjectId()
      });

      // Need to explicitly select password as it's excluded by default
      const userWithPassword = await User.findById(user._id).select('+password');
      
      expect(userWithPassword.password).toBeDefined();
      expect(userWithPassword.password).not.toBe(plainPassword);
      expect(userWithPassword.password.length).toBeGreaterThan(20);
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        username: 'norehash',
        password: 'password123',
        employee: new mongoose.Types.ObjectId()
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const originalHash = userWithPassword.password;

      userWithPassword.username = 'newusername';
      await userWithPassword.save();

      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser.password).toBe(originalHash);
    });

    it('should rehash password when modified', async () => {
      const user = await User.create({
        username: 'rehashtest',
        password: 'oldpassword',
        employee: new mongoose.Types.ObjectId()
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const originalHash = userWithPassword.password;

      userWithPassword.password = 'newpassword';
      await userWithPassword.save();

      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser.password).not.toBe(originalHash);
    });

    it('should use BCRYPT_ROUNDS from environment', async () => {
      const originalRounds = process.env.BCRYPT_ROUNDS;
      process.env.BCRYPT_ROUNDS = '5';

      const user = await User.create({
        username: 'roundstest',
        password: 'password123',
        employee: new mongoose.Types.ObjectId()
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      expect(userWithPassword.password).toBeDefined();

      if (originalRounds) {
        process.env.BCRYPT_ROUNDS = originalRounds;
      } else {
        delete process.env.BCRYPT_ROUNDS;
      }
    });
  });

  describe('comparePassword method', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'correctPassword';
      const user = await User.create({
        username: 'comparetest',
        password: plainPassword,
        employee: new mongoose.Types.ObjectId()
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword(plainPassword);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = await User.create({
        username: 'wrongpasstest',
        password: 'correctPassword',
        employee: new mongoose.Types.ObjectId()
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword('wrongPassword');

      expect(isMatch).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const user = await User.create({
        username: 'casetest',
        password: 'MyPassword',
        employee: new mongoose.Types.ObjectId()
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword('mypassword');

      expect(isMatch).toBe(false);
    });

    it('should handle empty string password', async () => {
      const user = await User.create({
        username: 'emptytest',
        password: 'actualPassword',
        employee: new mongoose.Types.ObjectId()
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword('');

      expect(isMatch).toBe(false);
    });
  });

  describe('updateRefreshToken method', () => {
    it('should update refresh token', async () => {
      const user = await User.create({
        username: 'tokentest',
        password: 'password123',
        employee: new mongoose.Types.ObjectId()
      });

      const newToken = 'new.refresh.token';
      await user.updateRefreshToken(newToken);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.refreshToken).toBe(newToken);
    });

    it('should update updatedAt timestamp', async () => {
      const user = await User.create({
        username: 'timestamptest',
        password: 'password123',
        employee: new mongoose.Types.ObjectId()
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      await user.updateRefreshToken('new.token');
      const updatedUser = await User.findById(user._id);

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should handle null token', async () => {
      const user = await User.create({
        username: 'nulltoken',
        password: 'password123',
        employee: new mongoose.Types.ObjectId()
      });

      await user.updateRefreshToken('initial.token');
      await user.updateRefreshToken(null);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.refreshToken).toBeNull();
    });
  });

  describe('Password field exclusion', () => {
    it('should not include password in queries by default', async () => {
      await User.create({
        username: 'excludetest',
        password: 'secretPassword',
        employee: new mongoose.Types.ObjectId()
      });

      const user = await User.findOne({ username: 'excludetest' });

      expect(user).toBeDefined();
      expect(user.password).toBeUndefined();
    });

    it('should include password when explicitly selected', async () => {
      await User.create({
        username: 'selecttest',
        password: 'secretPassword',
        employee: new mongoose.Types.ObjectId()
      });

      const user = await User.findOne({ username: 'selecttest' }).select('+password');

      expect(user.password).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have index on username', async () => {
      const indexes = await User.collection.getIndexes();
      
      const hasUsernameIndex = Object.keys(indexes).some(key => 
        key.includes('username')
      );

      expect(hasUsernameIndex).toBe(true);
    });

    it('should have index on employee', async () => {
      const indexes = await User.collection.getIndexes();
      
      const hasEmployeeIndex = Object.keys(indexes).some(key => 
        key.includes('employee')
      );

      expect(hasEmployeeIndex).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete user lifecycle', async () => {
      // Create user
      const user = await User.create({
        username: 'lifecycle',
        password: 'initial',
        employee: new mongoose.Types.ObjectId()
      });

      expect(user._id).toBeDefined();

      // Update refresh token
      await user.updateRefreshToken('refresh.token.123');
      
      // Verify password
      const userWithPass = await User.findById(user._id).select('+password');
      const isValid = await userWithPass.comparePassword('initial');
      expect(isValid).toBe(true);

      // Update password
      userWithPass.password = 'newpassword';
      await userWithPass.save();

      // Verify new password
      const finalUser = await User.findById(user._id).select('+password');
      const isNewValid = await finalUser.comparePassword('newpassword');
      expect(isNewValid).toBe(true);

      // Verify token persists
      expect(finalUser.refreshToken).toBe('refresh.token.123');
    });
  });
});