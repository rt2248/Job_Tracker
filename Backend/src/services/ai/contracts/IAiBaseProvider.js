/**
 * @file IAiBaseProvider.js
 * @description Vendor-neutral JSDoc structural contract for core AI providers.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 * All providers must structurally satisfy this base contract.
 */

/**
 * @typedef {Object} ProviderCapabilities
 * @property {boolean} structuredAssessment - Indicates support for native or schema-constrained JSON assessment generation.
 * @property {boolean} streamingChat - Indicates support for real-time conversational token streaming over SSE.
 * @property {boolean} nativeThinking - Indicates model supports internal reasoning / chain-of-thought tokens.
 */

/**
 * @typedef {Object} EndpointAccessibilityCheck
 * @property {boolean} isAccessible - True if network handshake succeeded and credentials were authenticated.
 * @property {string} providerId - Provider identifier (e.g., "groq", "gemini_vertex").
 * @property {string} modelIdentifier - Target model ID (e.g., "openai/gpt-oss-120b").
 * @property {number} latencyMs - Round-trip latency in milliseconds.
 * @property {string|null} error - Sanitized diagnostic error message if inaccessible.
 */

/**
 * @typedef {Object} IAiBaseProvider
 * @property {string} providerId - Unique provider identifier (e.g., "groq").
 * @property {string} modelIdentifier - Target model identifier (e.g., "openai/gpt-oss-120b").
 * @property {ProviderCapabilities} capabilities - Matrix of supported capabilities.
 * @property {() => Promise<EndpointAccessibilityCheck>} verifyAccessibility - Non-generation health check verifying endpoint reachability and credentials.
 */

module.exports = {};
