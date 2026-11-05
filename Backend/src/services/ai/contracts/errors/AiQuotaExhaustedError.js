/**
 * @file AiQuotaExhaustedError.js
 * @description Raised when provider returns HTTP 429 for daily/credit quota exhaustion.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiQuotaExhaustedError extends AiError {
  constructor(message = "AI service quota exhausted", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.QUOTA_EXHAUSTED,
      statusCode: 429,
      publicMessage: "AI service daily or credit quota has been exhausted.",
      ...options,
    });
  }
}

module.exports = { AiQuotaExhaustedError };
