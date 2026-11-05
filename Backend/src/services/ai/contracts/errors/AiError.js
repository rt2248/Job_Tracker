/**
 * @file AiError.js
 * @description Base class for all normalized AI domain errors.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 *
 * Security Requirements:
 * 1. Safe public-facing serialization (toPublicJson): Never leaks raw upstream error messages,
 *    provider response bodies, credentials, stack traces, or internal diagnostic context.
 * 2. Diagnostic logging serialization (toDiagnosticJson): Captures internal debug context
 *    while scrubbing sensitive authorization headers or keys.
 */

const AI_ERROR_CODES = Object.freeze({
  UNKNOWN_ERROR: "AI_UNKNOWN_ERROR",
  CANCELLATION: "AI_CANCELLATION",
  TIMEOUT: "AI_TIMEOUT",
  GATEWAY_TIMEOUT: "AI_GATEWAY_TIMEOUT",
  BAD_GATEWAY: "AI_BAD_GATEWAY",
  CAPACITY_UNAVAILABLE: "AI_CAPACITY_UNAVAILABLE",
  RATE_LIMITED: "AI_RATE_LIMITED",
  QUOTA_EXHAUSTED: "AI_QUOTA_EXHAUSTED",
  NETWORK_ERROR: "AI_NETWORK_ERROR",
  AUTHENTICATION_ERROR: "AI_AUTHENTICATION_ERROR",
  CONFIGURATION_ERROR: "AI_CONFIGURATION_ERROR",
  CONTEXT_WINDOW_EXCEEDED: "AI_CONTEXT_WINDOW_EXCEEDED",
  MODEL_FAILURE: "AI_MODEL_FAILURE",
  SCHEMA_VALIDATION_ERROR: "AI_SCHEMA_VALIDATION_ERROR",
});

class AiError extends Error {
  /**
   * @param {string} message - Internal developer/diagnostic message.
   * @param {Object} [options]
   * @param {string} [options.code=AI_ERROR_CODES.UNKNOWN_ERROR] - Stable error code.
   * @param {number} [options.statusCode=500] - Corresponding HTTP status code.
   * @param {string|null} [options.providerId=null] - Target provider ID (e.g. "groq").
   * @param {Error|any} [options.originalError=null] - Caught upstream or system error.
   * @param {Object|null} [options.diagnosticContext=null] - Internal debug metadata (never exposed to clients).
   * @param {boolean} [options.isOperational=true] - True if operational/transient error; false if programmer bug.
   * @param {string|null} [options.publicMessage=null] - Safe message suitable for client display.
   */
  constructor(
    message,
    {
      code = AI_ERROR_CODES.UNKNOWN_ERROR,
      statusCode = 500,
      providerId = null,
      originalError = null,
      diagnosticContext = null,
      isOperational = true,
      publicMessage = null,
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.providerId = providerId || null;
    this.originalError = originalError || null;
    this.diagnosticContext = diagnosticContext ? { ...diagnosticContext } : null;
    this.isOperational = Boolean(isOperational);
    this.publicMessage = publicMessage || "An error occurred while processing the AI request.";

    // Ensure clean prototype and stack trace capture
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Sanitized public-facing serialization.
   * Guaranteed safe for client response: never leaks credentials, raw upstream responses, or stacks.
   *
   * @param {string} [correlationId] - Optional request tracing correlation ID.
   * @returns {{ error: { code: string, message: string, statusCode: number, correlationId?: string } }}
   */
  toPublicJson(correlationId) {
    const errorPayload = {
      code: this.code,
      message: this.publicMessage,
      statusCode: this.statusCode,
    };

    if (correlationId && typeof correlationId === "string" && correlationId.trim().length > 0) {
      errorPayload.correlationId = correlationId.trim();
    }

    return { error: errorPayload };
  }

  /**
   * Sanitized internal diagnostic serialization for secure server-side observability.
   * Scrubs API keys and authorization tokens before returning debug structure.
   *
   * @returns {Object}
   */
  toDiagnosticJson() {
    const scrubValue = (val) => {
      if (!val) return val;
      if (typeof val === "string") {
        return val
          .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, "Bearer [REDACTED]")
          .replace(/gsk_[A-Za-z0-9_-]+/gi, "[REDACTED_API_KEY]")
          .replace(/AIza[A-Za-z0-9_-]+/gi, "[REDACTED_API_KEY]");
      }
      return val;
    };

    return {
      name: this.name,
      code: this.code,
      message: scrubValue(this.message),
      statusCode: this.statusCode,
      providerId: this.providerId,
      isOperational: this.isOperational,
      diagnosticContext: this.diagnosticContext ? JSON.parse(scrubValue(JSON.stringify(this.diagnosticContext))) : null,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: scrubValue(this.originalError.message),
          }
        : null,
    };
  }
}

module.exports = {
  AiError,
  AI_ERROR_CODES,
};
