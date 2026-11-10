/**
 * @file CareerStrategistService.js
 * @description Orchestration service coordinating the Career Strategist AI pipeline.
 *
 * Stage 2B.4B — Option C Provider Abstraction Foundation.
 *
 * Architectural Invariants:
 * 1. Pipeline Orchestration: Coordinates request validation, mandatory telemetry minimization,
 *    provider-boundary identity verification, provider dispatch, structural parsing, evidence validation,
 *    and sanitized response construction.
 * 2. Mandatory Minimization Boundary: Never dispatches an unminimized request to the AI provider.
 *    Relies on module-private WeakSet registration in `minimizedRequestRegistry`.
 * 3. Independent Evidence Validation: Every model assessment must pass `careerAssessmentValidator`
 *    before it can be returned or persisted. Unsupported claims fail closed.
 * 4. Deterministic Local Fallback: Only explicitly eligible operational provider errors (HTTP 429,
 *    timeouts, transient capacity, network drops) trigger deterministic heuristics fallback.
 *    External LLM fallback (e.g. Gemini) is STRICTLY PROHIBITED.
 * 5. Fail-Closed Security Perimeter: Minimization failures, identity boundary violations, authentication
 *    errors, configuration bugs, and client cancellations NEVER trigger fallback.
 * 6. Single Retry Boundary: Does not implement a secondary retry loop; provider adapter retry boundaries
 *    govern pre-transmission transport retries.
 * 7. Clean Cancellation: Caller AbortSignal propagates directly through the execution boundary;
 *    cancellation never triggers fallback and leaves zero hanging promises.
 */

const { validateCareerAssessmentRequest } = require("./contracts/dtos/CareerAssessmentRequest.dto");
const { createCareerAssessmentResponseDTO } = require("./contracts/dtos/CareerAssessmentResponse.dto");
const { isVerifiedMinimizedRequest } = require("./contracts/minimizedRequestRegistry");
const { minimizeCareerAssessmentTelemetry } = require("./sanitizers/telemetryMinimizer");
const { validateCareerAssessmentEvidence } = require("./validators/careerAssessmentValidator");
const { GroqProviderAdapter } = require("./providers/groq/GroqProviderAdapter");
const { isFallbackEligible } = require("./policy/fallbackPolicy");

const { AI_ERROR_CODES } = require("./contracts/errors/AiError");
const { AiCancellationError } = require("./contracts/errors/AiCancellationError");
const { AiAuthenticationError } = require("./contracts/errors/AiAuthenticationError");
const { AiConfigurationError } = require("./contracts/errors/AiConfigurationError");
const { AiModelFailureError } = require("./contracts/errors/AiModelFailureError");
const { AiSchemaValidationError } = require("./contracts/errors/AiSchemaValidationError");

/** Default execution timeout in milliseconds (30 seconds) */
const DEFAULT_EXECUTION_TIMEOUT_MS = 30000;

class CareerStrategistService {
  /**
   * Initializes the Career Strategist Orchestration Service.
   *
   * @param {Object} [dependencies]
   * @param {import('./contracts/IStructuredAssessmentProvider')} [dependencies.provider] - Structured AI provider adapter.
   * @param {number} [dependencies.defaultTimeoutMs=30000] - Default execution timeout boundary.
   * @param {Function} [dependencies.fallbackPolicyFn=isFallbackEligible] - Error classification function.
   */
  constructor({
    provider = null,
    defaultTimeoutMs = DEFAULT_EXECUTION_TIMEOUT_MS,
    fallbackPolicyFn = isFallbackEligible,
  } = {}) {
    this._provider = provider || new GroqProviderAdapter();
    this._defaultTimeoutMs =
      typeof defaultTimeoutMs === "number" && defaultTimeoutMs > 0
        ? defaultTimeoutMs
        : DEFAULT_EXECUTION_TIMEOUT_MS;
    this._fallbackPolicyFn =
      typeof fallbackPolicyFn === "function" ? fallbackPolicyFn : isFallbackEligible;
  }

  /**
   * AI provider adapter instance currently configured.
   */
  get provider() {
    return this._provider;
  }

  /**
   * Default execution timeout in milliseconds.
   */
  get defaultTimeoutMs() {
    return this._defaultTimeoutMs;
  }

