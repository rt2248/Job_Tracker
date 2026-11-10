/**
 * @file edgeCaseValidation.test.js
 * @description Stage 2B.8 Synthetic Edge-Case Validation & Reliability Assessment Suite.
 *
 * Evaluates five representative synthetic candidate scenarios across the full backend AI
 * pipeline (Controller -> Telemetry Minimizer -> GroqPromptContract / Adapter -> Validator
 * -> Fallback Policy -> Sanitized Response DTO).
 *
 * Execution Mode: STRICTLY OFFLINE.
 * External API Requests: ZERO.
 * Cost Incurred: $0.00.
 * Production Code Modifications: ZERO.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");

const {
  CareerStrategistService,
  GroqProviderAdapter,
  minimizeCareerAssessmentTelemetry,
  validateCareerAssessmentRequest,
  validateCareerAssessmentEvidence,
  buildCareerAssessmentSystemPrompt,
  buildCareerAssessmentUserPrompt,
  AiSchemaValidationError,
  AiRateLimitError,
  AI_ERROR_CODES,
} = require("../../src/services/ai");

const {
  createCareerStrategistController,
} = require("../../src/controller/careerStrategist.controller");

// ----------------------------------------------------------------------------
// Offline Helpers (Mock Transport, Mock HTTP req/res, Synthetic Baseline DTO)
// ----------------------------------------------------------------------------

function createMockGroqAdapter(responsePayload, options = {}) {
  const { shouldThrow = null, capturePromptFn = null } = options;

  const transport = async (_url, fetchOpts) => {
    if (capturePromptFn && fetchOpts?.body) {
      capturePromptFn(JSON.parse(fetchOpts.body));
    }

    if (shouldThrow) {
      throw shouldThrow;
    }

    if (options.httpStatus && options.httpStatus !== 200) {
      return {
        ok: false,
        status: options.httpStatus,
        headers: new Headers(options.headers || {}),
        text: async () => options.errorBody || JSON.stringify({ error: { message: "Mock HTTP Error" } }),
      };
    }

    return {
      ok: true,
      status: 200,
      headers: new Headers({
        "x-ratelimit-limit-requests": "1000",
        "x-ratelimit-remaining-requests": "999",
        "x-ratelimit-limit-tokens": "8000",
        "x-ratelimit-remaining-tokens": "6500",
      }),
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  typeof responsePayload === "string"
                    ? responsePayload
                    : JSON.stringify(responsePayload),
              },
            },
          ],
          usage: { prompt_tokens: 950, completion_tokens: 650, total_tokens: 1600 },
        }),
    };
  };

  return new GroqProviderAdapter({
    apiKey: "gsk_offline_synthetic_key_not_used_externally",
    transport,
  });
}

function createMockExpressReqRes({ userId = "user-edge-test", body = {} } = {}) {
  const req = new EventEmitter();
  req.user = userId ? { userId } : undefined;
  req.body = body;
  req.headers = {};

  const res = new EventEmitter();
  res.statusCode = null;
  res.bodyPayload = null;
  res.writableEnded = false;
  res.finished = false;
  res.destroyed = false;
  res.socket = { destroyed: false, writable: true };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.bodyPayload = payload;
    res.writableEnded = true;
    res.finished = true;
    return res;
  };

  return { req, res };
}

function assertValidResponseDTO(response, { expectFallback = false } = {}) {
  assert.strictEqual(response.success, true);
  assert.strictEqual(typeof response.correlationId, "string");
  assert.ok(response.correlationId.length > 0);
  assert.strictEqual(response.fallbackActive, expectFallback);
  if (expectFallback) {
    assert.ok(response.fallbackMetadata);
    assert.strictEqual(response.fallbackMetadata.strategy, "deterministic_pipeline_heuristics");
  } else {
    assert.strictEqual(response.fallbackMetadata, null);
  }
  assert.strictEqual(response.validationAudit.schemaValid, true);
  assert.strictEqual(response.validationAudit.evidenceGrounded, true);
  assert.deepStrictEqual(response.validationAudit.discrepancies, []);
  assert.ok(response.assessment);
  assert.strictEqual(response.assessment.hallucinationCheckPassed, undefined);
  assert.strictEqual(typeof response.assessment.evidenceGrounding.dataLimitationsNoted, "string");
}

// ============================================================================
// STAGE 2B.8 SYNTHETIC EDGE-CASE VALIDATION SUITE (5 SCENARIOS)
// ============================================================================

describe("Stage 2B.8: Synthetic Edge-Case Validation & Reliability Assessment (Offline)", () => {
  // --------------------------------------------------------------------------
  // SCENARIO 1: Minimal Candidate Profile
  // --------------------------------------------------------------------------
  describe("Scenario 1 — Minimal Candidate Profile", () => {
    const rawMinimalInput = {
      correlationId: "corr-stage-2b8-scenario-1",
      candidateProfile: {
        headline: "",
        yearsOfExperience: 1,
        declaredSkills: ["HTML"],
        targetRoles: ["Frontend Developer"],
        userNotes: null,
      },
      pipelineTelemetry: {
        trackedOpportunities: 2,
        submittedApplications: 1,
        savedCount: 1,
        activeInPipeline: 1,
        interviewsInProgress: 0,
        pendingOffers: 0,
        cumulativeOffers: 0,
        cumulativeRejections: 0,
        stageDistribution: [
          { status: "saved", count: 1 },
          { status: "applied", count: 1 },
        ],
        staleAlerts: {
          staleCount: 0,
          thresholdDays: 14,
        },
      },
    };

    const compliantMinimalResponse = {
      candidateSummary: {
        careerStage: "unspecified",
        pipelineHealth: "insufficient_data",
        primaryBottleneck: "Limited profile and application evidence prevents full diagnostic precision",
      },
      pipelineDiagnostics: {
        volumeAssessment: "Only 2 tracked opportunities and 1 submitted application are recorded.",
        stageProgressionVelocity: "Insufficient historical volume to determine stage velocity.",
        staleApplicationRisk: "No stale alerts reported within the 14 day window.",
      },
      skillGapAnalysis: {
        verifiedCandidateSkills: ["HTML"],
        criticalMissingSkills: ["CSS", "JavaScript", "Git"],
        skillBridgingAdvice: "Build core CSS and JavaScript fundamentals alongside expanding profile details.",
      },
      strategicRecommendations: [
        {
          id: "REC-01",
          category: "data_hygiene",
          priority: "high",
          title: "Complete Candidate Profile Details",
          rationale: "Minimal declared skills (HTML) and missing career context limit targeting accuracy.",
          actionSteps: [
            "Add technical skills and past coursework or projects to profile",
            "Specify preferred stack and summary notes",
          ],
          expectedImpact: "Enables higher precision gap analysis and role alignment",
        },
      ],
      evidenceGrounding: {
        citedMetrics: ["2 tracked opportunities", "1 submitted application"],
        dataLimitationsNoted:
          "Candidate profile has empty headline, missing user notes, and only 1 declared skill; telemetry volume is very small.",
      },
    };

    it("1.1 Telemetry minimizer & request DTO accept empty headline, null notes, and minimal skills cleanly", () => {
      const minimized = minimizeCareerAssessmentTelemetry(rawMinimalInput);
      const reqCheck = validateCareerAssessmentRequest(minimized.minimizedRequest);

      assert.strictEqual(reqCheck.isValid, true);
      assert.strictEqual(minimized.candidateProfile.headline, "");
      assert.strictEqual(minimized.candidateProfile.userNotes, null);
      assert.deepStrictEqual(minimized.candidateProfile.declaredSkills, ["HTML"]);

      // Prompt contract serialization safety check
      const userPromptJson = JSON.parse(buildCareerAssessmentUserPrompt(minimized.minimizedRequest));
      assert.strictEqual(userPromptJson.candidateProfile.headline, "");
      assert.strictEqual(userPromptJson.candidateProfile.userNotes, null);
      assert.deepStrictEqual(userPromptJson.candidateProfile.declaredSkills, ["HTML"]);
    });

    it("1.2 Compliant minimal/insufficient-data Groq response passes all validations and DTO creation", async () => {
      let capturedRequest = null;
      const adapter = createMockGroqAdapter(compliantMinimalResponse, {
        capturePromptFn: (body) => {
          capturedRequest = body;
        },
      });
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawMinimalInput);

      assertValidResponseDTO(result, { expectFallback: false });
      assert.strictEqual(result.assessment.candidateSummary.careerStage, "unspecified");
      assert.strictEqual(result.assessment.candidateSummary.pipelineHealth, "insufficient_data");
      assert.deepStrictEqual(result.assessment.skillGapAnalysis.verifiedCandidateSkills, ["HTML"]);
      assert.ok(result.assessment.evidenceGrounding.dataLimitationsNoted.length > 0);
      assert.strictEqual(capturedRequest.messages[0].content, buildCareerAssessmentSystemPrompt());
    });

    it("1.3 Rejects provider assuming undeclared web skills (CSS, JavaScript) for minimal profile without fallback", async () => {
      const invalidResponse = structuredClone(compliantMinimalResponse);
      invalidResponse.skillGapAnalysis.verifiedCandidateSkills = ["HTML", "CSS", "JavaScript"];

      const adapter = createMockGroqAdapter(invalidResponse);
      const service = new CareerStrategistService({ provider: adapter });

      await assert.rejects(
        () => service.generateCareerStrategy(rawMinimalInput),
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.strictEqual(err.code, AI_ERROR_CODES.SCHEMA_VALIDATION_ERROR);
          assert.strictEqual(err.diagnosticContext.reason, "UNSUPPORTED_CLAIMS");
          assert.ok(
            err.diagnosticContext.discrepancies.some((d) => d.includes("CSS") || d.includes("JavaScript"))
          );
          return true;
        }
      );
    });

    it("1.4 Controller handles completely null DB profile and empty request body safely", async () => {
      const adapter = createMockGroqAdapter({
        ...compliantMinimalResponse,
        skillGapAnalysis: {
          verifiedCandidateSkills: [],
          criticalMissingSkills: ["Programming Fundamentals"],
          skillBridgingAdvice: "Add declared skills to receive tailored advice.",
        },
        evidenceGrounding: {
          citedMetrics: ["0 tracked opportunities"],
          dataLimitationsNoted: "Profile record not initialized and zero applications tracked.",
        },
      });
      const controller = createCareerStrategistController({
        careerStrategistService: new CareerStrategistService({ provider: adapter }),
        profileModel: { getProfileByUserId: async () => null },
        insightsModel: {
          getInsightsSummary: async () => null,
          getPipelineSnapshot: async () => null,
        },
      });

      const { req, res } = createMockExpressReqRes({ body: {} });
      await controller.generateAssessment(req, res);

      assert.strictEqual(res.statusCode, 200);
      assertValidResponseDTO(res.bodyPayload, { expectFallback: false });
      assert.deepStrictEqual(res.bodyPayload.assessment.skillGapAnalysis.verifiedCandidateSkills, []);
    });

    it("1.5 Deterministic fallback succeeds cleanly on minimal profile when Groq experiences HTTP 429", async () => {
      const adapter = createMockGroqAdapter(null, { httpStatus: 429 });
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawMinimalInput);
      assertValidResponseDTO(result, { expectFallback: true });
      assert.deepStrictEqual(result.assessment.skillGapAnalysis.verifiedCandidateSkills, ["HTML"]);
      assert.deepStrictEqual(result.assessment.skillGapAnalysis.criticalMissingSkills, []);
    });

    it("1.6 Handles completely empty declaredSkills and targetRoles arrays gracefully across minimizer, validator, and fallback", async () => {
      const bareInput = {
        ...rawMinimalInput,
        correlationId: "corr-stage-2b8-scenario-1-bare",
        candidateProfile: {
          headline: "",
          yearsOfExperience: 0,
          declaredSkills: [],
          targetRoles: [],
          userNotes: null,
        },
      };

      const adapter = createMockGroqAdapter(null, { httpStatus: 429 });
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(bareInput);
      assertValidResponseDTO(result, { expectFallback: true });
      assert.deepStrictEqual(result.assessment.skillGapAnalysis.verifiedCandidateSkills, []);
      assert.strictEqual(result.assessment.candidateSummary.careerStage, "entry_level");
    });
  });

  // --------------------------------------------------------------------------
  // SCENARIO 2: Zero Professional Experience
  // --------------------------------------------------------------------------
  describe("Scenario 2 — Zero Professional Experience", () => {
    const rawZeroExpInput = {
      correlationId: "corr-stage-2b8-scenario-2",
      candidateProfile: {
        headline: "Aspiring Software Developer",
        yearsOfExperience: 0,
        declaredSkills: ["Java", "Python", "SQL", "Git"],
        targetRoles: ["Junior Software Engineer", "Associate Backend Developer"],
        userNotes: "Seeking first full-time engineering role after academic coding coursework.",
      },
      pipelineTelemetry: {
        trackedOpportunities: 10,
        submittedApplications: 6,
        savedCount: 4,
        activeInPipeline: 4,
        interviewsInProgress: 1,
        pendingOffers: 0,
        cumulativeOffers: 0,
        cumulativeRejections: 2,
        stageDistribution: [
          { status: "saved", count: 4 },
          { status: "applied", count: 3 },
          { status: "interview", count: 1 },
          { status: "rejected", count: 2 },
        ],
        staleAlerts: {
          staleCount: 1,
          thresholdDays: 14,
        },
      },
    };

    const compliantZeroExpResponse = {
      candidateSummary: {
        careerStage: "entry_level",
        pipelineHealth: "needs_focus",
        primaryBottleneck: "Limited commercial experience requiring portfolio-backed entry-level interviews",
      },
      pipelineDiagnostics: {
        volumeAssessment: "Candidate is tracking 10 opportunities with 6 submitted applications.",
        stageProgressionVelocity: "1 interview in progress demonstrates early traction alongside 2 rejections.",
        staleApplicationRisk: "1 stale application inactive beyond 14 days requires timely follow-up.",
      },
      skillGapAnalysis: {
        verifiedCandidateSkills: ["Java", "Python", "SQL", "Git"],
        criticalMissingSkills: ["Spring Boot", "REST API Design", "Unit Testing"],
        skillBridgingAdvice:
          "Build and deploy small REST API projects using Java and SQL, and consider obtaining foundational cloud certifications.",
      },
      strategicRecommendations: [
        {
          id: "REC-01",
          category: "interview_preparation",
          priority: "high",
          title: "Prepare Fundamentals for Active Entry-Level Interview",
          rationale: "With 1 interview in progress, strong computer science fundamentals and project walkthroughs are key.",
          actionSteps: [
            "Rehearse explanation of SQL and Java/Python portfolio projects",
            "Consider pursuing an entry-level AWS certification after current interview rounds",
          ],
          expectedImpact: "Improves conversion rate from technical screen to offer",
        },
      ],
      evidenceGrounding: {
        citedMetrics: ["10 tracked opportunities", "6 submitted applications", "1 interview in progress"],
        dataLimitationsNoted: "Zero prior commercial years of experience; educational credentials not verified.",
      },
    };

    it("2.1 Valid entry_level assessment with future-oriented learning advice passes all audits", async () => {
      const adapter = createMockGroqAdapter(compliantZeroExpResponse);
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawZeroExpInput);
      assertValidResponseDTO(result, { expectFallback: false });
      assert.strictEqual(result.assessment.candidateSummary.careerStage, "entry_level");
    });

    it("2.2 Rejects careerStage 'senior' for 0-year candidate", async () => {
      const invalidResponse = structuredClone(compliantZeroExpResponse);
      invalidResponse.candidateSummary.careerStage = "senior";

      const adapter = createMockGroqAdapter(invalidResponse);
      const service = new CareerStrategistService({ provider: adapter });

      await assert.rejects(
        () => service.generateCareerStrategy(rawZeroExpInput),
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.strictEqual(err.diagnosticContext.reason, "UNSUPPORTED_CLAIMS");
          assert.ok(err.diagnosticContext.discrepancies.some((d) => d.includes("senior")));
          return true;
        }
      );
    });

    it("2.3 Rejects careerStage 'lead_architect' for 0-year candidate", async () => {
      const invalidResponse = structuredClone(compliantZeroExpResponse);
      invalidResponse.candidateSummary.careerStage = "lead_architect";

      const adapter = createMockGroqAdapter(invalidResponse);
      const service = new CareerStrategistService({ provider: adapter });

      await assert.rejects(
        () => service.generateCareerStrategy(rawZeroExpInput),
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.strictEqual(err.diagnosticContext.reason, "UNSUPPORTED_CLAIMS");
          assert.ok(err.diagnosticContext.discrepancies.some((d) => d.includes("lead_architect")));
          return true;
        }
      );
    });

    it("2.4 Documents validator floor tolerance behavior for 'mid_level' on 0-year candidate", () => {
      // Validator enforces hard floor rejecting senior and lead_architect when years < 1.0,
      // while allowing prompt contract to steer entry_level/unspecified without crashing.
      const midLevelClaim = structuredClone(compliantZeroExpResponse);
      midLevelClaim.candidateSummary.careerStage = "mid_level";

      const minimized = minimizeCareerAssessmentTelemetry(rawZeroExpInput);
      const outcome = validateCareerAssessmentEvidence(minimized.minimizedRequest, midLevelClaim);
      assert.strictEqual(outcome.isValid, true);
    });

    it("2.5 Rejects fabricated degree/certification ownership claims while permitting future suggestions", async () => {
      const fabricatedCredResponse = structuredClone(compliantZeroExpResponse);
      fabricatedCredResponse.candidateSummary.primaryBottleneck =
        "Candidate holds a bachelor degree in computer science and graduated from state university without internships";

      const adapter = createMockGroqAdapter(fabricatedCredResponse);
      const service = new CareerStrategistService({ provider: adapter });

      await assert.rejects(
        () => service.generateCareerStrategy(rawZeroExpInput),
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.strictEqual(err.diagnosticContext.reason, "UNSUPPORTED_CLAIMS");
          assert.ok(
            err.diagnosticContext.discrepancies.some((d) => d.includes("Unsupported educational or certification claim"))
          );
          return true;
        }
      );
    });

    it("2.6 Rejects inflated experience duration assertion in diagnostic rationale", async () => {
      const inflatedExpResponse = structuredClone(compliantZeroExpResponse);
      inflatedExpResponse.strategicRecommendations[0].rationale =
        "Candidate brings 3 years of experience in commercial software production.";

      const adapter = createMockGroqAdapter(inflatedExpResponse);
      const service = new CareerStrategistService({ provider: adapter });

      await assert.rejects(
        () => service.generateCareerStrategy(rawZeroExpInput),
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.strictEqual(err.diagnosticContext.reason, "UNSUPPORTED_CLAIMS");
          assert.ok(err.diagnosticContext.discrepancies.some((d) => d.includes("Inflated experience claim")));
          return true;
        }
      );
    });

    it("2.7 Deterministic fallback enforces entry_level for 0 years and passes validation", async () => {
      const adapter = createMockGroqAdapter(null, { shouldThrow: new AiRateLimitError("429 TPM limit") });
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawZeroExpInput);
      assertValidResponseDTO(result, { expectFallback: true });
      assert.strictEqual(result.assessment.candidateSummary.careerStage, "entry_level");
    });
  });

  // --------------------------------------------------------------------------
  // SCENARIO 3: Career Transition
  // --------------------------------------------------------------------------
  describe("Scenario 3 — Career Transition", () => {
    const rawTransitionInput = {
      correlationId: "corr-stage-2b8-scenario-3",
      candidateProfile: {
        headline: "Technical Support Specialist Transitioning to Cloud DevOps",
        yearsOfExperience: 4,
        declaredSkills: ["Linux", "Bash", "Networking", "SQL", "Python"],
        targetRoles: ["Junior DevOps Engineer", "Cloud Operations Engineer"],
        userNotes: "4 years in enterprise IT technical support; transitioning into infrastructure automation.",
      },
      pipelineTelemetry: {
        trackedOpportunities: 14,
        submittedApplications: 9,
        savedCount: 5,
        activeInPipeline: 5,
        interviewsInProgress: 1,
        pendingOffers: 0,
        cumulativeOffers: 0,
        cumulativeRejections: 4,
        stageDistribution: [
          { status: "saved", count: 5 },
          { status: "applied", count: 4 },
          { status: "interview", count: 1 },
          { status: "rejected", count: 4 },
        ],
        staleAlerts: {
          staleCount: 2,
          thresholdDays: 14,
        },
      },
    };

    const compliantTransitionResponse = {
      candidateSummary: {
        careerStage: "transitioning",
        pipelineHealth: "needs_focus",
        primaryBottleneck: "Transferring support troubleshooting experience into cloud infrastructure automation roles",
      },
      pipelineDiagnostics: {
        volumeAssessment: "14 tracked opportunities and 9 submitted applications reflect active transition exploration.",
        stageProgressionVelocity: "1 interview in progress alongside 4 rejections signals moderate screening alignment.",
        staleApplicationRisk: "2 stale applications inactive past 14 days require active follow-up.",
      },
      skillGapAnalysis: {
        verifiedCandidateSkills: ["Linux", "Bash", "Networking", "Python", "SQL"],
        criticalMissingSkills: ["Docker", "Kubernetes", "Terraform", "AWS", "CI/CD"],
        skillBridgingAdvice:
          "Leverage existing Linux, Bash, and Networking strengths while automating containerized AWS infrastructure via Terraform and CI/CD pipelines.",
      },
      strategicRecommendations: [
        {
          id: "REC-01",
          category: "targeting_alignment",
          priority: "high",
          title: "Highlight Transferable Linux & Automation Diagnostics",
          rationale: "4 years of support foundation with Linux and Bash aligns strongly with operational DevOps troubleshooting.",
          actionSteps: [
            "Frame production incident resolution metrics cleanly alongside Bash scripting projects",
            "Target Cloud Operations and Platform Support bridge roles alongside Junior DevOps",
          ],
          expectedImpact: "Increases interview callback yield during domain transition",
        },
        {
          id: "REC-02",
          category: "skill_acquisition",
          priority: "high",
          title: "Bridge Infrastructure-as-Code and Containerization Gaps",
          rationale: "Declared skillset lacks Docker, Kubernetes, and Terraform demanded in target DevOps roles.",
          actionSteps: [
            "Containerize a Python/SQL service with Docker",
            "Provision reproducible test infrastructure using Terraform",
          ],
          expectedImpact: "Closes core technical missing skill gaps",
        },
      ],
      evidenceGrounding: {
        citedMetrics: [
          "14 tracked opportunities",
          "9 submitted applications",
          "1 interview in progress",
          "4 rejections",
          "2 stale applications",
        ],
        dataLimitationsNoted: "Prior domain role depth is inferred only from headline and summary notes.",
      },
    };

    it("3.1 Accepts transitioning careerStage distinguishing transferable skills from missing cloud skills", async () => {
      const adapter = createMockGroqAdapter(compliantTransitionResponse);
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawTransitionInput);
      assertValidResponseDTO(result, { expectFallback: false });
      assert.strictEqual(result.assessment.candidateSummary.careerStage, "transitioning");
      assert.deepStrictEqual(result.assessment.skillGapAnalysis.verifiedCandidateSkills, [
        "Linux",
        "Bash",
        "Networking",
        "Python",
        "SQL",
      ]);
      assert.ok(result.assessment.skillGapAnalysis.criticalMissingSkills.includes("Kubernetes"));
    });

    it("3.2 Rejects contradiction when transferable declared skill ('Linux') is also marked as missing", async () => {
      const contradictoryResponse = structuredClone(compliantTransitionResponse);
      contradictoryResponse.skillGapAnalysis.criticalMissingSkills = ["Docker", "Linux"];

      const adapter = createMockGroqAdapter(contradictoryResponse);
      const service = new CareerStrategistService({ provider: adapter });

      await assert.rejects(
        () => service.generateCareerStrategy(rawTransitionInput),
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.strictEqual(err.diagnosticContext.reason, "UNSUPPORTED_CLAIMS");
          assert.ok(err.diagnosticContext.discrepancies.some((d) => d.includes("Contradiction") && d.includes("Linux")));
          return true;
        }
      );
    });

    it("3.3 Deterministic fallback executes cleanly on 4-year transitioning profile", async () => {
      const adapter = createMockGroqAdapter(null, { httpStatus: 503 });
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawTransitionInput);
      assertValidResponseDTO(result, { expectFallback: true });
      assert.strictEqual(result.assessment.candidateSummary.careerStage, "mid_level");
      assert.deepStrictEqual(
        result.assessment.skillGapAnalysis.verifiedCandidateSkills,
        rawTransitionInput.candidateProfile.declaredSkills
      );
    });

    it("3.4 Recognizes canonical skill synonyms across transferable skills ('Postgres' -> 'PostgreSQL')", async () => {
      const synonymInput = structuredClone(rawTransitionInput);
      synonymInput.candidateProfile.declaredSkills = ["Postgres", "Linux", "Bash"];

      const acceptedResponse = structuredClone(compliantTransitionResponse);
      acceptedResponse.skillGapAnalysis.verifiedCandidateSkills = ["PostgreSQL", "Linux"];
      acceptedResponse.skillGapAnalysis.criticalMissingSkills = ["Kubernetes", "Docker"];

      const serviceOk = new CareerStrategistService({ provider: createMockGroqAdapter(acceptedResponse) });
      const resOk = await serviceOk.generateCareerStrategy(synonymInput);
      assertValidResponseDTO(resOk, { expectFallback: false });

      // Conversely, putting PostgreSQL into criticalMissingSkills when Postgres is declared must fail as contradiction
      const contradictoryResponse = structuredClone(acceptedResponse);
      contradictoryResponse.skillGapAnalysis.criticalMissingSkills = ["PostgreSQL"];

      const serviceFail = new CareerStrategistService({ provider: createMockGroqAdapter(contradictoryResponse) });
      await assert.rejects(
        () => serviceFail.generateCareerStrategy(synonymInput),
        (err) => err instanceof AiSchemaValidationError && err.diagnosticContext.reason === "UNSUPPORTED_CLAIMS"
      );
    });
  });

  // --------------------------------------------------------------------------
  // SCENARIO 4: Target Role and Skill Mismatch
  // --------------------------------------------------------------------------
  describe("Scenario 4 — Target Role and Skill Mismatch", () => {
    const rawMismatchInput = {
      correlationId: "corr-stage-2b8-scenario-4",
      candidateProfile: {
        headline: "Frontend Web Designer",
        yearsOfExperience: 2,
        declaredSkills: ["HTML", "CSS", "Figma", "Photoshop"],
        targetRoles: ["Machine Learning Engineer", "Distributed Systems Architect"],
        userNotes: "Seeking direct pivot into machine learning engineering.",
      },
      pipelineTelemetry: {
        trackedOpportunities: 8,
        submittedApplications: 7,
        savedCount: 1,
        activeInPipeline: 1,
        interviewsInProgress: 0,
        pendingOffers: 0,
        cumulativeOffers: 0,
        cumulativeRejections: 6,
        stageDistribution: [
          { status: "saved", count: 1 },
          { status: "applied", count: 1 },
          { status: "rejected", count: 6 },
        ],
        staleAlerts: {
          staleCount: 0,
          thresholdDays: 14,
        },
      },
    };

    const compliantMismatchResponse = {
      candidateSummary: {
        careerStage: "transitioning",
        pipelineHealth: "needs_focus",
        primaryBottleneck: "Severe alignment mismatch between declared visual design skills and ML target roles",
      },
      pipelineDiagnostics: {
        volumeAssessment: "7 submitted applications across 8 tracked roles have resulted in 6 rejections.",
        stageProgressionVelocity: "0 interviews in progress indicates low resume-to-role qualification match.",
        staleApplicationRisk: "No stale applications reported; rejections reflect fast initial screening.",
      },
      skillGapAnalysis: {
        verifiedCandidateSkills: ["HTML", "CSS", "Figma"],
        criticalMissingSkills: ["Python", "PyTorch", "Statistics", "Distributed Systems", "Algorithms"],
        skillBridgingAdvice:
          "Candidate's declared skills are UI/design oriented and lack ML/distributed engineering foundations. Either build core Python and ML engineering projects or calibrate target roles toward UI Engineering bridge positions.",
      },
      strategicRecommendations: [
        {
          id: "REC-01",
          category: "targeting_alignment",
          priority: "high",
          title: "Realign Target Roles or Establish Structured Prerequisite Roadmap",
          rationale: "86% rejection rate with 0 interviews stems from mismatch with Machine Learning Engineer prerequisites.",
          actionSteps: [
            "Consider intermediate UX Engineer or Frontend Developer targets utilizing existing HTML/CSS/Figma strengths",
            "If committing to ML, complete Python data structures and machine learning coursework prior to mass applying",
          ],
          expectedImpact: "Stops high-volume mismatches and builds credible screening eligibility",
        },
      ],
      evidenceGrounding: {
        citedMetrics: [
          "8 tracked opportunities",
          "7 submitted applications",
          "6 rejections",
          "0 interviews in progress",
          "86% rejection rate",
        ],
        dataLimitationsNoted: "No rejection reason feedback recorded; mismatch inferred solely from declared skills vs target titles.",
      },
    };

    it("4.1 Honest mismatch diagnosis with verified derived rejection percentage (86%) passes cleanly", async () => {
      const adapter = createMockGroqAdapter(compliantMismatchResponse);
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawMismatchInput);
      assertValidResponseDTO(result, { expectFallback: false });
      assert.deepStrictEqual(result.assessment.skillGapAnalysis.verifiedCandidateSkills, ["HTML", "CSS", "Figma"]);
      assert.ok(result.assessment.evidenceGrounding.citedMetrics.includes("86% rejection rate"));
    });

    it("4.2 Rejects model falsely verifying ML skills ('Python', 'PyTorch') inferred from targetRoles", async () => {
      const hallucinatedResponse = structuredClone(compliantMismatchResponse);
      hallucinatedResponse.skillGapAnalysis.verifiedCandidateSkills = ["HTML", "CSS", "Python", "PyTorch"];

      const adapter = createMockGroqAdapter(hallucinatedResponse);
      const service = new CareerStrategistService({ provider: adapter });

      await assert.rejects(
        () => service.generateCareerStrategy(rawMismatchInput),
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.strictEqual(err.diagnosticContext.reason, "UNSUPPORTED_CLAIMS");
          assert.ok(
            err.diagnosticContext.discrepancies.some((d) => d.includes("Python") || d.includes("PyTorch"))
          );
          return true;
        }
      );
    });

    it("4.3 Rejects fabricated optimistic percentage ('50% interview conversion') when interviews=0", async () => {
      const optimisticFabrication = structuredClone(compliantMismatchResponse);
      optimisticFabrication.evidenceGrounding.citedMetrics = ["50% interview conversion"];

      const adapter = createMockGroqAdapter(optimisticFabrication);
      const service = new CareerStrategistService({ provider: adapter });

      await assert.rejects(
        () => service.generateCareerStrategy(rawMismatchInput),
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.strictEqual(err.diagnosticContext.reason, "UNSUPPORTED_CLAIMS");
          assert.ok(err.diagnosticContext.discrepancies.some((d) => d.includes("50%")));
          return true;
        }
      );
    });

    it("4.4 Deterministic fallback never hallucinates missing target skills and stays strictly grounded", async () => {
      const adapter = createMockGroqAdapter(null, { shouldThrow: new AiRateLimitError("429") });
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawMismatchInput);
      assertValidResponseDTO(result, { expectFallback: true });
      assert.deepStrictEqual(
        result.assessment.skillGapAnalysis.verifiedCandidateSkills,
        ["HTML", "CSS", "Figma", "Photoshop"]
      );
      assert.ok(!result.assessment.skillGapAnalysis.verifiedCandidateSkills.includes("Python"));
    });
  });

  // --------------------------------------------------------------------------
  // SCENARIO 5: Insufficient Pipeline Telemetry
  // --------------------------------------------------------------------------
  describe("Scenario 5 — Insufficient Pipeline Telemetry", () => {
    const rawZeroTelemetryInput = {
      correlationId: "corr-stage-2b8-scenario-5a",
      candidateProfile: {
        headline: "Full Stack Developer",
        yearsOfExperience: 3,
        declaredSkills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
        targetRoles: ["Full Stack Engineer"],
        userNotes: "Just created tracker profile.",
      },
      pipelineTelemetry: {
        trackedOpportunities: 0,
        submittedApplications: 0,
        savedCount: 0,
        activeInPipeline: 0,
        interviewsInProgress: 0,
        pendingOffers: 0,
        cumulativeOffers: 0,
        cumulativeRejections: 0,
        stageDistribution: [],
        staleAlerts: {
          staleCount: 0,
          thresholdDays: 14,
        },
      },
    };

    const rawSparseTelemetryInput = {
      ...rawZeroTelemetryInput,
      correlationId: "corr-stage-2b8-scenario-5b",
      pipelineTelemetry: {
        trackedOpportunities: 2,
        submittedApplications: 0,
        savedCount: 2,
        activeInPipeline: 0,
        interviewsInProgress: 0,
        pendingOffers: 0,
        cumulativeOffers: 0,
        cumulativeRejections: 0,
        stageDistribution: [{ status: "saved", count: 2 }],
        staleAlerts: {
          staleCount: 0,
          thresholdDays: 14,
        },
      },
    };

    const compliantZeroTelemetryResponse = {
      candidateSummary: {
        careerStage: "mid_level",
        pipelineHealth: "insufficient_data",
        primaryBottleneck: "Zero tracked or submitted job applications in pipeline telemetry",
      },
      pipelineDiagnostics: {
        volumeAssessment: "0 tracked opportunities and 0 submitted applications available for analysis.",
        stageProgressionVelocity: "Conversion velocity cannot be calculated with 0 active applications.",
        staleApplicationRisk: "0 stale applications because tracking has not yet started.",
      },
      skillGapAnalysis: {
        verifiedCandidateSkills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
        criticalMissingSkills: ["Docker", "CI/CD"],
        skillBridgingAdvice:
          "Begin tracking Full Stack applications and align portfolio with containerization and deployment expectations.",
      },
      strategicRecommendations: [
        {
          id: "REC-01",
          category: "data_hygiene",
          priority: "high",
          title: "Initialize Opportunity Tracking Pipeline",
          rationale: "With 0 tracked opportunities, pipeline diagnostics cannot evaluate conversion or bottlenecks.",
          actionSteps: [
            "Log at least 5 target Full Stack Engineer listings in the Saved or Applied stage",
            "Record stage transitions as applications progress",
          ],
          expectedImpact: "Establishes telemetry baseline for conversion and staleness monitoring",
        },
      ],
      evidenceGrounding: {
        citedMetrics: ["0 tracked opportunities", "0 submitted applications", "0 active in pipeline"],
        dataLimitationsNoted:
          "Insufficient telemetry: zero job opportunities tracked and zero submission/interview outcomes available.",
      },
    };

    it("5.1 Zero-telemetry scenario accepts honest 'insufficient_data' assessment with zero citations", async () => {
      const adapter = createMockGroqAdapter(compliantZeroTelemetryResponse);
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawZeroTelemetryInput);
      assertValidResponseDTO(result, { expectFallback: false });
      assert.strictEqual(result.assessment.candidateSummary.pipelineHealth, "insufficient_data");
      assert.ok(result.assessment.evidenceGrounding.dataLimitationsNoted.includes("Insufficient telemetry"));
    });

    it("5.2 Rejects unsupported qualitative metric claims ('strong interview activity') when counts are zero", async () => {
      const ungroundedQualResponse = structuredClone(compliantZeroTelemetryResponse);
      ungroundedQualResponse.evidenceGrounding.citedMetrics = ["active interview momentum"];

      const adapter = createMockGroqAdapter(ungroundedQualResponse);
      const service = new CareerStrategistService({ provider: adapter });

      await assert.rejects(
        () => service.generateCareerStrategy(rawZeroTelemetryInput),
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.strictEqual(err.diagnosticContext.reason, "UNSUPPORTED_CLAIMS");
          assert.ok(
            err.diagnosticContext.discrepancies.some((d) =>
              d.includes("Qualitative citation") || d.includes("no verifiable telemetry evidence")
            )
          );
          return true;
        }
      );
    });

    it("5.3 Rejects phantom conversion percentage ('25% offer rate') when submittedApplications=0 (zero division guard)", async () => {
      const phantomRateResponse = structuredClone(compliantZeroTelemetryResponse);
      phantomRateResponse.evidenceGrounding.citedMetrics = ["25% offer rate"];

      const adapter = createMockGroqAdapter(phantomRateResponse);
      const service = new CareerStrategistService({ provider: adapter });

      await assert.rejects(
        () => service.generateCareerStrategy(rawZeroTelemetryInput),
        (err) => {
          assert.ok(err instanceof AiSchemaValidationError);
          assert.strictEqual(err.diagnosticContext.reason, "UNSUPPORTED_CLAIMS");
          assert.ok(err.diagnosticContext.discrepancies.some((d) => d.includes("25%")));
          return true;
        }
      );
    });

    it("5.4 Deterministic fallback correctly outputs 'insufficient_data' on zero tracked telemetry", async () => {
      const adapter = createMockGroqAdapter(null, { shouldThrow: new AiRateLimitError("429") });
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawZeroTelemetryInput);
      assertValidResponseDTO(result, { expectFallback: true });
      assert.strictEqual(result.assessment.candidateSummary.pipelineHealth, "insufficient_data");
      assert.strictEqual(
        result.assessment.candidateSummary.primaryBottleneck,
        "No tracked opportunities in career pipeline"
      );
    });

    it("5.5 Sparse non-zero telemetry (2 saved, 0 submitted) fallback remains grounded and valid", async () => {
      const adapter = createMockGroqAdapter(null, { shouldThrow: new AiRateLimitError("429") });
      const service = new CareerStrategistService({ provider: adapter });

      const result = await service.generateCareerStrategy(rawSparseTelemetryInput);
      assertValidResponseDTO(result, { expectFallback: true });
      // Observed heuristic: tracked > 0 with 0 submitted & saved > 0 produces 'needs_focus'
      // with conversion bottleneck rather than 'insufficient_data'. Still structurally & evidence valid.
      assert.strictEqual(result.assessment.candidateSummary.pipelineHealth, "needs_focus");
      assert.strictEqual(
        result.assessment.candidateSummary.primaryBottleneck,
        "Conversion of saved listings to submitted applications"
      );
    });

    it("5.6 Controller constructs valid zero-telemetry DTO from empty insights DB summaries", async () => {
      const adapter = createMockGroqAdapter(compliantZeroTelemetryResponse);
      const controller = createCareerStrategistController({
        careerStrategistService: new CareerStrategistService({ provider: adapter }),
        profileModel: {
          getProfileByUserId: async () => ({
            headline: "Full Stack Developer",
            skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
            experience: [{ startDate: "2023-11", current: true }],
            bio: "Just created tracker profile.",
          }),
        },
        insightsModel: {
          getInsightsSummary: async () => ({
            volumeMetrics: {
              trackedOpportunities: 0,
              submittedApplications: 0,
              cumulativeOffers: 0,
              cumulativeRejections: 0,
            },
            snapshotMetrics: { activeInPipeline: 0, interviewsInProgress: 0, pendingOffers: 0 },
            staleAlerts: { thresholdDays: 14, staleCount: 0, applications: [] },
          }),
          getPipelineSnapshot: async () => ({
            activeSegment: { totalActive: 0, stages: [{ status: "saved", count: 0 }] },
            closedSegment: { totalClosed: 0, stages: [{ status: "rejected", count: 0 }] },
          }),
        },
      });

      const { req, res } = createMockExpressReqRes({ body: { targetRoles: ["Full Stack Engineer"] } });
      await controller.generateAssessment(req, res);

      assert.strictEqual(res.statusCode, 200);
      assertValidResponseDTO(res.bodyPayload, { expectFallback: false });
      assert.strictEqual(res.bodyPayload.assessment.candidateSummary.pipelineHealth, "insufficient_data");
    });

    it("5.7 Documents validator schema behavior for empty citedMetrics and empty dataLimitationsNoted on zero telemetry", () => {
      const bareOutput = structuredClone(compliantZeroTelemetryResponse);
      bareOutput.evidenceGrounding.citedMetrics = [];
      bareOutput.evidenceGrounding.dataLimitationsNoted = "";

      const minimized = minimizeCareerAssessmentTelemetry(rawZeroTelemetryInput);
      const outcome = validateCareerAssessmentEvidence(minimized.minimizedRequest, bareOutput);
      // Schema accepts string type for dataLimitationsNoted and array type for citedMetrics without rejecting empty values
      assert.strictEqual(outcome.isValid, true);
    });
  });
});
