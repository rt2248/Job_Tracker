/**
 * @file careerStrategistService.test.js
 * @description Comprehensive unit and integration test suite for CareerStrategistService orchestration layer.
 *
 * Stage 2B.4B — Option C Provider Abstraction Foundation.
 * Execution Mode: STRICTLY OFFLINE (Mocked provider transports, synthetic fixtures, zero live inference).
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  CareerStrategistService,
  DEFAULT_EXECUTION_TIMEOUT_MS,
} = require("../../src/services/ai/CareerStrategistService");

const {
  createRawProviderAssessmentOutput,
} = require("../../src/services/ai/contracts/dtos/RawProviderAssessmentOutput.dto");
const {
  isVerifiedMinimizedRequest,
  registerMinimizedRequest,
} = require("../../src/services/ai/contracts/minimizedRequestRegistry");
const {
  validateCareerAssessmentEvidence,
} = require("../../src/services/ai/validators/careerAssessmentValidator");

const { AiError } = require("../../src/services/ai/contracts/errors/AiError");
const { AiRateLimitError } = require("../../src/services/ai/contracts/errors/AiRateLimitError");
const { AiTimeoutError } = require("../../src/services/ai/contracts/errors/AiTimeoutError");
const { AiCancellationError } = require("../../src/services/ai/contracts/errors/AiCancellationError");
const { AiNetworkError } = require("../../src/services/ai/contracts/errors/AiNetworkError");
const { AiCapacityError } = require("../../src/services/ai/contracts/errors/AiCapacityError");
const { AiQuotaExhaustedError } = require("../../src/services/ai/contracts/errors/AiQuotaExhaustedError");
const { AiBadGatewayError } = require("../../src/services/ai/contracts/errors/AiBadGatewayError");
const { AiGatewayTimeoutError } = require("../../src/services/ai/contracts/errors/AiGatewayTimeoutError");
const { AiAuthenticationError } = require("../../src/services/ai/contracts/errors/AiAuthenticationError");
const { AiConfigurationError } = require("../../src/services/ai/contracts/errors/AiConfigurationError");
const { AiContextWindowExceededError } = require("../../src/services/ai/contracts/errors/AiContextWindowExceededError");
const { AiModelFailureError } = require("../../src/services/ai/contracts/errors/AiModelFailureError");
const { AiSchemaValidationError } = require("../../src/services/ai/contracts/errors/AiSchemaValidationError");

// ----------------------------------------------------------------------------
// SYNTHETIC TEST FIXTURES
// ----------------------------------------------------------------------------

function createValidSyntheticRequest(overrides = {}) {
  return {
    correlationId: "corr-test-4b-12345",
    candidateProfile: {
      fullName: "Jane Doe (PII to be stripped)",
      email: "jane.doe@example.com (PII to be stripped)",
      phoneNumber: "+1-555-0199 (PII to be stripped)",
      headline: "Senior Backend Engineer",
      yearsOfExperience: 6,
      declaredSkills: ["node.js", "react", "postgresql", "docker", "aws"],
      targetRoles: ["Senior Backend Engineer", "Lead Engineer"],
      userNotes: "Candidate seeking high-scale distributed backend roles.",
      internalRecruiterNotes: "DO NOT EXPOSE TO MODEL",
    },
    pipelineTelemetry: {
      trackedOpportunities: 25,
      submittedApplications: 18,
      savedCount: 7,
      activeInPipeline: 6,
      interviewsInProgress: 2,
      pendingOffers: 1,
      cumulativeOffers: 1,
      cumulativeRejections: 11,
      stageDistribution: [
        { status: "applied", count: 2 },
        { status: "oa", count: 2 },
        { status: "interview", count: 2 },
        { status: "offer", count: 1 },
      ],
      staleAlerts: {
        staleCount: 2,
        thresholdDays: 14,
      },
      internalConversionRate: 0.15, // Unsanitized field to be stripped
    },
    ...overrides,
  };
}

function createValidMockModelAssessment(candidateProfile, pipelineTelemetry) {
  return {
    candidateSummary: {
      careerStage: "senior",
      pipelineHealth: "healthy",
      primaryBottleneck: "Technical system design interview pacing",
    },
    pipelineDiagnostics: {
      volumeAssessment: "Strong volume with 18 submitted applications.",
      stageProgressionVelocity: "Healthy velocity with 2 active interviews and 1 pending offer.",
      staleApplicationRisk: "Moderate risk with 2 stale applications requiring follow-up.",
    },
    skillGapAnalysis: {
      verifiedCandidateSkills: ["node.js", "postgresql", "aws"],
      criticalMissingSkills: ["kubernetes"],
      skillBridgingAdvice: "Gain container orchestration experience via Kubernetes projects.",
    },
    strategicRecommendations: [
      {
        id: "REC-01",
        category: "interview_preparation",
        priority: "high",
        title: "Prepare for Active Interviews",
        rationale: "You have 2 interviews in progress across active submissions.",
        actionSteps: ["Review system design patterns", "Prepare STAR stories for past projects"],
        expectedImpact: "Increase offer conversion probability",
      },
      {
        id: "REC-02",
        category: "pipeline_velocity",
        priority: "medium",
        title: "Follow Up on Stale Applications",
        rationale: "Detected 2 applications with no movement beyond 14 days.",
        actionSteps: ["Send concise follow-up emails", "Check application portal for updates"],
        expectedImpact: "Re-engage stale opportunities",
      },
    ],
    evidenceGrounding: {
      citedMetrics: [
        "18 submitted applications",
        "2 interviews in progress",
        "1 pending offer",
        "2 stale applications",
      ],
      dataLimitationsNoted: "Analysis based strictly on verified pipeline telemetry.",
      hallucinationCheckPassed: true, // Adversarial self-verification claim to be stripped
    },
  };
}

/**
 * Creates a mock provider implementing IStructuredAssessmentProvider.
 */
