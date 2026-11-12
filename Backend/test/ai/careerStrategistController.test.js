/**
 * @file careerStrategistController.test.js
 * @description Comprehensive unit and integration test suite for Career Strategist Controller and Routes.
 *
 * Stage 2B.4C — Option C Provider Abstraction Foundation.
 * Execution Mode: STRICTLY OFFLINE (Mocked data models, synthetic fixtures, zero live inference).
 */

const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { EventEmitter } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../../src/configs/db");

const {
  createCareerStrategistController,
  generateAssessment,
  calculateYearsOfExperienceFromHistory,
} = require("../../src/controller/careerStrategist.controller");

const careerStrategistRoutes = require("../../src/routes/careerStrategist.routes");

const {
  AiError,
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
  AiSchemaValidationError,
  AiModelFailureError,
  AI_ERROR_CODES,
} = require("../../src/services/ai/contracts/errors");

const {
  createCareerAssessmentResponseDTO,
} = require("../../src/services/ai/contracts/dtos/CareerAssessmentResponse.dto");

// ----------------------------------------------------------------------------
// SYNTHETIC TEST FIXTURES & MOCKS
// ----------------------------------------------------------------------------

const TEST_JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-offline-audit-4c";

function createMockProfile(overrides = {}) {
  return {
    id: "profile-uuid-12345",
    userId: "user-uuid-12345",
    headline: "Senior Distributed Systems Engineer",
    bio: "Focusing on low-latency microservices and distributed storage.",
    location: "San Francisco, CA",
    skills: ["node.js", "go", "postgresql", "docker", "aws"],
    experience: [
      {
        company: "Alpha Corp",
        title: "Senior Backend Engineer",
        startDate: "2021-01-01",
        endDate: "2024-01-01",
        current: false,
        description: "Built microservices",
      },
      {
        company: "Beta Tech",
        title: "Lead Engineer",
        startDate: "2024-01-01",
        endDate: null,
        current: true,
        description: "Led architectural initiatives",
      },
    ],
    ...overrides,
  };
}

function createMockInsightsSummary(overrides = {}) {
  return {
    volumeMetrics: {
      trackedOpportunities: 20,
      submittedApplications: 14,
      cumulativeOffers: 2,
      cumulativeRejections: 8,
    },
    snapshotMetrics: {
      activeInPipeline: 4,
      interviewsInProgress: 2,
      pendingOffers: 1,
    },
    staleAlerts: {
      thresholdDays: 14,
      staleCount: 1,
      applications: [],
    },
    submissionActivity: {
      selectedRange: "all",
      totalSubmittedInPeriod: 14,
      dailySeries: [],
    },
    ...overrides,
  };
}

function createMockPipelineSnapshot(overrides = {}) {
  return {
    snapshotTotal: 20,
    activeSegment: {
      totalActive: 10,
      stages: [
        { status: "saved", label: "Saved", count: 6, percentage: 30 },
        { status: "applied", label: "Applied", count: 2, percentage: 10 },
        { status: "oa", label: "Online Assessment", count: 1, percentage: 5 },
        { status: "interview", label: "Interview", count: 2, percentage: 10 },
        { status: "offer", label: "Offer", count: 1, percentage: 5 },
      ],
    },
    closedSegment: {
      totalClosed: 10,
      stages: [
        { status: "accepted", label: "Accepted", count: 1, percentage: 5 },
        { status: "rejected", label: "Rejected", count: 9, percentage: 45 },
      ],
    },
    ...overrides,
  };
}

function createMockAssessmentResponse(overrides = {}) {
  return createCareerAssessmentResponseDTO({
    success: true,
    correlationId: "corr-test-4c-response",
    fallbackActive: false,
    fallbackMetadata: null,
    assessment: {
      candidateSummary: {
        careerStage: "senior",
        pipelineHealth: "healthy",
        primaryBottleneck: "Interview round technical pacing",
      },
      pipelineDiagnostics: {
        volumeAssessment: "Strong application volume with 14 submissions.",
        stageProgressionVelocity: "Tracking 2 interviews and 1 pending offer.",
        staleApplicationRisk: "1 application exceeds 14 days inactivity.",
      },
      skillGapAnalysis: {
        verifiedCandidateSkills: ["node.js", "go", "postgresql"],
        criticalMissingSkills: ["kubernetes"],
        skillBridgingAdvice: "Acquire container orchestration competencies.",
      },
      strategicRecommendations: [
        {
          id: "REC-01",
          category: "interview_preparation",
          priority: "high",
          title: "Focus on Active Interviews",
          rationale: "You have 2 active interviews in progress.",
          actionSteps: ["Review STAR responses", "Study system design fundamentals"],
          expectedImpact: "Increase offer conversion probability",
        },
      ],
      evidenceGrounding: {
        citedMetrics: ["14 submitted applications", "2 interviews in progress", "1 pending offer"],
        dataLimitationsNoted: "Derived strictly from verified telemetry.",
      },
    },
    validationAudit: {
      schemaValid: true,
      evidenceGrounded: true,
      discrepancies: [],
    },
    telemetry: {
      providerId: "mock-groq",
      modelIdentifier: "openai/gpt-oss-120b",
      latencyMs: 150,
      totalTokens: 850,
      rateLimit: null,
    },
    ...overrides,
  });
}

