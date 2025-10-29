/**
 * @fileoverview Joi validation schema for Transaction
 * @module schemas/transactionSchema
 */

const Joi = require('joi');

/**
 * Schema for creating transaction
 */
const createTransactionSchema = Joi.object({
  amount: Joi.number().required().positive().strict(),
  type: Joi.string().valid('credit', 'debit', 'refund', 'purchase', 'transfer').required(),
  debitAccount: Joi.object({
    accountType: Joi.string().required(),
    accountId: Joi.string().required()
  }).required(),
  creditAccount: Joi.object({
    accountType: Joi.string().required(),
    accountId: Joi.string().required()
  }).required(),
  reference: Joi.object({
    refType: Joi.string().valid('employee', 'branch', 'vendor').required(),
    refId: Joi.string().required()
  }).required(),
  description: Joi.string().optional().allow('', null),
  metadata: Joi.object().optional()
});

/**
 * Schema for updating transaction
 */
const updateTransactionSchema = Joi.object({
  description: Joi.string().optional().allow('', null),
  metadata: Joi.object().optional()
});

/**
 * Schema for approving transaction
 */
const approveTransactionSchema = Joi.object({
  approverId: Joi.string().required()
});

/**
 * Schema for rejecting transaction
 */
const rejectTransactionSchema = Joi.object({
  approverId: Joi.string().required(),
  reason: Joi.string().required().min(1).max(500)
});

/**
 * Schema for recording expense
 */
const recordExpenseSchema = Joi.object({
  amount: Joi.number().required().positive().strict(),
  description: Joi.string().required().min(1).max(1000),
  debitAccount: Joi.object({
    accountType: Joi.string().required(),
    accountId: Joi.string().required()
  }).required(),
  creditAccount: Joi.object({
    accountType: Joi.string().required(),
    accountId: Joi.string().required()
  }).required(),
  vendorId: Joi.string().optional(),
  metadata: Joi.object().optional()
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  approveTransactionSchema,
  rejectTransactionSchema,
  recordExpenseSchema
};

