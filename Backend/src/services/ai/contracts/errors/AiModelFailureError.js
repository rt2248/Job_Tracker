/**
 * @file AiModelFailureError.js
 * @description Raised when provider returns unparseable non-JSON, truncated payload, or malformed SSE (HTTP 502).
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiModelFailureError extends AiError {
  constructor(message = "AI provider produced unparseable or corrupted response", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.MODEL_FAILURE,
      statusCode: 502,
      publicMessage: "The AI provider produced an unparseable or corrupted response.",
      isOperational: false,
      ...options,
    });
  }
}

module.exports = { AiModelFailureError };
