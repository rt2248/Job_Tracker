#!/usr/bin/env node

/**
 * harness.js
 *
 * Standalone evaluation runner for Evolexa Google Gemini Developer API Proof of Concept.
 * Executes seven synthetic candidate scenarios against Google Gemini models,
 * validating structured outputs, zero-hallucination guarantees, token efficiency,
 * and adversarial prompt-injection resistance.
 *
 * Implements Stage 2A.6 Benchmark Integrity Guardrails:
 * - Gemini 3.x thinkingLevel support (LOW, MEDIUM, HIGH; default: MEDIUM)
 * - Explicit local validation and rejection of unsupported thinking configurations
 * - Granular error classification (CONFIGURATION_ERROR, AUTHENTICATION_ERROR,
 *   QUOTA_EXHAUSTED, CAPACITY_UNAVAILABLE, MODEL_FAILURE, NETWORK_ERROR)
 * - Strict non-retrying quota exhaustion guardrails
 * - Mathematical integrity: operational blocks (quota, auth, network) are marked as BLOCKED
 *   and NEVER assigned a score of 0, protecting composite model quality scores.
 *
 * Usage:
 *   node Backend/poc/gemini/harness.js --all
 *   node Backend/poc/gemini/harness.js --scenario=1
 *   node Backend/poc/gemini/harness.js --thinking-level=LOW --all
 *   node Backend/poc/gemini/harness.js --thinking-level=HIGH --all
 *   node Backend/poc/gemini/harness.js --runs=2 --all
 *   node Backend/poc/gemini/harness.js --dry-run
 *   node Backend/poc/gemini/harness.js --all --verbose
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const {
  GeminiClient,
  DEFAULT_MODEL,
  ERROR_TYPES,
  SUPPORTED_THINKING_LEVELS,
  DEFAULT_THINKING_LEVEL,
  validateThinkingLevel,
} = require("./geminiClient");
const { SYNTHETIC_SCENARIOS } = require("../groq/syntheticProfiles");
const { buildAssessmentPrompt } = require("../groq/promptBuilder");
const { validateCareerAssessmentSchema } = require("../groq/responseSchema");
const { TARGET_LATENCY_MS, TARGET_MAX_TOTAL_TOKENS } = require("../groq/metricsReporter");

// Pacing interval between scenarios (ms) to respect Gemini Free Tier 15 RPM limit
const REQUEST_PACING_MS = 4000;

class GeminiMetricsReporter {
  constructor(modelName, thinkingLevel = DEFAULT_THINKING_LEVEL) {
    this.modelName = modelName;
    this.thinkingLevel = thinkingLevel;
    this.results = [];
  }

  /**
   * Scores an assessment output against a synthetic scenario and its ground truth,
   * or records a categorized operational block or inference failure.
   *
   * @param {Object} params
   * @param {Object} params.scenario
   * @param {Object} [params.assessment]
   * @param {number} [params.latencyMs=0]
   * @param {Object} [params.usage]
   * @param {boolean} [params.isLiveExecution=false]
   * @param {string} [params.errorMessage=null]
   * @param {string} [params.errorType=null]
   * @param {string} [params.status=null] // "COMPLETED" | "BLOCKED" | "FAILED_INFERENCE"
   * @param {number} [params.runIndex=1]
   * @returns {Object}
   */
  evaluateScenario({
    scenario,
    assessment = null,
    latencyMs = 0,
    usage = { promptTokens: 0, completionTokens: 0, thinkingTokens: 0, totalTokens: 0 },
    isLiveExecution = false,
    errorMessage = null,
    errorType = null,
    status = null,
    runIndex = 1,
  }) {
    // Determine execution status
    const isBlocked =
      status === "BLOCKED" ||
      [
        ERROR_TYPES.QUOTA_EXHAUSTED,
        ERROR_TYPES.CONFIGURATION_ERROR,
        ERROR_TYPES.AUTHENTICATION_ERROR,
        ERROR_TYPES.CAPACITY_UNAVAILABLE,
        ERROR_TYPES.NETWORK_ERROR,
      ].includes(errorType);

    // CASE 1: OPERATIONAL / ENVIRONMENTAL BLOCK
    // E.g. Quota exhausted (429), Network timeout, Auth failure, Capacity 503
    // Critical Guardrail: Blocked runs must NEVER be scored 0. Their scores are set to null (reported as N/A).
    if (isBlocked) {
      const blockedResult = {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        runIndex,
        isLiveExecution,
        status: "BLOCKED",
        success: false,
        errorType: errorType || ERROR_TYPES.QUOTA_EXHAUSTED,
        errorMessage: errorMessage || "Execution blocked by environment or quota ceiling",
        latencyMs: latencyMs || 0,
        usage: usage || { promptTokens: 0, completionTokens: 0, thinkingTokens: 0, totalTokens: 0 },
        schemaValid: false,
        schemaErrors: ["Execution blocked prior to payload generation"],
        scores: null, // Guardrail: null scores prevent distortion of aggregate quality metrics
        hallucinationCheck: { passed: null, details: "Blocked prior to hallucination check" },
        targetsMet: {
          schemaCompliant: false,
          zeroFabrication: false,
          latencyTargetMet: false,
          tokenBudgetMet: false,
          blocked: true,
        },
        assessment: null,
      };
      this.results.push(blockedResult);
      return blockedResult;
    }

    // CASE 2: MODEL INFERENCE FAILURE
    // E.g. Model returned empty output, invalid JSON, or unparseable candidate part
    if (!assessment) {
      const failedInferenceResult = {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        runIndex,
        isLiveExecution,
        status: "FAILED_INFERENCE",
        success: false,
        errorType: errorType || ERROR_TYPES.MODEL_FAILURE,
        errorMessage: errorMessage || "Model inference failed to return structured assessment",
        latencyMs: latencyMs || 0,
        usage: usage || { promptTokens: 0, completionTokens: 0, thinkingTokens: 0, totalTokens: 0 },
        schemaValid: false,
        schemaErrors: ["Assessment payload could not be parsed"],
        scores: null,
        hallucinationCheck: { passed: false, details: "Model failed to return output" },
        targetsMet: {
          schemaCompliant: false,
          zeroFabrication: false,
          latencyTargetMet: false,
          tokenBudgetMet: false,
          blocked: false,
        },
        assessment: null,
      };
      this.results.push(failedInferenceResult);
      return failedInferenceResult;
    }

    // CASE 3: SUCCESSFUL MODEL INFERENCE — EXECUTE 5-DIMENSION RUBRIC SCORING
    // 1. Schema Validation
    const schemaValidation = validateCareerAssessmentSchema(assessment);

    // 2. Anti-Hallucination & Evidence Grounding Check
    const declaredSkillsSet = new Set((scenario.profile.declaredSkills || []).map((s) => s.toLowerCase().trim()));
    const returnedVerifiedSkills = (assessment.skillGapAnalysis?.verifiedCandidateSkills || []).map((s) =>
      String(s).toLowerCase().trim()
    );

    const fabricatedSkills = returnedVerifiedSkills.filter((s) => !declaredSkillsSet.has(s));
    const zeroFabrication = fabricatedSkills.length === 0;

    // Check if expected bottleneck keywords are addressed
    const primaryBottleneckLower = (assessment.candidateSummary?.primaryBottleneck || "").toLowerCase();
    const rationaleLower = (assessment.strategicRecommendations || []).map((r) => r.rationale.toLowerCase()).join(" ");
    const combinedReasoningText = `${primaryBottleneckLower} ${rationaleLower}`;

    const groundTruthKeywords = scenario.expectedGroundTruth?.primaryBottleneckKeywords || [];
    const matchedKeywords = groundTruthKeywords.filter((kw) => combinedReasoningText.includes(kw.toLowerCase()));
    const keywordRelevanceRatio = groundTruthKeywords.length > 0 ? matchedKeywords.length / groundTruthKeywords.length : 1.0;

    // 3. Rubric Scoring (1 - 5 scale)
    // A. Evidence Grounding (1 - 5)
    let evidenceGroundingScore = 5;
    if (!zeroFabrication) evidenceGroundingScore -= 2;
    if (!assessment.evidenceGrounding?.citedMetrics || assessment.evidenceGrounding.citedMetrics.length === 0) evidenceGroundingScore -= 1;
    if (assessment.evidenceGrounding?.hallucinationCheckPassed !== true) evidenceGroundingScore -= 1;
    evidenceGroundingScore = Math.max(1, Math.min(5, evidenceGroundingScore));

    // B. Recommendation Actionability (1 - 5)
    let actionabilityScore = 5;
    const recs = assessment.strategicRecommendations || [];
    if (recs.length === 0) {
      actionabilityScore = 1;
    } else {
      const avgActionSteps = recs.reduce((acc, r) => acc + (r.actionSteps?.length || 0), 0) / recs.length;
      if (avgActionSteps < 2) actionabilityScore -= 1;
      const hasImpact = recs.every((r) => r.expectedImpact && r.expectedImpact.length > 10);
      if (!hasImpact) actionabilityScore -= 1;
    }
    actionabilityScore = Math.max(1, Math.min(5, actionabilityScore));

    // C. Career Strategy Relevance (1 - 5)
    let relevanceScore = 5;
    if (keywordRelevanceRatio < 0.3) relevanceScore -= 2;
    else if (keywordRelevanceRatio < 0.6) relevanceScore -= 1;
    if (assessment.candidateSummary?.careerStage !== scenario.expectedGroundTruth?.careerStage) {
      relevanceScore -= 1;
    }
    relevanceScore = Math.max(1, Math.min(5, relevanceScore));

    // D. Contextual Reasoning (1 - 5)
    let reasoningScore = 5;
    if (!assessment.pipelineDiagnostics?.volumeAssessment || assessment.pipelineDiagnostics.volumeAssessment.length < 20) reasoningScore -= 1;
    if (!assessment.pipelineDiagnostics?.stageProgressionVelocity || assessment.pipelineDiagnostics.stageProgressionVelocity.length < 20) reasoningScore -= 1;
    if (scenario.id === "SCENARIO-7") {
      if (assessment.candidateSummary?.pipelineHealth !== "inconsistent_data") reasoningScore -= 2;
    }
    if (scenario.id === "SCENARIO-6") {
      if (assessment.candidateSummary?.pipelineHealth !== "insufficient_data") reasoningScore -= 2;
    }
    reasoningScore = Math.max(1, Math.min(5, reasoningScore));

    // E. Output Consistency (1 - 5)
    let consistencyScore = 5;
    if (!schemaValidation.valid) consistencyScore -= 3;
    const allHaveValidPriority = recs.every((r) => ["high", "medium", "low"].includes(r.priority));
    if (!allHaveValidPriority) consistencyScore -= 1;
    consistencyScore = Math.max(1, Math.min(5, consistencyScore));

    const compositeScore = Number(
      ((evidenceGroundingScore + actionabilityScore + relevanceScore + reasoningScore + consistencyScore) / 5).toFixed(2)
    );

    // 4. Targets Check
    const tokenUsage = usage || { promptTokens: 0, completionTokens: 0, thinkingTokens: 0, totalTokens: 0 };
    const targetsMet = {
      schemaCompliant: schemaValidation.valid,
      zeroFabrication,
      latencyTargetMet: latencyMs <= TARGET_LATENCY_MS,
      tokenBudgetMet: tokenUsage.totalTokens <= TARGET_MAX_TOTAL_TOKENS,
      blocked: false,
    };

    const completedResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      runIndex,
      isLiveExecution,
      status: "COMPLETED",
      success: true,
      errorType: null,
      errorMessage: null,
      latencyMs,
      usage: tokenUsage,
      schemaValid: schemaValidation.valid,
      schemaErrors: schemaValidation.errors,
      scores: {
        evidenceGrounding: evidenceGroundingScore,
        recommendationActionability: actionabilityScore,
        careerStrategyRelevance: relevanceScore,
        contextualReasoning: reasoningScore,
        outputConsistency: consistencyScore,
        compositeScore,
      },
      hallucinationCheck: {
        passed: zeroFabrication,
        fabricatedSkills,
      },
      targetsMet,
      assessment,
    };

    this.results.push(completedResult);
    return completedResult;
  }

  /**
   * Generates a consolidated benchmark summary with strict integrity protections.
   *
   * @returns {Object}
   */
  generateSummary() {
    const totalPlanned = this.results.length;
    if (totalPlanned === 0) {
      return { totalPlanned: 0, error: "No scenario evaluations recorded" };
    }

    const successfulRuns = this.results.filter((r) => r.status === "COMPLETED");
    const failedInferences = this.results.filter((r) => r.status === "FAILED_INFERENCE");
    const blockedExecutions = this.results.filter((r) => r.status === "BLOCKED");

    const scenarioCoverageRate = totalPlanned > 0
      ? `${Math.round((successfulRuns.length / totalPlanned) * 100)}%`
      : "0%";

    const blockedBreakdown = {
      quotaExhausted: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.QUOTA_EXHAUSTED).length,
      configurationError: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.CONFIGURATION_ERROR).length,
      authenticationError: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.AUTHENTICATION_ERROR).length,
      capacityUnavailable: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.CAPACITY_UNAVAILABLE).length,
      networkError: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.NETWORK_ERROR).length,
    };

    const completedCount = successfulRuns.length;
    let averages = null;
    let rubricScores = null;
    let complianceRate = "N/A";
    let zeroFabricationRate = "N/A";
    let latencyComplianceRate = "N/A";
    let tokenBudgetComplianceRate = "N/A";

    if (completedCount > 0) {
      const avgLatency = Math.round(
        successfulRuns.reduce((acc, r) => acc + (r.latencyMs || 0), 0) / completedCount
      );
      const avgPromptTokens = Math.round(
        successfulRuns.reduce((acc, r) => acc + (r.usage?.promptTokens || 0), 0) / completedCount
      );
      const avgCompletionTokens = Math.round(
        successfulRuns.reduce((acc, r) => acc + (r.usage?.completionTokens || 0), 0) / completedCount
      );
      const avgThinkingTokens = Math.round(
        successfulRuns.reduce((acc, r) => acc + (r.usage?.thinkingTokens || 0), 0) / completedCount
      );
      const avgTotalTokens = Math.round(
        successfulRuns.reduce((acc, r) => acc + (r.usage?.totalTokens || 0), 0) / completedCount
      );

      const avgEvidence = Number(
        (successfulRuns.reduce((acc, r) => acc + (r.scores?.evidenceGrounding || 0), 0) / completedCount).toFixed(2)
      );
      const avgActionability = Number(
        (successfulRuns.reduce((acc, r) => acc + (r.scores?.recommendationActionability || 0), 0) / completedCount).toFixed(2)
      );
      const avgRelevance = Number(
        (successfulRuns.reduce((acc, r) => acc + (r.scores?.careerStrategyRelevance || 0), 0) / completedCount).toFixed(2)
      );
      const avgReasoning = Number(
        (successfulRuns.reduce((acc, r) => acc + (r.scores?.contextualReasoning || 0), 0) / completedCount).toFixed(2)
      );
      const avgConsistency = Number(
        (successfulRuns.reduce((acc, r) => acc + (r.scores?.outputConsistency || 0), 0) / completedCount).toFixed(2)
      );
      const overallCompositeScore = Number(
        ((avgEvidence + avgActionability + avgRelevance + avgReasoning + avgConsistency) / 5).toFixed(2)
      );

      const schemaCompliantCount = successfulRuns.filter((r) => r.targetsMet?.schemaCompliant).length;
      const zeroFabricationCount = successfulRuns.filter((r) => r.targetsMet?.zeroFabrication).length;
      const latencyMetCount = successfulRuns.filter((r) => r.targetsMet?.latencyTargetMet).length;
      const tokenBudgetMetCount = successfulRuns.filter((r) => r.targetsMet?.tokenBudgetMet).length;

      complianceRate = `${Math.round((schemaCompliantCount / completedCount) * 100)}%`;
      zeroFabricationRate = `${Math.round((zeroFabricationCount / completedCount) * 100)}%`;
      latencyComplianceRate = `${Math.round((latencyMetCount / completedCount) * 100)}%`;
      tokenBudgetComplianceRate = `${Math.round((tokenBudgetMetCount / completedCount) * 100)}%`;

      averages = {
        latencyMs: avgLatency,
        promptTokens: avgPromptTokens,
        completionTokens: avgCompletionTokens,
        thinkingTokens: avgThinkingTokens,
        totalTokens: avgTotalTokens,
      };

      rubricScores = {
        evidenceGrounding: avgEvidence,
        recommendationActionability: avgActionability,
        careerStrategyRelevance: avgRelevance,
        contextualReasoning: avgReasoning,
        outputConsistency: avgConsistency,
        overallCompositeScore,
      };
    }

    return {
      totalPlanned,
      scenarioCoverageRate,
      successfulExecutions: successfulRuns.length,
      failedInferences: failedInferences.length,
      blockedExecutions: blockedExecutions.length,
      blockedBreakdown,
      complianceRate,
      zeroFabricationRate,
      latencyComplianceRate,
      tokenBudgetComplianceRate,
      averages,
      rubricScores,
      scenarioResults: this.results,
    };
  }

  printReport() {
    const summary = this.generateSummary();
    console.log("\n==========================================================================================");
    console.log("            EVOFLEXA AI PROOF OF CONCEPT — GEMINI EVALUATION BENCHMARK REPORT             ");
    console.log("==========================================================================================\n");

    console.table(
      this.results.map((r) => {
        let scoreDisplay = "N/A";
        if (r.status === "COMPLETED") {
          scoreDisplay = `${r.scores?.compositeScore}/5.00`;
        } else if (r.status === "BLOCKED") {
          scoreDisplay = `BLOCKED (${r.errorType || "BLOCKED"})`;
        } else if (r.status === "FAILED_INFERENCE") {
          scoreDisplay = "FAIL (Inference)";
        }

        return {
          Scenario: r.scenarioId,
          Name: r.scenarioName.slice(0, 24),
          Run: r.runIndex || 1,
          Status: r.status,
          "Score /5": scoreDisplay,
          "Schema OK": r.status === "COMPLETED" ? (r.schemaValid ? "PASS" : "FAIL") : "N/A",
          "Zero Fab.": r.status === "COMPLETED" ? (r.hallucinationCheck?.passed ? "PASS" : "FAIL") : "N/A",
          "In/Out/Think": r.status === "COMPLETED"
            ? `${r.usage?.promptTokens || 0}/${r.usage?.completionTokens || 0}/${r.usage?.thinkingTokens || 0}`
            : "N/A",
          "Total Tok": r.status === "COMPLETED" ? r.usage?.totalTokens || 0 : "N/A",
          Latency: r.status === "COMPLETED" ? `${r.latencyMs}ms` : (r.latencyMs ? `${r.latencyMs}ms` : "N/A"),
          Mode: r.isLiveExecution ? `Live (${this.modelName})` : "Dry-Run",
        };
      })
    );

    console.log("\n--- BENCHMARK COVERAGE & OPERATIONAL SUMMARY ---");
    console.log(`• Target Model:                    ${this.modelName}`);
    console.log(`• Thinking Level:                  ${this.thinkingLevel} (Configured Gemini 3.x Thinking Level)`);
    console.log(`• Total Planned Scenarios:         ${summary.totalPlanned}`);
    console.log(`• Scenario Coverage Rate:          ${summary.scenarioCoverageRate}`);
    console.log(`• Successful Executions:           ${summary.successfulExecutions} / ${summary.totalPlanned}`);
    console.log(`• Failed Inferences:               ${summary.failedInferences} (Output parsing or candidate part errors)`);
    console.log(`• Blocked Executions:              ${summary.blockedExecutions}`);
    if (summary.blockedExecutions > 0) {
      console.log(`  - Quota Exhausted (429):         ${summary.blockedBreakdown.quotaExhausted}`);
      console.log(`  - Capacity Unavailable (503):    ${summary.blockedBreakdown.capacityUnavailable}`);
      console.log(`  - Authentication Error:          ${summary.blockedBreakdown.authenticationError}`);
      console.log(`  - Configuration Error:           ${summary.blockedBreakdown.configurationError}`);
      console.log(`  - Network/Timeout Error:         ${summary.blockedBreakdown.networkError}`);
    }

    console.log("\n--- MODEL QUALITY & RUBRIC METRICS (Completed Inferences Only) ---");
    if (summary.rubricScores) {
      console.log(`• Schema Compliance Rate:          ${summary.complianceRate} (${summary.complianceRate === "100%" ? "Target Met" : "Target Failed"})`);
      console.log(`• Zero-Fabrication Integrity Rate: ${summary.zeroFabricationRate} (${summary.zeroFabricationRate === "100%" ? "Target Met" : "Target Failed"})`);
      console.log(`• Average Latency:                 ${summary.averages?.latencyMs}ms (Target: <${TARGET_LATENCY_MS}ms)`);
      console.log(`• Average Token Consumption:       ${summary.averages?.totalTokens} tokens (Target: <${TARGET_MAX_TOTAL_TOKENS})`);
      console.log(`  - Average Prompt Tokens:         ${summary.averages?.promptTokens}`);
      console.log(`  - Average Completion Tokens:     ${summary.averages?.completionTokens}`);
      console.log(`  - Average Thinking Tokens:       ${summary.averages?.thinkingTokens}`);
      console.log(`• Evidence Grounding:              ${summary.rubricScores.evidenceGrounding} / 5.00`);
      console.log(`• Actionability:                   ${summary.rubricScores.recommendationActionability} / 5.00`);
      console.log(`• Career Strategy Relevance:       ${summary.rubricScores.careerStrategyRelevance} / 5.00`);
      console.log(`• Contextual Reasoning:            ${summary.rubricScores.contextualReasoning} / 5.00`);
      console.log(`• Output Consistency:              ${summary.rubricScores.outputConsistency} / 5.00`);
      console.log(`• Overall Composite Score:         ${summary.rubricScores.overallCompositeScore} / 5.00`);
    } else {
      console.log(`• Overall Composite Score:         N/A (No successful live inferences completed to evaluate)`);
      console.log(`  Note: Operational blocks (quota exhaustion, network timeouts) do NOT count as 0/5.00.`);
    }
    console.log("==========================================================================================\n");
  }
}

