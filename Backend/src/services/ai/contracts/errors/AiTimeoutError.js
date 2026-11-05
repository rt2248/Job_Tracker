/**
 * @file AiTimeoutError.js
 * @description Raised when local execution boundary timeout expires (HTTP 504).
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiTimeoutError extends AiError {
  constructor(message = "AI operation timed out locally", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.TIMEOUT,
      statusCode: 504,
      publicMessage: "The AI operation timed out before completing.",
      ...options,
    });
  }
}

module.exports = { AiTimeoutError };
