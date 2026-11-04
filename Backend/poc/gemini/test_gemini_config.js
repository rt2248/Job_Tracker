/**
 * test_gemini_config.js
 *
 * Comprehensive offline verification suite for Stage 2A.6:
 * - Gemini 3.x thinkingLevel validation (LOW, MEDIUM, HIGH, rejection of MINIMAL & numeric budgets)
 * - Error classification taxonomy (CONFIGURATION_ERROR, AUTHENTICATION_ERROR, QUOTA_EXHAUSTED,
 *   CAPACITY_UNAVAILABLE, MODEL_FAILURE, NETWORK_ERROR)
 * - Strict non-retrying guardrail for HTTP 429 (quota exhausted)
 * - Benchmark integrity and score isolation (blocked executions never scored as 0/5.00)
 *
 * Execution: Strictly offline / local mock tests. No live API calls.
 */

const assert = require("assert");
const {
  GeminiClient,
  ERROR_TYPES,
  SUPPORTED_THINKING_LEVELS,
  DEFAULT_THINKING_LEVEL,
  validateThinkingLevel,
  sanitizeSchemaForGemini,
} = require("./geminiClient");
const { GeminiMetricsReporter } = require("./harness");

let testCount = 0;
let passedCount = 0;

function it(description, fn) {
  testCount++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function itAsync(description, fn) {
  testCount++;
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("       STAGE 2A.6 OFFLINE VERIFICATION: GEMINI CONFIG & ERROR TAXONOMY          ");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. THINKING LEVEL VALIDATION TESTS
  // ---------------------------------------------------------------------------
  console.log("--- 1. Thinking Level Validation (Gemini 3.x Specification) ---");

  it("defaults to MEDIUM when level is undefined, null, or empty string", () => {
    assert.deepStrictEqual(validateThinkingLevel(undefined), { valid: true, value: "MEDIUM", error: null });
    assert.deepStrictEqual(validateThinkingLevel(null), { valid: true, value: "MEDIUM", error: null });
    assert.deepStrictEqual(validateThinkingLevel(""), { valid: true, value: "MEDIUM", error: null });
  });

  it("accepts valid thinking levels: LOW, MEDIUM, HIGH", () => {
    for (const level of ["LOW", "MEDIUM", "HIGH"]) {
      const res = validateThinkingLevel(level);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.value, level);
      assert.strictEqual(res.error, null);
    }
  });

  it("handles case-insensitivity and trimming for thinking levels", () => {
    assert.strictEqual(validateThinkingLevel("low").value, "LOW");
    assert.strictEqual(validateThinkingLevel("  medium  ").value, "MEDIUM");
    assert.strictEqual(validateThinkingLevel("HiGh").value, "HIGH");
  });

  it("explicitly rejects MINIMAL with guidance that gemini-3.8-flash does not support it", () => {
    const res = validateThinkingLevel("MINIMAL", "gemini-3.8-flash");
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.value, null);
    assert.ok(res.error.includes("'MINIMAL' is not supported by gemini-3.8-flash"));
    assert.ok(res.error.includes("https://ai.google.dev/gemini-api/docs/thinking"));
  });

  it("explicitly rejects numeric token budgets (e.g. 0) with legacy 2.5 guidance", () => {
    const res0 = validateThinkingLevel("0");
    assert.strictEqual(res0.valid, false);
    assert.ok(res0.error.includes("Numeric token budgets (e.g. thinkingBudget: 0) are legacy Gemini 2.5 parameters"));

    const resInt = validateThinkingLevel(1024);
    assert.strictEqual(resInt.valid, false);
    assert.ok(resInt.error.includes("Numeric token budgets"));
  });

  it("rejects unsupported arbitrary levels (OFF, NONE, EXTREME, -1)", () => {
    for (const invalid of ["OFF", "NONE", "EXTREME", "-1", "minimalist"]) {
      const res = validateThinkingLevel(invalid);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.value, null);
      assert.ok(res.error.includes(`Invalid thinkingLevel '${invalid}'`));
    }
  });

  // ---------------------------------------------------------------------------
  // 2. ERROR TYPES ENUM VERIFICATION
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Error Classification Taxonomy Constants ---");

  it("defines all six mandatory error classifications", () => {
    assert.strictEqual(ERROR_TYPES.CONFIGURATION_ERROR, "CONFIGURATION_ERROR");
    assert.strictEqual(ERROR_TYPES.AUTHENTICATION_ERROR, "AUTHENTICATION_ERROR");
    assert.strictEqual(ERROR_TYPES.QUOTA_EXHAUSTED, "QUOTA_EXHAUSTED");
    assert.strictEqual(ERROR_TYPES.CAPACITY_UNAVAILABLE, "CAPACITY_UNAVAILABLE");
    assert.strictEqual(ERROR_TYPES.MODEL_FAILURE, "MODEL_FAILURE");
    assert.strictEqual(ERROR_TYPES.NETWORK_ERROR, "NETWORK_ERROR");
  });

  // ---------------------------------------------------------------------------
  // 3. CLIENT CONFIGURATION GUARDRAIL
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Client Local Guardrails (No API Call for Invalid Config) ---");

  await itAsync("halts immediately with CONFIGURATION_ERROR when client instantiated with invalid thinkingLevel", async () => {
    const invalidClient = new GeminiClient({
      apiKey: "test-fake-key",
      thinkingLevel: "MINIMAL",
    });

    assert.ok(invalidClient.configError);
    assert.ok(invalidClient.configError.includes("MINIMAL"));

    const result = await invalidClient.generateAssessment({
      systemPrompt: "sys",
      userPrompt: "usr",
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.errorType, ERROR_TYPES.CONFIGURATION_ERROR);
    assert.strictEqual(result.statusCode, 400);
    assert.strictEqual(result.attempts, 0);
    assert.ok(result.error.includes("MINIMAL"));
  });

  // ---------------------------------------------------------------------------
  // 4. MOCKED API ERROR HANDLING & RETRY BEHAVIOR
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. API Error Mapping & Non-Retrying Quota Guardrail (Mocked) ---");

  const originalFetch = global.fetch;

  await itAsync("maps HTTP 400 Bad Request to CONFIGURATION_ERROR", async () => {
    global.fetch = async () => ({
      status: 400,
      ok: false,
      text: async () => JSON.stringify({ error: { message: "Invalid argument: bad parameter" } }),
    });

    const client = new GeminiClient({ apiKey: "test-key" });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.CONFIGURATION_ERROR);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.error.includes("Configuration Error"));
  });

  await itAsync("maps HTTP 401 & 403 to AUTHENTICATION_ERROR", async () => {
    global.fetch = async () => ({
      status: 403,
      ok: false,
      text: async () => JSON.stringify({ error: { message: "API key expired or invalid" } }),
    });

    const client = new GeminiClient({ apiKey: "bad-key" });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.AUTHENTICATION_ERROR);
    assert.strictEqual(res.statusCode, 403);
    assert.ok(res.error.includes("Authentication Error"));
  });

  await itAsync("HTTP 429 returns QUOTA_EXHAUSTED immediately with ZERO retries", async () => {
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      return {
        status: 429,
        ok: false,
        headers: new Map(),
        text: async () => JSON.stringify({ error: { message: "RESOURCE_EXHAUSTED: daily limit reached" } }),
      };
    };

    const client = new GeminiClient({ apiKey: "test-key", maxRetries: 3 });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(callCount, 1, "HTTP 429 must not be retried automatically");
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.QUOTA_EXHAUSTED);
    assert.strictEqual(res.statusCode, 429);
    assert.strictEqual(res.attempts, 1);
    assert.ok(res.error.includes("Quota Exhausted"));
  });

  await itAsync("HTTP 503 triggers bounded retries and maps to CAPACITY_UNAVAILABLE", async () => {
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      return {
        status: 503,
        ok: false,
        headers: { get: () => "0" }, // 0 delay for fast unit test
        text: async () => JSON.stringify({ error: { message: "Service Unavailable: model overloaded" } }),
      };
    };

    const client = new GeminiClient({ apiKey: "test-key", maxRetries: 2 });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(callCount, 2, "HTTP 503 should retry up to maxRetries");
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.CAPACITY_UNAVAILABLE);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.attempts, 2);
  });

  await itAsync("Timeout / AbortError maps to NETWORK_ERROR", async () => {
    global.fetch = async () => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    };

    const client = new GeminiClient({ apiKey: "test-key", timeoutMs: 100 });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.NETWORK_ERROR);
    assert.ok(res.error.includes("timed out"));
  });

  await itAsync("Malformed non-JSON output maps to MODEL_FAILURE", async () => {
    global.fetch = async () => ({
      status: 200,
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "This is plain text, not JSON" }] } }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50, totalTokenCount: 150 },
      }),
    });

    const client = new GeminiClient({ apiKey: "test-key" });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.MODEL_FAILURE);
    assert.ok(res.error.includes("JSON parse error"));
  });

  // Restore original fetch
  global.fetch = originalFetch;

  // ---------------------------------------------------------------------------
  // 5. BENCHMARK INTEGRITY & SCORE PROTECTION
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Benchmark Integrity & Score Isolation ---");

  it("marks operational blocks as BLOCKED with null scores (never 0/5.00)", () => {
    const reporter = new GeminiMetricsReporter("gemini-3.8-flash", "MEDIUM");
    const mockScenario = { id: "SCENARIO-1", name: "Volume Deficit" };

    const result = reporter.evaluateScenario({
      scenario: mockScenario,
      assessment: null,
      errorType: ERROR_TYPES.QUOTA_EXHAUSTED,
      errorMessage: "HTTP 429 RESOURCE_EXHAUSTED",
      status: "BLOCKED",
    });

    assert.strictEqual(result.status, "BLOCKED");
    assert.strictEqual(result.scores, null, "Blocked execution scores must be null, not 0");
    assert.strictEqual(result.errorType, ERROR_TYPES.QUOTA_EXHAUSTED);
  });

  it("calculates rubric composite scores exclusively from completed runs", () => {
    const reporter = new GeminiMetricsReporter("gemini-3.8-flash", "MEDIUM");
    const mockScenario1 = {
      id: "SCENARIO-1",
      name: "Volume Deficit",
      profile: { declaredSkills: ["Node.js", "Express", "PostgreSQL"] },
      expectedGroundTruth: {
        careerStage: "mid_level",
        pipelineHealth: "needs_focus",
        primaryBottleneckKeywords: ["volume", "submission"],
      },
    };
    const mockScenario2 = { id: "SCENARIO-2", name: "Resume Conversion" };

    // Run 1: Successful assessment
    const validAssessment = {
      candidateSummary: {
        careerStage: "mid_level",
        pipelineHealth: "needs_focus",
        primaryBottleneck: "low submission volume in application pipeline",
      },
      pipelineDiagnostics: {
        volumeAssessment: "Candidate has tracked only 3 applications in 60 days.",
        stageProgressionVelocity: "Progression velocity is stalled at initial screening.",
        staleApplicationRisk: "Moderate risk of stale opportunities.",
      },
      skillGapAnalysis: {
        verifiedCandidateSkills: ["Node.js", "Express", "PostgreSQL"],
        criticalMissingSkills: ["System Design", "AWS"],
        skillBridgingAdvice: "Complete cloud architecture certifications.",
      },
      strategicRecommendations: [
        {
          id: "REC-01",
          category: "pipeline_velocity",
          priority: "high",
          title: "Increase Application Cadence",
          rationale: "Volume is the primary hurdle currently facing the candidate.",
          actionSteps: ["Apply to 5 jobs weekly", "Target backend roles"],
          expectedImpact: "Doubles interview invitation probability.",
        },
      ],
      evidenceGrounding: {
        citedMetrics: ["3 applications submitted"],
        dataLimitationsNoted: "None",
        hallucinationCheckPassed: true,
      },
    };

    reporter.evaluateScenario({
      scenario: mockScenario1,
      assessment: validAssessment,
      latencyMs: 1800,
      usage: { promptTokens: 300, completionTokens: 200, thinkingTokens: 400, totalTokens: 900 },
      isLiveExecution: true,
      status: "COMPLETED",
    });

    // Run 2: Blocked by quota exhaustion
    reporter.evaluateScenario({
      scenario: mockScenario2,
      assessment: null,
      errorType: ERROR_TYPES.QUOTA_EXHAUSTED,
      errorMessage: "HTTP 429 RESOURCE_EXHAUSTED",
      status: "BLOCKED",
    });

    const summary = reporter.generateSummary();

    assert.strictEqual(summary.totalPlanned, 2);
    assert.strictEqual(summary.successfulExecutions, 1);
    assert.strictEqual(summary.blockedExecutions, 1);
    assert.strictEqual(summary.scenarioCoverageRate, "50%");
    assert.strictEqual(summary.blockedBreakdown.quotaExhausted, 1);

    // Rubric score must match Run 1 (5.00), and NOT be halved to 2.50 by the blocked scenario!
    assert.strictEqual(summary.rubricScores.overallCompositeScore, 5.00);
    assert.strictEqual(summary.rubricScores.evidenceGrounding, 5.00);
    assert.strictEqual(summary.averages.thinkingTokens, 400);
  });

  it("reports N/A rubric scores when all executions are blocked (no division by zero or 0.00 score)", () => {
    const reporter = new GeminiMetricsReporter("gemini-3.8-flash", "MEDIUM");
    const mockScenario = { id: "SCENARIO-1", name: "Blocked" };

    reporter.evaluateScenario({
      scenario: mockScenario,
      assessment: null,
      errorType: ERROR_TYPES.QUOTA_EXHAUSTED,
      status: "BLOCKED",
    });

    const summary = reporter.generateSummary();
    assert.strictEqual(summary.successfulExecutions, 0);
    assert.strictEqual(summary.blockedExecutions, 1);
    assert.strictEqual(summary.rubricScores, null);
  });

  // ---------------------------------------------------------------------------
  // 6. JSON SCHEMA SANITIZER TEST
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Schema Sanitization for Gemini OpenAPI Dialect ---");

  it("recursively removes additionalProperties from schema while preserving structure", () => {
    const schemaWithAdditional = {
      type: "object",
      additionalProperties: false,
      properties: {
        field1: { type: "string" },
        nested: {
          type: "object",
          additionalProperties: false,
          properties: {
            field2: { type: "number" },
          },
        },
      },
    };

    const sanitized = sanitizeSchemaForGemini(schemaWithAdditional);
    assert.strictEqual(sanitized.additionalProperties, undefined);
    assert.strictEqual(sanitized.properties.nested.additionalProperties, undefined);
    assert.strictEqual(sanitized.properties.field1.type, "string");
    assert.strictEqual(sanitized.properties.nested.properties.field2.type, "number");
  });

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passedCount} / ${testCount} passed (${Math.round((passedCount / testCount) * 100)}%)`);
  console.log("================================================================================\n");

  if (passedCount !== testCount) {
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exitCode = 1;
});