async function runHarness() {
  const args = process.argv.slice(2);
  const isVerbose = args.includes("--verbose");
  const forceDryRun = args.includes("--dry-run") || args.includes("--mock");
  const scenarioArg = args.find((a) => a.startsWith("--scenario="));
  const modelArg = args.find((a) => a.startsWith("--model="));
  const thinkingLevelArg = args.find((a) => a.startsWith("--thinking-level="));
  const legacyBudgetArg = args.find((a) => a.startsWith("--thinking-budget="));
  const runsArg = args.find((a) => a.startsWith("--runs="));

  // Guard against legacy thinking budget flag
  if (legacyBudgetArg) {
    const rawVal = legacyBudgetArg.split("=")[1].trim();
    console.error(`\n[CONFIGURATION ERROR] Legacy flag '--thinking-budget=${rawVal}' is deprecated and unsupported.`);
    console.error(`Gemini 3.x models (including gemini-3.8-flash) use 'thinkingLevel' rather than integer token budgets.`);
    console.error(`Supported levels: LOW, MEDIUM, HIGH (default: MEDIUM).`);
    console.error(`Please use: --thinking-level=<LOW|MEDIUM|HIGH>\n`);
    process.exitCode = 1;
    return;
  }

  const targetModel = modelArg
    ? modelArg.split("=")[1].trim()
    : process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // Validate thinkingLevel locally before making any network calls
  const rawThinkingLevel = thinkingLevelArg
    ? thinkingLevelArg.split("=")[1].trim()
    : process.env.GEMINI_THINKING_LEVEL || DEFAULT_THINKING_LEVEL;

  const thinkingValidation = validateThinkingLevel(rawThinkingLevel, targetModel);
  if (!thinkingValidation.valid) {
    console.error(`\n[CONFIGURATION ERROR] ${thinkingValidation.error}`);
    console.error(`Execution halted: Unsupported thinkingLevel configuration.\n`);
    process.exitCode = 1;
    return;
  }

  const thinkingLevel = thinkingValidation.value;

  const numRuns = runsArg
    ? Math.max(1, parseInt(runsArg.split("=")[1].trim(), 10))
    : 1;

  let selectedScenarios = SYNTHETIC_SCENARIOS;

  if (scenarioArg) {
    const rawVal = scenarioArg.split("=")[1].trim();
    const scenarioNum = parseInt(rawVal.replace(/^scenario-?/i, ""), 10);
    const targetId = `SCENARIO-${scenarioNum}`;
    const matched = SYNTHETIC_SCENARIOS.filter(
      (s) => s.id === targetId || s.id === rawVal.toUpperCase()
    );
    if (matched.length > 0) {
      selectedScenarios = matched;
    } else {
      console.error(`[Error] Unknown scenario argument: ${rawVal}. Valid options: 1 to 7.`);
      process.exitCode = 1;
      return;
    }
  }

  const client = new GeminiClient({ model: targetModel, thinkingLevel });
  const reporter = new GeminiMetricsReporter(targetModel, thinkingLevel);

  console.log("\n==========================================================================================");
  console.log("            EVOFLEXA CAREER STRATEGIST — GEMINI AI EVALUATION HARNESS                     ");
  console.log("==========================================================================================");
  console.log(`• Target Provider:        Google Gemini Developer API (v1beta)`);
  console.log(`• Target Model:           ${targetModel}`);
  console.log(`• Thinking Level:         ${thinkingLevel} (Validated Gemini 3.x parameter)`);
  console.log(`• Independent Runs:       ${numRuns} run(s)`);
  console.log(`• Scenarios to Run:       ${selectedScenarios.length} scenario(s) per run (${selectedScenarios.length * numRuns} total)`);
  console.log(`• Pacing Between Calls:   ${REQUEST_PACING_MS}ms (15 RPM compliance)`);
  console.log(
    `• Execution Mode:         ${forceDryRun ? "MANUAL DRY-RUN (--dry-run flag active)" : `LIVE GEMINI INFERENCE (${targetModel})`}`
  );

  // PRE-FLIGHT VERIFICATION
  console.log("\n--- PRE-FLIGHT CREDENTIAL & MODEL ACCESSIBILITY VERIFICATION ---");
  const preflight = await client.verifyModelAccess();

  if (!preflight.configured) {
    console.error(`[PRE-FLIGHT FAILED] API Key Missing: ${preflight.error}`);
    console.error(`                    Cannot perform live Gemini inference.`);
    console.error(`                    Per Stage 2A.4/2A.6 constraints, silent fixture substitution is strictly prohibited.`);
    console.log("==========================================================================================\n");

    if (!forceDryRun) {
      process.exitCode = 1;
      return {
        success: false,
        preflight,
        error: "Execution halted: GEMINI_API_KEY is not configured.",
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
          error: `Execution halted: Target model '${targetModel}' is not listed in accessible models.`,
        };
      }
    } else {
      console.log(`[PRE-FLIGHT CHECK]  Model Access Listed:     YES (${targetModel} found in account catalog)`);
      console.log(`[PRE-FLIGHT CHECK]  Total Models Cataloged:  ${preflight.availableModelsCount}`);
    }
  }
  console.log("==========================================================================================\n");

  const isLiveExecution = preflight.accessible && !forceDryRun;
  let dailyQuotaExhausted = false;

  for (let run = 1; run <= numRuns; run++) {
    if (numRuns > 1) {
      console.log(`\n=================== STARTING BENCHMARK RUN ${run} OF ${numRuns} ===================`);
    }

    for (let i = 0; i < selectedScenarios.length; i++) {
      const scenario = selectedScenarios[i];
      console.log(`[Run ${run} | ${i + 1}/${selectedScenarios.length}] Evaluating ${scenario.id}: "${scenario.name}"...`);

      // If daily quota error was already triggered, abort further requests immediately
      if (dailyQuotaExhausted) {
        console.warn(`  [BLOCKED] Skipping ${scenario.id}: Project daily quota exhausted. No repeated requests permitted.`);
        reporter.evaluateScenario({
          scenario,
          assessment: null,
          latencyMs: 0,
          usage: { promptTokens: 0, completionTokens: 0, thinkingTokens: 0, totalTokens: 0 },
          isLiveExecution: true,
          errorMessage: "Daily free-tier request quota exhausted (HTTP 429 RESOURCE_EXHAUSTED)",
          errorType: ERROR_TYPES.QUOTA_EXHAUSTED,
          status: "BLOCKED",
          runIndex: run,
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
      let usage = { promptTokens: 0, completionTokens: 0, thinkingTokens: 0, totalTokens: 0 };
      let errorMessage = null;
      let errorType = null;
      let status = "COMPLETED";

      if (isLiveExecution) {
        // Pace requests to respect RPM ceilings on free tier
        if (i > 0 || run > 1) {
          console.log(`  [Pacing] Waiting ${REQUEST_PACING_MS}ms for RPM compliance...`);
          await new Promise((r) => setTimeout(r, REQUEST_PACING_MS));
        }

        const apiResult = await client.generateAssessment({ systemPrompt, userPrompt });

        latencyMs = apiResult.latencyMs || 0;
        usage = apiResult.usage || usage;
        errorType = apiResult.errorType;

        if (apiResult.success && apiResult.data) {
          assessment = apiResult.data;
          status = "COMPLETED";
        } else {
          errorMessage = apiResult.error || "Gemini API live call failed";
          console.error(`  [FAILED CALL] ${errorMessage} (Type: ${errorType})`);

          // Categorize as BLOCKED or FAILED_INFERENCE
          if (
            [
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

          // Detect daily quota exhaustion
          if (
            errorType === ERROR_TYPES.QUOTA_EXHAUSTED ||
            errorMessage.includes("RESOURCE_EXHAUSTED") ||
            errorMessage.includes("quota exceeded") ||
            errorMessage.includes("limit: 20") ||
            apiResult.statusCode === 429
          ) {
            dailyQuotaExhausted = true;
            console.error(`\n[CRITICAL QUOTA CEILING] Daily free-tier quota ceiling reached for ${targetModel}.`);
            console.error(`Per Stage 2A.6 constraints, repeated requests after daily quota errors are strictly blocked.`);
          }
        }
      } else {
        // Dry-run mode for local harness verification
        const t0 = performance.now();
        assessment = {
          candidateSummary: {
            careerStage: scenario.expectedGroundTruth?.careerStage || "mid_level",
            pipelineHealth: scenario.expectedGroundTruth?.pipelineHealth || "needs_focus",
            primaryBottleneck: scenario.expectedGroundTruth?.primaryBottleneckKeywords?.[0] || "Pipeline volume",
          },
          pipelineDiagnostics: {
            volumeAssessment: "Candidate has tracked moderate opportunities.",
            stageProgressionVelocity: "Progression is moving at average speed.",
            staleApplicationRisk: "Low risk of stale applications.",
          },
          skillGapAnalysis: {
            verifiedCandidateSkills: scenario.profile.declaredSkills || [],
            criticalMissingSkills: ["system design", "docker"],
            skillBridgingAdvice: "Focus on missing architectural skills.",
          },
          strategicRecommendations: [
            {
              id: "REC-01",
              category: "pipeline_velocity",
              priority: "high",
              title: "Increase Submission Frequency",
              rationale: "Pipeline requires more top-of-funnel activity.",
              actionSteps: ["Apply to 5 jobs per week", "Tailor resume"],
              expectedImpact: "Higher interview progression rate",
            },
          ],
          evidenceGrounding: {
            citedMetrics: ["10 applications submitted"],
            dataLimitationsNoted: "None",
            hallucinationCheckPassed: true,
          },
        };
        latencyMs = Math.round(performance.now() - t0);
        usage = { promptTokens: 350, completionTokens: 250, thinkingTokens: 0, totalTokens: 600 };
        status = "COMPLETED";
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
        runIndex: run,
      });

      console.log(
        `  -> Status: ${evalResult.status} | Score: ${evalResult.scores ? `${evalResult.scores.compositeScore}/5.00` : "N/A (Blocked/Failed)"} | Schema: ${evalResult.schemaValid ? "VALID" : (evalResult.status === "BLOCKED" ? "N/A" : "INVALID")} | Zero-Fab: ${evalResult.hallucinationCheck?.passed ? "YES" : (evalResult.status === "BLOCKED" ? "N/A" : "NO")} | Latency: ${evalResult.latencyMs}ms | Tokens: ${evalResult.usage?.totalTokens} (${evalResult.isLiveExecution ? `Live ${targetModel}` : "Dry-Run"})`
      );

      if (isVerbose && assessment) {
        console.log("\n--- GENERATED ASSESSMENT OUTPUT ---");
        console.log(JSON.stringify(assessment, null, 2));
      }
    }
  }

  // 3. Print final report
  reporter.printReport();

  return reporter.generateSummary();
}

if (require.main === module) {
  runHarness().catch((err) => {
    console.error("Fatal error in Gemini evaluation harness:", err);
    process.exitCode = 1;
  });
}

module.exports = {
  runHarness,
  GeminiMetricsReporter,
};
