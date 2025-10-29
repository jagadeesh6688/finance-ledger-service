/**
 * @fileoverview User model schema for authentication
 * @module models/User
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    select: false // Don't include password in queries by default
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  refreshToken: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Index on username and employee for faster queries
userSchema.index({ username: 1 });
userSchema.index({ employee: 1 });

/**
 * Hash password before saving
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '10'));
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password with hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Update refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<void>} Resolves when token is updated
 */
userSchema.methods.updateRefreshToken = async function (token) {
  this.refreshToken = token;
  this.updatedAt = Date.now();
  await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;

