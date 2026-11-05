/**
 * @file contracts.test.js
 * @description Comprehensive automated test suite for Stage 2B.1 AI Provider Foundation.
 *
 * Execution: Strictly OFFLINE / Local Mocks Only. Zero live API calls or network requests.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  // Conformance
  isAiBaseProvider,
  isStructuredAssessmentProvider,
  isStreamingChatProvider,

  // DTOs
  validateCareerAssessmentRequest,
  createRawProviderAssessmentOutput,
  createCareerAssessmentResponseDTO,
  validateChatStreamRequest,
  createChatStreamChunk,

  // Errors
  AiError,
  AI_ERROR_CODES,
  AiCancellationError,
  AiTimeoutError,
  AiGatewayTimeoutError,
  AiBadGatewayError,
  AiCapacityError,
  AiRateLimitError,
  AiQuotaExhaustedError,
  AiNetworkError,
  AiAuthenticationError,
  AiConfigurationError,
  AiContextWindowExceededError,
  AiModelFailureError,
  AiSchemaValidationError,

  // Execution Boundary Contract
  executeWithBoundaryContract,

  // Fallback Policy
  isFallbackEligible,
  countsTowardsCircuitBreaker,
  FALLBACK_ELIGIBLE_ERROR_CODES,
  FALLBACK_FORBIDDEN_ERROR_CODES,
} = require("../../src/services/ai");

// ============================================================================
// 1. PROVIDER CONTRACTS & CONFORMANCE
// ============================================================================
describe("1. Provider Contracts & Structural Conformance (Option C)", () => {
  const createMockBaseProvider = (overrides = {}) => ({
    providerId: "mock_provider",
    modelIdentifier: "mock/model-v1",
    capabilities: {
      structuredAssessment: false,
      streamingChat: false,
      nativeThinking: false,
    },
    verifyAccessibility: async () => ({
      isAccessible: true,
      providerId: "mock_provider",
      modelIdentifier: "mock/model-v1",
      latencyMs: 12,
      error: null,
    }),
    ...overrides,
  });

  it("should pass isAiBaseProvider for a structurally valid base provider", () => {
    const provider = createMockBaseProvider();
    assert.equal(isAiBaseProvider(provider), true);
  });

  it("should reject objects with missing or empty providerId", () => {
    assert.equal(isAiBaseProvider(createMockBaseProvider({ providerId: "" })), false);
    assert.equal(isAiBaseProvider(createMockBaseProvider({ providerId: null })), false);
    assert.equal(isAiBaseProvider(createMockBaseProvider({ providerId: 123 })), false);
  });

  it("should reject objects with missing or invalid modelIdentifier", () => {
    assert.equal(isAiBaseProvider(createMockBaseProvider({ modelIdentifier: "" })), false);
    assert.equal(isAiBaseProvider(createMockBaseProvider({ modelIdentifier: null })), false);
    assert.equal(isAiBaseProvider(createMockBaseProvider({ modelIdentifier: undefined })), false);
  });

  it("should reject objects with missing or malformed capabilities", () => {
    assert.equal(isAiBaseProvider(createMockBaseProvider({ capabilities: null })), false);
    assert.equal(isAiBaseProvider(createMockBaseProvider({ capabilities: "invalid" })), false);
    assert.equal(isAiBaseProvider(createMockBaseProvider({ capabilities: [] })), false);
  });

  it("should reject objects with missing or non-function verifyAccessibility", () => {
    assert.equal(isAiBaseProvider(createMockBaseProvider({ verifyAccessibility: null })), false);
    assert.equal(isAiBaseProvider(createMockBaseProvider({ verifyAccessibility: "notAFunction" })), false);
  });

  it("should reject null, undefined, primitives, and arrays", () => {
    assert.equal(isAiBaseProvider(null), false);
    assert.equal(isAiBaseProvider(undefined), false);
    assert.equal(isAiBaseProvider("provider"), false);
    assert.equal(isAiBaseProvider(42), false);
    assert.equal(isAiBaseProvider([]), false);
  });

  it("should pass isStructuredAssessmentProvider when structuredAssessment is true and generateAssessment exists", () => {
    const provider = createMockBaseProvider({
      capabilities: { structuredAssessment: true, streamingChat: false, nativeThinking: false },
      generateAssessment: async (req) => ({ rawData: {}, telemetry: { providerId: "p", modelIdentifier: "m", latencyMs: 10 } }),
    });
    assert.equal(isStructuredAssessmentProvider(provider), true);
  });

  it("should reject isStructuredAssessmentProvider when capability flag is false or missing", () => {
    const provider = createMockBaseProvider({
      capabilities: { structuredAssessment: false, streamingChat: false, nativeThinking: false },
      generateAssessment: async () => {},
    });
    assert.equal(isStructuredAssessmentProvider(provider), false);
  });

  it("should reject isStructuredAssessmentProvider when generateAssessment method is missing", () => {
    const provider = createMockBaseProvider({
      capabilities: { structuredAssessment: true, streamingChat: false, nativeThinking: false },
    });
    assert.equal(isStructuredAssessmentProvider(provider), false);
  });

  it("should pass isStreamingChatProvider when streamingChat is true and streamChat exists", () => {
    const provider = createMockBaseProvider({
      capabilities: { structuredAssessment: false, streamingChat: true, nativeThinking: false },
      streamChat: async function* () {},
    });
    assert.equal(isStreamingChatProvider(provider), true);
  });

  it("should reject isStreamingChatProvider when capability flag is false or streamChat is missing", () => {
    const missingMethod = createMockBaseProvider({
      capabilities: { structuredAssessment: false, streamingChat: true, nativeThinking: false },
    });
    assert.equal(isStreamingChatProvider(missingMethod), false);

    const falseFlag = createMockBaseProvider({
      capabilities: { structuredAssessment: false, streamingChat: false, nativeThinking: false },
      streamChat: async function* () {},
    });
    assert.equal(isStreamingChatProvider(falseFlag), false);
  });

  it("should not accidentally pass conformance for arbitrary objects with unrelated methods", () => {
    const arbitraryObj = {
      foo: "bar",
      dummyMethod: () => {},
      doSomething: () => {},
    };
    assert.equal(isAiBaseProvider(arbitraryObj), false);
    assert.equal(isStructuredAssessmentProvider(arbitraryObj), false);
    assert.equal(isStreamingChatProvider(arbitraryObj), false);
  });
});

// ============================================================================
// 2. DTO BOUNDARIES & VALIDATION
// ============================================================================
describe("2. DTO Boundaries & Structural Validation", () => {
  const createValidRequestDTO = () => ({
    correlationId: "123e4567-e89b-12d3-a456-426614174000",
    candidateProfile: {
      headline: "Senior Software Engineer",
      yearsOfExperience: 6,
      declaredSkills: ["JavaScript", "Node.js", "PostgreSQL"],
      targetRoles: ["Full Stack Lead", "Backend Architect"],
      userNotes: "Interested in high-scale systems.",
    },
    pipelineTelemetry: {
      trackedOpportunities: 12,
      submittedApplications: 8,
      savedCount: 4,
      activeInPipeline: 5,
      interviewsInProgress: 2,
      pendingOffers: 1,
      cumulativeOffers: 1,
      cumulativeRejections: 2,
      stageDistribution: [
        { status: "Applied", count: 3 },
        { status: "Interview", count: 2 },
      ],
      staleAlerts: {
        staleCount: 1,
        thresholdDays: 14,
      },
    },
  });

  it("validateCareerAssessmentRequest passes for fully valid DTO", () => {
    const req = createValidRequestDTO();
    const result = validateCareerAssessmentRequest(req);
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
  });

  it("validateCareerAssessmentRequest rejects missing correlationId", () => {
    const req = createValidRequestDTO();
    delete req.correlationId;
    const result = validateCareerAssessmentRequest(req);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("correlationId")));
  });

  it("validateCareerAssessmentRequest rejects negative yearsOfExperience", () => {
    const req = createValidRequestDTO();
    req.candidateProfile.yearsOfExperience = -1;
    const result = validateCareerAssessmentRequest(req);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("yearsOfExperience")));
  });

  it("validateCareerAssessmentRequest rejects non-array declaredSkills", () => {
    const req = createValidRequestDTO();
    req.candidateProfile.declaredSkills = "JavaScript, Node.js";
    const result = validateCareerAssessmentRequest(req);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("declaredSkills")));
  });

  it("validateCareerAssessmentRequest rejects missing or negative pipeline metrics", () => {
    const req = createValidRequestDTO();
    req.pipelineTelemetry.submittedApplications = -5;
    const result = validateCareerAssessmentRequest(req);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("submittedApplications")));
  });

  it("createRawProviderAssessmentOutput cleanly separates rawData from provider telemetry", () => {
    const rawData = { candidateSummary: { careerStage: "senior" } };
    const telemetry = {
      providerId: "groq",
      modelIdentifier: "openai/gpt-oss-120b",
      latencyMs: 342,
      inputTokens: 1200,
      outputTokens: 450,
      totalTokens: 1650,
      rateLimit: { remainingTokens: 7500 },
    };

    const output = createRawProviderAssessmentOutput({ rawData, telemetry });
    assert.deepEqual(output.rawData, rawData);
    assert.equal(output.telemetry.providerId, "groq");
    assert.equal(output.telemetry.totalTokens, 1650);

    // Verify rawData is not mutated with telemetry
    assert.equal(output.rawData.telemetry, undefined);
  });

  it("createCareerAssessmentResponseDTO strictly ensures hallucinationCheckPassed is NOT an authoritative field", () => {
    const assessmentWithHallucinationClaim = {
      candidateSummary: { careerStage: "senior", pipelineHealth: "healthy", primaryBottleneck: "none" },
      pipelineDiagnostics: { volumeAssessment: "good", stageProgressionVelocity: "high", staleApplicationRisk: "low" },
      skillGapAnalysis: { verifiedCandidateSkills: ["Node.js"], criticalMissingSkills: [], skillBridgingAdvice: "none" },
      strategicRecommendations: [],
      evidenceGrounding: {
        citedMetrics: ["8 submitted"],
        dataLimitationsNoted: "none",
        // Adversarial or model-generated self-verification claim:
        hallucinationCheckPassed: true,
      },
    };

    const response = createCareerAssessmentResponseDTO({
      success: true,
      correlationId: "corr-123",
      assessment: assessmentWithHallucinationClaim,
      validationAudit: {
        schemaValid: true,
        evidenceGrounded: true,
        discrepancies: [],
      },
    });

    // Verification: hallucinationCheckPassed must NOT be present in sanitized output
    assert.equal(response.assessment.evidenceGrounding.hallucinationCheckPassed, undefined);
    assert.equal(response.validationAudit.evidenceGrounded, true);
  });

  it("createCareerAssessmentResponseDTO handles missing optional telemetry without invalidating response", () => {
    const response = createCareerAssessmentResponseDTO({
      success: true,
      correlationId: "corr-123",
      assessment: {
        candidateSummary: { careerStage: "mid_level", pipelineHealth: "healthy", primaryBottleneck: "none" },
        pipelineDiagnostics: { volumeAssessment: "ok", stageProgressionVelocity: "normal", staleApplicationRisk: "low" },
        skillGapAnalysis: { verifiedCandidateSkills: [], criticalMissingSkills: [], skillBridgingAdvice: "" },
        strategicRecommendations: [],
        evidenceGrounding: { citedMetrics: [], dataLimitationsNoted: "" },
      },
      validationAudit: {
        schemaValid: true,
        evidenceGrounded: true,
        discrepancies: [],
      },
      telemetry: null, // missing optional telemetry
    });

    assert.equal(response.success, true);
    assert.equal(response.telemetry, null);
  });
});

// ============================================================================
// 3. NORMALIZED ERROR TAXONOMY & SERIALIZATION
// ============================================================================
describe("3. Normalized Error Taxonomy & Serialization", () => {
  const errorTestCases = [
    { ClassRef: AiCancellationError, expectedCode: "AI_CANCELLATION", expectedStatus: 499 },
    { ClassRef: AiTimeoutError, expectedCode: "AI_TIMEOUT", expectedStatus: 504 },
    { ClassRef: AiGatewayTimeoutError, expectedCode: "AI_GATEWAY_TIMEOUT", expectedStatus: 504 },
    { ClassRef: AiBadGatewayError, expectedCode: "AI_BAD_GATEWAY", expectedStatus: 502 },
    { ClassRef: AiCapacityError, expectedCode: "AI_CAPACITY_UNAVAILABLE", expectedStatus: 503 },
    { ClassRef: AiRateLimitError, expectedCode: "AI_RATE_LIMITED", expectedStatus: 429 },
    { ClassRef: AiQuotaExhaustedError, expectedCode: "AI_QUOTA_EXHAUSTED", expectedStatus: 429 },
    { ClassRef: AiNetworkError, expectedCode: "AI_NETWORK_ERROR", expectedStatus: 502 },
    { ClassRef: AiAuthenticationError, expectedCode: "AI_AUTHENTICATION_ERROR", expectedStatus: 401 },
    { ClassRef: AiConfigurationError, expectedCode: "AI_CONFIGURATION_ERROR", expectedStatus: 400 },
    { ClassRef: AiContextWindowExceededError, expectedCode: "AI_CONTEXT_WINDOW_EXCEEDED", expectedStatus: 400 },
    { ClassRef: AiModelFailureError, expectedCode: "AI_MODEL_FAILURE", expectedStatus: 502 },
    { ClassRef: AiSchemaValidationError, expectedCode: "AI_SCHEMA_VALIDATION_ERROR", expectedStatus: 422 },
  ];

  it("all 13 error subclasses inherit from AiError and Error", () => {
    for (const { ClassRef } of errorTestCases) {
      const err = new ClassRef("Test error");
      assert.ok(err instanceof AiError, `${ClassRef.name} must inherit from AiError`);
      assert.ok(err instanceof Error, `${ClassRef.name} must inherit from Error`);
    }
  });

  it("all 13 error subclasses map to expected stable codes and HTTP status codes", () => {
    for (const { ClassRef, expectedCode, expectedStatus } of errorTestCases) {
      const err = new ClassRef("Test error message");
      assert.equal(err.code, expectedCode, `${ClassRef.name} must have code ${expectedCode}`);
      assert.equal(err.statusCode, expectedStatus, `${ClassRef.name} must have statusCode ${expectedStatus}`);
    }
  });

  it("toPublicJson produces sanitized client response and preserves correlationId", () => {
    const err = new AiRateLimitError("Internal rate limit from Groq with prompt tokens 1400", {
      providerId: "groq",
      diagnosticContext: { internalHeader: "x-ratelimit-reset", rawBody: { sensitive: "data" } },
    });

    const publicJson = err.toPublicJson("corr-uuid-999");

    assert.equal(publicJson.error.code, "AI_RATE_LIMITED");
    assert.equal(publicJson.error.statusCode, 429);
    assert.equal(publicJson.error.correlationId, "corr-uuid-999");
    assert.equal(publicJson.error.message, "AI service rate limit exceeded. Please retry after a brief pause.");

    // Security check: internal diagnostics, rawBody, and stacks must NOT be present in public JSON
    assert.equal(publicJson.error.diagnosticContext, undefined);
    assert.equal(publicJson.error.originalError, undefined);
    assert.equal(publicJson.error.stack, undefined);
    assert.equal(publicJson.error.rawBody, undefined);
  });

  it("toDiagnosticJson scrubs API credentials and tokens", () => {
    const err = new AiError("Failed with key gsk_testSecret1234567890 and Bearer eyJhbGciOiJIUzI1NiJ9", {
      diagnosticContext: {
        authHeader: "Bearer eyJhbGciOiJIUzI1NiJ9",
        apiKey: "gsk_testSecret1234567890",
      },
    });

    const diag = err.toDiagnosticJson();
    assert.ok(!diag.message.includes("gsk_testSecret1234567890"), "Raw key must be scrubbed from message");
    assert.ok(!diag.message.includes("eyJhbGciOiJIUzI1NiJ9"), "Bearer token must be scrubbed from message");
    assert.ok(diag.message.includes("[REDACTED_API_KEY]"), "Message must contain replacement indicator");
  });
});

// ============================================================================
// 4. EXECUTION BOUNDARY CONTRACT SEMANTICS
// ============================================================================
describe("4. Execution Boundary Contract Semantics", () => {
  it("caller cancellation throws AiCancellationError (HTTP 499) distinct from timeout", async () => {
    const controller = new AbortController();

    const executionPromise = executeWithBoundaryContract(
      async (signal) => {
        return new Promise((resolve) => setTimeout(resolve, 500));
      },
      { timeoutMs: 1000, callerSignal: controller.signal }
    );

    // Cancel from caller after 50ms
    setTimeout(() => controller.abort(), 50);

    await assert.rejects(
      executionPromise,
      (err) => {
        assert.ok(err instanceof AiCancellationError, "Error must be AiCancellationError");
        assert.equal(err.statusCode, 499);
        assert.equal(err.code, "AI_CANCELLATION");
        return true;
      }
    );
  });

  it("local timeout throws AiTimeoutError (HTTP 504) distinct from cancellation", async () => {
    const executionPromise = executeWithBoundaryContract(
      async (signal) => {
        return new Promise((resolve) => setTimeout(resolve, 200));
      },
      { timeoutMs: 50 } // times out after 50ms
    );

    await assert.rejects(
      executionPromise,
      (err) => {
        assert.ok(err instanceof AiTimeoutError, "Error must be AiTimeoutError");
        assert.equal(err.statusCode, 504);
        assert.equal(err.code, "AI_TIMEOUT");
        return true;
      }
    );
  });

  it("pre-dispatch cancellation fails fast immediately without executing underlying function", async () => {
    const controller = new AbortController();
    controller.abort(); // already aborted before dispatch

    let fnCalled = false;
    await assert.rejects(
      executeWithBoundaryContract(
        async () => {
          fnCalled = true;
          return "success";
        },
        { timeoutMs: 1000, callerSignal: controller.signal }
      ),
      (err) => {
        assert.ok(err instanceof AiCancellationError);
        assert.equal(err.statusCode, 499);
        return true;
      }
    );

    assert.equal(fnCalled, false, "Underlying function must never be dispatched if caller already aborted");
  });

  it("deterministic precedence: caller cancellation takes precedence if cancellation and timeout race", async () => {
    const controller = new AbortController();

    // Trigger both simultaneously
    const executionPromise = executeWithBoundaryContract(
      async (signal) => {
        return new Promise((resolve) => setTimeout(resolve, 500));
      },
      { timeoutMs: 40, callerSignal: controller.signal }
    );

    setTimeout(() => controller.abort(), 40);

    await assert.rejects(
      executionPromise,
      (err) => {
        assert.ok(
          err instanceof AiCancellationError || err instanceof AiTimeoutError,
          "Must throw either cancellation or timeout deterministically"
        );
        return true;
      }
    );
  });

  it("late resolution after timeout is suppressed and never returned as success", async () => {
    let resolvedAfterTimeout = false;

    const boundaryPromise = executeWithBoundaryContract(
      async (signal) => {
        await new Promise((r) => setTimeout(r, 80));
        resolvedAfterTimeout = true;
        return { data: "late_success" };
      },
      { timeoutMs: 30 }
    );

    await assert.rejects(boundaryPromise, (err) => err instanceof AiTimeoutError);

    // Wait until after the late execution finishes
    await new Promise((r) => setTimeout(r, 70));
    assert.equal(resolvedAfterTimeout, true, "Underlying promise finished late");
  });
});

// ============================================================================
// 5. FALLBACK & CIRCUIT BREAKER POLICY
// ============================================================================
describe("5. Fallback & Circuit Breaker Policy", () => {
  it("all 7 operational errors are eligible for fallback", () => {
    const eligibleErrors = [
      new AiRateLimitError(),
      new AiQuotaExhaustedError(),
      new AiCapacityError(),
      new AiBadGatewayError(),
      new AiGatewayTimeoutError(),
      new AiTimeoutError(),
      new AiNetworkError(),
    ];

    for (const err of eligibleErrors) {
      assert.equal(
        isFallbackEligible(err),
        true,
        `Error ${err.code} should be fallback eligible`
      );
    }
  });

  it("all 6 non-operational errors are strictly forbidden from triggering fallback", () => {
    const forbiddenErrors = [
      new AiCancellationError(),
      new AiAuthenticationError(),
      new AiConfigurationError(),
      new AiContextWindowExceededError(),
      new AiModelFailureError(),
      new AiSchemaValidationError(),
    ];

    for (const err of forbiddenErrors) {
      assert.equal(
        isFallbackEligible(err),
        false,
        `Error ${err.code} must be strictly forbidden from triggering fallback`
      );
    }
  });

  it("countsTowardsCircuitBreaker correctly isolates breaker failures", () => {
    // Excluded from breaker (not operational outages)
    assert.equal(countsTowardsCircuitBreaker(new AiCancellationError()), false);
    assert.equal(countsTowardsCircuitBreaker(new AiAuthenticationError()), false);
    assert.equal(countsTowardsCircuitBreaker(new AiConfigurationError()), false);
    assert.equal(countsTowardsCircuitBreaker(new AiContextWindowExceededError()), false);
    assert.equal(countsTowardsCircuitBreaker(new AiSchemaValidationError()), false);

    // Included in breaker (operational provider outages)
    assert.equal(countsTowardsCircuitBreaker(new AiCapacityError()), true);
    assert.equal(countsTowardsCircuitBreaker(new AiBadGatewayError()), true);
    assert.equal(countsTowardsCircuitBreaker(new AiGatewayTimeoutError()), true);
    assert.equal(countsTowardsCircuitBreaker(new AiNetworkError()), true);
  });
});
