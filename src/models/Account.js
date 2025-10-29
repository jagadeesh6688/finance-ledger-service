/**
 * @fileoverview Account model for chart of accounts
 * @module models/Account
 */

const mongoose = require("mongoose");
const logger = require("../config/logger");

const accountSchema = new mongoose.Schema(
  {
    accountCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      required: true,
      enum: ["asset", "liability", "equity", "revenue", "expense"],
      index: true,
    },
    parentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    balance: {
      type: Number,
      default: 0,
    },
    entity: {
      entityType: {
        type: String,
        enum: ["employee", "branch", "vendor", "organization"],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "accounts",
  }
);

// Indexes for faster queries
accountSchema.index({ accountCode: 1 });
accountSchema.index({ "entity.entityId": 1 });
accountSchema.index({ accountType: 1 });

/**
 * Update account balance
 * @param {number} amount - Amount to add/subtract
 * @param {string} operation - 'debit' or 'credit'
 * @returns {Promise<void>} Resolves when balance is updated
 */
accountSchema.methods.updateBalance = async function (amount, operation) {
  if (operation === "debit") {
    // For asset and expense accounts, debits increase balance
    if (["asset", "expense"].includes(this.accountType)) {
      this.balance += amount;
    } else {
      // For liability, equity, and revenue accounts, debits decrease balance
      this.balance -= amount;
    }
  } else if (operation === "credit") {
    // Credits work opposite of debits
    if (["asset", "expense"].includes(this.accountType)) {
      this.balance -= amount;
    } else {
      this.balance += amount;
    }
  }

  this.updatedAt = Date.now();
  await this.save();

  logger.debug(`Account ${this.accountCode} balance updated: ${this.balance}`);
};

/**
 * Get current balance
 * @returns {number} Current balance
 */
accountSchema.methods.getBalance = function () {
  return this.balance;
};

/**
 * Get transaction ledger within date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of transactions
 */
accountSchema.methods.getLedger = async function (startDate, endDate) {
  const Transaction = mongoose.model("Transaction");

  return await Transaction.find({
    $or: [
      { "debitAccount.accountId": this._id.toString() },
      { "creditAccount.accountId": this._id.toString() },
    ],
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .sort({ createdAt: -1 })
    .populate("approvedBy", "name designation");
};

// Update the updatedAt timestamp before saving
accountSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
