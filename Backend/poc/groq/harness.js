#!/usr/bin/env node

/**
 * harness.js
 *
 * Standalone evaluation runner for Evolexa Groq AI Proof of Concept.
 * Executes seven synthetic candidate scenarios against GroqCloud models (openai/gpt-oss-120b),
 * validating structured outputs, zero-hallucination guarantees, token efficiency,
 * and adversarial prompt-injection resistance.
 *
 * Stage 2A.9 Alignment:
 * - Standardized error classification taxonomy
 * - Non-retrying HTTP 429 quota and rate-limit guardrails
 * - Benchmark stop mechanism: immediately stops subsequent scenario dispatches on HTTP 429
 * - Safe rate-limit header telemetry extraction and reporting
 * - Score isolation: blocked executions receive `scores: null` (N/A) and do NOT corrupt composite score
 *
 * Usage:
 *   node Backend/poc/groq/harness.js --all
 *   node Backend/poc/groq/harness.js --scenario=1
 *   node Backend/poc/groq/harness.js --dry-run
 *   node Backend/poc/groq/harness.js --dry-run --simulate-429
 *   node Backend/poc/groq/harness.js --all --verbose
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const { GroqClient, DEFAULT_MODEL, ERROR_TYPES, parseResetTimeToMs } = require("./groqClient");
const { SYNTHETIC_SCENARIOS } = require("./syntheticProfiles");
const { buildAssessmentPrompt } = require("./promptBuilder");
const { MetricsReporter } = require("./metricsReporter");

// Default pacing interval between scenarios (ms) to maintain safe RPM/TPM margins.
// Groq enforces an 8,000 TPM limit on openai/gpt-oss-120b in the on-demand tier.
// 65,000ms ensures the 60-second sliding token window resets completely before each invocation.
const DEFAULT_LIVE_PACING_MS = 65000;
const DEFAULT_DRY_RUN_PACING_MS = 0;

async function runHarness() {
  const args = process.argv.slice(2);
  const isVerbose = args.includes("--verbose");
  const forceDryRun = args.includes("--dry-run") || args.includes("--mock");
  const simulate429 = args.includes("--simulate-429");
  const simulateQuota = args.includes("--simulate-quota");
  const scenarioArg = args.find((a) => a.startsWith("--scenario="));
  const resumeFromArg = args.find((a) => a.startsWith("--resume-from=") || a.startsWith("--from="));
  const modelArg = args.find((a) => a.startsWith("--model="));
  const pacingArg = args.find((a) => a.startsWith("--pacing=") || a.startsWith("--pacing-ms="));

  const targetModel = modelArg
    ? modelArg.split("=")[1].trim()
    : process.env.GROQ_MODEL || DEFAULT_MODEL;

  let requestPacingMs = pacingArg
    ? parseInt(pacingArg.split("=")[1].trim(), 10)
    : (forceDryRun ? DEFAULT_DRY_RUN_PACING_MS : DEFAULT_LIVE_PACING_MS);

  let selectedScenarios = SYNTHETIC_SCENARIOS;

  if (resumeFromArg) {
    const rawVal = resumeFromArg.split("=")[1].trim();
    const fromNum = parseInt(rawVal.replace(/^scenario-?/i, ""), 10);
    if (!isNaN(fromNum) && fromNum >= 1 && fromNum <= SYNTHETIC_SCENARIOS.length) {
      selectedScenarios = SYNTHETIC_SCENARIOS.filter((_, idx) => (idx + 1) >= fromNum);
    } else {
      console.error(`[Error] Invalid resume-from argument: ${rawVal}. Valid options: 1 to ${SYNTHETIC_SCENARIOS.length}.`);
      process.exitCode = 1;
      return;
    }
  } else if (scenarioArg) {
    const rawVal = scenarioArg.split("=")[1].trim();
    const rangeMatch = rawVal.match(/^(\d+)\.\.(\d+)$/) || rawVal.match(/^(\d+)-(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      selectedScenarios = SYNTHETIC_SCENARIOS.filter((_, idx) => {
        const num = idx + 1;
        return num >= start && num <= end;
      });
      if (selectedScenarios.length === 0) {
        console.error(`[Error] Scenario range ${rawVal} matched no scenarios. Valid range: 1 to ${SYNTHETIC_SCENARIOS.length}.`);
        process.exitCode = 1;
        return;
      }
    } else if (rawVal.includes(",")) {
      const nums = rawVal.split(",").map((v) => parseInt(v.trim().replace(/^scenario-?/i, ""), 10));
      selectedScenarios = SYNTHETIC_SCENARIOS.filter((_, idx) => nums.includes(idx + 1));
      if (selectedScenarios.length === 0) {
        console.error(`[Error] Scenario list ${rawVal} matched no scenarios.`);
        process.exitCode = 1;
        return;
      }
    } else {
      const scenarioNum = parseInt(rawVal.replace(/^scenario-?/i, ""), 10);
      const targetId = `SCENARIO-${scenarioNum}`;
      const matched = SYNTHETIC_SCENARIOS.filter((s) => s.id === targetId || s.id === rawVal.toUpperCase());
      if (matched.length > 0) {
        selectedScenarios = matched;
      } else {
        console.error(`[Error] Unknown scenario argument: ${rawVal}. Valid options: 1 to ${SYNTHETIC_SCENARIOS.length}.`);
        process.exitCode = 1;
        return;
      }
    }
  }

  const client = new GroqClient({ model: targetModel });
  const reporter = new MetricsReporter(targetModel);

  console.log("\n==========================================================================================");
  console.log("            EVOFLEXA CAREER STRATEGIST — GROQ AI EVALUATION HARNESS                      ");
  console.log("==========================================================================================");
  console.log(`• Target Provider:        GroqCloud (https://api.groq.com/openai/v1)`);
  console.log(`• Target Model:           ${targetModel}`);
  console.log(`• Scenarios to Run:       ${selectedScenarios.length} scenario(s) (${selectedScenarios.map((s) => s.id).join(", ")})`);
  console.log(`• Pacing Between Calls:   ${requestPacingMs}ms (TPM sliding-window reset pacing)`);
  console.log(`• Execution Mode:         ${forceDryRun ? "MANUAL DRY-RUN (--dry-run flag active)" : `LIVE GROQ INFERENCE (${targetModel})`}`);

  // PRE-FLIGHT VERIFICATION
  console.log("\n--- PRE-FLIGHT CREDENTIAL & MODEL ACCESSIBILITY VERIFICATION ---");
  const preflight = await client.verifyModelAccess();

  if (!preflight.configured) {
    console.error(`[PRE-FLIGHT FAILED] API Key Missing: ${preflight.error}`);
    console.error(`                    Cannot perform live Groq inference.`);
    console.error(`                    Per Stage 2A.9 constraints, silent fixture substitution is strictly prohibited.`);
    console.log("==========================================================================================\n");

    if (!forceDryRun) {
      process.exitCode = 1;
      return {
        success: false,
        preflight,
        error: "Execution halted: GROQ_API_KEY is not configured.",
      };
    }
  } else {
    console.log(`[PRE-FLIGHT CHECK]  API Key Configured:      YES (${preflight.maskedKey})`);
    if (!preflight.accessible) {
      console.error(`[PRE-FLIGHT FAILED] Model Access Error:      ${preflight.error}`);
      console.log("==========================================================================================\n");

      if (!forceDryRun) {
        process.exitCode = 1;
        return {
          success: false,
          preflight,
          error: `Execution halted: Target model '${targetModel}' is inaccessible.`,
        };
      }
    } else {
      console.log(`[PRE-FLIGHT CHECK]  Model Access Verified:   YES (${targetModel} available on account)`);
      console.log(`[PRE-FLIGHT CHECK]  Total Models Accessible: ${preflight.availableModelsCount}`);
    }
  }
  console.log("==========================================================================================\n");

  const isLiveExecution = preflight.accessible && !forceDryRun;
  let stopEncountered = false;
  let stopReason = null;
  let lastRateLimits = null;

  for (let i = 0; i < selectedScenarios.length; i++) {
    const scenario = selectedScenarios[i];
    console.log(`[${i + 1}/${selectedScenarios.length}] Evaluating ${scenario.id}: "${scenario.name}"...`);

    // Benchmark Stop Guardrail: If an HTTP 429 was encountered previously, skip all remaining scenarios immediately
    if (stopEncountered) {
      console.warn(`  [BLOCKED] Skipping ${scenario.id}: Dispatch halted due to ${stopReason.errorType}. No redundant requests sent.`);
      reporter.evaluateScenario({
        scenario,
        assessment: null,
        latencyMs: 0,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        isLiveExecution,
        errorMessage: `Skipped: Benchmark stopped after ${stopReason.errorType} on prior scenario (${stopReason.message})`,
        errorType: stopReason.errorType,
        status: "BLOCKED",
        attempted: false,
        runIndex: 1,
      });
      continue;
    }

    // 1. Build sanitized, minimized prompt
    const { systemPrompt, userPrompt, minimizedContext } = buildAssessmentPrompt(scenario);

    if (isVerbose) {
      console.log("\n--- MINIMIZED CONTEXT ---");
      console.log(JSON.stringify(minimizedContext, null, 2));
    }

    let assessment = null;
    let latencyMs = 0;
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let errorMessage = null;
    let errorType = null;
    let status = "COMPLETED";
    let rateLimits = null;

    if (isLiveExecution) {
      // Live execution via GroqCloud
      if (i > 0) {
        const headerWaitMs = parseResetTimeToMs(lastRateLimits?.resetTokens);
        const effectiveWaitMs = Math.max(requestPacingMs, headerWaitMs);
        console.log(`  [Pacing] Waiting ${(effectiveWaitMs / 1000).toFixed(1)}s for TPM sliding window (configured: ${requestPacingMs}ms, header reset: ${lastRateLimits?.resetTokens || "unavailable"})...`);
        await new Promise((r) => setTimeout(r, effectiveWaitMs));
      }

      const apiResult = await client.generateAssessment({ systemPrompt, userPrompt });

      latencyMs = apiResult.latencyMs || 0;
      usage = apiResult.usage || usage;
      errorType = apiResult.errorType;
      rateLimits = apiResult.rateLimits || null;
      lastRateLimits = rateLimits;

      if (apiResult.success && apiResult.data) {
        assessment = apiResult.data;
        status = "COMPLETED";
      } else {
        errorMessage = apiResult.error || "Groq API live call failed";
        console.error(`  [FAILED CALL] ${errorMessage} (Type: ${errorType})`);

        // Categorize execution status
        if (
          [
            ERROR_TYPES.RATE_LIMITED,
            ERROR_TYPES.QUOTA_EXHAUSTED,
            ERROR_TYPES.CONFIGURATION_ERROR,
            ERROR_TYPES.AUTHENTICATION_ERROR,
            ERROR_TYPES.CAPACITY_UNAVAILABLE,
            ERROR_TYPES.NETWORK_ERROR,
          ].includes(errorType)
        ) {
          status = "BLOCKED";
        } else {
          status = "FAILED_INFERENCE";
        }

        // Benchmark Stop Mechanism for HTTP 429
        if (errorType === ERROR_TYPES.QUOTA_EXHAUSTED || errorType === ERROR_TYPES.RATE_LIMITED) {
          stopEncountered = true;
          stopReason = { errorType, message: errorMessage };

          if (errorType === ERROR_TYPES.QUOTA_EXHAUSTED) {
            console.error(`\n[CRITICAL QUOTA EXHAUSTED] Account daily/project quota exhausted for ${targetModel}.`);
            console.error(`Per Stage 2A.9 constraints, repeated requests after daily quota errors are strictly blocked.`);
          } else {
            console.warn(`\n[RATE LIMIT ENCOUNTERED] RPM/TPM rate limit reached for ${targetModel}.`);
            console.warn(`Per Stage 2A.9 constraints, scenario dispatch is halted to prevent rate-limit thrashing.`);
          }
        }
      }
    } else {
      // Dry-run mode for local harness verification
      if (simulate429 && i === 1) {
        // Simulation for testing the stop guardrail
        stopEncountered = true;
        stopReason = { errorType: ERROR_TYPES.RATE_LIMITED, message: "Simulated RPM rate limit" };
        errorMessage = "HTTP 429 RATE_LIMITED: Rate limit reached for requests per minute";
        errorType = ERROR_TYPES.RATE_LIMITED;
        status = "BLOCKED";
        latencyMs = 120;
      } else if (simulateQuota && i === 1) {
        stopEncountered = true;
        stopReason = { errorType: ERROR_TYPES.QUOTA_EXHAUSTED, message: "Simulated daily quota limit" };
        errorMessage = "HTTP 429 QUOTA_EXHAUSTED: Daily request limit exceeded";
        errorType = ERROR_TYPES.QUOTA_EXHAUSTED;
        status = "BLOCKED";
        latencyMs = 150;
      } else {
        const t0 = performance.now();
        assessment = client.generateSyntheticAssessment(scenario);
        latencyMs = Math.round(performance.now() - t0);

        const promptChars = (systemPrompt + userPrompt).length;
        const completionChars = JSON.stringify(assessment).length;
        const estPromptTokens = Math.round(promptChars / 4);
        const estCompletionTokens = Math.round(completionChars / 4);
        usage = {
          promptTokens: estPromptTokens,
          completionTokens: estCompletionTokens,
          totalTokens: estPromptTokens + estCompletionTokens,
        };
        status = "COMPLETED";
      }
    }

    // 2. Score and evaluate
    const evalResult = reporter.evaluateScenario({
      scenario,
      assessment,
      latencyMs,
      usage,
      isLiveExecution,
      errorMessage,
      errorType,
      status,
      attempted: true,
      rateLimits,
      runIndex: 1,
    });

    console.log(
      `  -> Status: ${evalResult.status} | Score: ${evalResult.scores ? `${evalResult.scores.compositeScore}/5.00` : "N/A (Blocked/Failed)"} | Schema: ${evalResult.schemaValid ? "VALID" : (evalResult.status === "BLOCKED" ? "N/A" : "INVALID")} | Zero-Fab: ${evalResult.hallucinationCheck?.passed ? "YES" : (evalResult.status === "BLOCKED" ? "N/A" : "NO")} | Latency: ${evalResult.latencyMs}ms | Tokens: ${evalResult.usage?.totalTokens} (${evalResult.isLiveExecution ? `Live ${targetModel}` : "Dry-Run"})`
    );

    if (isVerbose && assessment) {
      console.log("\n--- GENERATED ASSESSMENT OUTPUT ---");
      console.log(JSON.stringify(assessment, null, 2));
    }
  }

  // 3. Print final report
  reporter.printReport();

  return reporter.generateSummary();
}

if (require.main === module) {
  runHarness().catch((err) => {
    console.error("Fatal error in Groq evaluation harness:", err);
    process.exitCode = 1;
  });
}

module.exports = {
  runHarness,
};
