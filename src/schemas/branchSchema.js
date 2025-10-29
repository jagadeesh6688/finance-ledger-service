/**
 * @fileoverview Joi validation schema for Branch
 * @module schemas/branchSchema
 */

const Joi = require('joi');

/**
 * Schema for creating branch
 */
const createBranchSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(255),
  organization: Joi.string().required(),
  manager: Joi.string().optional(),
  employees: Joi.array().items(Joi.string()).optional()
});

/**
 * Schema for updating branch
 */
const updateBranchSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  manager: Joi.string().optional(),
  employees: Joi.array().items(Joi.string()).optional()
});

/**
 * Schema for assigning manager
 */
const assignManagerSchema = Joi.object({
  employeeId: Joi.string().required()
});

module.exports = {
  createBranchSchema,
  updateBranchSchema,
  assignManagerSchema
};

