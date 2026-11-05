/**
 * @file IStructuredAssessmentProvider.js
 * @description Vendor-neutral JSDoc structural contract for structured assessment providers.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 * Providers that generate structured career strategy assessments must structurally satisfy this contract.
 */

/**
 * @typedef {import('./IAiBaseProvider').IAiBaseProvider} IAiBaseProvider
 * @typedef {import('./IAiBaseProvider').ProviderCapabilities} ProviderCapabilities
 * @typedef {import('./IAiBaseProvider').EndpointAccessibilityCheck} EndpointAccessibilityCheck
 * @typedef {import('./dtos/CareerAssessmentRequest.dto').CareerAssessmentRequestDTO} CareerAssessmentRequestDTO
 * @typedef {import('./dtos/RawProviderAssessmentOutput.dto').RawProviderAssessmentOutput} RawProviderAssessmentOutput
 */

/**
 * @typedef {Object} IStructuredAssessmentProvider
 * @property {string} providerId - Unique provider identifier.
 * @property {string} modelIdentifier - Target model identifier.
 * @property {ProviderCapabilities} capabilities - Matrix of supported capabilities (capabilities.structuredAssessment === true).
 * @property {() => Promise<EndpointAccessibilityCheck>} verifyAccessibility - Non-generation health check.
 * @property {(request: CareerAssessmentRequestDTO) => Promise<RawProviderAssessmentOutput>} generateAssessment - Dispatches a structured career assessment inference request.
 */

module.exports = {};
