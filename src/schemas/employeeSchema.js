/**
 * @fileoverview Joi validation schema for Employee
 * @module schemas/employeeSchema
 */

const Joi = require('joi');

/**
 * Schema for creating employee
 */
const createEmployeeSchema = Joi.object({
  userId: Joi.string().required().trim().min(1).max(100),
  name: Joi.string().required().trim().min(1).max(255),
  branch: Joi.string().required(),
  designation: Joi.string().valid('Admin', 'BranchManager', 'Employee').required(),
  manager: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
  expenses: Joi.array().items(Joi.string()).optional()
});

/**
 * Schema for updating employee
 */
const updateEmployeeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  designation: Joi.string().valid('Admin', 'BranchManager', 'Employee').optional(),
  manager: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).optional()
});

/**
 * Schema for updating permissions
 */
const updatePermissionsSchema = Joi.object({
  permissions: Joi.array().items(Joi.string()).required()
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  updatePermissionsSchema
};

