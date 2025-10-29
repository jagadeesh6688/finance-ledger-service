/**
 * @fileoverview Employee model schema
 * @module models/Employee
 */

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true
  },
  designation: {
    type: String,
    required: true,
    enum: ['Admin', 'BranchManager', 'Employee'],
    index: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  permissions: [{
    type: String,
    trim: true
  }],
  expenses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
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
  collection: 'employees'
});

// Indexes for faster queries
employeeSchema.index({ userId: 1 });
employeeSchema.index({ branch: 1 });
employeeSchema.index({ manager: 1 });
employeeSchema.index({ designation: 1 });

/**
 * Check if employee has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} True if employee has permission
 */
employeeSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

/**
 * Get all subordinates (direct reports)
 * @returns {Promise<Array>} Array of subordinate employees
 */
employeeSchema.methods.getSubordinates = async function () {
  return await mongoose.model('Employee').find({ manager: this._id });
};

/**
 * Get total expenses within date range
 * @param {Date} startDate - Start date for expenses
 * @param {Date} endDate - End date for expenses
 * @returns {Promise<number>} Total expenses amount
 */
employeeSchema.methods.getTotalExpenses = async function (startDate, endDate) {
  const Transaction = mongoose.model('Transaction');
  
  const expenses = await Transaction.aggregate([
    {
      $match: {
        'reference.refId': this._id,
        'reference.refType': 'employee',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  return expenses.length > 0 ? expenses[0].total : 0;
};

// Update the updatedAt timestamp before saving
employeeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;

