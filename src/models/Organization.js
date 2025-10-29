/**
 * @fileoverview Organization model schema
 * @module models/Organization
 */

const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  branches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }],
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
  collection: 'organizations'
});

// Index on name for faster queries
organizationSchema.index({ name: 1 });

/**
 * Add a branch to the organization
 * @param {mongoose.Types.ObjectId} branchId - Branch ID to add
 * @returns {Promise<void>} Resolves when branch is added
 */
organizationSchema.methods.addBranch = async function (branchId) {
  if (!this.branches.includes(branchId)) {
    this.branches.push(branchId);
    await this.save();
  }
};

/**
 * Get full organization details with populated branches
 * @returns {Promise<Object>} Organization with populated branches
 */
organizationSchema.methods.getDetails = async function () {
  return await this
    .populate({
      path: 'branches',
      populate: {
        path: 'manager',
        select: 'name designation'
      }
    })
    .execPopulate();
};

// Update the updatedAt timestamp before saving
organizationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;

