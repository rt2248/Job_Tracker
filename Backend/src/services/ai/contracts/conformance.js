/**
 * @file conformance.js
 * @description Zero-dependency runtime capability and structural conformance assertion helpers.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 * Enforces structural duck-typing for AI provider candidates without runtime inheritance classes.
 */

/**
 * Asserts whether a candidate object structurally satisfies IAiBaseProvider.
 *
 * @param {any} candidate - Object to inspect.
 * @returns {boolean} True if candidate satisfies the base provider contract.
 */
function isAiBaseProvider(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return false;
  }

  const hasValidProviderId =
    typeof candidate.providerId === "string" && candidate.providerId.trim().length > 0;
  const hasValidModelId =
    typeof candidate.modelIdentifier === "string" && candidate.modelIdentifier.trim().length > 0;
  const hasValidCapabilities =
    candidate.capabilities !== null &&
    typeof candidate.capabilities === "object" &&
    !Array.isArray(candidate.capabilities);
  const hasVerifyAccessibility = typeof candidate.verifyAccessibility === "function";

  return hasValidProviderId && hasValidModelId && hasValidCapabilities && hasVerifyAccessibility;
}

/**
 * Asserts whether a candidate object structurally satisfies IStructuredAssessmentProvider.
 *
 * @param {any} candidate - Object to inspect.
 * @returns {boolean} True if candidate satisfies the structured assessment provider contract.
 */
function isStructuredAssessmentProvider(candidate) {
  if (!isAiBaseProvider(candidate)) {
    return false;
  }

  const supportsStructuredAssessment = candidate.capabilities.structuredAssessment === true;
  const hasGenerateAssessment = typeof candidate.generateAssessment === "function";

  return supportsStructuredAssessment && hasGenerateAssessment;
}

/**
 * Asserts whether a candidate object structurally satisfies IStreamingChatProvider.
 *
 * @param {any} candidate - Object to inspect.
 * @returns {boolean} True if candidate satisfies the streaming chat provider contract.
 */
function isStreamingChatProvider(candidate) {
  if (!isAiBaseProvider(candidate)) {
    return false;
  }

  const supportsStreamingChat = candidate.capabilities.streamingChat === true;
  const hasStreamChat = typeof candidate.streamChat === "function";

  return supportsStreamingChat && hasStreamChat;
}

module.exports = {
  isAiBaseProvider,
  isStructuredAssessmentProvider,
  isStreamingChatProvider,
};