  /**
   * Executes the full Career Strategist assessment pipeline for a candidate request.
   *
   * Pipeline Steps:
   * 1. Request Structure Validation
   * 2. Mandatory Telemetry Minimization & PII Stripping
   * 3. Provider Boundary Identity Verification (WeakSet)
   * 4. Provider Execution (GroqCloud / Structured Provider)
   * 5. Structural Response Validation
   * 6. Factual Evidence Grounding Audit (Validator)
   * 7. Sanitized CareerAssessmentResponseDTO Construction
   *
   * @param {any} rawRequest - Incoming CareerAssessmentRequest DTO.
   * @param {Object} [options] - Execution options.
   * @param {number} [options.timeoutMs] - Optional execution timeout override.
   * @param {AbortSignal} [options.signal] - Optional caller cancellation signal.
   * @param {Function} [options.fallbackPolicyFn] - Optional fallback policy override.
   * @returns {Promise<import('./contracts/dtos/CareerAssessmentResponse.dto').CareerAssessmentResponseDTO>}
   */
  async generateCareerStrategy(rawRequest, options = {}) {
    // ------------------------------------------------------------------------
    // STEP 1: Request Structure Validation
    // ------------------------------------------------------------------------
    const initialValidation = validateCareerAssessmentRequest(rawRequest);
    if (!initialValidation.isValid) {
      throw new AiConfigurationError(
        `Invalid CareerAssessmentRequest: ${initialValidation.errors.join("; ")}`,
        {
          providerId: this._provider?.providerId || "groq",
          diagnosticContext: {
            reason: "INVALID_REQUEST_STRUCTURE",
            errorsCount: initialValidation.errors.length,
          },
        }
      );
    }

    // ------------------------------------------------------------------------
    // STEP 2: Mandatory Telemetry Minimization & WeakSet Registration
    // ------------------------------------------------------------------------
    let minimizedResult;
    try {
      // Merge execution options (signal and timeout) into request before minimization
      const requestWithOptions = {
        ...rawRequest,
        options: {
          timeoutMs: options.timeoutMs || rawRequest.options?.timeoutMs || this._defaultTimeoutMs,
          signal: options.signal || rawRequest.options?.signal || undefined,
        },
      };

      minimizedResult = minimizeCareerAssessmentTelemetry(requestWithOptions);
    } catch (minimizationErr) {
      // Minimization failures represent privacy-boundary violations and MUST fail closed
      if (minimizationErr instanceof AiConfigurationError) {
        throw minimizationErr;
      }
      throw new AiConfigurationError(
        `Failed to minimize candidate telemetry: ${minimizationErr.message}`,
        {
          providerId: this._provider?.providerId || "groq",
          originalError: minimizationErr,
          diagnosticContext: { reason: "MINIMIZATION_FAILED" },
        }
      );
    }

    // Canonical minimized request registered in module-private WeakSet
    const cleanRequest = minimizedResult.minimizedRequest || minimizedResult;

    // ------------------------------------------------------------------------
    // STEP 3: Provider-Boundary Identity Verification
    // ------------------------------------------------------------------------
    if (!isVerifiedMinimizedRequest(cleanRequest)) {
      throw new AiConfigurationError(
        "Provider boundary violation: request has not been verified in minimized identity registry",
        {
          providerId: this._provider?.providerId || "groq",
          diagnosticContext: { reason: "UNMINIMIZED_REQUEST_REJECTED" },
        }
      );
    }

    // ------------------------------------------------------------------------
    // STEPS 4 - 6: Provider Dispatch, Structural Parsing & Evidence Validation
    // ------------------------------------------------------------------------
    const effectiveFallbackPolicy = options.fallbackPolicyFn || this._fallbackPolicyFn;

    try {
      // Step 4: Dispatch to structured provider (with execution boundary)
      const rawOutput = await this._provider.generateAssessment(cleanRequest);

      // Validate provider raw output wrapper
      if (!rawOutput || typeof rawOutput !== "object" || Array.isArray(rawOutput)) {
        throw new AiModelFailureError("Provider returned invalid or non-object output wrapper", {
          providerId: this._provider?.providerId || "groq",
        });
      }

      const domainData = rawOutput.rawData || rawOutput;
      if (!domainData || typeof domainData !== "object" || Array.isArray(domainData)) {
        throw new AiModelFailureError("Provider output missing domain assessment payload object", {
          providerId: this._provider?.providerId || "groq",
        });
      }

      // Steps 5 & 6: Independent Deterministic Evidence Validation
      const validationOutcome = validateCareerAssessmentEvidence(cleanRequest, rawOutput, {
        throwOnError: false,
      });

      if (!validationOutcome.isValid) {
        if (validationOutcome.status === "STRUCTURAL_INVALID") {
          throw new AiSchemaValidationError(
            "Career assessment output failed structural schema validation",
            {
              providerId: this._provider?.providerId || "groq",
              diagnosticContext: {
                reason: "STRUCTURAL_INVALID",
                discrepanciesCount: validationOutcome.validationAudit.discrepancies.length,
                discrepancies: validationOutcome.validationAudit.discrepancies,
              },
            }
          );
        }

        // status === "UNSUPPORTED_CLAIMS"
        throw new AiSchemaValidationError(
          "Career assessment failed factual evidence grounding audit",
          {
            providerId: this._provider?.providerId || "groq",
            diagnosticContext: {
              reason: "UNSUPPORTED_CLAIMS",
              discrepanciesCount: validationOutcome.validationAudit.discrepancies.length,
              discrepancies: validationOutcome.validationAudit.discrepancies,
            },
          }
        );
      }

      // Step 7: Response Construction (Normal Success Path)
      return createCareerAssessmentResponseDTO({
        success: true,
        correlationId: cleanRequest.correlationId,
        fallbackActive: false,
        fallbackMetadata: null,
        assessment: validationOutcome.sanitizedAssessment,
        validationAudit: validationOutcome.validationAudit,
        telemetry: rawOutput.telemetry || null,
      });
    } catch (execErr) {
      // ----------------------------------------------------------------------
      // ERROR HANDLING & DETERMINISTIC LOCAL FALLBACK EVALUATION
      // ----------------------------------------------------------------------
      // Enforce strict fail-closed boundary invariants:
      // Client cancellations, authentication errors, and configuration failures
      // must NEVER trigger fallback under any circumstance.
      if (
        execErr instanceof AiCancellationError ||
        execErr.code === AI_ERROR_CODES.CANCELLATION ||
        options.signal?.aborted ||
        cleanRequest.options?.signal?.aborted ||
        execErr instanceof AiAuthenticationError ||
        execErr.code === AI_ERROR_CODES.AUTHENTICATION_ERROR ||
        execErr instanceof AiConfigurationError ||
        execErr.code === AI_ERROR_CODES.CONFIGURATION_ERROR
      ) {
        throw execErr;
      }

      // Evaluate against explicit error-to-action classification policy
      const fallbackPermitted = effectiveFallbackPolicy(execErr);

      if (fallbackPermitted) {
        // Invoke permitted local deterministic heuristics fallback
        return this._executeDeterministicFallback(cleanRequest, execErr);
      }

      // Fail closed for all forbidden error classes (cancellations, auth, config, model failures)
      throw execErr;
    }
  }

