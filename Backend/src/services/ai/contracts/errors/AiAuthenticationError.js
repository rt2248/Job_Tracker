/**
 * @file AiAuthenticationError.js
 * @description Raised on HTTP 401/403 invalid API keys or unauthorized access.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiAuthenticationError extends AiError {
  constructor(message = "AI provider authentication failed", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.AUTHENTICATION_ERROR,
      statusCode: 401,
      publicMessage: "AI provider authentication failed. Please verify API configuration.",
      ...options,
    });
  }
}

module.exports = { AiAuthenticationError };
