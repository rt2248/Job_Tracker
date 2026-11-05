/**
 * @file IStreamingChatProvider.js
 * @description Vendor-neutral JSDoc structural contract for real-time streaming chat providers.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 * Providers that support conversational token streaming must structurally satisfy this contract.
 */

/**
 * @typedef {import('./IAiBaseProvider').IAiBaseProvider} IAiBaseProvider
 * @typedef {import('./IAiBaseProvider').ProviderCapabilities} ProviderCapabilities
 * @typedef {import('./IAiBaseProvider').EndpointAccessibilityCheck} EndpointAccessibilityCheck
 * @typedef {import('./dtos/ChatStreamRequest.dto').ChatStreamRequestDTO} ChatStreamRequestDTO
 * @typedef {import('./dtos/ChatStreamChunk.dto').ChatStreamChunkDTO} ChatStreamChunkDTO
 */

/**
 * @typedef {Object} IStreamingChatProvider
 * @property {string} providerId - Unique provider identifier.
 * @property {string} modelIdentifier - Target model identifier.
 * @property {ProviderCapabilities} capabilities - Matrix of supported capabilities (capabilities.streamingChat === true).
 * @property {() => Promise<EndpointAccessibilityCheck>} verifyAccessibility - Non-generation health check.
 * @property {(request: ChatStreamRequestDTO) => AsyncIterable<ChatStreamChunkDTO>} streamChat - Opens an asynchronous iterable stream of token chunks.
 */

module.exports = {};