  /**
   * Generates a fully grounded, deterministic career assessment derived strictly from local telemetry.
   *
   * Architectural Guarantees:
   * 1. Consumes only the already minimized candidate request (cleanRequest).
   * 2. Zero raw candidate data, notes, or PII consumed.
   * 3. Zero external LLM calls (no Gemini, no Groq, no network).
   * 4. 100% deterministic rule-based evaluation.
   * 5. Validated through `validateCareerAssessmentEvidence` before returning.
   *
   * @param {Object} cleanRequest - Verified minimized CareerAssessmentRequest.
   * @param {Error|Object} causeError - The operational error triggering fallback.
   * @returns {import('./contracts/dtos/CareerAssessmentResponse.dto').CareerAssessmentResponseDTO}
   * @private
   */
  _executeDeterministicFallback(cleanRequest, causeError) {
    const rawFallbackPayload = this.generateDeterministicFallbackPayload(cleanRequest);

    // Validate deterministic payload through independent domain validator
    const fallbackValidation = validateCareerAssessmentEvidence(cleanRequest, rawFallbackPayload, {
      throwOnError: false,
    });

    if (!fallbackValidation.isValid || !fallbackValidation.sanitizedAssessment) {
      throw new AiConfigurationError(
        "Deterministic local fallback generator produced invalid assessment payload",
        {
          providerId: this._provider?.providerId || "groq",
          diagnosticContext: {
            reason: "FALLBACK_GENERATOR_INVALID",
            discrepancies: fallbackValidation.validationAudit.discrepancies,
          },
        }
      );
    }

    const fallbackReason =
      causeError?.message || causeError?.code || "Operational Provider Degradation";

    return createCareerAssessmentResponseDTO({
      success: true,
      correlationId: cleanRequest.correlationId,
      fallbackActive: true,
      fallbackMetadata: {
        reason: fallbackReason,
        strategy: "deterministic_pipeline_heuristics",
        timestamp: new Date().toISOString(),
      },
      assessment: fallbackValidation.sanitizedAssessment,
      validationAudit: fallbackValidation.validationAudit,
      telemetry: null,
    });
  }

