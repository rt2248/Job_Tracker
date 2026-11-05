/**
 * @file careerAssessmentValidator.test.js
 * @description Comprehensive automated test suite for Stage 2B.3B Deterministic Evidence Validator.
 *
 * Execution: Strictly OFFLINE. Zero live API calls, zero external network traffic.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  validateCareerAssessmentEvidence,
  minimizeCareerAssessmentTelemetry,
  AiConfigurationError,
  AiSchemaValidationError,
} = require("../../src/services/ai");

// Helper: Standard valid minimized request fixture
const createValidMinimizedRequest = (overrides = {}) => ({
  correlationId: "corr-audit-123e4567-e89b",
  candidateProfile: {
    headline: "Senior Cloud Infrastructure Engineer",
    yearsOfExperience: 7.0,
    declaredSkills: ["Go", "Kubernetes", "AWS", "Terraform", "PostgreSQL"],
    targetRoles: ["Cloud Architect", "Staff Infrastructure Engineer"],
    userNotes: "Focusing on distributed systems and cloud platforms.",
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
  options: { timeoutMs: 15000 },
  ...overrides,
});

// Helper: Standard valid model assessment payload fixture
const createValidAssessmentPayload = (overrides = {}) => ({
  candidateSummary: {
    careerStage: "senior",
    pipelineHealth: "healthy",
    primaryBottleneck: "Technical interview conversion rate",
  },
  pipelineDiagnostics: {
    volumeAssessment: "Sufficient search volume with 8 submitted applications.",
    stageProgressionVelocity: "Healthy progression from application to interview stages.",
    staleApplicationRisk: "Low risk with only 1 application inactive beyond 14 days.",
  },
  skillGapAnalysis: {
    verifiedCandidateSkills: ["Go", "Kubernetes", "AWS"],
    criticalMissingSkills: ["Rust", "System Architecture Modeling"],
    skillBridgingAdvice: "Focus on systems programming and large-scale architecture.",
  },
  strategicRecommendations: [
    {
      id: "REC-01",
      category: "targeting_alignment",
      priority: "high",
      title: "Target Staff Infrastructure Positions",
      rationale: "Strong infrastructure background in Go and Kubernetes aligns with high-scale roles.",
      actionSteps: [
        "Tailor resume emphasizing distributed systems reliability.",
        "Highlight Terraform infrastructure as code projects.",
      ],
      expectedImpact: "Higher callback rate from Tier-1 tech organizations.",
    },
    {
      id: "REC-02",
      category: "skill_acquisition",
      priority: "medium",
      title: "Pursue Advanced Distributed Systems Certification",
      rationale: "Future skill growth in Rust and architecture modeling will expand options.",
      actionSteps: [
        "Consider studying for AWS Solutions Architect Professional certification.",
        "Build a sample distributed consensus project in Rust.",
      ],
      expectedImpact: "Closes senior-to-staff technical gap.",
    },
  ],
  evidenceGrounding: {
    citedMetrics: [
      "8 submitted applications",
      "2 active interviews",
      "1 pending offer",
      "14 days stale threshold",
    ],
    dataLimitationsNoted: "No historical rejection notes or coding challenge feedbacks recorded.",
  },
  ...overrides,
});

describe("Stage 2B.3B Deterministic Evidence Validator", () => {
  // ==========================================================================
  // 1. INPUT & STRUCTURAL SCHEMA VALIDATION
  // ==========================================================================
  describe("1. Input & Structural Schema Validation", () => {
    it("successfully validates a clean, structurally compliant and evidence-grounded assessment", () => {
      const minReq = createValidMinimizedRequest();
      const rawOutput = { rawData: createValidAssessmentPayload() };

      const result = validateCareerAssessmentEvidence(minReq, rawOutput);

      assert.equal(result.isValid, true);
      assert.equal(result.status, "VALID");
      assert.equal(result.validationAudit.schemaValid, true);
      assert.equal(result.validationAudit.evidenceGrounded, true);
      assert.equal(result.validationAudit.discrepancies.length, 0);
      assert.deepEqual(result.claimsAnalysis.unsupportedSkills, []);
      assert.ok(result.sanitizedAssessment);
    });

    it("works interchangeably with RawProviderAssessmentOutput or direct rawData object", () => {
      const minReq = createValidMinimizedRequest();
      const rawDataDirect = createValidAssessmentPayload();

      // Passing rawData directly without wrapper
      const result = validateCareerAssessmentEvidence(minReq, rawDataDirect);
      assert.equal(result.isValid, true);
      assert.equal(result.status, "VALID");
    });

    it("interoperates seamlessly with output of minimizeCareerAssessmentTelemetry()", () => {
      const rawReq = {
        correlationId: "corr-live-test",
        candidateProfile: {
          headline: "DevOps Engineer",
          yearsOfExperience: 5,
          declaredSkills: ["Docker", "Kubernetes", "Python"],
          targetRoles: ["Senior DevOps Engineer"],
          email: "should_be_stripped@example.com", // unallowlisted
        },
        pipelineTelemetry: createValidMinimizedRequest().pipelineTelemetry,
      };

      const minimizerResult = minimizeCareerAssessmentTelemetry(rawReq);
      const validPayload = createValidAssessmentPayload({
        skillGapAnalysis: {
          verifiedCandidateSkills: ["Docker", "Kubernetes"],
          criticalMissingSkills: ["Go"],
          skillBridgingAdvice: "Expand programming depth",
        },
      });

      // Pass minimizer result directly into validator
      const result = validateCareerAssessmentEvidence(minimizerResult, validPayload);
      assert.equal(result.isValid, true);
      assert.equal(result.status, "VALID");
    });

    it("rejects invalid minimizedRequest with AiConfigurationError", () => {
      assert.throws(
        () => validateCareerAssessmentEvidence(null, createValidAssessmentPayload()),
        (err) => err instanceof AiConfigurationError && err.diagnosticContext?.reason === "INVALID_MINIMIZED_REQUEST"
      );

      const brokenReq = { correlationId: "" };
      assert.throws(
        () => validateCareerAssessmentEvidence(brokenReq, createValidAssessmentPayload()),
        (err) => err instanceof AiConfigurationError && err.diagnosticContext?.reason === "INVALID_MINIMIZED_REQUEST"
      );
    });

    it("rejects invalid rawAssessmentOutput types with AiConfigurationError", () => {
      const minReq = createValidMinimizedRequest();
      assert.throws(
        () => validateCareerAssessmentEvidence(minReq, null),
        (err) => err instanceof AiConfigurationError && err.diagnosticContext?.reason === "INVALID_RAW_OUTPUT"
      );
      assert.throws(
        () => validateCareerAssessmentEvidence(minReq, "notAnObject"),
        (err) => err instanceof AiConfigurationError && err.diagnosticContext?.reason === "INVALID_RAW_OUTPUT"
      );
    });

    it("flags missing sections with STRUCTURAL_INVALID status", () => {
      const minReq = createValidMinimizedRequest();
      const brokenPayload = createValidAssessmentPayload();
      delete brokenPayload.candidateSummary;

      const result = validateCareerAssessmentEvidence(minReq, brokenPayload);
      assert.equal(result.isValid, false);
      assert.equal(result.status, "STRUCTURAL_INVALID");
      assert.equal(result.validationAudit.schemaValid, false);
      assert.ok(result.validationAudit.discrepancies.some((d) => d.includes("candidateSummary")));
    });

    it("flags invalid enum values with STRUCTURAL_INVALID status", () => {
      const minReq = createValidMinimizedRequest();
      const badEnumPayload = createValidAssessmentPayload({
        candidateSummary: {
          careerStage: "super_ninja_master", // invalid enum
          pipelineHealth: "healthy",
          primaryBottleneck: "None",
        },
      });

      const result = validateCareerAssessmentEvidence(minReq, badEnumPayload);
      assert.equal(result.isValid, false);
      assert.equal(result.status, "STRUCTURAL_INVALID");
      assert.equal(result.validationAudit.schemaValid, false);
      assert.ok(result.validationAudit.discrepancies.some((d) => d.includes("careerStage")));
    });

    it("rejects oversized assessment output payloads (> 512 KB)", () => {
      const minReq = createValidMinimizedRequest();
      const giantList = new Array(20000).fill("Giant string content for payload inflation");
      const giantPayload = createValidAssessmentPayload({
        pipelineDiagnostics: {
          volumeAssessment: giantList.join(" "),
          stageProgressionVelocity: "ok",
          staleApplicationRisk: "low",
        },
      });

      assert.throws(
        () => validateCareerAssessmentEvidence(minReq, giantPayload),
        (err) => err instanceof AiConfigurationError && err.diagnosticContext?.reason === "OUTPUT_PAYLOAD_TOO_LARGE"
      );
    });

    it("throws AiSchemaValidationError when throwOnError is enabled and structure fails", () => {
      const minReq = createValidMinimizedRequest();
      const badPayload = { candidateSummary: null };

      assert.throws(
        () => validateCareerAssessmentEvidence(minReq, badPayload, { throwOnError: true }),
        (err) => err instanceof AiSchemaValidationError && err.statusCode === 422
      );
    });
  });

  // ==========================================================================
  // 2. SKILL EVIDENCE GROUNDING & SUBSET AUDIT
  // ==========================================================================
  describe("2. Skill Evidence Grounding & Subset Audit", () => {
    it("accepts verified candidate skills that are strict case-insensitive subsets of declared skills", () => {
      const minReq = createValidMinimizedRequest({
        candidateProfile: {
          ...createValidMinimizedRequest().candidateProfile,
          declaredSkills: ["JavaScript", "Node.js", "React.js", "PostgreSQL"],
        },
      });

      const payload = createValidAssessmentPayload({
        skillGapAnalysis: {
          verifiedCandidateSkills: ["javascript", "Node.js", "react"], // case and .js normalized
          criticalMissingSkills: ["Go"],
          skillBridgingAdvice: "Learn systems languages",
        },
      });

      const result = validateCareerAssessmentEvidence(minReq, payload);
      assert.equal(result.isValid, true);
      assert.equal(result.claimsAnalysis.unsupportedSkills.length, 0);
      assert.equal(result.claimsAnalysis.validatedSkills.length, 3);
    });

    it("identifies undeclared skills in verifiedCandidateSkills and sets UNSUPPORTED_CLAIMS", () => {
      const minReq = createValidMinimizedRequest({
        candidateProfile: {
          ...createValidMinimizedRequest().candidateProfile,
          declaredSkills: ["Go", "Kubernetes"], // Only Go and Kubernetes declared
        },
      });

      const payloadWithHallucinatedSkills = createValidAssessmentPayload({
        skillGapAnalysis: {
          // Model hallucinates Rust and Ruby as existing skills:
          verifiedCandidateSkills: ["Go", "Kubernetes", "Rust", "Ruby on Rails"],
          criticalMissingSkills: ["AWS"],
          skillBridgingAdvice: "Focus on cloud providers",
        },
      });

      const result = validateCareerAssessmentEvidence(minReq, payloadWithHallucinatedSkills);
      assert.equal(result.isValid, false);
      assert.equal(result.status, "UNSUPPORTED_CLAIMS");
      assert.equal(result.validationAudit.evidenceGrounded, false);

      // Verify unsupported skills tracked
      assert.ok(result.claimsAnalysis.unsupportedSkills.includes("Rust"));
      assert.ok(result.claimsAnalysis.unsupportedSkills.includes("Ruby on Rails"));
      assert.ok(result.validationAudit.discrepancies.some((d) => d.includes("Rust")));
    });

    it("flags contradiction when a skill in criticalMissingSkills was already declared", () => {
      const minReq = createValidMinimizedRequest({
        candidateProfile: {
          ...createValidMinimizedRequest().candidateProfile,
          declaredSkills: ["Python", "Docker", "PostgreSQL"],
        },
      });

      const payloadWithContradiction = createValidAssessmentPayload({
        skillGapAnalysis: {
          verifiedCandidateSkills: ["Docker"],
          // Model claims candidate is critically missing Python, which they already have!
          criticalMissingSkills: ["Python", "Kubernetes"],
          skillBridgingAdvice: "Learn Python from scratch",
        },
      });

      const result = validateCareerAssessmentEvidence(minReq, payloadWithContradiction);
      assert.equal(result.isValid, false);
      assert.equal(result.status, "UNSUPPORTED_CLAIMS");
      assert.ok(result.validationAudit.discrepancies.some((d) => d.includes("Contradiction") && d.includes("Python")));
    });
  });

  // ==========================================================================
  // 3. EXPERIENCE DURATION & CAREER STAGE FLOORS
  // ==========================================================================
  describe("3. Experience & Career Stage Floor Audit", () => {
    it("rejects senior or lead classification for zero-experience candidates", () => {
      const zeroExpReq = createValidMinimizedRequest({
        candidateProfile: {
          ...createValidMinimizedRequest().candidateProfile,
          yearsOfExperience: 0, // Fresh graduate / bootcamp career starter
        },
      });

      // 1. Inflated to senior
      const seniorClaim = createValidAssessmentPayload({
        candidateSummary: {
          careerStage: "senior",
          pipelineHealth: "healthy",
          primaryBottleneck: "Lack of volume",
        },
      });

      const resultSenior = validateCareerAssessmentEvidence(zeroExpReq, seniorClaim);
      assert.equal(resultSenior.isValid, false);
      assert.equal(resultSenior.status, "UNSUPPORTED_CLAIMS");
      assert.equal(resultSenior.claimsAnalysis.experienceAssessment.supported, false);
      assert.ok(resultSenior.validationAudit.discrepancies.some((d) => d.includes("Inflated career stage claim")));

      // 2. Inflated to lead architect
      const leadClaim = createValidAssessmentPayload({
        candidateSummary: {
          careerStage: "lead_architect",
          pipelineHealth: "healthy",
          primaryBottleneck: "Lack of volume",
        },
      });

      const resultLead = validateCareerAssessmentEvidence(zeroExpReq, leadClaim);
      assert.equal(resultLead.isValid, false);
      assert.equal(resultLead.status, "UNSUPPORTED_CLAIMS");
    });

    it("rejects lead_architect classification for candidates with less than 3 years experience", () => {
      const juniorReq = createValidMinimizedRequest({
        candidateProfile: {
          ...createValidMinimizedRequest().candidateProfile,
          yearsOfExperience: 1.5,
        },
      });

      const leadClaim = createValidAssessmentPayload({
        candidateSummary: {
          careerStage: "lead_architect",
          pipelineHealth: "healthy",
          primaryBottleneck: "None",
        },
      });

      const result = validateCareerAssessmentEvidence(juniorReq, leadClaim);
      assert.equal(result.isValid, false);
      assert.equal(result.status, "UNSUPPORTED_CLAIMS");
      assert.ok(result.validationAudit.discrepancies.some((d) => d.includes("lead_architect")));
    });

    it("detects inflated experience duration assertions inside rationale text", () => {
      const minReq = createValidMinimizedRequest({
        candidateProfile: {
          ...createValidMinimizedRequest().candidateProfile,
          yearsOfExperience: 2.0, // Candidate has 2 years
        },
      });

      const payloadInflatedText = createValidAssessmentPayload({
        candidateSummary: {
          careerStage: "mid_level",
          pipelineHealth: "healthy",
          primaryBottleneck: "None",
        },
        strategicRecommendations: [
          {
            id: "REC-01",
            category: "targeting_alignment",
            priority: "high",
            title: "Leverage Veteran Status",
            // Model asserts candidate has 12 years experience!
            rationale: "With over 12 years of experience in distributed systems, candidate is overqualified for junior roles.",
            actionSteps: ["Apply to principal roles"],
            expectedImpact: "High",
          },
        ],
      });

      const result = validateCareerAssessmentEvidence(minReq, payloadInflatedText);
      assert.equal(result.isValid, false);
      assert.equal(result.status, "UNSUPPORTED_CLAIMS");
      assert.ok(result.validationAudit.discrepancies.some((d) => d.includes("Inflated experience claim in text")));
    });
  });

  // ==========================================================================
  // 4. PIPELINE METRIC CITATION GROUNDING
  // ==========================================================================
  describe("4. Pipeline Metric Citation Grounding", () => {
    it("accepts valid citations that ground cleanly in pipeline telemetry numbers", () => {
      const minReq = createValidMinimizedRequest();
      const payload = createValidAssessmentPayload({
        evidenceGrounding: {
          citedMetrics: [
            "8 submitted applications",
            "2 active interviews",
            "1 pending offer",
            "14 threshold days",
          ],
          dataLimitationsNoted: "None",
        },
      });

      const result = validateCareerAssessmentEvidence(minReq, payload);
      assert.equal(result.isValid, true);
      assert.equal(result.claimsAnalysis.unsupportedMetrics.length, 0);
    });

    it("flags fabricated numbers in citedMetrics that appear nowhere in pipeline telemetry", () => {
      const minReq = createValidMinimizedRequest({
        pipelineTelemetry: {
          ...createValidMinimizedRequest().pipelineTelemetry,
          submittedApplications: 8,
          interviewsInProgress: 2,
        },
      });

      const payloadWithHallucinatedMetrics = createValidAssessmentPayload({
        evidenceGrounding: {
          citedMetrics: [
            "8 submitted applications",
            // Fabricated metrics: 47 rejected, 89 active applications:
            "47 total rejections",
            "89 active applications",
          ],
          dataLimitationsNoted: "None",
        },
      });

      const result = validateCareerAssessmentEvidence(minReq, payloadWithHallucinatedMetrics);
      assert.equal(result.isValid, false);
      assert.equal(result.status, "UNSUPPORTED_CLAIMS");
      assert.ok(result.claimsAnalysis.unsupportedMetrics.includes("47 total rejections"));
      assert.ok(result.validationAudit.discrepancies.some((d) => d.includes("Fabricated metric citation")));
    });
  });

  // ==========================================================================
  // 5. FACTUAL DEGREE & CERTIFICATION ASSERTIONS
  // ==========================================================================
  describe("5. Education & Certification Factual Assertions", () => {
    it("flags ungrounded factual assertions claiming candidate holds specific degrees or certs", () => {
      const minReq = createValidMinimizedRequest();

      const payloadWithFabricatedDegree = createValidAssessmentPayload({
        candidateSummary: {
          careerStage: "senior",
          pipelineHealth: "healthy",
          // Model invents a degree:
          primaryBottleneck: "Candidate graduated from MIT with a Master's degree but lacks interview volume.",
        },
      });

      const result = validateCareerAssessmentEvidence(minReq, payloadWithFabricatedDegree);
      assert.equal(result.isValid, false);
      assert.equal(result.status, "UNSUPPORTED_CLAIMS");
      assert.ok(result.validationAudit.discrepancies.some((d) => d.includes("Unsupported educational or certification claim")));
    });

    it("preserves legitimate future-oriented recommendations without falsely rejecting them", () => {
      const minReq = createValidMinimizedRequest();

      // Recommendation suggests future certification study: this is a suggestion, NOT an ungrounded claim!
      const payloadWithFutureRecommendation = createValidAssessmentPayload({
        strategicRecommendations: [
          {
            id: "REC-01",
            category: "skill_acquisition",
            priority: "medium",
            title: "Study for CKA Certification",
            rationale: "Acquiring a Certified Kubernetes Administrator credential would validate cloud skills.",
            actionSteps: ["Enroll in online course", "Practice mock exams"],
            expectedImpact: "Boosts interview callback rate.",
          },
        ],
      });

      const result = validateCareerAssessmentEvidence(minReq, payloadWithFutureRecommendation);
      assert.equal(result.isValid, true);
      assert.equal(result.status, "VALID");
      assert.equal(result.validationAudit.discrepancies.length, 0);
    });
  });

  // ==========================================================================
  // 6. SECURITY, PRIVACY & SELF-VERIFICATION CLAIM NEUTRALIZATION
  // ==========================================================================
  describe("6. Security & Self-Verification Claim Neutralization", () => {
    it("strips hallucinationCheckPassed claim from assessment output", () => {
      const minReq = createValidMinimizedRequest();

      const payloadWithDeceptiveClaims = createValidAssessmentPayload({
        // Deceptive self-certification flags injected by model:
        hallucinationCheckPassed: true,
        evidenceGrounding: {
          citedMetrics: ["8 submitted applications"],
          dataLimitationsNoted: "None",
          hallucinationCheckPassed: true,
        },
      });

      const result = validateCareerAssessmentEvidence(minReq, payloadWithDeceptiveClaims);
      assert.equal(result.isValid, true);

      // Verify authoritative output does NOT contain hallucinationCheckPassed
      assert.equal(result.sanitizedAssessment.hallucinationCheckPassed, undefined);
      assert.equal(result.sanitizedAssessment.evidenceGrounding.hallucinationCheckPassed, undefined);
    });

    it("prevents prototype pollution payloads from polluting validation results", () => {
      const minReq = createValidMinimizedRequest();
      const maliciousPayload = JSON.parse(
        '{"__proto__":{"polluted":true},"candidateSummary":{"careerStage":"senior","pipelineHealth":"healthy","primaryBottleneck":"None"},"pipelineDiagnostics":{"volumeAssessment":"ok","stageProgressionVelocity":"ok","staleApplicationRisk":"ok"},"skillGapAnalysis":{"verifiedCandidateSkills":["Go"],"criticalMissingSkills":[],"skillBridgingAdvice":"ok"},"strategicRecommendations":[{"id":"REC-1","category":"pipeline_velocity","priority":"high","title":"A","rationale":"B","actionSteps":["C"],"expectedImpact":"D"}],"evidenceGrounding":{"citedMetrics":[],"dataLimitationsNoted":""}}'
      );

      const result = validateCareerAssessmentEvidence(minReq, maliciousPayload);
      assert.equal({}.polluted, undefined, "Global Object prototype must not be polluted");
      assert.equal(result.sanitizedAssessment.__proto__.polluted, undefined);
    });

    it("does not leak raw candidate PII in validation error messages or discrepancies", () => {
      const minReq = createValidMinimizedRequest({
        candidateProfile: {
          ...createValidMinimizedRequest().candidateProfile,
          declaredSkills: ["Go"],
        },
      });

      const badPayload = createValidAssessmentPayload({
        skillGapAnalysis: {
          verifiedCandidateSkills: ["Go", "HallucinatedSecretSkill"],
          criticalMissingSkills: [],
          skillBridgingAdvice: "Advice",
        },
      });

      const result = validateCareerAssessmentEvidence(minReq, badPayload);
      const discrepanciesJson = JSON.stringify(result.validationAudit.discrepancies);

      // Verify no internal sensitive keys leaked
      assert.ok(!discrepanciesJson.includes("gsk_"));
      assert.ok(!discrepanciesJson.includes("password"));
      assert.ok(!discrepanciesJson.includes("Bearer"));
    });
  });

  // ==========================================================================
  // 7. DETERMINISM & IMMUTABILITY
  // ==========================================================================
  describe("7. Determinism & Immutability", () => {
    it("never mutates original inputs", () => {
      const minReq = createValidMinimizedRequest();
      const rawPayload = createValidAssessmentPayload({
        hallucinationCheckPassed: true,
      });

      const reqSnapshot = JSON.stringify(minReq);
      const payloadSnapshot = JSON.stringify(rawPayload);

      validateCareerAssessmentEvidence(minReq, rawPayload);

      assert.equal(JSON.stringify(minReq), reqSnapshot, "minimizedRequest must remain unmutated");
      assert.equal(JSON.stringify(rawPayload), payloadSnapshot, "rawAssessmentOutput must remain unmutated");
    });

    it("mutating returned sanitizedAssessment does not alter raw assessment input", () => {
      const minReq = createValidMinimizedRequest();
      const rawPayload = createValidAssessmentPayload();

      const result = validateCareerAssessmentEvidence(minReq, rawPayload);
      result.sanitizedAssessment.candidateSummary.careerStage = "entry_level";
      result.sanitizedAssessment.strategicRecommendations.push({ evil: true });

      assert.equal(rawPayload.candidateSummary.careerStage, "senior");
      assert.equal(rawPayload.strategicRecommendations.length, 2);
    });

    it("produces deterministic validation outcomes across repeated runs", () => {
      const minReq = createValidMinimizedRequest();
      const payload = createValidAssessmentPayload();

      const run1 = validateCareerAssessmentEvidence(minReq, payload);
      const run2 = validateCareerAssessmentEvidence(minReq, payload);

      assert.deepEqual(run1.validationAudit, run2.validationAudit);
      assert.deepEqual(run1.claimsAnalysis, run2.claimsAnalysis);
      assert.equal(run1.isValid, run2.isValid);
      assert.equal(run1.status, run2.status);
    });
  });
});