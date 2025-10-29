/**
 * @fileoverview Centralized input validation utilities
 * @module handles/validation
 */

const Joi = require("joi");
const mongoose = require("mongoose");
const logger = require("../config/logger");
const { ValidationError } = require("./errors");

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId
 */
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate input data against Joi schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema
 * @returns {Promise<Object>} Validated data
 */
const validateInput = async (data, schema) => {
  try {
    const { error, value } = await schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details
        .map((detail) => detail.message)
        .join(", ");
      logger.warn("Validation failed:", errorMessages);
      throw new ValidationError(errorMessages);
    }

    return value;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Validation error:", error);
    throw new ValidationError("Input validation failed");
  }
};

/**
 * Sanitize input data
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
const sanitizeInput = (data) => {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      sanitized[key] = value.trim();
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

module.exports = {
  validateObjectId,
  validateInput,
  sanitizeInput,
};
