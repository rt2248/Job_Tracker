/**
 * @file RawProviderAssessmentOutput.dto.js
 * @description Raw provider output DTO separating transport telemetry from domain payload.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

/**
 * @typedef {Object} ProviderRateLimitTelemetry
 * @property {number|null} [limitRequests] - Request limit quota.
 * @property {number|null} [remainingRequests] - Remaining requests before window reset.
 * @property {number|null} [resetRequestsMs] - Milliseconds until request quota window resets.
 * @property {number|null} [limitTokens] - Token limit quota.
 * @property {number|null} [remainingTokens] - Remaining tokens before window reset.
 * @property {number|null} [resetTokensMs] - Milliseconds until token quota window resets.
 */

/**
 * @typedef {Object} ProviderTelemetryMetadata
 * @property {string} providerId - Identifier of the provider (e.g., "groq").
 * @property {string} modelIdentifier - Target model used (e.g., "openai/gpt-oss-120b").
 * @property {number} latencyMs - Execution round-trip latency in milliseconds.
 * @property {number|null} [inputTokens] - Prompt token count if reported by provider.
 * @property {number|null} [outputTokens] - Completion token count if reported by provider.
 * @property {number|null} [totalTokens] - Combined token count if reported by provider.
 * @property {ProviderRateLimitTelemetry|null} [rateLimit] - Extracted rate limit telemetry.
 */

/**
 * @typedef {Object} RawProviderAssessmentOutput
 * @property {Object} rawData - Parsed JSON object output from provider model gateway.
 * @property {ProviderTelemetryMetadata} telemetry - Separate transport and consumption metadata.
 */

/**
 * Creates a validated RawProviderAssessmentOutput DTO.
 * Guarantees that provider telemetry does not pollute raw assessment payload.
 *
 * @param {Object} params
 * @param {Object} params.rawData - Parsed raw JSON object from model.
 * @param {ProviderTelemetryMetadata} params.telemetry - Latency, tokens, and rate limits.
 * @returns {RawProviderAssessmentOutput}
 */
function createRawProviderAssessmentOutput({ rawData, telemetry }) {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    throw new TypeError("rawData must be a non-null object");
  }
  if (!telemetry || typeof telemetry !== "object" || Array.isArray(telemetry)) {
    throw new TypeError("telemetry must be a non-null object");
  }
  if (typeof telemetry.providerId !== "string" || telemetry.providerId.trim().length === 0) {
    throw new TypeError("telemetry.providerId must be a non-empty string");
  }
  if (typeof telemetry.modelIdentifier !== "string" || telemetry.modelIdentifier.trim().length === 0) {
    throw new TypeError("telemetry.modelIdentifier must be a non-empty string");
  }
  if (typeof telemetry.latencyMs !== "number" || telemetry.latencyMs < 0 || !Number.isFinite(telemetry.latencyMs)) {
    throw new TypeError("telemetry.latencyMs must be a non-negative finite number");
  }

  return {
    rawData,
    telemetry: {
      providerId: telemetry.providerId,
      modelIdentifier: telemetry.modelIdentifier,
      latencyMs: telemetry.latencyMs,
      inputTokens: typeof telemetry.inputTokens === "number" ? telemetry.inputTokens : null,
      outputTokens: typeof telemetry.outputTokens === "number" ? telemetry.outputTokens : null,
      totalTokens: typeof telemetry.totalTokens === "number" ? telemetry.totalTokens : null,
      rateLimit: telemetry.rateLimit && typeof telemetry.rateLimit === "object" ? { ...telemetry.rateLimit } : null,
    },
  };
}

module.exports = {
  createRawProviderAssessmentOutput,
};
