/**
 * metricsReporter.js
 *
 * Scoring, benchmarking, and reporting suite for Evolexa Groq AI Proof of Concept.
 * Evaluates responses against rubric criteria (1-5 scale) and target metrics.
 *
 * Stage 2A.9 Alignment:
 * - Score isolation: Blocked and operational failures are assigned `scores: null` (N/A)
 * - Rubric averages calculated EXCLUSIVELY across completed successful inferences
 * - Zero completed runs produce N/A quality score (never 0.00)
 * - Granular reporting: Planned, Attempted, Completed, Failed Inferences, Blocked (with breakdown)
 * - Safe rate-limit header telemetry reporting
 */

const { validateCareerAssessmentSchema } = require("./responseSchema");
const { ERROR_TYPES } = require("./groqClient");

const TARGET_LATENCY_MS = 3500;
const TARGET_MAX_TOTAL_TOKENS = 2500;

class MetricsReporter {
  constructor(modelName = "openai/gpt-oss-120b") {
    this.modelName = modelName;
    this.results = [];
  }

  /**
   * Scores an assessment output against a synthetic scenario and its ground truth,
   * or records a categorized operational block or inference failure.
   *
   * @param {Object} params
   * @param {Object} params.scenario
   * @param {Object} [params.assessment=null]
   * @param {number} [params.latencyMs=0]
   * @param {Object} [params.usage]
   * @param {boolean} [params.isLiveExecution=false]
   * @param {string} [params.errorMessage=null]
   * @param {string} [params.errorType=null]
   * @param {string} [params.status=null] // "COMPLETED" | "BLOCKED" | "FAILED_INFERENCE"
   * @param {boolean} [params.attempted=true]
   * @param {Object} [params.rateLimits=null]
   * @param {number} [params.runIndex=1]
   * @returns {Object}
   */
  evaluateScenario({
    scenario,
    assessment = null,
    latencyMs = 0,
    usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    isLiveExecution = false,
    errorMessage = null,
    errorType = null,
    status = null,
    attempted = true,
    rateLimits = null,
    runIndex = 1,
  }) {
    const isBlocked =
      status === "BLOCKED" ||
      [
        ERROR_TYPES.RATE_LIMITED,
        ERROR_TYPES.QUOTA_EXHAUSTED,
        ERROR_TYPES.CONFIGURATION_ERROR,
        ERROR_TYPES.AUTHENTICATION_ERROR,
        ERROR_TYPES.CAPACITY_UNAVAILABLE,
        ERROR_TYPES.NETWORK_ERROR,
      ].includes(errorType);

    // CASE 1: OPERATIONAL / ENVIRONMENT BLOCK
    // Critical Guardrail: Blocked runs must NEVER be scored 0. Their scores are set to null.
    if (isBlocked) {
      const blockedResult = {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        runIndex,
        isLiveExecution,
        attempted,
        status: "BLOCKED",
        success: false,
        errorType: errorType || ERROR_TYPES.RATE_LIMITED,
        errorMessage: errorMessage || "Execution blocked by environment, rate limit, or quota ceiling",
        latencyMs: latencyMs || 0,
        usage: usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
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
        rateLimits: rateLimits || null,
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
        attempted,
        status: "FAILED_INFERENCE",
        success: false,
        errorType: errorType || ERROR_TYPES.MODEL_FAILURE,
        errorMessage: errorMessage || "Model inference failed to return structured assessment",
        latencyMs: latencyMs || 0,
        usage: usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
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
        rateLimits: rateLimits || null,
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
    const tokenUsage = usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
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
      attempted,
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
      rateLimits: rateLimits || null,
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

    const attemptedScenarios = this.results.filter((r) => r.attempted !== false);
    const successfulRuns = this.results.filter((r) => r.status === "COMPLETED");
    const failedInferences = this.results.filter((r) => r.status === "FAILED_INFERENCE");
    const blockedExecutions = this.results.filter((r) => r.status === "BLOCKED");

    const scenarioCoverageRate = totalPlanned > 0
      ? `${Math.round((successfulRuns.length / totalPlanned) * 100)}%`
      : "0%";

    const blockedBreakdown = {
      rateLimited: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.RATE_LIMITED).length,
      quotaExhausted: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.QUOTA_EXHAUSTED).length,
      configurationError: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.CONFIGURATION_ERROR).length,
      authenticationError: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.AUTHENTICATION_ERROR).length,
      capacityUnavailable: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.CAPACITY_UNAVAILABLE).length,
      networkError: blockedExecutions.filter((r) => r.errorType === ERROR_TYPES.NETWORK_ERROR).length,
    };

    // Find the latest rate-limit telemetry returned by the API
    const lastWithRateLimits = [...this.results].reverse().find((r) => r.rateLimits);
    const latestRateLimits = lastWithRateLimits ? lastWithRateLimits.rateLimits : null;

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
      attemptedScenarios: attemptedScenarios.length,
      scenarioCoverageRate,
      successfulExecutions: successfulRuns.length,
      failedInferences: failedInferences.length,
      blockedExecutions: blockedExecutions.length,
      blockedBreakdown,
      latestRateLimits,
      complianceRate,
      zeroFabricationRate,
      latencyComplianceRate,
      tokenBudgetComplianceRate,
      averages,
      rubricScores,
      scenarioResults: this.results,
    };
  }

  /**
   * Prints a formatted summary table to stdout.
   */
  printReport() {
    const summary = this.generateSummary();
    console.log("\n==========================================================================================");
    console.log("            EVOFLEXA AI PROOF OF CONCEPT — GROQ EVALUATION BENCHMARK REPORT               ");
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
          "Tokens In/Out": r.status === "COMPLETED"
            ? `${r.usage?.promptTokens || 0}/${r.usage?.completionTokens || 0}`
            : "N/A",
          "Total Tok": r.status === "COMPLETED" ? r.usage?.totalTokens || 0 : "N/A",
          Latency: r.status === "COMPLETED" ? `${r.latencyMs}ms` : (r.latencyMs ? `${r.latencyMs}ms` : "N/A"),
          Mode: r.isLiveExecution ? `Live (${this.modelName})` : "Dry-Run",
        };
      })
    );

    console.log("\n--- BENCHMARK COVERAGE & OPERATIONAL SUMMARY ---");
    console.log(`• Target Model:                    ${this.modelName}`);
    console.log(`• Total Planned Scenarios:         ${summary.totalPlanned}`);
    console.log(`• Attempted Scenarios:             ${summary.attemptedScenarios} / ${summary.totalPlanned}`);
    console.log(`• Scenario Coverage Rate:          ${summary.scenarioCoverageRate}`);
    console.log(`• Successful Executions:           ${summary.successfulExecutions} / ${summary.totalPlanned}`);
    console.log(`• Failed Inferences:               ${summary.failedInferences} (Output parsing or candidate part errors)`);
    console.log(`• Blocked Executions:              ${summary.blockedExecutions}`);
    if (summary.blockedExecutions > 0) {
      console.log(`  - Rate Limited (429 RPM/TPM):    ${summary.blockedBreakdown.rateLimited}`);
      console.log(`  - Quota Exhausted (429 Daily):   ${summary.blockedBreakdown.quotaExhausted}`);
      console.log(`  - Capacity Unavailable (503):    ${summary.blockedBreakdown.capacityUnavailable}`);
      console.log(`  - Authentication Error:          ${summary.blockedBreakdown.authenticationError}`);
      console.log(`  - Configuration Error:           ${summary.blockedBreakdown.configurationError}`);
      console.log(`  - Network/Timeout Error:         ${summary.blockedBreakdown.networkError}`);
    }

    if (summary.latestRateLimits) {
      console.log("\n--- PROVIDER RATE-LIMIT TELEMETRY (Latest API Headers) ---");
      console.log(`• Remaining Requests:              ${summary.latestRateLimits.remainingRequests} / ${summary.latestRateLimits.limitRequests}`);
      console.log(`• Remaining Tokens:                ${summary.latestRateLimits.remainingTokens} / ${summary.latestRateLimits.limitTokens}`);
      console.log(`• Request Limit Reset Window:      ${summary.latestRateLimits.resetRequests}`);
      console.log(`• Token Limit Reset Window:        ${summary.latestRateLimits.resetTokens}`);
    }

    console.log("\n--- MODEL QUALITY & RUBRIC METRICS (Completed Inferences Only) ---");
    if (summary.rubricScores) {
      console.log(`• Schema Compliance Rate:          ${summary.complianceRate} (${summary.complianceRate === "100%" ? "Target Met" : "Target Failed"})`);
      console.log(`• Zero-Fabrication Integrity Rate: ${summary.zeroFabricationRate} (${summary.zeroFabricationRate === "100%" ? "Target Met" : "Target Failed"})`);
      console.log(`• Average Latency:                 ${summary.averages?.latencyMs}ms (Target: <${TARGET_LATENCY_MS}ms)`);
      console.log(`• Average Token Consumption:       ${summary.averages?.totalTokens} tokens (Target: <${TARGET_MAX_TOTAL_TOKENS})`);
      console.log(`  - Average Prompt Tokens:         ${summary.averages?.promptTokens}`);
      console.log(`  - Average Completion Tokens:     ${summary.averages?.completionTokens}`);
      console.log(`• Evidence Grounding:              ${summary.rubricScores.evidenceGrounding} / 5.00`);
      console.log(`• Actionability:                   ${summary.rubricScores.recommendationActionability} / 5.00`);
      console.log(`• Career Strategy Relevance:       ${summary.rubricScores.careerStrategyRelevance} / 5.00`);
      console.log(`• Contextual Reasoning:            ${summary.rubricScores.contextualReasoning} / 5.00`);
      console.log(`• Output Consistency:              ${summary.rubricScores.outputConsistency} / 5.00`);
      console.log(`• Overall Composite Score:         ${summary.rubricScores.overallCompositeScore} / 5.00`);
    } else {
      console.log(`• Overall Composite Score:         N/A (No successful live inferences completed to evaluate)`);
      console.log(`  Note: Operational blocks (rate limiting, quota exhaustion, network timeouts) do NOT count as 0/5.00.`);
    }
    console.log("==========================================================================================\n");
  }
}

module.exports = {
  MetricsReporter,
  TARGET_LATENCY_MS,
  TARGET_MAX_TOTAL_TOKENS,
};
