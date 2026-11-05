/**
 * @file AiSchemaValidationError.js
 * @description Raised when model output violates Ajv JSON Schema or independent deterministic evidence grounding (HTTP 422).
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");

class AiSchemaValidationError extends AiError {
  constructor(message = "AI output failed schema validation or evidence grounding", options = {}) {
    super(message, {
      code: AI_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
      statusCode: 422,
      publicMessage: "The AI output failed schema validation or independent evidence grounding.",
      isOperational: false,
      ...options,
    });
  }
}

module.exports = { AiSchemaValidationError };
