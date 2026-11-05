/**
 * @file CareerAssessmentResponse.dto.js
 * @description Validated career assessment response DTO specification and boundary helper.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 *
 * Strict Architectural Guarantees:
 * 1. Model-generated claims are NOT treated as independent verification.
 * 2. `hallucinationCheckPassed` is REMOVED as an authoritative response field.
 * 3. `validationAudit` represents independently performed validation by the domain validator.
 * 4. Provider telemetry does not contaminate the assessment-domain payload.
 * 5. Missing optional provider usage telemetry does NOT invalidate an otherwise valid assessment.
 */

/**
 * @typedef {import('./RawProviderAssessmentOutput.dto').ProviderTelemetryMetadata} ProviderTelemetryMetadata
 */

/**
 * @typedef {Object} StrategicRecommendationItem
 * @property {string} id - Unique identifier (e.g. "REC-01").
 * @property {"pipeline_velocity"|"targeting_alignment"|"skill_acquisition"|"interview_preparation"|"data_hygiene"} category - Strategic category.
 * @property {"high"|"medium"|"low"} priority - Urgency/impact level.
 * @property {string} title - Actionable recommendation title.
 * @property {string} rationale - Contextual reason based on pipeline and profile.
 * @property {string[]} actionSteps - Sequential concrete steps to execute.
 * @property {string} expectedImpact - Desired operational or career outcome.
 */

/**
 * @typedef {Object} CandidateSummarySection
 * @property {"entry_level"|"mid_level"|"senior"|"lead_architect"|"transitioning"|"unspecified"} careerStage - Assessed career stage.
 * @property {"healthy"|"needs_focus"|"critical_bottleneck"|"insufficient_data"|"inconsistent_data"} pipelineHealth - Pipeline state.
 * @property {string} primaryBottleneck - Dominant funnel obstruction or strategic challenge.
 */

/**
 * @typedef {Object} PipelineDiagnosticsSection
 * @property {string} volumeAssessment - Evaluation of search scale and volume.
 * @property {string} stageProgressionVelocity - Assessment of conversion between stages.
 * @property {string} staleApplicationRisk - Risk analysis of aging applications.
 */

/**
 * @typedef {Object} SkillGapAnalysisSection
 * @property {string[]} verifiedCandidateSkills - Skills verified against declared profile.
 * @property {string[]} criticalMissingSkills - Priority skill deficiencies for target roles.
 * @property {string} skillBridgingAdvice - Strategic recommendations for addressing gaps.
 */

/**
 * @typedef {Object} EvidenceGroundingSection
 * @property {string[]} citedMetrics - Verifiable pipeline statistics referenced in assessment.
 * @property {string} dataLimitationsNoted - Acknowledged missing or ambiguous data points.
 */

/**
 * @typedef {Object} CareerAssessmentPayload
 * @property {CandidateSummarySection} candidateSummary - High-level candidate synthesis.
 * @property {PipelineDiagnosticsSection} pipelineDiagnostics - Funnel velocity diagnostics.
 * @property {SkillGapAnalysisSection} skillGapAnalysis - Technical capability alignment.
 * @property {StrategicRecommendationItem[]} strategicRecommendations - Prioritized action items.
 * @property {EvidenceGroundingSection} evidenceGrounding - Metric citations and limitations.
 */

/**
 * @typedef {Object} ValidationAuditDTO
 * @property {boolean} schemaValid - True if Ajv structural JSON Schema validation passed.
 * @property {boolean} evidenceGrounded - True if independent deterministic skill and metric checks passed.
 * @property {string[]} discrepancies - Detected factual or structural discrepancies, if any.
 */

/**
 * @typedef {Object} FallbackMetadata
 * @property {string} reason - Cause of fallback (e.g. "HTTP 429 Rate Limit").
 * @property {string} strategy - Fallback mechanism (e.g. "deterministic_pipeline_heuristics").
 * @property {string} timestamp - ISO 8601 timestamp of fallback execution.
 */

