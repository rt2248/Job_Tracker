/**
 * @file index.js (services/ai)
 * @description Main barrel export for AI provider foundation layer (Stage 2B.1 / Stage 2B.2).
 *
 * Stage 2B.2 — Option C Provider Abstraction Foundation.
 */

const conformance = require("./contracts/conformance");
const executionBoundary = require("./contracts/executionBoundaryContract");
const errors = require("./contracts/errors");
const fallbackPolicy = require("./policy/fallbackPolicy");

const careerAssessmentRequestDto = require("./contracts/dtos/CareerAssessmentRequest.dto");
const rawProviderAssessmentOutputDto = require("./contracts/dtos/RawProviderAssessmentOutput.dto");
const careerAssessmentResponseDto = require("./contracts/dtos/CareerAssessmentResponse.dto");
const chatStreamRequestDto = require("./contracts/dtos/ChatStreamRequest.dto");
const chatStreamChunkDto = require("./contracts/dtos/ChatStreamChunk.dto");

const { BaseAiProviderAdapter } = require("./providers/BaseAiProviderAdapter");
const { GroqProviderAdapter, DEFAULT_GROQ_MODEL, DEFAULT_GROQ_ENDPOINT } = require("./providers/groq/GroqProviderAdapter");
const groqRateLimitParser = require("./providers/groq/groqRateLimitParser");

const telemetryMinimizer = require("./sanitizers/telemetryMinimizer");
const careerAssessmentValidator = require("./validators/careerAssessmentValidator");

module.exports = {
  // Conformance
  ...conformance,

  // Execution Boundary Contract
  ...executionBoundary,

  // Error Taxonomy
  ...errors,

  // Policy
  ...fallbackPolicy,

  // DTO Validators and Factories
  ...careerAssessmentRequestDto,
  ...rawProviderAssessmentOutputDto,
  ...careerAssessmentResponseDto,
  ...chatStreamRequestDto,
  ...chatStreamChunkDto,

  // Provider Adapters
  BaseAiProviderAdapter,
  GroqProviderAdapter,
  DEFAULT_GROQ_MODEL,
  DEFAULT_GROQ_ENDPOINT,
  ...groqRateLimitParser,

  // Sanitizers & Privacy Perimeter
  ...telemetryMinimizer,

  // Independent Evidence Validators
  ...careerAssessmentValidator,
};
