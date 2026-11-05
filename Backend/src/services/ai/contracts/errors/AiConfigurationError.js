/**
 * @file AiConfigurationError.js
 * @description Raised on invalid parameters, missing credentials, or invalid model settings (HTTP 400).
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiConfigurationError extends AiError {
  constructor(message = "Invalid AI provider configuration", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.CONFIGURATION_ERROR,
      statusCode: 400,
      publicMessage: "Invalid AI provider configuration or missing required parameters.",
      isOperational: false,
      ...options,
    });
  }
}

module.exports = { AiConfigurationError };
