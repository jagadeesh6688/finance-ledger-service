/**
 * @fileoverview Joi validation schema for Vendor
 * @module schemas/vendorSchema
 */

const Joi = require('joi');

/**
 * Schema for creating vendor
 */
const createVendorSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(255),
  contactInfo: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional().pattern(/^[\d\s\-+()]+$/),
    address: Joi.string().optional()
  }).optional(),
  transactions: Joi.array().items(Joi.string()).optional()
});

/**
 * Schema for updating vendor
 */
const updateVendorSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  contactInfo: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional().pattern(/^[\d\s\-+()]+$/),
    address: Joi.string().optional()
  }).optional()
});

module.exports = {
  createVendorSchema,
  updateVendorSchema
};

