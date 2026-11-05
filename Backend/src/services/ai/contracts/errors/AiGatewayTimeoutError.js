/**
 * @file AiGatewayTimeoutError.js
 * @description Raised when upstream reverse proxy/gateway returns HTTP 504.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiGatewayTimeoutError extends AiError {
  constructor(message = "Upstream AI gateway timed out", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.GATEWAY_TIMEOUT,
      statusCode: 504,
      publicMessage: "The upstream AI provider gateway timed out.",
      ...options,
    });
  }
}

module.exports = { AiGatewayTimeoutError };