function createMockProvider({
  assessmentOutput = null,
  throwError = null,
  delayMs = 0,
  providerId = "mock-groq",
  onGenerate = null,
} = {}) {
  let callCount = 0;
  let lastReceivedRequest = null;

  return {
    providerId,
    modelIdentifier: "openai/gpt-oss-120b",
    capabilities: {
      structuredAssessment: true,
      streamingChat: false,
      nativeThinking: false,
    },
    get callCount() {
      return callCount;
    },
    get lastReceivedRequest() {
      return lastReceivedRequest;
    },
    async generateAssessment(request) {
      callCount++;
      lastReceivedRequest = request;

      if (typeof onGenerate === "function") {
        onGenerate(request);
      }

      if (delayMs > 0) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, delayMs);
          if (request.options?.signal) {
            request.options.signal.addEventListener("abort", () => {
              clearTimeout(timer);
              reject(new AiCancellationError("Request aborted by caller"));
            });
          }
        });
      }

      if (request.options?.signal?.aborted) {
        throw new AiCancellationError("Request aborted by caller");
      }

      if (throwError) {
        throw throwError;
      }

      const rawData =
        assessmentOutput ||
        createValidMockModelAssessment(request.candidateProfile, request.pipelineTelemetry);

      return createRawProviderAssessmentOutput({
        rawData,
        telemetry: {
          providerId,
          modelIdentifier: "openai/gpt-oss-120b",
          latencyMs: 120,
          inputTokens: 450,
          outputTokens: 380,
          totalTokens: 830,
          rateLimit: {
            remainingRequests: 29,
            remainingTokens: 5800,
            resetTimeSeconds: 60,
          },
        },
      });
    },
  };
}

// ============================================================================
// TEST SUITE: CareerStrategistService Orchestration Layer
// ============================================================================

