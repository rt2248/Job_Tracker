/**
 * @file AiContextWindowExceededError.js
 * @description Raised when prompt tokens exceed model's supported context window (HTTP 400).
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiContextWindowExceededError extends AiError {
  constructor(message = "Prompt exceeds model context window", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.CONTEXT_WINDOW_EXCEEDED,
      statusCode: 400,
      publicMessage: "The prompt token size exceeds the model's supported context window.",
      isOperational: false,
      ...options,
    });
  }
}

module.exports = { AiContextWindowExceededError };
