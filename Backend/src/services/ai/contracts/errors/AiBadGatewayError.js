/**
 * @file AiBadGatewayError.js
 * @description Raised when upstream gateway returns HTTP 502 or invalid response.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiBadGatewayError extends AiError {
  constructor(message = "Upstream AI provider returned bad gateway response", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.BAD_GATEWAY,
      statusCode: 502,
      publicMessage: "The upstream AI provider returned an invalid or unreachable response.",
      ...options,
    });
  }
}

module.exports = { AiBadGatewayError };
