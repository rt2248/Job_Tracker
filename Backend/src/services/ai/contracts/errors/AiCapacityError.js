/**
 * @file AiCapacityError.js
 * @description Raised when upstream model is overloaded or returns HTTP 503 Capacity Unavailable.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiCapacityError extends AiError {
  constructor(message = "AI provider capacity currently unavailable", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.CAPACITY_UNAVAILABLE,
      statusCode: 503,
      publicMessage: "The AI provider is temporarily overloaded or unavailable. Please try again shortly.",
      ...options,
    });
  }
}

module.exports = { AiCapacityError };
