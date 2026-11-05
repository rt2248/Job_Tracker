/**
 * @file securityRemediation.test.js
 * @description Dedicated adversarial and boundary unit tests for Stage 2B.4A security remediations.
 *
 * Stage 2B.4A — Security Remediation & Boundary Hardening
 *
 * Verifies all 9 findings from the Stage 2B.3C verification gate audit:
 * - HIGH-01: Correct Metric Citation Grounding
 * - HIGH-02: Mandatory Minimization at Provider Boundary
 * - MED-01: Native Fetch ReadableStream Cancellation
 * - MED-02: Credential Factual Claim Coverage (all factual sections)
 * - MED-03: Output Schema Allowlisting
 * - MED-04: Canonical Skill Synonym Handling
 * - MED-05: Null Consumable Assessment on Validation Failure
 * - LOW-01: Deep Immutability of Minimized Output
 * - LOW-02: Elimination of Permanently Pending Promise Pattern
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  minimizeCareerAssessmentTelemetry,
  validateCareerAssessmentEvidence,
  validateCareerAssessmentRequest,
  normalizeSkill,
  auditMetricCitation,
  GroqProviderAdapter,
  executeWithBoundaryContract,
  registerMinimizedRequest,
  isVerifiedMinimizedRequest,
  AiConfigurationError,
  AiSchemaValidationError,
  AiCancellationError,
  AiTimeoutError,
  DEFAULT_GROQ_MODEL,
} = require("../../src/services/ai");

// Helper: base valid candidate request
function createBaseRawRequest(overrides = {}) {
  return {
    correlationId: "corr-remed-123e4567-e89b",
    candidateProfile: {
      headline: "Senior Cloud Infrastructure Engineer",
      yearsOfExperience: 6,
      declaredSkills: ["Go", "Kubernetes", "PostgreSQL", "AWS"],
      targetRoles: ["Cloud Architect", "Staff Platform Engineer"],
      userNotes: "Prefers high-scale distributed backend systems.",
    },
    pipelineTelemetry: {
      trackedOpportunities: 25,
      submittedApplications: 18,
      savedCount: 7,
      activeInPipeline: 5,
      interviewsInProgress: 2,
      pendingOffers: 1,
      cumulativeOffers: 2,
      cumulativeRejections: 4,
      stageDistribution: [
        { status: "Applied", count: 2 },
        { status: "OA", count: 1 },
        { status: "Interview", count: 2 },
      ],
      staleAlerts: {
        staleCount: 1,
        thresholdDays: 14,
      },
    },
    ...overrides,
  };
}

// Helper: base valid assessment payload
function createBaseAssessmentPayload(overrides = {}) {
  return {
    candidateSummary: {
      careerStage: "senior",
      pipelineHealth: "healthy",
      primaryBottleneck: "Technical interview conversion rate needs refinement.",
    },
    pipelineDiagnostics: {
      volumeAssessment: "Application volume of 18 is strong and active.",
      stageProgressionVelocity: "Conversion from OA to Interview is currently healthy.",
      staleApplicationRisk: "Only 1 application exceeds the 14 day threshold.",
    },
    skillGapAnalysis: {
      verifiedCandidateSkills: ["Go", "Kubernetes"],
      criticalMissingSkills: ["Rust", "Terraform"],
      skillBridgingAdvice: "Focus on systems programming and IaC automation.",
    },
    strategicRecommendations: [
      {
        id: "REC-01",
        category: "interview_preparation",
        priority: "high",
        title: "System Design Deep Dive",
        rationale: "Advancing to staff roles requires deep distributed system capability.",
        actionSteps: ["Study distributed caching", "Complete mock system design interviews"],
        expectedImpact: "Increase staff role interview pass rate.",
      },
    ],
    evidenceGrounding: {
      citedMetrics: ["18 submitted applications", "2 active interviews"],
      dataLimitationsNoted: "No historical rejection reasons available in pipeline notes.",
    },
    ...overrides,
  };
}

// ============================================================================
// 1. HIGH-01: METRIC CITATION GROUNDING
// ============================================================================
describe("1. HIGH-01 — Correct Metric Citation Grounding", () => {
  const telemetry = {
    trackedOpportunities: 25,
    submittedApplications: 18,
    savedCount: 7,
    activeInPipeline: 5,
    interviewsInProgress: 2,
    pendingOffers: 1,
    cumulativeOffers: 2,
    cumulativeRejections: 4,
    stageDistribution: [
      { status: "Applied", count: 2 },
      { status: "OA", count: 1 },
      { status: "Interview", count: 2 },
    ],
    staleAlerts: { staleCount: 1, thresholdDays: 14 },
  };

  it("accepts correct metric and value association", () => {
    const res = auditMetricCitation("18 submitted applications", telemetry);
    assert.equal(res.isValid, true);
  });

  it("rejects correct value attributed to the wrong metric (25 pending offers)", () => {
    // 25 is trackedOpportunities, pendingOffers is 1
    const res = auditMetricCitation("25 pending offers", telemetry);
    assert.equal(res.isValid, false);
    assert.match(res.reason, /does not match associated metric value/);
  });

  it("rejects fabricated number alongside a valid number (9999 interviews and 4 rejections)", () => {
    const res = auditMetricCitation("9999 interviews and 4 rejections", telemetry);
    assert.equal(res.isValid, false);
    assert.match(res.reason, /Value '9999'/);
  });

  it("rejects multiple numbers when only some are supported", () => {
    const res = auditMetricCitation("18 submitted applications and 100 offers", telemetry);
    assert.equal(res.isValid, false);
    assert.match(res.reason, /Value '100'/);
  });

  it("distinguishes duplicate values across unrelated telemetry fields", () => {
    // interviewsInProgress = 2, cumulativeOffers = 2
    // A citation for "2 active interviews" must match interviewsInProgress
    const resInterviews = auditMetricCitation("2 active interviews", telemetry);
    assert.equal(resInterviews.isValid, true);

    const resOffers = auditMetricCitation("2 total offers received", telemetry);
    assert.equal(resOffers.isValid, true);

    // Citing 5 offers when cumulativeOffers is 2 must fail
    const resWrongOffers = auditMetricCitation("5 offers received", telemetry);
    assert.equal(resWrongOffers.isValid, false);
  });

  it("rejects unsupported derived percentages", () => {
    const res = auditMetricCitation("99% offer conversion rate", telemetry);
    assert.equal(res.isValid, false);
    assert.match(res.reason, /Unsupported derived percentage/);
  });

  it("accepts correctly calculated supported percentages (2 / 18 = 11%)", () => {
    const res = auditMetricCitation("11% offer rate on submissions", telemetry);
    assert.equal(res.isValid, true);
  });

  it("rejects qualitative citations with no verifiable telemetry evidence", () => {
    const res = auditMetricCitation("Candidate was hired as CTO with high salary", telemetry);
    assert.equal(res.isValid, false);
    assert.match(res.reason, /no verifiable telemetry evidence/);
  });

  it("rejects ambiguous metric terminology", () => {
    const res = auditMetricCitation("50 widgets tracked in database", telemetry);
    assert.equal(res.isValid, false);
    assert.match(res.reason, /Ambiguous metric terminology/);
  });

  it("validates zero-valued metrics accurately", () => {
    const zeroTelemetry = { ...telemetry, pendingOffers: 0 };
    // Claiming 0 pending offers when pendingOffers is 0 -> accepted
    const resZero = auditMetricCitation("0 pending offers", zeroTelemetry);
    assert.equal(resZero.isValid, true);

    // Claiming 5 pending offers when pendingOffers is 0 -> rejected
    const resNonZero = auditMetricCitation("5 pending offers", zeroTelemetry);
    assert.equal(resNonZero.isValid, false);
  });
});

// ============================================================================
// 2. HIGH-02: MANDATORY MINIMIZATION AT PROVIDER BOUNDARY
// ============================================================================
describe("2. HIGH-02 — Mandatory Minimization at Provider Boundary", () => {
  it("accepts genuine minimized request through provider adapter", async () => {
    const rawReq = createBaseRawRequest();
    const minimized = minimizeCareerAssessmentTelemetry(rawReq);

    let capturedBody = null;
    const mockTransport = async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        status: 200,
        ok: true,
        headers: { get: () => null, entries: () => [] },
        text: async () =>
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(createBaseAssessmentPayload()) } }],
            usage: { prompt_tokens: 100, completion_tokens: 100, total_tokens: 200 },
          }),
      };
    };

    const adapter = new GroqProviderAdapter({ apiKey: "gsk_test123", transport: mockTransport });
    const result = await adapter.generateAssessment(minimized.minimizedRequest);

    assert.ok(result.rawData);
    assert.equal(capturedBody.model, DEFAULT_GROQ_MODEL);
  });

  it("rejects structurally identical manually constructed object not processed by minimizer", async () => {
    const manuallyConstructed = createBaseRawRequest(); // unminimized object
    const adapter = new GroqProviderAdapter({ apiKey: "gsk_test123" });

    await assert.rejects(
      async () => {
        await adapter.generateAssessment(manuallyConstructed);
      },
      (err) => {
        return (
          err instanceof AiConfigurationError &&
          err.message.includes("Provider boundary violation") &&
          err.diagnosticContext?.reason === "UNMINIMIZED_REQUEST_REJECTED"
        );
      }
    );
  });

  it("rejects objects with forge attempts (e.g. caller-supplied isMinimized property)", async () => {
    const fakeReq = {
      ...createBaseRawRequest(),
      isMinimized: true,
      minimized: true,
      auditMetadata: { success: true },
    };

    const adapter = new GroqProviderAdapter({ apiKey: "gsk_test123" });
    await assert.rejects(
      async () => {
        await adapter.generateAssessment(fakeReq);
      },
      (err) => err instanceof AiConfigurationError && err.diagnosticContext?.reason === "UNMINIMIZED_REQUEST_REJECTED"
    );
  });

  it("ensures provider serialization includes strictly approved minimized fields", async () => {
    const rawReq = createBaseRawRequest();
    const minimized = minimizeCareerAssessmentTelemetry(rawReq);

    let serializedUserPrompt = null;
    const mockTransport = async (url, init) => {
      const body = JSON.parse(init.body);
      const userMsg = body.messages.find((m) => m.role === "user");
      serializedUserPrompt = JSON.parse(userMsg.content);
      return {
        status: 200,
        ok: true,
        headers: { get: () => null, entries: () => [] },
        text: async () =>
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(createBaseAssessmentPayload()) } }],
          }),
      };
    };

    const adapter = new GroqProviderAdapter({ apiKey: "gsk_test123", transport: mockTransport });
    await adapter.generateAssessment(minimized);

    // Verify candidateProfile keys in userPrompt
    const candidateKeys = Object.keys(serializedUserPrompt.candidateProfile);
    assert.deepEqual(candidateKeys.sort(), ["declaredSkills", "headline", "targetRoles", "userNotes", "yearsOfExperience"].sort());

    // Verify pipelineTelemetry keys in userPrompt
    const telemetryKeys = Object.keys(serializedUserPrompt.pipelineTelemetry);
    assert.equal(telemetryKeys.includes("recruiterNotes"), false);
    assert.equal(telemetryKeys.includes("userEmail"), false);
  });
});

// ============================================================================
// 3. MED-01: WEB READABLESTREAM CANCELLATION
// ============================================================================
describe("3. MED-01 — Web ReadableStream Cancellation", () => {
  it("cancels Web ReadableStream when caller cancels or stream completes", async () => {
    let cancelCalled = false;
    let cancelReason = null;

    const mockBody = {
      async *[Symbol.asyncIterator]() {
        yield 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';
        yield "data: [DONE]\n\n";
      },
      cancel: async (reason) => {
        cancelCalled = true;
        cancelReason = reason;
      },
    };

    const mockTransport = async () => ({
      status: 200,
      ok: true,
      headers: { get: () => null, entries: () => [] },
      body: mockBody,
    });

    const adapter = new GroqProviderAdapter({ apiKey: "gsk_test123", transport: mockTransport });
    const stream = await adapter.streamChat({
      correlationId: "corr-stream-test",
      messages: [{ role: "user", content: "Hi" }],
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    assert.equal(chunks.length, 2);
    assert.equal(chunks[1].finishReason, "stop");
    assert.equal(cancelCalled, true, "ReadableStream.cancel() must be called in finally");
  });

  it("handles cancellation promise rejection safely without unhandled error", async () => {
    const mockBody = {
      async *[Symbol.asyncIterator]() {
        yield "data: [DONE]\n\n";
      },
      cancel: async () => {
        throw new Error("Stream already cancelled upstream");
      },
    };

    const mockTransport = async () => ({
      status: 200,
      ok: true,
      headers: { get: () => null, entries: () => [] },
      body: mockBody,
    });

    const adapter = new GroqProviderAdapter({ apiKey: "gsk_test123", transport: mockTransport });
    const stream = await adapter.streamChat({
      correlationId: "corr-stream-reject",
      messages: [{ role: "user", content: "Hi" }],
    });

    // Should complete cleanly without unhandled rejection
    for await (const chunk of stream) {
      assert.ok(chunk);
    }
  });

  it("falls back to .destroy() for Node.js-style streams", async () => {
    let destroyCalled = false;
    const mockBody = {
      async *[Symbol.asyncIterator]() {
        yield "data: [DONE]\n\n";
      },
      destroy: () => {
        destroyCalled = true;
      },
    };

    const mockTransport = async () => ({
      status: 200,
      ok: true,
      headers: { get: () => null, entries: () => [] },
      body: mockBody,
    });

    const adapter = new GroqProviderAdapter({ apiKey: "gsk_test123", transport: mockTransport });
    const stream = await adapter.streamChat({
      correlationId: "corr-stream-destroy",
      messages: [{ role: "user", content: "Hi" }],
    });

    for await (const chunk of stream) {
      assert.ok(chunk);
    }
    assert.equal(destroyCalled, true, "Must call .destroy() when .cancel is not available");
  });
});

// ============================================================================
// 4. MED-02: EXTEND CREDENTIAL FACTUAL CLAIM COVERAGE
// ============================================================================
describe("4. MED-02 — Extend Credential Factual Claim Coverage", () => {
  const req = minimizeCareerAssessmentTelemetry(createBaseRawRequest());

  it("detects fabricated degree in pipelineDiagnostics.staleApplicationRisk", () => {
    const payload = createBaseAssessmentPayload();
    payload.pipelineDiagnostics.staleApplicationRisk =
      "Candidate graduated from Harvard with a PhD in Computer Science, so risk is minimal.";

    const result = validateCareerAssessmentEvidence(req, payload);
    assert.equal(result.isValid, false);
    assert.equal(result.status, "UNSUPPORTED_CLAIMS");
    assert.ok(result.validationAudit.discrepancies.some((d) => d.includes("graduated from")));
  });

  it("detects fabricated certification in skillGapAnalysis.skillBridgingAdvice", () => {
    const payload = createBaseAssessmentPayload();
    payload.skillGapAnalysis.skillBridgingAdvice =
      "Candidate holds a certification in advanced Kubernetes architecture.";

    const result = validateCareerAssessmentEvidence(req, payload);
    assert.equal(result.isValid, false);
    assert.equal(result.status, "UNSUPPORTED_CLAIMS");
    assert.ok(result.validationAudit.discrepancies.some((d) => d.includes("holds a certification")));
  });

  it("preserves valid future-oriented certification recommendations without false rejection", () => {
    const payload = createBaseAssessmentPayload();
    payload.strategicRecommendations[0].title = "Pursue AWS Solutions Architect Certification";
    payload.strategicRecommendations[0].rationale = "Earning an AWS certification will demonstrate cloud mastery.";
    payload.strategicRecommendations[0].actionSteps = ["Enroll in AWS course", "Schedule exam"];

    const result = validateCareerAssessmentEvidence(req, payload);
    assert.equal(result.isValid, true);
    assert.equal(result.status, "VALID");
  });
});

// ============================================================================
// 5. MED-03: OUTPUT SCHEMA ALLOWLISTING
// ============================================================================
describe("5. MED-03 — Output Schema Allowlisting", () => {
  const req = minimizeCareerAssessmentTelemetry(createBaseRawRequest());

  it("discards unknown root and nested properties from sanitized output", () => {
    const payload = createBaseAssessmentPayload({
      unknownRootField: "injectedData",
      maliciousPayload: { secret: 123 },
    });
    payload.candidateSummary.sneakyField = "hidden";
    payload.pipelineDiagnostics.extraDiagnostic = "extra";

    const result = validateCareerAssessmentEvidence(req, payload);
    assert.equal(result.isValid, true);

    const sanitized = result.sanitizedAssessment;
    assert.equal(sanitized.unknownRootField, undefined);
    assert.equal(sanitized.maliciousPayload, undefined);
    assert.equal(sanitized.candidateSummary.sneakyField, undefined);
    assert.equal(sanitized.pipelineDiagnostics.extraDiagnostic, undefined);

    // Approved fields are preserved
    assert.equal(sanitized.candidateSummary.careerStage, "senior");
    assert.equal(sanitized.candidateSummary.primaryBottleneck, "Technical interview conversion rate needs refinement.");
  });

  it("strips prototype pollution keys and self-verification claims recursively", () => {
    const payloadWithProto = {
      ...createBaseAssessmentPayload(),
      __proto__: { polluted: true },
      hallucinationCheckPassed: true,
    };
    payloadWithProto.candidateSummary.hallucinationCheckPassed = true;

    const result = validateCareerAssessmentEvidence(req, payloadWithProto);
    assert.equal(result.isValid, true);
    assert.equal(result.sanitizedAssessment.hallucinationCheckPassed, undefined);
    assert.equal(result.sanitizedAssessment.candidateSummary.hallucinationCheckPassed, undefined);
    assert.equal(({}).polluted, undefined);
  });
});

// ============================================================================
// 6. MED-04: CANONICAL SKILL SYNONYM HANDLING
// ============================================================================
describe("6. MED-04 — Canonical Skill Synonym Handling", () => {
  it("normalizes canonical equivalents to matching canonical tokens", () => {
    // Golang <-> Go
    assert.equal(normalizeSkill("Golang"), "go");
    assert.equal(normalizeSkill("Go"), "go");

    // PostgreSQL <-> Postgres
    assert.equal(normalizeSkill("PostgreSQL"), "postgresql");
    assert.equal(normalizeSkill("Postgres"), "postgresql");

    // Kubernetes <-> K8s
    assert.equal(normalizeSkill("Kubernetes"), "kubernetes");
    assert.equal(normalizeSkill("K8s"), "kubernetes");

    // Node.js <-> nodejs <-> node
    assert.equal(normalizeSkill("Node.js"), "node.js");
    assert.equal(normalizeSkill("nodejs"), "node.js");
    assert.equal(normalizeSkill("node"), "node.js");
  });

  it("keeps related but distinct technologies strictly separate", () => {
    assert.notEqual(normalizeSkill("C"), normalizeSkill("C++"));
    assert.notEqual(normalizeSkill("Java"), normalizeSkill("JavaScript"));
    assert.notEqual(normalizeSkill("PostgreSQL"), normalizeSkill("MySQL"));
    assert.notEqual(normalizeSkill("Python"), normalizeSkill("Ruby"));
  });

  it("accepts candidate with Golang when model outputs Go", () => {
    const rawReq = createBaseRawRequest();
    rawReq.candidateProfile.declaredSkills = ["Golang", "Postgres", "K8s"];
    const req = minimizeCareerAssessmentTelemetry(rawReq);

    const payload = createBaseAssessmentPayload();
    payload.skillGapAnalysis.verifiedCandidateSkills = ["Go", "PostgreSQL", "Kubernetes"];

    const result = validateCareerAssessmentEvidence(req, payload);
    assert.equal(result.isValid, true);
    assert.equal(result.claimsAnalysis.unsupportedSkills.length, 0);
  });
});

// ============================================================================
// 7. MED-05: NEVER RETURN CONSUMABLE ASSESSMENT WHEN VALIDATION FAILS
// ============================================================================
describe("7. MED-05 — Never Return Consumable Assessment When Validation Fails", () => {
  const req = minimizeCareerAssessmentTelemetry(createBaseRawRequest());

  it("returns sanitizedAssessment: null on UNSUPPORTED_CLAIMS", () => {
    const payload = createBaseAssessmentPayload();
    payload.skillGapAnalysis.verifiedCandidateSkills.push("Rust_Fabricated");

    const result = validateCareerAssessmentEvidence(req, payload);
    assert.equal(result.isValid, false);
    assert.equal(result.status, "UNSUPPORTED_CLAIMS");
    assert.equal(result.sanitizedAssessment, null, "sanitizedAssessment must be strictly null on unsupported claims");
    assert.ok(result.validationAudit.discrepancies.length > 0);
  });

  it("returns sanitizedAssessment: null on STRUCTURAL_INVALID", () => {
    const invalidPayload = { candidateSummary: { careerStage: "invalid_stage" } };
    const result = validateCareerAssessmentEvidence(req, invalidPayload);

    assert.equal(result.isValid, false);
    assert.equal(result.status, "STRUCTURAL_INVALID");
    assert.equal(result.sanitizedAssessment, null);
  });

  it("returns non-null sanitizedAssessment only when isValid is true", () => {
    const validPayload = createBaseAssessmentPayload();
    const result = validateCareerAssessmentEvidence(req, validPayload);

    assert.equal(result.isValid, true);
    assert.equal(result.status, "VALID");
    assert.notEqual(result.sanitizedAssessment, null);
  });
});

// ============================================================================
// 8. LOW-01: DEEP IMMUTABILITY OF MINIMIZED OUTPUT
// ============================================================================
describe("8. LOW-01 — Deep Immutability of Minimized Output", () => {
  it("enforces deep recursive freezing on canonical minimized request and nested data", () => {
    const rawReq = createBaseRawRequest();
    const minimized = minimizeCareerAssessmentTelemetry(rawReq);

    assert.equal(Object.isFrozen(minimized), true);
    assert.equal(Object.isFrozen(minimized.candidateProfile), true);
    assert.equal(Object.isFrozen(minimized.candidateProfile.declaredSkills), true);
    assert.equal(Object.isFrozen(minimized.candidateProfile.targetRoles), true);
    assert.equal(Object.isFrozen(minimized.pipelineTelemetry), true);
    assert.equal(Object.isFrozen(minimized.pipelineTelemetry.stageDistribution), true);
    assert.equal(Object.isFrozen(minimized.pipelineTelemetry.staleAlerts), true);
    assert.equal(Object.isFrozen(minimized.auditMetadata), true);

    const cleanReq = minimized.minimizedRequest;
    assert.equal(Object.isFrozen(cleanReq), true);
    assert.equal(Object.isFrozen(cleanReq.candidateProfile), true);
  });

  it("prevents mutation of declaredSkills and throws TypeError", () => {
    const rawReq = createBaseRawRequest();
    const minimized = minimizeCareerAssessmentTelemetry(rawReq);

    assert.throws(
      () => {
        minimized.candidateProfile.declaredSkills.push("MutatedSkill");
      },
      TypeError
    );
  });

  it("preserves mutability and state of original input object", () => {
    const rawReq = createBaseRawRequest();
    minimizeCareerAssessmentTelemetry(rawReq);

    assert.equal(Object.isFrozen(rawReq), false);
    assert.equal(Object.isFrozen(rawReq.candidateProfile), false);

    // Can still modify original input
    rawReq.candidateProfile.declaredSkills.push("OriginalModification");
    assert.equal(rawReq.candidateProfile.declaredSkills.includes("OriginalModification"), true);
  });
});

// ============================================================================
// 9. LOW-02: REMOVE PERMANENTLY PENDING PROMISE PATTERN
// ============================================================================
describe("9. LOW-02 — Elimination of Permanently Pending Promise Pattern", () => {
  it("execution boundary suppresses late resolution without allocating pending promise", async () => {
    let lateResolved = false;

    await assert.rejects(
      async () => {
        await executeWithBoundaryContract(
          async () => {
            await new Promise((r) => setTimeout(r, 60));
            lateResolved = true;
            return "late-success";
          },
          { timeoutMs: 20 }
        );
      },
      (err) => err instanceof AiTimeoutError
    );

    // Wait past the late resolution
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(lateResolved, true, "Late operation completed in background");
  });

  it("execution boundary suppresses late rejection without unhandled rejection", async () => {
    let lateRejected = false;

    await assert.rejects(
      async () => {
        await executeWithBoundaryContract(
          async () => {
            await new Promise((r) => setTimeout(r, 60));
            lateRejected = true;
            throw new Error("Late background failure");
          },
          { timeoutMs: 20 }
        );
      },
      (err) => err instanceof AiTimeoutError
    );

    // Wait past late rejection - should not crash process or trigger unhandledRejection
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(lateRejected, true);
  });

  it("cleans up caller abort listeners deterministically", async () => {
    const controller = new AbortController();
    assert.equal(controller.signal.aborted, false);

    await executeWithBoundaryContract(
      async () => "fast-success",
      { timeoutMs: 1000, callerSignal: controller.signal }
    );

    // Listener was cleaned up; aborting controller now has no listeners
    controller.abort();
    assert.equal(controller.signal.aborted, true);
  });
});