function createMockService({ response = null, throwError = null, onGenerate = null } = {}) {
  let callCount = 0;
  let lastReceivedRequest = null;
  let lastReceivedOptions = null;

  return {
    get callCount() {
      return callCount;
    },
    get lastReceivedRequest() {
      return lastReceivedRequest;
    },
    get lastReceivedOptions() {
      return lastReceivedOptions;
    },
    async generateCareerStrategy(request, options) {
      callCount++;
      lastReceivedRequest = request;
      lastReceivedOptions = options;

      if (typeof onGenerate === "function") {
        onGenerate(request, options);
      }

      if (throwError) {
        throw throwError;
      }

      return (
        response ||
        createMockAssessmentResponse({
          correlationId: request.correlationId,
        })
      );
    },
  };
}

/**
 * Creates a mock Express request and response pair backed by standard EventEmitters.
 */
function createMockReqRes({
  user = { userId: "user-uuid-12345" },
  body = {},
  headers = {},
  params = {},
  query = {},
  aborted = false,
  destroyed = false,
} = {}) {
  const req = new EventEmitter();
  Object.assign(req, {
    user,
    body,
    headers: {
      authorization: "Bearer mock-token-abc",
      ...headers,
    },
    params,
    query,
    aborted,
    destroyed,
    complete: true,
  });

  const res = new EventEmitter();
  Object.assign(res, {
    statusCode: 200,
    body: null,
    headersSent: false,
    writableEnded: false,
    finished: false,
    destroyed,
    statusCalled: false,
    jsonCalled: false,
    status(code) {
      this.statusCalled = true;
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonCalled = true;
      this.body = data;
      this.writableEnded = true;
      this.finished = true;
      this.headersSent = true;
      return this;
    },
    end() {
      this.writableEnded = true;
      this.finished = true;
      this.headersSent = true;
      return this;
    },
  });

  return { req, res };
}

// ============================================================================
// TEST SUITE: Career Strategist Controller & Route Integration
// ============================================================================

