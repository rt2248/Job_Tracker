/**
 * test_groq_config.js
 *
 * Comprehensive offline verification suite for Stage 2A.9:
 * - Groq error classification taxonomy (CONFIGURATION_ERROR, AUTHENTICATION_ERROR,
 *   RATE_LIMITED, QUOTA_EXHAUSTED, CAPACITY_UNAVAILABLE, MODEL_FAILURE, NETWORK_ERROR)
 * - Distinguishing RPM/TPM rate limits from explicit daily quota exhaustion
 * - Zero retries on HTTP 429
 * - Harness benchmark stop mechanism on HTTP 429
 * - Benchmark integrity and score isolation (blocked runs have `scores: null`, never 0/5.00)
 * - Safe rate-limit header telemetry extraction (with fallback for missing headers)
 * - Credential protection (zero credential fragments in logs/status)
 *
 * Execution: STRICTLY OFFLINE / LOCAL MOCKS ONLY. No live API calls.
 */

const assert = require("assert");
const {
  GroqClient,
  ERROR_TYPES,
  classify429Error,
  parseRateLimitHeaders,
} = require("./groqClient");
const { MetricsReporter } = require("./metricsReporter");

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
  console.log("       STAGE 2A.9 OFFLINE VERIFICATION: GROQ CONFIG & ERROR TAXONOMY            ");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. ERROR CLASSIFICATION CONSTANTS
  // ---------------------------------------------------------------------------
  console.log("--- 1. Error Taxonomy Constants ---");

  it("defines all seven mandatory error classifications", () => {
    assert.strictEqual(ERROR_TYPES.CONFIGURATION_ERROR, "CONFIGURATION_ERROR");
    assert.strictEqual(ERROR_TYPES.AUTHENTICATION_ERROR, "AUTHENTICATION_ERROR");
    assert.strictEqual(ERROR_TYPES.RATE_LIMITED, "RATE_LIMITED");
    assert.strictEqual(ERROR_TYPES.QUOTA_EXHAUSTED, "QUOTA_EXHAUSTED");
    assert.strictEqual(ERROR_TYPES.CAPACITY_UNAVAILABLE, "CAPACITY_UNAVAILABLE");
    assert.strictEqual(ERROR_TYPES.MODEL_FAILURE, "MODEL_FAILURE");
    assert.strictEqual(ERROR_TYPES.NETWORK_ERROR, "NETWORK_ERROR");
  });

  // ---------------------------------------------------------------------------
  // 2. 429 CLASSIFICATION (RPM/TPM vs DAILY QUOTA)
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Granular 429 Classification (RPM/TPM vs Quota Exhaustion) ---");

  it("classifies transient RPM limits as RATE_LIMITED (not daily quota exhaustion)", () => {
    const msg = "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_xxx` on requests per minute (RPM): Limit 30, Used 30, Requested 1. Please try again in 2s.";
    const res = classify429Error(msg);
    assert.strictEqual(res, ERROR_TYPES.RATE_LIMITED);
  });

  it("classifies transient TPM limits as RATE_LIMITED (not daily quota exhaustion)", () => {
    const msg = "Rate limit reached for model `openai/gpt-oss-120b` on tokens per minute (TPM): Limit 30000, Used 29500, Requested 1200. Please try again in 500ms.";
    const res = classify429Error(msg);
    assert.strictEqual(res, ERROR_TYPES.RATE_LIMITED);
  });

  it("classifies explicit daily quota exhaustion as QUOTA_EXHAUSTED", () => {
    const msg = "You exceeded your current quota: requests_per_day limit 14400 reached for project.";
    const res = classify429Error(msg);
    assert.strictEqual(res, ERROR_TYPES.QUOTA_EXHAUSTED);
  });

  it("classifies billing/credit exhaustion as QUOTA_EXHAUSTED", () => {
    const details = { error: { message: "Credit limit exceeded or billing expired", code: "insufficient_quota" } };
    const res = classify429Error("Exceeded your current quota", details);
    assert.strictEqual(res, ERROR_TYPES.QUOTA_EXHAUSTED);
  });

  it("defaults ambiguous 429 responses to RATE_LIMITED without false daily quota claims", () => {
    const res = classify429Error("Too Many Requests");
    assert.strictEqual(res, ERROR_TYPES.RATE_LIMITED);
  });

  // ---------------------------------------------------------------------------
  // 3. ZERO CREDENTIAL LEAKAGE
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Credential Protection (Zero Fragment Exposure) ---");

  it("getMaskedKey never exposes credential prefixes, suffixes, or character fragments", () => {
    const client = new GroqClient({ apiKey: "gsk_1234567890abcdefghijklmnopqrstuvwxyz" });
    const masked = client.getMaskedKey();
    assert.strictEqual(masked, "[CONFIGURED_PROTECTED]");
    assert.ok(!masked.includes("gsk"));
    assert.ok(!masked.includes("1234"));
    assert.ok(!masked.includes("wxyz"));
  });

  it("getMaskedKey returns null when key is not configured", () => {
    const client = new GroqClient({ apiKey: "" });
    assert.strictEqual(client.getMaskedKey(), null);
  });

  // ---------------------------------------------------------------------------
  // 4. RATE-LIMIT TELEMETRY EXTRACTION
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Safe Rate-Limit Telemetry Extraction ---");

  it("extracts all standard Groq rate limit headers when present", () => {
    const mockHeaders = {
      get: (name) => {
        const map = {
          "x-ratelimit-limit-requests": "30",
          "x-ratelimit-remaining-requests": "29",
          "x-ratelimit-limit-tokens": "30000",
          "x-ratelimit-remaining-tokens": "28500",
          "x-ratelimit-reset-requests": "2.1s",
          "x-ratelimit-reset-tokens": "500ms",
        };
        return map[name.toLowerCase()] || null;
      },
    };

    const telemetry = parseRateLimitHeaders(mockHeaders);
    assert.strictEqual(telemetry.limitRequests, "30");
    assert.strictEqual(telemetry.remainingRequests, "29");
    assert.strictEqual(telemetry.limitTokens, "30000");
    assert.strictEqual(telemetry.remainingTokens, "28500");
    assert.strictEqual(telemetry.resetRequests, "2.1s");
    assert.strictEqual(telemetry.resetTokens, "500ms");
  });

  it("reports missing headers as 'unavailable' rather than crashing or guessing", () => {
    const telemetry = parseRateLimitHeaders(null);
    assert.strictEqual(telemetry.limitRequests, "unavailable");
    assert.strictEqual(telemetry.remainingRequests, "unavailable");
    assert.strictEqual(telemetry.limitTokens, "unavailable");
    assert.strictEqual(telemetry.remainingTokens, "unavailable");
    assert.strictEqual(telemetry.resetRequests, "unavailable");
    assert.strictEqual(telemetry.resetTokens, "unavailable");
  });

  // ---------------------------------------------------------------------------
  // 5. MOCKED API ERROR HANDLING & RETRY BEHAVIOR
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. API Error Taxonomy & Retry Policy (Mocked Responses) ---");

  const originalFetch = global.fetch;

  await itAsync("HTTP 429 returns RATE_LIMITED immediately with STRICTLY ZERO retries", async () => {
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      return {
        status: 429,
        ok: false,
        headers: { get: () => null },
        text: async () => JSON.stringify({ error: { message: "Rate limit reached for requests per minute (RPM)" } }),
      };
    };

    const client = new GroqClient({ apiKey: "test-fake-key", maxRetries: 3 });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(callCount, 1, "HTTP 429 must never be retried automatically");
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.RATE_LIMITED);
    assert.strictEqual(res.statusCode, 429);
    assert.strictEqual(res.attempts, 1);
    assert.ok(res.error.includes("RATE_LIMITED"));
  });

  await itAsync("HTTP 401 returns AUTHENTICATION_ERROR with zero retries", async () => {
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      return {
        status: 401,
        ok: false,
        headers: { get: () => null },
        text: async () => JSON.stringify({ error: { message: "Invalid API key" } }),
      };
    };

    const client = new GroqClient({ apiKey: "bad-key", maxRetries: 3 });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(callCount, 1, "HTTP 401 must not be retried");
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.AUTHENTICATION_ERROR);
    assert.strictEqual(res.statusCode, 401);
  });

  await itAsync("HTTP 400 returns CONFIGURATION_ERROR with zero retries", async () => {
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      return {
        status: 400,
        ok: false,
        headers: { get: () => null },
        text: async () => JSON.stringify({ error: { message: "Invalid model parameter or malformed schema" } }),
      };
    };

    const client = new GroqClient({ apiKey: "test-key", maxRetries: 3 });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(callCount, 1, "HTTP 400 must not be retried");
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.CONFIGURATION_ERROR);
    assert.strictEqual(res.statusCode, 400);
  });

  await itAsync("HTTP 503 triggers bounded retries up to maxRetries and maps to CAPACITY_UNAVAILABLE", async () => {
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      return {
        status: 503,
        ok: false,
        headers: { get: () => "0" }, // 0ms delay for unit test speed
        text: async () => JSON.stringify({ error: { message: "Service Unavailable: model overloaded" } }),
      };
    };

    const client = new GroqClient({ apiKey: "test-key", maxRetries: 2 });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(callCount, 2, "HTTP 503 should retry up to maxRetries");
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.CAPACITY_UNAVAILABLE);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.attempts, 2);
  });

  await itAsync("AbortError maps to NETWORK_ERROR", async () => {
    global.fetch = async () => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    };

    const client = new GroqClient({ apiKey: "test-key", timeoutMs: 50 });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.NETWORK_ERROR);
    assert.ok(res.error.includes("timed out"));
  });

  await itAsync("Malformed non-JSON output maps to MODEL_FAILURE", async () => {
    global.fetch = async () => ({
      status: 200,
      ok: true,
      headers: { get: () => null },
      json: async () => ({
        choices: [{ message: { content: "Unstructured plain text instead of JSON" } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      }),
    });

    const client = new GroqClient({ apiKey: "test-key" });
    const res = await client.generateAssessment({ systemPrompt: "sys", userPrompt: "usr" });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorType, ERROR_TYPES.MODEL_FAILURE);
    assert.ok(res.error.includes("JSON parse error"));
  });

  // Restore fetch
  global.fetch = originalFetch;

  // ---------------------------------------------------------------------------
  // 6. BENCHMARK INTEGRITY & SCORE ISOLATION
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Benchmark Integrity & Score Isolation ---");

  it("marks blocked runs as BLOCKED with null scores (never 0/5.00)", () => {
    const reporter = new MetricsReporter("openai/gpt-oss-120b");
    const mockScenario = { id: "SCENARIO-1", name: "Volume Deficit" };

    const result = reporter.evaluateScenario({
      scenario: mockScenario,
      assessment: null,
      errorType: ERROR_TYPES.RATE_LIMITED,
      errorMessage: "HTTP 429 RATE_LIMITED: RPM limit reached",
      status: "BLOCKED",
    });

    assert.strictEqual(result.status, "BLOCKED");
    assert.strictEqual(result.scores, null, "Blocked execution scores must be null, not 0");
    assert.strictEqual(result.errorType, ERROR_TYPES.RATE_LIMITED);
  });

  it("calculates rubric composite scores exclusively from completed runs", () => {
    const reporter = new MetricsReporter("openai/gpt-oss-120b");
    const mockScenario1 = {
      id: "SCENARIO-1",
      name: "Volume Deficit",
      profile: { declaredSkills: ["React", "JavaScript"] },
      expectedGroundTruth: {
        careerStage: "entry_level",
        pipelineHealth: "needs_focus",
        primaryBottleneckKeywords: ["volume", "saved"],
      },
    };
    const mockScenario2 = { id: "SCENARIO-2", name: "Mid-Level Progression" };

    // Run 1: Successful assessment
    const validAssessment = {
      candidateSummary: {
        careerStage: "entry_level",
        pipelineHealth: "needs_focus",
        primaryBottleneck: "Disproportionate volume of saved vs applied positions",
      },
      pipelineDiagnostics: {
        volumeAssessment: "Candidate has tracked 45 opportunities, but 42 remain in Saved state.",
        stageProgressionVelocity: "Progression velocity is stalled with zero interviews scheduled.",
        staleApplicationRisk: "Saved listings risk expiring if not applied within 14 days.",
      },
      skillGapAnalysis: {
        verifiedCandidateSkills: ["React", "JavaScript"],
        criticalMissingSkills: ["TypeScript", "Git"],
        skillBridgingAdvice: "Complete TypeScript fundamentals and portfolio projects.",
      },
      strategicRecommendations: [
        {
          id: "REC-01",
          category: "pipeline_velocity",
          priority: "high",
          title: "Submit Applications to Top 5 Saved Roles",
          rationale: "Volume bottleneck requires immediate submission cadence.",
          actionSteps: ["Select top 5 roles", "Apply within 48h"],
          expectedImpact: "Doubles active pipeline opportunities.",
        },
      ],
      evidenceGrounding: {
        citedMetrics: ["45 tracked", "42 saved", "3 applied"],
        dataLimitationsNoted: "None",
        hallucinationCheckPassed: true,
      },
    };

    reporter.evaluateScenario({
      scenario: mockScenario1,
      assessment: validAssessment,
      latencyMs: 1950,
      usage: { promptTokens: 350, completionTokens: 250, totalTokens: 600 },
      isLiveExecution: true,
      status: "COMPLETED",
    });

    // Run 2: Blocked by rate limiting
    reporter.evaluateScenario({
      scenario: mockScenario2,
      assessment: null,
      errorType: ERROR_TYPES.RATE_LIMITED,
      errorMessage: "HTTP 429 RATE_LIMITED: RPM exceeded",
      status: "BLOCKED",
    });

    const summary = reporter.generateSummary();

    assert.strictEqual(summary.totalPlanned, 2);
    assert.strictEqual(summary.successfulExecutions, 1);
    assert.strictEqual(summary.blockedExecutions, 1);
    assert.strictEqual(summary.scenarioCoverageRate, "50%");
    assert.strictEqual(summary.blockedBreakdown.rateLimited, 1);

    // Score must be calculated strictly from Run 1 (5.00), not halved to 2.50!
    assert.strictEqual(summary.rubricScores.overallCompositeScore, 5.00);
    assert.strictEqual(summary.rubricScores.evidenceGrounding, 5.00);
  });

  it("reports N/A quality scores when zero executions complete (never 0.00)", () => {
    const reporter = new MetricsReporter("openai/gpt-oss-120b");
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
