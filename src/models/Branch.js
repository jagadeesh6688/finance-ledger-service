/**
 * @fileoverview Branch model schema
 * @module models/Branch
 */

const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  employees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
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
  collection: 'branches'
});

// Indexes for faster queries
branchSchema.index({ name: 1 });
branchSchema.index({ organization: 1 });

/**
 * Add an employee to the branch
 * @param {mongoose.Types.ObjectId} employeeId - Employee ID to add
 * @returns {Promise<void>} Resolves when employee is added
 */
branchSchema.methods.addEmployee = async function (employeeId) {
  if (!this.employees.includes(employeeId)) {
    this.employees.push(employeeId);
    await this.save();
  }
};

/**
 * Get all employees in the branch
 * @returns {Promise<Array>} Array of employees
 */
branchSchema.methods.getEmployees = async function () {
  return await this
    .populate('employees')
    .execPopulate()
    .then(branch => branch.employees);
};

// Update the updatedAt timestamp before saving
branchSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;