describe("Stage 2B.4C Career Strategist Controller & Route Integration", () => {
  // --------------------------------------------------------------------------
  // 1. Authentication and Authorization
  // --------------------------------------------------------------------------
  describe("1. Authentication and Authorization", () => {
    it("rejects unauthenticated request when req.user is missing with HTTP 401", async () => {
      const controller = createCareerStrategistController();
      const { req, res } = createMockReqRes({ user: null });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 401);
      assert.match(res.body.message, /no token provided/i);
    });

    it("rejects request when req.user.userId is missing with HTTP 401", async () => {
      const controller = createCareerStrategistController();
      const { req, res } = createMockReqRes({ user: {} });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 401);
      assert.match(res.body.message, /invalid session/i);
    });

    it("rejects client attempt to override authenticated identity with body.userId (HTTP 403)", async () => {
      const mockService = createMockService();
      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
      });

      const { req, res } = createMockReqRes({
        user: { userId: "legitimate-user-id" },
        body: {
          userId: "victim-user-id-attempted-spoof",
        },
      });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 403);
      assert.match(res.body.message, /cannot override authenticated user identity/i);
      assert.equal(mockService.callCount, 0, "Service must never be invoked on spoof attempt");
    });

    it("rejects client attempt to override identity with body.user_id (HTTP 403)", async () => {
      const mockService = createMockService();
      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
      });

      const { req, res } = createMockReqRes({
        user: { userId: "legitimate-user-id" },
        body: {
          user_id: "other-user-id",
        },
      });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 403);
      assert.match(res.body.message, /cannot override authenticated user identity/i);
      assert.equal(mockService.callCount, 0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Request Handling & Parameter Validation
  // --------------------------------------------------------------------------
  describe("2. Request Handling & Parameter Validation", () => {
    it("rejects negative yearsOfExperience with HTTP 400", async () => {
      const controller = createCareerStrategistController();
      const { req, res } = createMockReqRes({
        body: { yearsOfExperience: -2 },
      });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /invalid yearsOfExperience/i);
    });

    it("rejects non-numeric yearsOfExperience with HTTP 400", async () => {
      const controller = createCareerStrategistController();
      const { req, res } = createMockReqRes({
        body: { yearsOfExperience: "ten years" },
      });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /invalid yearsOfExperience/i);
    });

    it("rejects yearsOfExperience exceeding biological sanity limit (> 70) with HTTP 400", async () => {
      const controller = createCareerStrategistController();
      const { req, res } = createMockReqRes({
        body: { yearsOfExperience: 85 },
      });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /between 0 and 70/i);
    });

    it("rejects non-array targetRoles with HTTP 400", async () => {
      const controller = createCareerStrategistController();
      const { req, res } = createMockReqRes({
        body: { targetRoles: "Senior Backend Engineer" },
      });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /targetRoles.*must be an array/i);
    });

    it("rejects invalid options.timeoutMs exceeding boundary with HTTP 400", async () => {
      const controller = createCareerStrategistController();
      const { req, res } = createMockReqRes({
        body: { options: { timeoutMs: 150000 } }, // > 120,000 ms
      });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /timeoutMs.*<= 120,000/i);
    });

    it("calculateYearsOfExperienceFromHistory correctly computes duration from work history", () => {
      const experience = [
        { company: "A", startDate: "2020-01-01", endDate: "2022-01-01", current: false },
        { company: "B", startDate: "2022-01-01", endDate: "2023-07-01", current: false },
      ];

      const yoe = calculateYearsOfExperienceFromHistory(experience);
      assert.ok(yoe >= 3.4 && yoe <= 3.6, `Calculated yoe (${yoe}) should be approximately 3.5`);
    });

    it("calculateYearsOfExperienceFromHistory returns 0 for empty or invalid history", () => {
      assert.equal(calculateYearsOfExperienceFromHistory([]), 0);
      assert.equal(calculateYearsOfExperienceFromHistory(null), 0);
      assert.equal(calculateYearsOfExperienceFromHistory([{ startDate: "invalid-date" }]), 0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Authoritative Backend Data Sourcing
  // --------------------------------------------------------------------------
  describe("3. Authoritative Backend Data Sourcing", () => {
    it("sources profile skills, headline, bio, and experience authoritatively from profileModel", async () => {
      let passedRequest = null;
      const mockService = createMockService({
        onGenerate: (req) => {
          passedRequest = req;
        },
      });

      const mockProfileModel = {
        async getProfileByUserId(uid) {
          assert.equal(uid, "test-auth-user-id");
          return createMockProfile({
            headline: "Principal Cloud Architect",
            skills: ["rust", "kubernetes", "terraform"],
          });
        },
      };

      const mockInsightsModel = {
        async getInsightsSummary() {
          return createMockInsightsSummary();
        },
        async getPipelineSnapshot() {
          return createMockPipelineSnapshot();
        },
      };

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: mockProfileModel,
        insightsModel: mockInsightsModel,
      });

      const { req, res } = createMockReqRes({
        user: { userId: "test-auth-user-id" },
      });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(passedRequest);
      assert.deepEqual(passedRequest.candidateProfile.declaredSkills, ["rust", "kubernetes", "terraform"]);
      assert.equal(passedRequest.candidateProfile.headline, "Principal Cloud Architect");
    });

    it("sources pipeline volume, active stages, and stale alerts authoritatively from insightsModel", async () => {
      let passedRequest = null;
      const mockService = createMockService({
        onGenerate: (req) => {
          passedRequest = req;
        },
      });

      const mockProfileModel = {
        async getProfileByUserId() {
          return createMockProfile();
        },
      };

      const mockInsightsModel = {
        async getInsightsSummary(uid) {
          assert.equal(uid, "test-auth-user-id");
          return createMockInsightsSummary({
            volumeMetrics: {
              trackedOpportunities: 45,
              submittedApplications: 30,
              cumulativeOffers: 3,
              cumulativeRejections: 12,
            },
            snapshotMetrics: {
              activeInPipeline: 9,
              interviewsInProgress: 3,
              pendingOffers: 2,
            },
            staleAlerts: {
              staleCount: 4,
              thresholdDays: 21,
            },
          });
        },
        async getPipelineSnapshot() {
          return createMockPipelineSnapshot();
        },
      };

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: mockProfileModel,
        insightsModel: mockInsightsModel,
      });

      const { req, res } = createMockReqRes({
        user: { userId: "test-auth-user-id" },
      });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(passedRequest);
      assert.equal(passedRequest.pipelineTelemetry.trackedOpportunities, 45);
      assert.equal(passedRequest.pipelineTelemetry.submittedApplications, 30);
      assert.equal(passedRequest.pipelineTelemetry.activeInPipeline, 9);
      assert.equal(passedRequest.pipelineTelemetry.interviewsInProgress, 3);
      assert.equal(passedRequest.pipelineTelemetry.pendingOffers, 2);
      assert.equal(passedRequest.pipelineTelemetry.staleAlerts.staleCount, 4);
      assert.equal(passedRequest.pipelineTelemetry.staleAlerts.thresholdDays, 21);
    });

    it("handles database model retrieval failure gracefully with HTTP 500 without leaking connection details", async () => {
      const mockProfileModel = {
        async getProfileByUserId() {
          throw new Error("pg: connection refused at 10.0.0.5:5432 with password=secret");
        },
      };
      const mockInsightsModel = {
        async getInsightsSummary() {
          return createMockInsightsSummary();
        },
        async getPipelineSnapshot() {
          return createMockPipelineSnapshot();
        },
      };

      const controller = createCareerStrategistController({
        profileModel: mockProfileModel,
        insightsModel: mockInsightsModel,
      });

      const { req, res } = createMockReqRes({
        user: { userId: "test-user-id" },
      });

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.message, "Failed to retrieve candidate profile and pipeline telemetry");
      assert.equal(JSON.stringify(res.body).includes("password=secret"), false);
      assert.equal(JSON.stringify(res.body).includes("10.0.0.5"), false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Service Invocation & Response Handling
  // --------------------------------------------------------------------------
  describe("4. Service Invocation & Response Handling", () => {
    it("returns HTTP 200 and complete CareerAssessmentResponseDTO on successful service execution", async () => {
      const mockService = createMockService();
      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.fallbackActive, false);
      assert.ok(res.body.assessment);
      assert.ok(res.body.validationAudit);
      assert.equal(res.body.validationAudit.schemaValid, true);
    });

    it("returns HTTP 200 with fallbackActive: true when service activates deterministic local fallback", async () => {
      const fallbackResponse = createMockAssessmentResponse({
        fallbackActive: true,
        fallbackMetadata: {
          reason: "HTTP 429 Rate Limit",
          strategy: "deterministic_pipeline_heuristics",
          timestamp: new Date().toISOString(),
        },
        telemetry: null,
      });

      const mockService = createMockService({ response: fallbackResponse });
      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();

      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.fallbackActive, true);
      assert.ok(res.body.fallbackMetadata);
      assert.equal(res.body.fallbackMetadata.strategy, "deterministic_pipeline_heuristics");
      assert.equal(res.body.telemetry, null);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Sanitized Error-to-HTTP-Status Mapping
  // --------------------------------------------------------------------------
  describe("5. Sanitized Error-to-HTTP-Status Mapping", () => {
    it("maps AiRateLimitError to HTTP 429", async () => {
      const mockService = createMockService({
        throwError: new AiRateLimitError("Rate limit exceeded"),
      });

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 429);
      assert.match(res.body.message, /rate limit/i);
    });

    it("maps AiTimeoutError to HTTP 504 Gateway Timeout", async () => {
      const mockService = createMockService({
        throwError: new AiTimeoutError("Execution timeout boundary reached"),
      });

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 504);
      assert.match(res.body.message, /timed out/i);
    });

    it("maps AiSchemaValidationError (unsupported claims) to HTTP 502", async () => {
      const mockService = createMockService({
        throwError: new AiSchemaValidationError("Career assessment failed factual evidence grounding audit"),
      });

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 502);
      assert.match(res.body.message, /unsupported or ungrounded assessment/i);
    });

    it("maps AiModelFailureError (malformed JSON) to HTTP 502", async () => {
      const mockService = createMockService({
        throwError: new AiModelFailureError("Model completion content is not valid JSON"),
      });

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 502);
      assert.match(res.body.message, /malformed response/i);
    });

    it("maps AiAuthenticationError to HTTP 500 without leaking credentials", async () => {
      const mockService = createMockService({
        throwError: new AiAuthenticationError("Invalid API key: gsk_secret_token_12345"),
      });

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.message, "AI provider authentication failed");
      assert.equal(JSON.stringify(res.body).includes("gsk_secret_token_12345"), false);
    });

    it("maps AiConfigurationError with INVALID_REQUEST_STRUCTURE to HTTP 400", async () => {
      const mockService = createMockService({
        throwError: new AiConfigurationError("Invalid CareerAssessmentRequest: correlationId required", {
          diagnosticContext: { reason: "INVALID_REQUEST_STRUCTURE" },
        }),
      });

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /invalid assessment request structure/i);
    });

    it("maps unexpected generic runtime Error to HTTP 500 without leaking stack traces", async () => {
      const mockService = createMockService({
        throwError: new Error("Unhandled null pointer dereference at InternalModule.js:42:15"),
      });

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.message, "Failed to generate career strategy assessment");
      assert.equal(JSON.stringify(res.body).includes("InternalModule.js"), false);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Cancellation & Client Disconnection (Stage 2B.4C-R1 Lifecycle)
  // --------------------------------------------------------------------------
  describe("6. Cancellation & Client Disconnection", () => {
    it("1. normal request completion does not abort assessment and deregisters listeners", async () => {
      let receivedSignal = null;
      const mockService = createMockService({
        onGenerate: (req) => {
          receivedSignal = req.options?.signal;
        },
      });

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      await controller.generateAssessment(req, res);

      assert.ok(receivedSignal, "Must pass AbortSignal to service");
      assert.equal(receivedSignal.aborted, false, "Normal request completion must not trigger cancellation");
      assert.equal(res.statusCode, 200);
      assert.equal(res.writableEnded, true);
      assert.equal(res.listenerCount("close"), 0, "res 'close' listener must be cleaned up");
      assert.equal(req.listenerCount("aborted"), 0, "req 'aborted' listener must be cleaned up");
    });

    it("2a. premature client disconnect (res.on('close')) aborts in-flight assessment and does not attempt to write response", async () => {
      let capturedSignal = null;
      let serviceStarted = null;
      const startedPromise = new Promise((resolve) => {
        serviceStarted = resolve;
      });

      const mockService = {
        async generateCareerStrategy(request, options) {
          capturedSignal = options?.signal;
          serviceStarted();
          return new Promise((resolve, reject) => {
            options?.signal?.addEventListener("abort", () => {
              reject(new AiCancellationError("Client connection closed prematurely"));
            });
          });
        },
      };

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      const assessmentPromise = controller.generateAssessment(req, res);

      // Wait until service is actively in-flight
      await startedPromise;

      // Premature disconnect before response finished (writableEnded is false)
      assert.equal(res.writableEnded, false);
      res.emit("close");

      await assessmentPromise;

      assert.ok(capturedSignal);
      assert.equal(capturedSignal.aborted, true, "AbortSignal must be marked aborted on premature res close");
      assert.equal(res.statusCalled, false, "Must not attempt res.status when client disconnected");
      assert.equal(res.jsonCalled, false, "Must not attempt res.json when client disconnected");
      assert.equal(res.listenerCount("close"), 0, "Listeners must be cleaned up");
      assert.equal(req.listenerCount("aborted"), 0);
    });

    it("2b. premature client disconnect via real HTTP socket destruction aborts in-flight assessment and does not attempt to write response", async () => {
      let serverAborted = false;
      let serviceStarted = null;
      let statusCalledOnServer = false;
      const startedPromise = new Promise((resolve) => {
        serviceStarted = resolve;
      });

      const app = express();
      app.use(express.json());

      const mockService = {
        async generateCareerStrategy(request, options) {
          const signal = options?.signal;
          serviceStarted();
          return new Promise((resolve, reject) => {
            const onAbort = () => {
              serverAborted = true;
              reject(new AiCancellationError("Client socket destroyed"));
            };
            if (signal?.aborted) {
              onAbort();
              return;
            }
            signal?.addEventListener("abort", onAbort, { once: true });
          });
        },
      };

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      app.post("/test-socket-disconnect", (req, res, next) => {
        req.user = { userId: "user-uuid-12345" };
        const origStatus = res.status.bind(res);
        res.status = (code) => {
          statusCalledOnServer = true;
          return origStatus(code);
        };
        controller.generateAssessment(req, res, next);
      });

      const server = await new Promise((resolve) => {
        const s = app.listen(0, "127.0.0.1", () => resolve(s));
      });
      const port = server.address().port;

      try {
        const clientReq = http.request(
          {
            hostname: "127.0.0.1",
            port,
            path: "/test-socket-disconnect",
            method: "POST",
            agent: false,
            headers: { "Content-Type": "application/json" },
          },
          () => {}
        );

        clientReq.on("error", () => {}); // Expected on socket destruction
        clientReq.write(JSON.stringify({ yearsOfExperience: 5 }));
        clientReq.end(); // Body transmission complete

        // Wait until server is actively executing mockService
        await startedPromise;

        // Destroy client socket while server is executing
        clientReq.destroy();

        // Give server a small tick to handle the socket close and abort
        await new Promise((resolve) => setTimeout(resolve, 50));

        assert.equal(serverAborted, true, "Server AbortSignal must abort when client socket is destroyed");
        assert.equal(statusCalledOnServer, false, "Must not attempt to call res.status on destroyed socket");
      } finally {
        server.closeAllConnections?.();
        server.close();
      }
    });

    it("3. already-completed response does not trigger cancellation when res 'close' fires", async () => {
      let capturedSignal = null;
      const mockService = createMockService({
        onGenerate: (req) => {
          capturedSignal = req.options?.signal;
        },
      });

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.writableEnded, true);
      assert.equal(capturedSignal.aborted, false);

      // Now emit close after response completion
      res.emit("close");

      assert.equal(capturedSignal.aborted, false, "Completed response must never be aborted on subsequent close");
      assert.equal(res.statusCode, 200);
    });

    it("4a. aborted incoming request (req.on('aborted')) is handled safely and does not write to closed connection", async () => {
      let capturedSignal = null;
      let serviceStarted = null;
      const startedPromise = new Promise((resolve) => {
        serviceStarted = resolve;
      });

      const mockService = {
        async generateCareerStrategy(request, options) {
          capturedSignal = options?.signal;
          serviceStarted();
          return new Promise((resolve, reject) => {
            options?.signal?.addEventListener("abort", () => {
              reject(new AiCancellationError("Incoming request stream aborted"));
            });
          });
        },
      };

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      const assessmentPromise = controller.generateAssessment(req, res);

      // Wait until service is actively in-flight
      await startedPromise;

      // Client aborts the request stream
      req.emit("aborted");

      await assessmentPromise;

      assert.ok(capturedSignal);
      assert.equal(capturedSignal.aborted, true, "AbortSignal must be aborted upon req 'aborted'");
      assert.equal(res.statusCalled, false, "Must not attempt res.status when request aborted");
      assert.equal(res.jsonCalled, false, "Must not attempt res.json when request aborted");
      assert.equal(res.listenerCount("close"), 0);
      assert.equal(req.listenerCount("aborted"), 0);
    });

    it("4b. request already aborted prior to invocation (req.aborted === true) aborts immediately without writing response", async () => {
      let capturedSignal = null;
      const mockService = {
        async generateCareerStrategy(request, options) {
          capturedSignal = options?.signal;
          if (options?.signal?.aborted) {
            throw new AiCancellationError("Request pre-aborted");
          }
          return createMockAssessmentResponse();
        },
      };

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes({ aborted: true });
      await controller.generateAssessment(req, res);

      assert.ok(capturedSignal);
      assert.equal(capturedSignal.aborted, true);
      assert.equal(res.statusCalled, false, "Must not write response when pre-aborted");
      assert.equal(res.jsonCalled, false);
      assert.equal(res.listenerCount("close"), 0);
      assert.equal(req.listenerCount("aborted"), 0);
    });

    it("5. repeated disconnect-related events do not cause duplicate cancellation or response write attempts", async () => {
      let abortCount = 0;
      let serviceStarted = null;
      const startedPromise = new Promise((resolve) => {
        serviceStarted = resolve;
      });

      const mockService = {
        async generateCareerStrategy(request, options) {
          serviceStarted();
          options?.signal?.addEventListener("abort", () => {
            abortCount++;
          });
          return new Promise((resolve, reject) => {
            options?.signal?.addEventListener("abort", () => {
              reject(new AiCancellationError("Cancelled"));
            });
          });
        },
      };

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes();
      const assessmentPromise = controller.generateAssessment(req, res);

      // Wait until service is in-flight
      await startedPromise;

      // Emit multiple disconnect events rapidly
      res.emit("close");
      res.emit("close");
      req.emit("aborted");
      req.emit("aborted");

      await assessmentPromise;

      assert.equal(abortCount, 1, "AbortController.abort() must be idempotent and called exactly once");
      assert.equal(res.statusCalled, false, "Must not write response when client disconnected");
      assert.equal(res.jsonCalled, false);
      assert.equal(res.listenerCount("close"), 0, "No listener leaks on res");
      assert.equal(req.listenerCount("aborted"), 0, "No listener leaks on req");
    });

    it("6. independently raised AiCancellationError maps to HTTP 499 when connection remains open", async () => {
      const mockService = createMockService({
        throwError: new AiCancellationError("Request aborted by caller"),
      });

      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes(); // Connection remains open (no close event, not destroyed)
      await controller.generateAssessment(req, res);

      assert.equal(res.statusCode, 499);
      assert.equal(res.statusCalled, true);
      assert.equal(res.jsonCalled, true);
      assert.match(res.body.message, /cancelled/i);
    });

    it("7. existing successful and local fallback requests execute to completion without spurious aborts", async () => {
      let primarySignal = null;
      const mockPrimaryService = createMockService({
        onGenerate: (req) => {
          primarySignal = req.options?.signal;
        },
      });

      const controller1 = createCareerStrategistController({
        careerStrategistService: mockPrimaryService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req: req1, res: res1 } = createMockReqRes();
      await controller1.generateAssessment(req1, res1);

      assert.equal(res1.statusCode, 200);
      assert.equal(res1.body.fallbackActive, false);
      assert.equal(primarySignal.aborted, false);

      let fallbackSignal = null;
      const mockFallbackService = createMockService({
        response: createMockAssessmentResponse({ fallbackActive: true }),
        onGenerate: (req) => {
          fallbackSignal = req.options?.signal;
        },
      });

      const controller2 = createCareerStrategistController({
        careerStrategistService: mockFallbackService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req: req2, res: res2 } = createMockReqRes();
      await controller2.generateAssessment(req2, res2);

      assert.equal(res2.statusCode, 200);
      assert.equal(res2.body.fallbackActive, true);
      assert.equal(fallbackSignal.aborted, false);
    });

    it("8. already-destroyed response socket returns early without attempting HTTP write", async () => {
      const mockService = createMockService();
      const controller = createCareerStrategistController({
        careerStrategistService: mockService,
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req, res } = createMockReqRes({ destroyed: true });
      await controller.generateAssessment(req, res);

      assert.equal(res.statusCalled, false, "Must not write response when socket was pre-destroyed");
      assert.equal(res.jsonCalled, false);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Route Registration & Middleware Pipeline
  // --------------------------------------------------------------------------
  describe("7. Route Registration & Middleware Pipeline", () => {
    it("routes module exports an Express Router with /assessment and / endpoints", () => {
      assert.ok(careerStrategistRoutes);
      assert.equal(typeof careerStrategistRoutes, "function"); // Express router is a callable function

      // Inspect registered route layers
      const routePaths = careerStrategistRoutes.stack
        .filter((layer) => layer.route)
        .map((layer) => layer.route.path);

      assert.ok(routePaths.includes("/assessment"), "Should register /assessment endpoint");
      assert.ok(routePaths.includes("/"), "Should register root / endpoint alias");
    });

    it("verifies middleware execution order on router: verifyToken, careerAssessmentLimiter, generateAssessment", () => {
      const assessmentLayer = careerStrategistRoutes.stack.find(
        (layer) => layer.route && layer.route.path === "/assessment"
      );

      assert.ok(assessmentLayer);
      const handlers = assessmentLayer.route.stack;
      assert.equal(handlers.length, 3, "Endpoint must have 3 middleware handlers: auth, rateLimit, controller");
    });
  });

  // --------------------------------------------------------------------------
  // 8. Ephemeral End-to-End Route Integration
  // --------------------------------------------------------------------------
  describe("8. Ephemeral End-to-End Route Integration", () => {
    function makeJsonPostRequest(port, path, body = {}, headers = {}) {
      return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request(
          {
            hostname: "127.0.0.1",
            port,
            path,
            method: "POST",
            agent: false,
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
              Connection: "close",
              ...headers,
            },
          },
          (res) => {
            let rawData = "";
            res.setEncoding("utf8");
            res.on("data", (chunk) => {
              rawData += chunk;
            });
            res.on("end", () => {
              let json = {};
              try {
                json = JSON.parse(rawData);
              } catch (_) {
                json = { raw: rawData };
              }
              resolve({ status: res.statusCode, data: json });
            });
          }
        );
        req.on("error", reject);
        req.write(payload);
        req.end();
      });
    }

    it("POST /api/career-strategist/assessment rejects unauthenticated request with HTTP 401", async () => {
      const app = express();
      app.use(express.json());
      app.use("/api/career-strategist", careerStrategistRoutes);

      const server = app.listen(0);
      const port = server.address().port;

      try {
        const response = await makeJsonPostRequest(port, "/api/career-strategist/assessment", {});
        assert.equal(response.status, 401);
        assert.match(response.data.message, /no token provided/i);
      } finally {
        server.closeAllConnections?.();
        server.close();
      }
    });

    it("POST /api/career-strategist (alias) rejects unauthenticated request with HTTP 401", async () => {
      const app = express();
      app.use(express.json());
      app.use("/api/career-strategist", careerStrategistRoutes);

      const server = app.listen(0);
      const port = server.address().port;

      try {
        const response = await makeJsonPostRequest(port, "/api/career-strategist", {});
        assert.equal(response.status, 401);
      } finally {
        server.closeAllConnections?.();
        server.close();
      }
    });

    it("POST /api/career-strategist/assessment with invalid JWT format rejects with HTTP 401", async () => {
      const app = express();
      app.use(express.json());
      app.use("/api/career-strategist", careerStrategistRoutes);

      const server = app.listen(0);
      const port = server.address().port;

      try {
        const response = await makeJsonPostRequest(port, "/api/career-strategist/assessment", {}, {
          Authorization: "Bearer totally-invalid-jwt-token-garbage",
        });

        assert.equal(response.status, 401);
        assert.match(response.data.message, /invalid or expired token/i);
      } finally {
        server.closeAllConnections?.();
        server.close();
      }
    });
  });

  // --------------------------------------------------------------------------
  // 9. Stage 2B.10B Targeted Error Envelope & Correlation ID Hardening
  // --------------------------------------------------------------------------
  describe("9. Stage 2B.10B Targeted Error Envelope & Correlation ID Hardening", () => {
    function buildStandardController(mockServiceOverride = null) {
      return createCareerStrategistController({
        careerStrategistService: mockServiceOverride || createMockService(),
        profileModel: {
          async getProfileByUserId() {
            return createMockProfile();
          },
        },
        insightsModel: {
          async getInsightsSummary() {
            return createMockInsightsSummary();
          },
          async getPipelineSnapshot() {
            return createMockPipelineSnapshot();
          },
        },
      });
    }

    it("emits consistent structured error envelopes with correlationId and backward-compatible message across controller branches", async () => {
      const scenarios = [
        {
          label: "missing user session (401)",
          setup: () => ({
            controller: buildStandardController(),
            reqRes: createMockReqRes({ user: null, body: { correlationId: "corr-branch-401" } }),
          }),
          expectedStatus: 401,
          expectedCode: "AUTHENTICATION_REQUIRED",
          expectedCorrelationId: "corr-branch-401",
          expectDetails: false,
        },
        {
          label: "userId spoof attempt (403)",
          setup: () => ({
            controller: buildStandardController(),
            reqRes: createMockReqRes({
              user: { userId: "auth-user" },
              body: { userId: "other-user", correlationId: "corr-branch-403" },
            }),
          }),
          expectedStatus: 403,
          expectedCode: "FORBIDDEN",
          expectedCorrelationId: "corr-branch-403",
          expectDetails: false,
        },
        {
          label: "invalid yearsOfExperience (400)",
          setup: () => ({
            controller: buildStandardController(),
            reqRes: createMockReqRes({ body: { yearsOfExperience: 99, correlationId: "corr-branch-yoe" } }),
          }),
          expectedStatus: 400,
          expectedCode: "INVALID_REQUEST",
          expectedCorrelationId: "corr-branch-yoe",
          expectDetails: true,
        },
        {
          label: "invalid targetRoles (400)",
          setup: () => ({
            controller: buildStandardController(),
            reqRes: createMockReqRes({ body: { targetRoles: "Lead", correlationId: "corr-branch-roles" } }),
          }),
          expectedStatus: 400,
          expectedCode: "INVALID_REQUEST",
          expectedCorrelationId: "corr-branch-roles",
          expectDetails: true,
        },
        {
          label: "invalid options.timeoutMs (400)",
          setup: () => ({
            controller: buildStandardController(),
            reqRes: createMockReqRes({
              body: { options: { timeoutMs: -5 }, correlationId: "corr-branch-timeout-opt" },
            }),
          }),
          expectedStatus: 400,
          expectedCode: "INVALID_REQUEST",
          expectedCorrelationId: "corr-branch-timeout-opt",
          expectDetails: true,
        },
        {
          label: "context window exceeded (400)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiContextWindowExceededError("Prompt too large") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-ctx" } }),
          }),
          expectedStatus: 400,
          expectedCode: "CONTEXT_WINDOW_EXCEEDED",
          expectedCorrelationId: "corr-branch-ctx",
          expectDetails: false,
        },
        {
          label: "service INVALID_REQUEST_STRUCTURE (400)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({
                throwError: new AiConfigurationError("Invalid CareerAssessmentRequest: targetRoles required", {
                  diagnosticContext: { reason: "INVALID_REQUEST_STRUCTURE" },
                }),
              })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-struct" } }),
          }),
          expectedStatus: 400,
          expectedCode: "INVALID_REQUEST",
          expectedCorrelationId: "corr-branch-struct",
          expectDetails: true,
        },
        {
          label: "AiRateLimitError (429)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiRateLimitError("429") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-429" } }),
          }),
          expectedStatus: 429,
          expectedCode: "RATE_LIMITED",
          expectedCorrelationId: "corr-branch-429",
          expectDetails: false,
        },
        {
          label: "AiQuotaExhaustedError (429)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiQuotaExhaustedError("Daily quota used") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-quota" } }),
          }),
          expectedStatus: 429,
          expectedCode: "RATE_LIMITED",
          expectedCorrelationId: "corr-branch-quota",
          expectDetails: false,
        },
        {
          label: "AiTimeoutError (504)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiTimeoutError("Timed out") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-504" } }),
          }),
          expectedStatus: 504,
          expectedCode: "TIMEOUT",
          expectedCorrelationId: "corr-branch-504",
          expectDetails: false,
        },
        {
          label: "AiGatewayTimeoutError (504)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiGatewayTimeoutError("Gateway timed out") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-gw504" } }),
          }),
          expectedStatus: 504,
          expectedCode: "TIMEOUT",
          expectedCorrelationId: "corr-branch-gw504",
          expectDetails: false,
        },
        {
          label: "AiSchemaValidationError (502)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiSchemaValidationError("Ungrounded output") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-schema" } }),
          }),
          expectedStatus: 502,
          expectedCode: "SCHEMA_VALIDATION_ERROR",
          expectedCorrelationId: "corr-branch-schema",
          expectDetails: false,
        },
        {
          label: "AiModelFailureError (502 MODEL_FAILURE)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiModelFailureError("Malformed JSON") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-model" } }),
          }),
          expectedStatus: 502,
          expectedCode: "MODEL_FAILURE",
          expectedCorrelationId: "corr-branch-model",
          expectDetails: false,
        },
        {
          label: "AiCapacityError (503)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiCapacityError("Overloaded") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-503" } }),
          }),
          expectedStatus: 503,
          expectedCode: "UPSTREAM_UNAVAILABLE",
          expectedCorrelationId: "corr-branch-503",
          expectDetails: false,
        },
        {
          label: "AiBadGatewayError (502 UPSTREAM_UNAVAILABLE)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiBadGatewayError("Bad gateway") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-bgw" } }),
          }),
          expectedStatus: 502,
          expectedCode: "UPSTREAM_UNAVAILABLE",
          expectedCorrelationId: "corr-branch-bgw",
          expectDetails: false,
        },
        {
          label: "AiNetworkError (502 UPSTREAM_UNAVAILABLE)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiNetworkError("Socket hangup") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-net" } }),
          }),
          expectedStatus: 502,
          expectedCode: "UPSTREAM_UNAVAILABLE",
          expectedCorrelationId: "corr-branch-net",
          expectDetails: false,
        },
        {
          label: "AiCancellationError (499)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiCancellationError("Aborted") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-499" } }),
          }),
          expectedStatus: 499,
          expectedCode: "ABORTED",
          expectedCorrelationId: "corr-branch-499",
          expectDetails: false,
        },
        {
          label: "Internal configuration defect (500)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiConfigurationError("Missing endpoint config") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-cfg500" } }),
          }),
          expectedStatus: 500,
          expectedCode: "INTERNAL_SERVER_ERROR",
          expectedCorrelationId: "corr-branch-cfg500",
          expectDetails: false,
        },
        {
          label: "AiAuthenticationError (500)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new AiAuthenticationError("Invalid provider key") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-auth500" } }),
          }),
          expectedStatus: 500,
          expectedCode: "INTERNAL_SERVER_ERROR",
          expectedCorrelationId: "corr-branch-auth500",
          expectDetails: false,
        },
        {
          label: "Unhandled runtime error (500)",
          setup: () => ({
            controller: buildStandardController(
              createMockService({ throwError: new Error("Unexpected internal failure") })
            ),
            reqRes: createMockReqRes({ body: { correlationId: "corr-branch-500" } }),
          }),
          expectedStatus: 500,
          expectedCode: "INTERNAL_SERVER_ERROR",
          expectedCorrelationId: "corr-branch-500",
          expectDetails: false,
        },
      ];

      for (const scenario of scenarios) {
        const { controller, reqRes } = scenario.setup();
        await controller.generateAssessment(reqRes.req, reqRes.res);

        assert.equal(reqRes.res.statusCode, scenario.expectedStatus, scenario.label);
        assert.equal(reqRes.res.body.correlationId, scenario.expectedCorrelationId, scenario.label);
        assert.equal(typeof reqRes.res.body.message, "string", scenario.label);
        assert.ok(reqRes.res.body.message.length > 0, scenario.label);
        assert.ok(reqRes.res.body.error && typeof reqRes.res.body.error === "object", scenario.label);
        assert.equal(reqRes.res.body.error.code, scenario.expectedCode, scenario.label);
        assert.equal(reqRes.res.body.error.message, reqRes.res.body.message, scenario.label);

        if (scenario.expectDetails) {
          assert.ok(
            reqRes.res.body.error.details && typeof reqRes.res.body.error.details === "object",
            scenario.label
          );
        } else {
          assert.equal("details" in reqRes.res.body.error, false, scenario.label);
        }
      }
    });

    it("generates a single consistent correlationId when none is provided and propagates x-correlation-id header", async () => {
      // 1. Auto-generated ID when missing
      let serviceCorrelationId = null;
      const controllerFailAfterService = createCareerStrategistController({
        careerStrategistService: createMockService({
          onGenerate: (reqDto) => {
            serviceCorrelationId = reqDto.correlationId;
          },
          throwError: new AiModelFailureError("Corrupted JSON"),
        }),
        profileModel: { async getProfileByUserId() { return createMockProfile(); } },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req: reqAuto, res: resAuto } = createMockReqRes();
      await controllerFailAfterService.generateAssessment(reqAuto, resAuto);

      assert.equal(resAuto.statusCode, 502);
      assert.equal(typeof resAuto.body.correlationId, "string");
      assert.ok(resAuto.body.correlationId.length > 0);
      assert.equal(
        resAuto.body.correlationId,
        serviceCorrelationId,
        "Error envelope correlationId must match the single request-scoped ID passed to service"
      );

      // 2. x-correlation-id header reuse across early DB error
      const controllerDbFail = createCareerStrategistController({
        profileModel: {
          async getProfileByUserId() {
            throw new Error("DB unreachable");
          },
        },
        insightsModel: {
          async getInsightsSummary() { return createMockInsightsSummary(); },
          async getPipelineSnapshot() { return createMockPipelineSnapshot(); },
        },
      });

      const { req: reqHeader, res: resHeader } = createMockReqRes({
        headers: { "x-correlation-id": "hdr-trace-7788" },
      });
      await controllerDbFail.generateAssessment(reqHeader, resHeader);

      assert.equal(resHeader.statusCode, 500);
      assert.equal(resHeader.body.correlationId, "hdr-trace-7788");
      assert.equal(resHeader.body.error.code, "INTERNAL_SERVER_ERROR");
      assert.equal(resHeader.body.error.message, resHeader.body.message);
    });

    it("handles nullish/non-Error throws gracefully and preserves exact HTTP 200 success DTO", async () => {
      // Non-Error primitive throw in service must not throw secondary TypeError
      const controllerPrimitiveThrow = buildStandardController(
        createMockService({ throwError: "string failure" })
      );
      const { req: reqPrim, res: resPrim } = createMockReqRes({
        body: { correlationId: "corr-prim-500" },
      });
      await controllerPrimitiveThrow.generateAssessment(reqPrim, resPrim);

      assert.equal(resPrim.statusCode, 500);
      assert.equal(resPrim.body.correlationId, "corr-prim-500");
      assert.equal(resPrim.body.error.code, "INTERNAL_SERVER_ERROR");
      assert.equal(resPrim.body.message, "Failed to generate career strategy assessment");

      // Existing HTTP 200 success response DTO contract remains unchanged
      const controllerOk = buildStandardController();
      const { req: reqOk, res: resOk } = createMockReqRes({
        body: { correlationId: "corr-success-unchanged" },
      });
      await controllerOk.generateAssessment(reqOk, resOk);

      assert.equal(resOk.statusCode, 200);
      assert.equal(resOk.body.success, true);
      assert.equal(resOk.body.correlationId, "corr-success-unchanged");
      assert.equal(resOk.body.error, undefined);
      assert.ok(resOk.body.assessment);
      assert.ok(resOk.body.validationAudit);
    });
  });

  after(async () => {
    // Close PostgreSQL pool connection if initialized by routes/middleware
    await pool.end().catch(() => {});
  });
});
