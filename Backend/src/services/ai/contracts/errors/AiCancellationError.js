/**
 * @file AiCancellationError.js
 * @description Raised when an AI operation is aborted by the caller AbortSignal (HTTP 499).
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiCancellationError extends AiError {
  constructor(message = "AI operation was cancelled by caller", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.CANCELLATION,
      statusCode: 499,
      publicMessage: "The AI operation was cancelled by the client.",
      ...options,
    });
  }
}

module.exports = { AiCancellationError };
