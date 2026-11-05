/**
 * @file AiRateLimitError.js
 * @description Raised when provider returns HTTP 429 for transient RPM/TPM rate limits.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiRateLimitError extends AiError {
  constructor(message = "AI service rate limit exceeded", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.RATE_LIMITED,
      statusCode: 429,
      publicMessage: "AI service rate limit exceeded. Please retry after a brief pause.",
      ...options,
    });
  }
}

module.exports = { AiRateLimitError };
