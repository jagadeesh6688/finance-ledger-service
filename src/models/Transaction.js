/**
 * @fileoverview Transaction model with double-entry bookkeeping
 * @module models/Transaction
 */

const mongoose = require("mongoose");
const logger = require("../config/logger");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      required: true,
      enum: ["credit", "debit", "refund", "purchase", "transfer"],
      index: true,
    },
    debitAccount: {
      accountType: {
        type: String,
        required: true,
      },
      accountId: {
        type: String,
        required: true,
      },
    },
    creditAccount: {
      accountType: {
        type: String,
        required: true,
      },
      accountId: {
        type: String,
        required: true,
      },
    },
    reference: {
      refType: {
        type: String,
        enum: ["employee", "branch", "vendor"],
        required: true,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
      },
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    linkedTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "transactions",
  }
);

// Indexes for faster queries
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ "reference.refId": 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });

/**
 * Approve the transaction
 * @param {mongoose.Types.ObjectId} approverId - Employee who approves
 * @returns {Promise<void>} Resolves when approved
 */
transactionSchema.methods.approve = async function (approverId) {
  this.status = "approved";
  this.approvedBy = approverId;
  this.updatedAt = Date.now();
  await this.save();

  logger.info(`Transaction ${this.transactionId} approved by ${approverId}`);
};

/**
 * Reject the transaction with a reason
 * @param {mongoose.Types.ObjectId} approverId - Employee who rejects
 * @param {string} reason - Reason for rejection
 * @returns {Promise<void>} Resolves when rejected
 */
transactionSchema.methods.reject = async function (approverId, reason) {
  this.status = "rejected";
  this.approvedBy = approverId;
  this.metadata = { ...this.metadata, rejectionReason: reason };
  this.updatedAt = Date.now();
  await this.save();

  logger.info(
    `Transaction ${this.transactionId} rejected by ${approverId}: ${reason}`
  );
};

/**
 * Create a linked double-entry transaction
 * @param {Object} partnerTransaction - Partner transaction data
 * @returns {Promise<Object>} Created partner transaction
 */
transactionSchema.methods.createDoubleEntry = async function (
  partnerTransaction
) {
  const Transaction = mongoose.model("Transaction");

  // Create the partner transaction
  const partner = new Transaction({
    ...partnerTransaction,
    linkedTransaction: this._id,
    transactionId: `TX-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
  });

  await partner.save();

  // Link back to this transaction
  this.linkedTransaction = partner._id;
  await this.save();

  logger.info(
    `Double-entry created: ${this.transactionId} <-> ${partner.transactionId}`
  );

  return partner;
};

// Update the updatedAt timestamp before saving
transactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
