/**
 * @file index.js (contracts/errors)
 * @description Barrel export for the normalized 14-class AI error taxonomy.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

const { AiError, AI_ERROR_CODES } = require("./AiError");
const { AiCancellationError } = require("./AiCancellationError");
const { AiTimeoutError } = require("./AiTimeoutError");
const { AiGatewayTimeoutError } = require("./AiGatewayTimeoutError");
const { AiBadGatewayError } = require("./AiBadGatewayError");
const { AiCapacityError } = require("./AiCapacityError");
const { AiRateLimitError } = require("./AiRateLimitError");
const { AiQuotaExhaustedError } = require("./AiQuotaExhaustedError");
const { AiNetworkError } = require("./AiNetworkError");
const { AiAuthenticationError } = require("./AiAuthenticationError");
const { AiConfigurationError } = require("./AiConfigurationError");
const { AiContextWindowExceededError } = require("./AiContextWindowExceededError");
const { AiModelFailureError } = require("./AiModelFailureError");
const { AiSchemaValidationError } = require("./AiSchemaValidationError");

module.exports = {
  AiError,
  AI_ERROR_CODES,
  AiCancellationError,
  AiTimeoutError,
  AiGatewayTimeoutError,
  AiBadGatewayError,
  AiCapacityError,
  AiRateLimitError,
  AiQuotaExhaustedError,
  AiNetworkError,
  AiAuthenticationError,
  AiConfigurationError,
  AiContextWindowExceededError,
  AiModelFailureError,
  AiSchemaValidationError,
};