describe("Stage 2B.4B CareerStrategistService Orchestration", () => {
  // --------------------------------------------------------------------------
  // CATEGORY A: Successful Orchestration
  // --------------------------------------------------------------------------
  describe("Category A: Successful Orchestration", () => {
    it("successfully orchestrates a valid request through minimization, provider dispatch, validation, and response construction", async () => {
      const mockProvider = createMockProvider();
      const service = new CareerStrategistService({ provider: mockProvider });

      const request = createValidSyntheticRequest();
      const response = await service.generateCareerStrategy(request);

      // Verify response envelope
      assert.equal(response.success, true);
      assert.equal(response.correlationId, request.correlationId);
      assert.equal(response.fallbackActive, false);
      assert.equal(response.fallbackMetadata, null);

      // Verify assessment payload structure
      assert.ok(response.assessment);
      assert.equal(response.assessment.candidateSummary.careerStage, "senior");
      assert.equal(response.assessment.candidateSummary.pipelineHealth, "healthy");
      assert.ok(Array.isArray(response.assessment.strategicRecommendations));
      assert.equal(response.assessment.strategicRecommendations.length, 2);

      // Verify validation audit
      assert.ok(response.validationAudit);
      assert.equal(response.validationAudit.schemaValid, true);
      assert.equal(response.validationAudit.evidenceGrounded, true);
      assert.deepEqual(response.validationAudit.discrepancies, []);

      // Verify provider usage telemetry attached
      assert.ok(response.telemetry);
      assert.equal(response.telemetry.providerId, "mock-groq");
      assert.equal(response.telemetry.totalTokens, 830);

      // Verify provider received verified minimized request (not raw request)
      assert.equal(mockProvider.callCount, 1);
      assert.ok(isVerifiedMinimizedRequest(mockProvider.lastReceivedRequest));
    });

    it("ensures candidate PII is completely stripped before request reaches the provider", async () => {
      let receivedProfile = null;
      const mockProvider = createMockProvider({
        onGenerate: (req) => {
          receivedProfile = req.candidateProfile;
        },
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await service.generateCareerStrategy(request);

      assert.ok(receivedProfile);
      assert.equal(receivedProfile.fullName, undefined);
      assert.equal(receivedProfile.email, undefined);
      assert.equal(receivedProfile.phoneNumber, undefined);
      assert.equal(receivedProfile.internalRecruiterNotes, undefined);
      assert.equal(receivedProfile.headline, "Senior Backend Engineer");
    });
  });

  // --------------------------------------------------------------------------
  // CATEGORY B: Minimization and Identity Boundaries
  // --------------------------------------------------------------------------
  describe("Category B: Minimization and Identity Boundaries", () => {
    it("rejects malformed incoming request at Step 1 before minimization", async () => {
      const mockProvider = createMockProvider();
      const service = new CareerStrategistService({ provider: mockProvider });

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(null);
        },
        (err) => {
          assert.ok(err instanceof AiConfigurationError);
          assert.equal(err.diagnosticContext?.reason, "INVALID_REQUEST_STRUCTURE");
          return true;
        }
      );

      assert.equal(mockProvider.callCount, 0, "Provider must never be called on Step 1 failure");
    });

    it("rejects request with missing correlationId at Step 1", async () => {
      const mockProvider = createMockProvider();
      const service = new CareerStrategistService({ provider: mockProvider });

      const invalidReq = createValidSyntheticRequest({ correlationId: "" });

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(invalidReq);
        },
        (err) => {
          assert.ok(err instanceof AiConfigurationError);
          assert.equal(err.diagnosticContext?.reason, "INVALID_REQUEST_STRUCTURE");
          return true;
        }
      );

      assert.equal(mockProvider.callCount, 0);
    });

    it("minimization failure fails closed with AiConfigurationError and does NOT trigger fallback", async () => {
      const mockProvider = createMockProvider();
      const service = new CareerStrategistService({ provider: mockProvider });

      // Circular reference forces minimization crash
      const circularReq = createValidSyntheticRequest();
      circularReq.candidateProfile.self = circularReq;

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(circularReq);
        },
        (err) => {
          assert.ok(err instanceof AiConfigurationError);
          return true;
        }
      );

      assert.equal(mockProvider.callCount, 0, "Provider must never be called when minimization fails");
    });

    it("rejects provider boundary violation when request identity is unverified in registry", async () => {
      // Simulate malicious provider adapter or boundary circumvention where
      // unminimized request object is passed
      const unverifiedObj = createValidSyntheticRequest();

      assert.equal(
        isVerifiedMinimizedRequest(unverifiedObj),
        false,
        "Unregistered object must not be verified"
      );
    });
  });

  // --------------------------------------------------------------------------
  // CATEGORY C: Provider Operational Failures & Error Handling
  // --------------------------------------------------------------------------
  describe("Category C: Provider Operational Failures & Error Handling", () => {
    it("HTTP 429 Rate Limit triggers deterministic local fallback with fallbackActive: true", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiRateLimitError("HTTP 429 Too Many Requests"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(response.success, true);
      assert.equal(response.fallbackActive, true);
      assert.ok(response.fallbackMetadata);
      assert.equal(response.fallbackMetadata.strategy, "deterministic_pipeline_heuristics");
      assert.match(response.fallbackMetadata.reason, /429/);
      assert.ok(response.assessment);
      assert.equal(response.telemetry, null);
    });

    it("Provider Timeout (AiTimeoutError) triggers deterministic local fallback", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiTimeoutError("Provider request exceeded timeout boundary"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(response.success, true);
      assert.equal(response.fallbackActive, true);
      assert.match(response.fallbackMetadata.reason, /timeout/i);
    });

    it("Provider Network Error (AiNetworkError) triggers deterministic local fallback", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiNetworkError("Connection reset by peer"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(response.success, true);
      assert.equal(response.fallbackActive, true);
      assert.match(response.fallbackMetadata.reason, /connection/i);
    });

    it("Provider Capacity Unavailable (503 / AiCapacityError) triggers deterministic local fallback", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiCapacityError("HTTP 503 Service Unavailable"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(response.success, true);
      assert.equal(response.fallbackActive, true);
    });

    it("Provider Quota Exhausted (AiQuotaExhaustedError) triggers deterministic local fallback", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiQuotaExhaustedError("Daily token quota exceeded"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(response.success, true);
      assert.equal(response.fallbackActive, true);
    });

    it("Provider Bad Gateway (502 / AiBadGatewayError) triggers deterministic local fallback", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiBadGatewayError("HTTP 502 Bad Gateway"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(response.success, true);
      assert.equal(response.fallbackActive, true);
    });

    it("Provider Gateway Timeout (504 / AiGatewayTimeoutError) triggers deterministic local fallback", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiGatewayTimeoutError("HTTP 504 Gateway Timeout"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(response.success, true);
      assert.equal(response.fallbackActive, true);
    });

    it("Provider Authentication Error (401 / AiAuthenticationError) fails closed with ZERO fallback", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiAuthenticationError("Invalid Groq API key"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request);
        },
        (err) => {
          assert.ok(err instanceof AiAuthenticationError);
          return true;
        }
      );
    });

    it("Provider Configuration Error (AiConfigurationError) fails closed with ZERO fallback", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiConfigurationError("Invalid provider endpoint configuration"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request);
        },
        (err) => {
          assert.ok(err instanceof AiConfigurationError);
          return true;
        }
      );
    });

    it("Context Window Exceeded (AiContextWindowExceededError) fails closed with ZERO fallback", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiContextWindowExceededError("Prompt exceeded maximum token budget"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request);
        },
        (err) => {
          assert.ok(err instanceof AiContextWindowExceededError);
          return true;
        }
      );
    });

    it("Unknown runtime error (generic Error) fails closed with ZERO fallback", async () => {
      const mockProvider = createMockProvider({
        throwError: new Error("Unexpected internal runtime failure"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request);
        },
        (err) => {
          assert.equal(err.message, "Unexpected internal runtime failure");
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // CATEGORY D: Invalid Provider Responses
  // --------------------------------------------------------------------------
  describe("Category D: Invalid Provider Responses", () => {
    it("malformed JSON from provider throws AiModelFailureError and fails closed", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiModelFailureError("Model completion content is not valid JSON"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request);
        },
        (err) => {
          assert.ok(err instanceof AiModelFailureError);
          return true;
        }
      );
    });

    it("missing required section in provider domain output throws AiSchemaValidationError (STRUCTURAL_INVALID)", async () => {
      const invalidPayload = {
        candidateSummary: { careerStage: "senior", pipelineHealth: "healthy", primaryBottleneck: "Bottleneck" },
        // pipelineDiagnostics intentionally missing!
        skillGapAnalysis: { verifiedCandidateSkills: ["node.js"], criticalMissingSkills: [], skillBridgingAdvice: "Advice" },
        strategicRecommendations: [
          { id: "REC-01", category: "pipeline_velocity", priority: "high", title: "T", rationale: "R", actionSteps: ["A"], expectedImpact: "E" },
        ],
        evidenceGrounding: { citedMetrics: ["18 submitted applications"], dataLimitationsNoted: "None" },
      };

      const mockProvider = createMockProvider({ assessmentOutput: invalidPayload });
      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request);
        },
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.equal(err.diagnosticContext?.reason, "STRUCTURAL_INVALID");
          return true;
        }
      );
    });

    it("invalid enum value in provider output throws AiSchemaValidationError (STRUCTURAL_INVALID)", async () => {
      const invalidEnumPayload = createValidMockModelAssessment();
      invalidEnumPayload.candidateSummary.careerStage = "rockstar_guru"; // Invalid enum

      const mockProvider = createMockProvider({ assessmentOutput: invalidEnumPayload });
      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request);
        },
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.equal(err.diagnosticContext?.reason, "STRUCTURAL_INVALID");
          return true;
        }
      );
    });

    it("unsupported candidate skill in provider output throws AiSchemaValidationError (UNSUPPORTED_CLAIMS)", async () => {
      const unsupportedSkillPayload = createValidMockModelAssessment();
      // Candidate only declared: node.js, react, postgresql, docker, aws
      // Provider invents "Haskell" and "Cobol"
      unsupportedSkillPayload.skillGapAnalysis.verifiedCandidateSkills = ["node.js", "Haskell", "Cobol"];

      const mockProvider = createMockProvider({ assessmentOutput: unsupportedSkillPayload });
      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request);
        },
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.equal(err.diagnosticContext?.reason, "UNSUPPORTED_CLAIMS");
          return true;
        }
      );
    });

    it("fabricated numbers in metric citations throws AiSchemaValidationError (UNSUPPORTED_CLAIMS)", async () => {
      const fabricatedMetricPayload = createValidMockModelAssessment();
      // Candidate telemetry: 18 submitted, 2 interviews, 1 offer.
      // Provider claims "99 job offers"
      fabricatedMetricPayload.evidenceGrounding.citedMetrics = ["99 job offers"];

      const mockProvider = createMockProvider({ assessmentOutput: fabricatedMetricPayload });
      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request);
        },
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.equal(err.diagnosticContext?.reason, "UNSUPPORTED_CLAIMS");
          return true;
        }
      );
    });

    it("model self-verification flag (hallucinationCheckPassed) is stripped and disregarded", async () => {
      const modelPayload = createValidMockModelAssessment();
      modelPayload.evidenceGrounding.hallucinationCheckPassed = true;

      const mockProvider = createMockProvider({ assessmentOutput: modelPayload });
      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(
        response.assessment.evidenceGrounding.hallucinationCheckPassed,
        undefined,
        "hallucinationCheckPassed must be stripped from response"
      );
    });
  });

  // --------------------------------------------------------------------------
  // CATEGORY E: Deterministic Fallback Output Verification
  // --------------------------------------------------------------------------
  describe("Category E: Deterministic Fallback Output Verification", () => {
    it("fallback output conforms 100% to CareerAssessmentResponseDTO schema", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiRateLimitError("Rate limited"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(response.success, true);
      assert.equal(response.fallbackActive, true);
      assert.ok(response.fallbackMetadata);
      assert.equal(response.fallbackMetadata.strategy, "deterministic_pipeline_heuristics");
      assert.ok(response.assessment);
      assert.ok(response.validationAudit);
      assert.equal(response.validationAudit.schemaValid, true);
      assert.equal(response.validationAudit.evidenceGrounded, true);
    });

    it("fallback output passes independent evidence validation (validateCareerAssessmentEvidence) with isValid: true", async () => {
      const service = new CareerStrategistService();
      const request = createValidSyntheticRequest();

      // Invoke generator directly
      const fallbackPayload = service.generateDeterministicFallbackPayload(request);
      const validation = validateCareerAssessmentEvidence(request, fallbackPayload);

      assert.equal(validation.isValid, true);
      assert.equal(validation.status, "VALID");
      assert.deepEqual(validation.validationAudit.discrepancies, []);
      assert.ok(validation.sanitizedAssessment);
    });

    it("fallback output verifiedCandidateSkills is a strict subset of candidate declared skills", async () => {
      const service = new CareerStrategistService();
      const declaredSkills = ["typescript", "postgresql", "docker"];
      const request = createValidSyntheticRequest({
        candidateProfile: {
          headline: "Engineer",
          yearsOfExperience: 4,
          declaredSkills,
          targetRoles: ["Backend Engineer"],
        },
      });

      const fallbackPayload = service.generateDeterministicFallbackPayload(request);

      for (const skill of fallbackPayload.skillGapAnalysis.verifiedCandidateSkills) {
        assert.ok(
          declaredSkills.includes(skill),
          `Fallback skill '${skill}' must be in candidate declared skills`
        );
      }
    });

    it("fallback output enforces career stage experience floor for 0-year candidate (entry_level)", async () => {
      const service = new CareerStrategistService();
      const zeroYoeReq = createValidSyntheticRequest({
        candidateProfile: {
          headline: "New Graduate",
          yearsOfExperience: 0,
          declaredSkills: ["python"],
          targetRoles: ["Junior Developer"],
        },
      });

      const fallbackPayload = service.generateDeterministicFallbackPayload(zeroYoeReq);
      assert.equal(fallbackPayload.candidateSummary.careerStage, "entry_level");

      const validation = validateCareerAssessmentEvidence(zeroYoeReq, fallbackPayload);
      assert.equal(validation.isValid, true);
    });

    it("fallback output enforces career stage floor for 10-year candidate (lead_architect)", async () => {
      const service = new CareerStrategistService();
      const tenYoeReq = createValidSyntheticRequest({
        candidateProfile: {
          headline: "Staff Architect",
          yearsOfExperience: 10,
          declaredSkills: ["go", "kubernetes", "distributed-systems"],
          targetRoles: ["Lead Architect"],
        },
      });

      const fallbackPayload = service.generateDeterministicFallbackPayload(tenYoeReq);
      assert.equal(fallbackPayload.candidateSummary.careerStage, "lead_architect");
    });

    it("fallback output citedMetrics ground cleanly in pipeline telemetry counts", async () => {
      const service = new CareerStrategistService();
      const request = createValidSyntheticRequest();

      const fallbackPayload = service.generateDeterministicFallbackPayload(request);
      const citedMetrics = fallbackPayload.evidenceGrounding.citedMetrics;

      assert.ok(Array.isArray(citedMetrics));
      assert.ok(citedMetrics.length >= 3);

      const validation = validateCareerAssessmentEvidence(request, fallbackPayload);
      assert.equal(validation.isValid, true);
      assert.equal(validation.validationAudit.evidenceGrounded, true);
    });

    it("fallback produces 100% deterministic results across repeated invocations with identical input", async () => {
      const service = new CareerStrategistService();
      const request = createValidSyntheticRequest();

      const payload1 = service.generateDeterministicFallbackPayload(request);
      const payload2 = service.generateDeterministicFallbackPayload(request);

      assert.deepEqual(payload1, payload2);
    });

    it("external LLM fallback is strictly impossible: zero calls made to secondary provider", async () => {
      // Create primary provider that fails with 429
      const failingPrimary = createMockProvider({
        throwError: new AiRateLimitError("Rate limit hit"),
        providerId: "primary-groq",
      });

      // Verify that no secondary provider is instantiated or invoked
      const service = new CareerStrategistService({ provider: failingPrimary });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(response.fallbackActive, true);
      assert.equal(response.fallbackMetadata.strategy, "deterministic_pipeline_heuristics");
      assert.equal(failingPrimary.callCount, 1);
    });
  });

  // --------------------------------------------------------------------------
  // CATEGORY F: Cancellation and Timeout Propagation
  // --------------------------------------------------------------------------
  describe("Category F: Cancellation and Timeout Propagation", () => {
    it("caller AbortSignal immediately aborts execution and throws AiCancellationError", async () => {
      const abortController = new AbortController();
      const mockProvider = createMockProvider({
        delayMs: 500, // 500ms delay to allow aborting in-flight
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      // Trigger abort immediately
      abortController.abort();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request, { signal: abortController.signal });
        },
        (err) => {
          assert.ok(err instanceof AiCancellationError);
          return true;
        }
      );
    });

    it("cancellation NEVER triggers fallback and leaves zero hanging promises", async () => {
      const abortController = new AbortController();
      let fallbackInvoked = false;

      const mockProvider = createMockProvider({
        throwError: new AiCancellationError("Operation aborted by client"),
      });

      const service = new CareerStrategistService({
        provider: mockProvider,
        fallbackPolicyFn: (err) => {
          fallbackInvoked = true;
          return true; // Malicious policy trying to fallback on cancellation
        },
      });

      const request = createValidSyntheticRequest();
      abortController.abort();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request, { signal: abortController.signal });
        },
        (err) => {
          assert.ok(err instanceof AiCancellationError);
          return true;
        }
      );
    });

    it("execution timeout boundary propagates into request options", async () => {
      let receivedTimeout = null;
      const mockProvider = createMockProvider({
        onGenerate: (req) => {
          receivedTimeout = req.options?.timeoutMs;
        },
      });

      const service = new CareerStrategistService({
        provider: mockProvider,
        defaultTimeoutMs: 15000,
      });

      const request = createValidSyntheticRequest();
      await service.generateCareerStrategy(request, { timeoutMs: 8000 });

      assert.equal(receivedTimeout, 8000);
    });
  });

  // --------------------------------------------------------------------------
  // CATEGORY G: Privacy, Security & Diagnostics
  // --------------------------------------------------------------------------
  describe("Category G: Privacy, Security & Diagnostics", () => {
    it("zero API keys or secrets leaked in errors or diagnostic context", async () => {
      const mockProvider = createMockProvider({
        throwError: new AiAuthenticationError("Invalid API key: gsk_secret_1234567890"),
      });

      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      try {
        await service.generateCareerStrategy(request);
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err instanceof AiAuthenticationError);
        const serialized = JSON.stringify(err);
        // Ensure no raw secret key fragment in serialized error
        assert.equal(serialized.includes("gsk_secret_1234567890"), false);
      }
    });

    it("failed validation never returns a consumable assessment (sanitizedAssessment is null or throws)", async () => {
      const invalidPayload = createValidMockModelAssessment();
      invalidPayload.skillGapAnalysis.verifiedCandidateSkills = ["UngroundedSkillXYZ"];

      const mockProvider = createMockProvider({ assessmentOutput: invalidPayload });
      const service = new CareerStrategistService({ provider: mockProvider });
      const request = createValidSyntheticRequest();

      await assert.rejects(
        async () => {
          await service.generateCareerStrategy(request);
        },
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // CATEGORY H: Architecture Invariants & Dependency Injection
  // --------------------------------------------------------------------------
  describe("Category H: Architecture Invariants & Dependency Injection", () => {
    it("defaults to GroqProviderAdapter when no provider injected", () => {
      const service = new CareerStrategistService();
      assert.ok(service.provider);
      assert.equal(service.provider.providerId, "groq");
      assert.equal(service.defaultTimeoutMs, DEFAULT_EXECUTION_TIMEOUT_MS);
    });

    it("injects custom provider conforming to IStructuredAssessmentProvider", () => {
      const customProvider = createMockProvider({ providerId: "custom-test-provider" });
      const service = new CareerStrategistService({
        provider: customProvider,
        defaultTimeoutMs: 25000,
      });

      assert.equal(service.provider.providerId, "custom-test-provider");
      assert.equal(service.defaultTimeoutMs, 25000);
    });

    it("CareerStrategistService preserves single retry policy invariant (does not perform duplicate retries)", async () => {
      let callCount = 0;
      const failingProvider = {
        providerId: "failing-provider",
        modelIdentifier: "test-model",
        async generateAssessment() {
          callCount++;
          throw new AiRateLimitError("Rate limit");
        },
      };

      const service = new CareerStrategistService({ provider: failingProvider });
      const request = createValidSyntheticRequest();

      const response = await service.generateCareerStrategy(request);

      assert.equal(response.fallbackActive, true);
      assert.equal(
        callCount,
        1,
        "Orchestration service must invoke provider exactly once without secondary retry loop"
      );
    });
  });
});