/**
 * @typedef {Object} CareerAssessmentResponseDTO
 * @property {boolean} success - True if assessment was generated and passed domain validation.
 * @property {string} correlationId - Unique tracing UUID (v4).
 * @property {boolean} fallbackActive - True if produced by deterministic heuristic engine.
 * @property {FallbackMetadata|null} fallbackMetadata - Fallback strategy details if active.
 * @property {CareerAssessmentPayload} assessment - Validated domain assessment content.
 * @property {ValidationAuditDTO} validationAudit - Independently performed verification audit.
 * @property {ProviderTelemetryMetadata|null} telemetry - Optional provider usage and latency metadata.
 */

/**
 * Factory and boundary validation function for CareerAssessmentResponseDTO.
 *
 * @param {Object} params
 * @param {boolean} params.success
 * @param {string} params.correlationId
 * @param {boolean} [params.fallbackActive=false]
 * @param {FallbackMetadata|null} [params.fallbackMetadata=null]
 * @param {CareerAssessmentPayload} params.assessment
 * @param {ValidationAuditDTO} params.validationAudit
 * @param {ProviderTelemetryMetadata|null} [params.telemetry=null]
 * @returns {CareerAssessmentResponseDTO}
 */
function createCareerAssessmentResponseDTO({
  success,
  correlationId,
  fallbackActive = false,
  fallbackMetadata = null,
  assessment,
  validationAudit,
  telemetry = null,
}) {
  if (typeof success !== "boolean") {
    throw new TypeError("success must be a boolean");
  }
  if (typeof correlationId !== "string" || correlationId.trim().length === 0) {
    throw new TypeError("correlationId must be a non-empty string");
  }
  if (!assessment || typeof assessment !== "object" || Array.isArray(assessment)) {
    throw new TypeError("assessment must be a non-null object");
  }
  if (!validationAudit || typeof validationAudit !== "object" || Array.isArray(validationAudit)) {
    throw new TypeError("validationAudit must be an object representing independent audit results");
  }
  if (typeof validationAudit.schemaValid !== "boolean") {
    throw new TypeError("validationAudit.schemaValid must be a boolean");
  }
  if (typeof validationAudit.evidenceGrounded !== "boolean") {
    throw new TypeError("validationAudit.evidenceGrounded must be a boolean");
  }

  // Sanitize evidenceGrounding to strictly ensure hallucinationCheckPassed is NOT an authoritative field
  const sanitizedEvidenceGrounding = assessment.evidenceGrounding
    ? {
        citedMetrics: Array.isArray(assessment.evidenceGrounding.citedMetrics)
          ? [...assessment.evidenceGrounding.citedMetrics]
          : [],
        dataLimitationsNoted:
          typeof assessment.evidenceGrounding.dataLimitationsNoted === "string"
            ? assessment.evidenceGrounding.dataLimitationsNoted
            : "",
      }
    : { citedMetrics: [], dataLimitationsNoted: "" };

  const sanitizedAssessment = {
    ...assessment,
    evidenceGrounding: sanitizedEvidenceGrounding,
  };

  // Missing optional telemetry must NOT invalidate an otherwise valid assessment
  const sanitizedTelemetry =
    telemetry && typeof telemetry === "object"
      ? {
          providerId: telemetry.providerId || "unknown",
          modelIdentifier: telemetry.modelIdentifier || "unknown",
          latencyMs: typeof telemetry.latencyMs === "number" ? telemetry.latencyMs : 0,
          inputTokens: typeof telemetry.inputTokens === "number" ? telemetry.inputTokens : null,
          outputTokens: typeof telemetry.outputTokens === "number" ? telemetry.outputTokens : null,
          totalTokens: typeof telemetry.totalTokens === "number" ? telemetry.totalTokens : null,
          rateLimit: telemetry.rateLimit || null,
        }
      : null;

  return {
    success,
    correlationId,
    fallbackActive: Boolean(fallbackActive),
    fallbackMetadata: fallbackActive && fallbackMetadata ? { ...fallbackMetadata } : null,
    assessment: sanitizedAssessment,
    validationAudit: {
      schemaValid: validationAudit.schemaValid,
      evidenceGrounded: validationAudit.evidenceGrounded,
      discrepancies: Array.isArray(validationAudit.discrepancies) ? [...validationAudit.discrepancies] : [],
    },
    telemetry: sanitizedTelemetry,
  };
}

module.exports = {
  createCareerAssessmentResponseDTO,
};
