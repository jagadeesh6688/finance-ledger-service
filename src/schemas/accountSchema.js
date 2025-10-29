/**
 * @fileoverview Joi validation schema for Account
 * @module schemas/accountSchema
 */

const Joi = require('joi');

/**
 * Schema for creating account
 */
const createAccountSchema = Joi.object({
  accountCode: Joi.string().required().trim().min(1).max(50),
  accountName: Joi.string().required().trim().min(1).max(255),
  accountType: Joi.string().valid('asset', 'liability', 'equity', 'revenue', 'expense').required(),
  parentAccount: Joi.string().optional(),
  balance: Joi.number().default(0).optional(),
  entity: Joi.object({
    entityType: Joi.string().valid('employee', 'branch', 'vendor', 'organization').required(),
    entityId: Joi.string().required()
  }).optional()
});

/**
 * Schema for updating account
 */
const updateAccountSchema = Joi.object({
  accountName: Joi.string().trim().min(1).max(255).optional(),
  balance: Joi.number().optional(),
  parentAccount: Joi.string().optional(),
  entity: Joi.object({
    entityType: Joi.string().valid('employee', 'branch', 'vendor', 'organization').optional(),
    entityId: Joi.string().optional()
  }).optional()
});

module.exports = {
  createAccountSchema,
  updateAccountSchema
};

