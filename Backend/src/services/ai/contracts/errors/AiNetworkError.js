/**
 * @file AiNetworkError.js
 * @description Raised on TCP/TLS socket disconnect, DNS resolution failure, or connection reset.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiNetworkError extends AiError {
  constructor(message = "Network communication error with AI provider", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.NETWORK_ERROR,
      statusCode: 502,
      publicMessage: "A network communication error occurred with the AI provider.",
      ...options,
    });
  }
}

module.exports = { AiNetworkError };
