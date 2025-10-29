/**
 * @fileoverview Vendor model schema
 * @module models/Vendor
 */

const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  transactions: [{
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
  collection: 'vendors'
});

// Index on name for faster queries
vendorSchema.index({ name: 1 });

/**
 * Get vendor transaction history within date range
 * @param {Date} startDate - Start date for transactions
 * @param {Date} endDate - End date for transactions
 * @returns {Promise<Array>} Array of transactions
 */
vendorSchema.methods.getLedger = async function (startDate, endDate) {
  const Transaction = mongoose.model('Transaction');
  
  return await Transaction.find({
    'reference.refId': this._id,
    'reference.refType': 'vendor',
    createdAt: { $gte: startDate, $lte: endDate }
  }).sort({ createdAt: -1 });
};

/**
 * Calculate outstanding balance for vendor
 * @returns {Promise<number>} Outstanding balance
 */
vendorSchema.methods.getOutstandingBalance = async function () {
  const Transaction = mongoose.model('Transaction');
  
  const balance = await Transaction.aggregate([
    {
      $match: {
        'reference.refId': this._id,
        'reference.refType': 'vendor'
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Calculate: purchases (debit) - payments (credit)
  let total = 0;
  balance.forEach(item => {
    if (item._id === 'purchase' || item._id === 'debit') {
      total += item.total;
    } else if (item._id === 'payment' || item._id === 'credit') {
      total -= item.total;
    }
  });

  return total;
};

// Update the updatedAt timestamp before saving
vendorSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;

