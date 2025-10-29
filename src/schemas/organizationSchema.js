/**
 * @fileoverview Joi validation schema for Organization
 * @module schemas/organizationSchema
 */

const Joi = require('joi');

/**
 * Schema for creating organization
 */
const createOrganizationSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(255),
  branches: Joi.array().items(Joi.string().optional()).optional()
});

/**
 * Schema for updating organization
 */
const updateOrganizationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  branches: Joi.array().items(Joi.string()).optional()
});

module.exports = {
  createOrganizationSchema,
  updateOrganizationSchema
};

