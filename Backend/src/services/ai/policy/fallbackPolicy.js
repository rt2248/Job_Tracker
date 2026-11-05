/**
 * @file fallbackPolicy.js
 * @description Policy definitions and helpers for AI error fallback eligibility and circuit-breaker accounting.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 *
 * Architecture Invariants:
 * 1. Fallback execution belongs to the application domain orchestrator (CareerStrategistService in Milestone 2B.4),
 *    NEVER inside provider adapters.
 * 2. Operational provider issues (rate limits, capacity, timeouts, network drops) are eligible for deterministic heuristics fallback.
 * 3. Client cancellations, bugs, schema drift, and configuration errors are STRICTLY FORBIDDEN from triggering fallback.
 * 4. Circuit breaker accounting evaluates failure per logical provider operation (not per transport attempt).
 *    Client cancellations, authentication bugs, and configuration errors do NOT count as breaker operational failures.
 */

const { AI_ERROR_CODES } = require("../contracts/errors/AiError");

/**
 * Error codes that are eligible to trigger deterministic pipeline heuristics fallback.
 */
const FALLBACK_ELIGIBLE_ERROR_CODES = Object.freeze([
  AI_ERROR_CODES.RATE_LIMITED,
  AI_ERROR_CODES.QUOTA_EXHAUSTED,
  AI_ERROR_CODES.CAPACITY_UNAVAILABLE,
  AI_ERROR_CODES.BAD_GATEWAY,
  AI_ERROR_CODES.GATEWAY_TIMEOUT,
  AI_ERROR_CODES.TIMEOUT,
  AI_ERROR_CODES.NETWORK_ERROR,
]);

/**
 * Error codes that MUST NOT trigger fallback under any circumstances.
 * These errors must throw or propagate directly to the caller.
 */
const FALLBACK_FORBIDDEN_ERROR_CODES = Object.freeze([
  AI_ERROR_CODES.CANCELLATION,
  AI_ERROR_CODES.AUTHENTICATION_ERROR,
  AI_ERROR_CODES.CONFIGURATION_ERROR,
  AI_ERROR_CODES.CONTEXT_WINDOW_EXCEEDED,
  AI_ERROR_CODES.MODEL_FAILURE,
  AI_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
]);

/**
 * Evaluates whether a given error qualifies for graceful fallback degradation.
 *
 * @param {any} error - Caught error instance.
 * @returns {boolean} True if fallback is permitted; false if error must throw.
 */
function isFallbackEligible(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorCode = error.code;
  if (!errorCode) {
    return false;
  }

  // Explicitly check forbidden list first
  if (FALLBACK_FORBIDDEN_ERROR_CODES.includes(errorCode)) {
    return false;
  }

  return FALLBACK_ELIGIBLE_ERROR_CODES.includes(errorCode);
}

/**
 * Evaluates whether an error counts toward circuit breaker consecutive failure accounting.
 *
 * Circuit Breaker Accounting Policy:
 * - Counted as ONE failure per logical provider operation (not per internal transport attempt).
 * - Excludes client cancellations (AI_CANCELLATION — client aborted, not provider outage).
 * - Excludes authentication bugs (AI_AUTHENTICATION_ERROR — bad API key, not transient outage).
 * - Excludes configuration bugs (AI_CONFIGURATION_ERROR — developer bug).
 * - Excludes context length bugs (AI_CONTEXT_WINDOW_EXCEEDED — input bug).
 * - Excludes schema validation bugs (AI_SCHEMA_VALIDATION_ERROR — model drift, handled separately).
 * - Includes transient operational errors: CAPACITY_UNAVAILABLE, BAD_GATEWAY, GATEWAY_TIMEOUT, NETWORK_ERROR.
 *
 * @param {any} error - Caught error instance.
 * @returns {boolean} True if error trips circuit breaker threshold; false otherwise.
 */
function countsTowardsCircuitBreaker(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorCode = error.code;
  if (!errorCode) {
    return false;
  }

  // Non-operational errors that must NEVER trip the circuit breaker
  const excludedFromBreaker = [
    AI_ERROR_CODES.CANCELLATION,
    AI_ERROR_CODES.AUTHENTICATION_ERROR,
    AI_ERROR_CODES.CONFIGURATION_ERROR,
    AI_ERROR_CODES.CONTEXT_WINDOW_EXCEEDED,
    AI_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
  ];

  if (excludedFromBreaker.includes(errorCode)) {
    return false;
  }

  // Operational provider outages that indicate provider unavailability
  const tripsBreaker = [
    AI_ERROR_CODES.CAPACITY_UNAVAILABLE,
    AI_ERROR_CODES.BAD_GATEWAY,
    AI_ERROR_CODES.GATEWAY_TIMEOUT,
    AI_ERROR_CODES.NETWORK_ERROR,
  ];

  return tripsBreaker.includes(errorCode);
}

module.exports = {
  FALLBACK_ELIGIBLE_ERROR_CODES,
  FALLBACK_FORBIDDEN_ERROR_CODES,
  isFallbackEligible,
  countsTowardsCircuitBreaker,
};