  /**
   * Generates a deterministic assessment payload conforming to CareerAssessmentPayload.
   *
   * Rules derived from existing Insights engine:
   * - Enforces career stage experience floors (0-yr -> entry_level, 2-yr -> mid_level, etc.)
   * - Verified skills are a strict subset of declared skills.
   * - Numerical claims in citedMetrics match exact pipeline telemetry integers.
   * - Zero ungrounded degree, credential, or experience assertions.
   *
   * @param {Object} cleanRequest - Minimized candidate request.
   * @returns {Object} Conforming CareerAssessmentPayload.
   */
  generateDeterministicFallbackPayload(cleanRequest) {
    const cp = cleanRequest.candidateProfile || {};
    const pt = cleanRequest.pipelineTelemetry || {};

    const yoe = typeof cp.yearsOfExperience === "number" ? cp.yearsOfExperience : 0;
    const tracked = pt.trackedOpportunities || 0;
    const submitted = pt.submittedApplications || 0;
    const saved = pt.savedCount || 0;
    const active = pt.activeInPipeline || 0;
    const interviews = pt.interviewsInProgress || 0;
    const pendingOffers = pt.pendingOffers || 0;
    const cumulativeOffers = pt.cumulativeOffers || 0;
    const cumulativeRejections = pt.cumulativeRejections || 0;
    const staleCount = pt.staleAlerts?.staleCount || 0;
    const thresholdDays = pt.staleAlerts?.thresholdDays || 14;

    // 1. Candidate Summary
    // Career Stage Floor Audit compliance
    let careerStage = "entry_level";
    if (yoe >= 10) {
      careerStage = "lead_architect";
    } else if (yoe >= 5) {
      careerStage = "senior";
    } else if (yoe >= 2) {
      careerStage = "mid_level";
    } else {
      careerStage = "entry_level";
    }

    // Pipeline Health calculation
    let pipelineHealth = "needs_focus";
    if (tracked === 0) {
      pipelineHealth = "insufficient_data";
    } else if (staleCount > 0 && staleCount >= Math.max(1, active * 0.5)) {
      pipelineHealth = "critical_bottleneck";
    } else if (active === 0 && submitted > 0) {
      pipelineHealth = "needs_focus";
    } else if (interviews > 0 || pendingOffers > 0) {
      pipelineHealth = "healthy";
    } else {
      pipelineHealth = "needs_focus";
    }

    // Primary Bottleneck identification
    let primaryBottleneck = "Application volume and pipeline velocity";
    if (tracked === 0) {
      primaryBottleneck = "No tracked opportunities in career pipeline";
    } else if (staleCount > 0) {
      primaryBottleneck = `${staleCount} applications currently inactive beyond threshold`;
    } else if (submitted === 0 && saved > 0) {
      primaryBottleneck = "Conversion of saved listings to submitted applications";
    } else if (interviews === 0 && submitted > 5) {
      primaryBottleneck = "Interview conversion from submitted applications";
    }

    // 2. Pipeline Diagnostics
    const volumeAssessment = `Pipeline contains ${submitted} submitted applications across ${tracked} total tracked opportunities.`;
    const stageProgressionVelocity = `Currently tracking ${active} active pipeline applications with ${interviews} interviews in progress and ${pendingOffers} pending offers.`;
    const staleApplicationRisk = `Identified ${staleCount} stale applications inactive for over ${thresholdDays} days.`;

    // 3. Skill Gap Analysis
    // Verified skills are strict subset of declared skills
    const declaredSkills = Array.isArray(cp.declaredSkills) ? [...cp.declaredSkills] : [];
    const verifiedCandidateSkills = [...declaredSkills];
    const criticalMissingSkills = []; // Empty array avoids contradictory missing skill claims
    const skillBridgingAdvice =
      declaredSkills.length > 0
        ? `Maintain active demonstration of declared skills (${declaredSkills.slice(0, 5).join(", ")}) in targeted applications and interview loops.`
        : "Review target role requirements to identify and catalog core technical competencies.";

    // 4. Strategic Recommendations (1 to 10 items conforming to Insights engine rules)
    const strategicRecommendations = [];

    if (staleCount > 0) {
      strategicRecommendations.push({
        id: "REC-01",
        category: "pipeline_velocity",
        priority: "high",
        title: "Follow Up on Stale Applications",
        rationale: `Detected ${staleCount} applications with no stage movement for over ${thresholdDays} days.`,
        actionSteps: [
          "Review status of inactive applications in applied and OA stages",
          "Send concise follow-up inquiries to hiring teams or recruiters",
          "Archive definitively inactive listings to maintain pipeline accuracy",
        ],
        expectedImpact: "Re-engage active interview loops or clarify pipeline status",
      });
    }

    if (saved >= 5 && (submitted === 0 || saved > submitted * 1.5)) {
      strategicRecommendations.push({
        id: "REC-02",
        category: "targeting_alignment",
        priority: "medium",
        title: "Convert Saved Opportunities",
        rationale: `You have ${saved} saved opportunities awaiting application submission.`,
        actionSteps: [
          "Select the top 3 highest-alignment saved listings",
          "Verify resume alignment with key role requirements",
          "Submit tailored applications to expand active pipeline volume",
        ],
        expectedImpact: "Increase active pipeline velocity and potential interview invitations",
      });
    }

    if (interviews > 0) {
      strategicRecommendations.push({
        id: "REC-03",
        category: "interview_preparation",
        priority: "high",
        title: "Prepare for Active Interview Loops",
        rationale: `You currently have ${interviews} active interview processes in progress.`,
        actionSteps: [
          "Research interviewer backgrounds and recent team architecture initiatives",
          "Prepare STAR method behavioral responses highlighting verified competencies",
          "Review technical core fundamentals relevant to target positions",
        ],
        expectedImpact: "Maximize progression from interview rounds to formal employment offers",
      });
    }

    if (strategicRecommendations.length === 0) {
      strategicRecommendations.push({
        id: "REC-01",
        category: "pipeline_velocity",
        priority: "medium",
        title: "Scale Opportunity Sourcing Cadence",
        rationale: `Pipeline currently tracks ${submitted} submitted applications.`,
        actionSteps: [
          "Identify and catalog 5 new matching opportunities weekly",
          "Align application materials with identifiable technical requirements",
          "Record all status transitions promptly to maintain diagnostic accuracy",
        ],
        expectedImpact: "Build sufficient pipeline volume to trigger regular interview cycles",
      });
    }

    // 5. Evidence Grounding
    // Every cited metric integer strictly grounds in pipelineTelemetry
    const citedMetrics = [
      `${tracked} tracked opportunities`,
      `${submitted} submitted applications`,
      `${active} active in pipeline`,
      `${interviews} interviews in progress`,
      `${pendingOffers} pending offers`,
    ];

    const dataLimitationsNoted =
      "Assessment generated via local deterministic heuristics engine. Analysis is derived strictly from verified pipeline telemetry and declared profile data.";

    return {
      candidateSummary: {
        careerStage,
        pipelineHealth,
        primaryBottleneck,
      },
      pipelineDiagnostics: {
        volumeAssessment,
        stageProgressionVelocity,
        staleApplicationRisk,
      },
      skillGapAnalysis: {
        verifiedCandidateSkills,
        criticalMissingSkills,
        skillBridgingAdvice,
      },
      strategicRecommendations,
      evidenceGrounding: {
        citedMetrics,
        dataLimitationsNoted,
      },
    };
  }
}

module.exports = {
  CareerStrategistService,
  DEFAULT_EXECUTION_TIMEOUT_MS,
};
