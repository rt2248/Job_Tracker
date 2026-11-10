/**
 * @file careerAssessmentValidator.js
 * @description Deterministic evidence validator auditing model outputs against minimized candidate facts.
 *
 * Stage 2B.3B — Option C Provider Abstraction Foundation.
 *
 * Architecture Invariants:
 * 1. Independent Deterministic Verification: Never trusts model-generated self-verification claims
 *    (e.g., hallucinationCheckPassed is stripped and disregarded).
 * 2. Strict Skill Subset Audit: Verified candidate skills must be a strict case-insensitive subset
 *    of candidate declared skills.
 * 3. Career Stage & Experience Floor: Enforces biological and experience sanity floors (0-year candidates
 *    cannot be classified as senior or lead architect).
 * 4. Grounded Metric Citations: Numerical claims in citedMetrics must correspond to verified pipeline telemetry integers.
 * 5. Facts vs. Recommendations: Distinguishes candidate-specific factual assertions from future-oriented recommendations.
 * 6. Immutability & Security: Deeply clones outputs; never mutates inputs; safe against prototype pollution.
 */

const { AiConfigurationError } = require("../contracts/errors/AiConfigurationError");
const { AiSchemaValidationError } = require("../contracts/errors/AiSchemaValidationError");
const { validateCareerAssessmentRequest } = require("../contracts/dtos/CareerAssessmentRequest.dto");
const { CANONICAL_SKILL_SYNONYMS } = require("../../../utils/skillMatcher");

/** Maximum allowed raw model output size in bytes (512 KB) */
const MAX_OUTPUT_BYTES = 512 * 1024;

/** Valid enum definitions */
const VALID_CAREER_STAGES = Object.freeze(
  new Set(["entry_level", "mid_level", "senior", "lead_architect", "transitioning", "unspecified"])
);

const VALID_PIPELINE_HEALTH = Object.freeze(
  new Set(["healthy", "needs_focus", "critical_bottleneck", "insufficient_data", "inconsistent_data"])
);

const VALID_REC_CATEGORIES = Object.freeze(
  new Set(["pipeline_velocity", "targeting_alignment", "skill_acquisition", "interview_preparation", "data_hygiene"])
);

const VALID_REC_PRIORITIES = Object.freeze(new Set(["high", "medium", "low"]));

/**
 * Normalizes and canonicalizes skill string for deterministic comparison.
 * Maps curated industry synonyms (e.g. Golang -> go, Postgres -> postgresql, K8s -> kubernetes)
 * and falls back to normalized alphanumeric representation.
 *
 * @param {string} skill
 * @returns {string}
 */
function normalizeSkill(skill) {
  if (!skill || typeof skill !== "string") return "";
  const cleaned = skill.trim().toLowerCase();
  if (CANONICAL_SKILL_SYNONYMS[cleaned]) {
    return CANONICAL_SKILL_SYNONYMS[cleaned];
  }
  return cleaned
    .replace(/\.js\b/gi, "") // normalize react.js -> react, node.js -> node
    .replace(/[^a-z0-9+#]/g, ""); // strip non-alphanumeric except + and # (for C++, C#)
}

/**
 * Validates the structural schema of the model-generated career assessment payload.
 *
 * @param {any} raw
 * @param {string[]} discrepancies
 * @returns {boolean} True if structurally valid; false otherwise.
 */
function validateAssessmentStructure(raw, discrepancies) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    discrepancies.push("Assessment output must be a non-null object");
    return false;
  }

  let valid = true;

  // 1. candidateSummary
  if (!raw.candidateSummary || typeof raw.candidateSummary !== "object" || Array.isArray(raw.candidateSummary)) {
    discrepancies.push("Missing or invalid section: candidateSummary must be an object");
    valid = false;
  } else {
    const cs = raw.candidateSummary;
    if (!VALID_CAREER_STAGES.has(cs.careerStage)) {
      discrepancies.push(
        `candidateSummary.careerStage '${cs.careerStage}' is not one of: ${Array.from(VALID_CAREER_STAGES).join(", ")}`
      );
      valid = false;
    }
    if (!VALID_PIPELINE_HEALTH.has(cs.pipelineHealth)) {
      discrepancies.push(
        `candidateSummary.pipelineHealth '${cs.pipelineHealth}' is not one of: ${Array.from(VALID_PIPELINE_HEALTH).join(", ")}`
      );
      valid = false;
    }
    if (typeof cs.primaryBottleneck !== "string" || cs.primaryBottleneck.trim().length === 0) {
      discrepancies.push("candidateSummary.primaryBottleneck must be a non-empty string");
      valid = false;
    }
  }

  // 2. pipelineDiagnostics
  if (!raw.pipelineDiagnostics || typeof raw.pipelineDiagnostics !== "object" || Array.isArray(raw.pipelineDiagnostics)) {
    discrepancies.push("Missing or invalid section: pipelineDiagnostics must be an object");
    valid = false;
  } else {
    const pd = raw.pipelineDiagnostics;
    if (typeof pd.volumeAssessment !== "string" || pd.volumeAssessment.trim().length === 0) {
      discrepancies.push("pipelineDiagnostics.volumeAssessment must be a non-empty string");
      valid = false;
    }
    if (typeof pd.stageProgressionVelocity !== "string" || pd.stageProgressionVelocity.trim().length === 0) {
      discrepancies.push("pipelineDiagnostics.stageProgressionVelocity must be a non-empty string");
      valid = false;
    }
    if (typeof pd.staleApplicationRisk !== "string" || pd.staleApplicationRisk.trim().length === 0) {
      discrepancies.push("pipelineDiagnostics.staleApplicationRisk must be a non-empty string");
      valid = false;
    }
  }

  // 3. skillGapAnalysis
  if (!raw.skillGapAnalysis || typeof raw.skillGapAnalysis !== "object" || Array.isArray(raw.skillGapAnalysis)) {
    discrepancies.push("Missing or invalid section: skillGapAnalysis must be an object");
    valid = false;
  } else {
    const sga = raw.skillGapAnalysis;
    if (!Array.isArray(sga.verifiedCandidateSkills)) {
      discrepancies.push("skillGapAnalysis.verifiedCandidateSkills must be an array of strings");
      valid = false;
    }
    if (!Array.isArray(sga.criticalMissingSkills)) {
      discrepancies.push("skillGapAnalysis.criticalMissingSkills must be an array of strings");
      valid = false;
    }
    if (typeof sga.skillBridgingAdvice !== "string" || sga.skillBridgingAdvice.trim().length === 0) {
      discrepancies.push("skillGapAnalysis.skillBridgingAdvice must be a non-empty string");
      valid = false;
    }
  }

  // 4. strategicRecommendations
  if (!Array.isArray(raw.strategicRecommendations) || raw.strategicRecommendations.length === 0) {
    discrepancies.push("strategicRecommendations must be a non-empty array of recommendation items");
    valid = false;
  } else {
    if (raw.strategicRecommendations.length > 10) {
      discrepancies.push("strategicRecommendations cannot exceed 10 items");
      valid = false;
    }
    raw.strategicRecommendations.forEach((rec, idx) => {
      if (!rec || typeof rec !== "object" || Array.isArray(rec)) {
        discrepancies.push(`strategicRecommendations[${idx}] must be an object`);
        valid = false;
        return;
      }
      if (typeof rec.id !== "string" || rec.id.trim().length === 0) {
        discrepancies.push(`strategicRecommendations[${idx}].id must be a non-empty string`);
        valid = false;
      }
      if (!VALID_REC_CATEGORIES.has(rec.category)) {
        discrepancies.push(
          `strategicRecommendations[${idx}].category '${rec.category}' is invalid`
        );
        valid = false;
      }
      if (!VALID_REC_PRIORITIES.has(rec.priority)) {
        discrepancies.push(`strategicRecommendations[${idx}].priority '${rec.priority}' is invalid`);
        valid = false;
      }
      if (typeof rec.title !== "string" || rec.title.trim().length === 0) {
        discrepancies.push(`strategicRecommendations[${idx}].title must be a non-empty string`);
        valid = false;
      }
      if (typeof rec.rationale !== "string" || rec.rationale.trim().length === 0) {
        discrepancies.push(`strategicRecommendations[${idx}].rationale must be a non-empty string`);
        valid = false;
      }
      if (!Array.isArray(rec.actionSteps) || rec.actionSteps.length === 0) {
        discrepancies.push(`strategicRecommendations[${idx}].actionSteps must be a non-empty array of strings`);
        valid = false;
      }
      if (typeof rec.expectedImpact !== "string" || rec.expectedImpact.trim().length === 0) {
        discrepancies.push(`strategicRecommendations[${idx}].expectedImpact must be a non-empty string`);
        valid = false;
      }
    });
  }

  // 5. evidenceGrounding
  if (!raw.evidenceGrounding || typeof raw.evidenceGrounding !== "object" || Array.isArray(raw.evidenceGrounding)) {
    discrepancies.push("Missing or invalid section: evidenceGrounding must be an object");
    valid = false;
  } else {
    const eg = raw.evidenceGrounding;
    if (!Array.isArray(eg.citedMetrics)) {
      discrepancies.push("evidenceGrounding.citedMetrics must be an array of strings");
      valid = false;
    }
    if (typeof eg.dataLimitationsNoted !== "string") {
      discrepancies.push("evidenceGrounding.dataLimitationsNoted must be a string");
      valid = false;
    }
  }

  return valid;
}

/**
 * Supported English number word dictionaries for Stage 2B.4A-R1 numeric grounding.
 */
const UNITS_1_TO_9 = Object.freeze({
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
});

const TEENS_10_TO_19 = Object.freeze({
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
});

const TENS_20_TO_90 = Object.freeze({
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
});

const SCALES = Object.freeze({
  hundred: 100,
  thousand: 1000,
});

const ALL_NUM_WORDS_SET = Object.freeze(
  new Set([
    "zero",
    ...Object.keys(UNITS_1_TO_9),
    ...Object.keys(TEENS_10_TO_19),
    ...Object.keys(TENS_20_TO_90),
    ...Object.keys(SCALES),
  ])
);

/**
 * Validates and converts a sequence of English number tokens (e.g. ["twenty", "five"])
 * into its integer representation. Rejects ungrammatical compounds (e.g. ["two", "five"]).
 *
 * @param {string[]} tokens
 * @returns {number|null}
 */
function parseEnglishNumberTokens(tokens) {
  if (!tokens || tokens.length === 0) return null;

  // Standalone zero
  if (tokens.length === 1 && tokens[0].toLowerCase() === "zero") {
    return 0;
  }
  // Zero cannot be part of compound numbers
  if (tokens.some((t) => t.toLowerCase() === "zero")) {
    return null;
  }

  let total = 0;
  let current = 0;
  let lastTokenType = null; // "UNIT", "TEEN", "TEN", "HUNDRED", "THOUSAND", "AND"

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].toLowerCase();

    if (token === "and") {
      if (lastTokenType !== "HUNDRED" && lastTokenType !== "THOUSAND") {
        return null;
      }
      lastTokenType = "AND";
      continue;
    }

    if (UNITS_1_TO_9[token] !== undefined) {
      if (lastTokenType === "UNIT" || lastTokenType === "TEEN") {
        return null; // "two five" is invalid
      }
      current += UNITS_1_TO_9[token];
      lastTokenType = "UNIT";
    } else if (TEENS_10_TO_19[token] !== undefined) {
      if (lastTokenType === "UNIT" || lastTokenType === "TEEN" || lastTokenType === "TEN") {
        return null; // "twenty twelve" or "five ten" is invalid
      }
      current += TEENS_10_TO_19[token];
      lastTokenType = "TEEN";
    } else if (TENS_20_TO_90[token] !== undefined) {
      if (lastTokenType === "UNIT" || lastTokenType === "TEEN" || lastTokenType === "TEN") {
        return null; // "twenty thirty" or "five twenty" is invalid
      }
      current += TENS_20_TO_90[token];
      lastTokenType = "TEN";
    } else if (token === "hundred") {
      if (current === 0 || lastTokenType === "HUNDRED") {
        return null;
      }
      current = current * 100;
      lastTokenType = "HUNDRED";
    } else if (token === "thousand") {
      if (current === 0 || lastTokenType === "THOUSAND") {
        return null;
      }
      total += current * 1000;
      current = 0;
      lastTokenType = "THOUSAND";
    } else {
      return null;
    }
  }

  return total + current;
}

const NUMBER_WORD_PHRASE_REGEX = new RegExp(
  `\\b(?:(?:${Array.from(ALL_NUM_WORDS_SET).join("|")})(?:[- ](?:and[- ])?(?:${Array.from(ALL_NUM_WORDS_SET).join("|")}))*)\\b`,
  "gi"
);

function normalizeEnglishNumberWordsInText(text) {
  return text.replace(NUMBER_WORD_PHRASE_REGEX, (match) => {
    const tokens = match.toLowerCase().split(/[- ]+/).filter((t) => t.length > 0);
    const val = parseEnglishNumberTokens(tokens);
    if (val !== null) {
      return String(val);
    }
    return match;
  });
}

function isNumericTokenOrWord(word) {
  if (!word) return false;
  const w = word.toLowerCase();
  return /^\d+$/.test(w) || ALL_NUM_WORDS_SET.has(w);
}

/**
 * Independently audits a single pipeline metric citation string against telemetry evidence.
 * Enforces metric-to-field association, percentage derivation checks, and strict integer grounding.
 *
 * Stage 2B.4A — HIGH-01 Remediation.
 * Stage 2B.4A-R1 — Numeric Claim Grounding Correction (English number words & independent clause grounding).
 *
 * @param {string} citationStr
 * @param {Object} pipelineTelemetry
 * @returns {{ isValid: boolean, reason?: string }}
 */
function auditMetricCitation(citationStr, pipelineTelemetry) {
  if (!citationStr || typeof citationStr !== "string" || citationStr.trim().length === 0) {
    return { isValid: false, reason: "Empty or invalid citation string" };
  }

  let text = citationStr.trim().toLowerCase();

  // 1. Check for negative numeric values
  // e.g. "-1", "-5", "negative 2", "negative two"
  if (/(?:^|\s)-(?:\d+)(?:\.\d+)?\b/.test(text) || /\bnegative\s+(?:\d+|[a-z]+)\b/i.test(text)) {
    return { isValid: false, reason: `Negative numeric value in '${citationStr}' is invalid for discrete metric counts` };
  }

  // 2. Check for numeric ranges BEFORE any token conversion
  // e.g. "2-5", "2 - 5", "2 to 5", "two to five", "between 2 and 5"
  if (/\b\d+\s*-\s*\d+\b/.test(text)) {
    return { isValid: false, reason: `Numeric range expression in '${citationStr}' is invalid for discrete metric counts` };
  }
  const toRangeMatch = text.match(/\b([a-z0-9]+)\s+to\s+([a-z0-9]+)\b/i);
  if (toRangeMatch && isNumericTokenOrWord(toRangeMatch[1]) && isNumericTokenOrWord(toRangeMatch[2])) {
    return { isValid: false, reason: `Numeric range expression in '${citationStr}' is invalid for discrete metric counts` };
  }
  const betweenMatch = text.match(/\bbetween\s+([a-z0-9]+)\s+and\s+([a-z0-9]+)\b/i);
  if (betweenMatch && isNumericTokenOrWord(betweenMatch[1]) && isNumericTokenOrWord(betweenMatch[2])) {
    return { isValid: false, reason: `Numeric range expression in '${citationStr}' is invalid for discrete metric counts` };
  }

  // 3. Check for decimal numbers that are NOT part of a percentage
  // e.g. "2.5 interviews", "2.0", ".5"
  // Negative lookahead (?!\s*%) ensures percentage decimals like "12.5%" are handled by the percentage check
  if (/(?:^|[^\w.])(?:\d+\.\d+|\.\d+)(?!\s*%)|\b\d+\.\d+\b(?!\s*%)/.test(text)) {
    return { isValid: false, reason: `Decimal value in '${citationStr}' is invalid for discrete metric counts` };
  }

  // 4. Normalize comma-separated thousands integers (e.g. "1,000" -> "1000")
  text = text.replace(/\b(\d{1,3}),(\d{3})\b/g, "$1$2");

  // 5. Check for percentage citations (e.g. "50% offer rate", "11% conversion")
  const pctMatches = text.match(/\b(\d+(?:\.\d+)?)%/g);
  if (pctMatches) {
    const submitted = pipelineTelemetry.submittedApplications || 0;
    const interviews = pipelineTelemetry.interviewsInProgress || 0;
    const offers = pipelineTelemetry.cumulativeOffers || 0;
    const rejections = pipelineTelemetry.cumulativeRejections || 0;

    const supportedRates = [];
    if (submitted > 0) {
      supportedRates.push(Math.round((offers / submitted) * 100)); // offer rate on submissions
      supportedRates.push(Math.round((rejections / submitted) * 100)); // rejection rate on submissions
      supportedRates.push(Math.round((interviews / submitted) * 100)); // interview conversion on submissions
    }
    if (interviews > 0) {
      supportedRates.push(Math.round((offers / interviews) * 100)); // offer rate on interviews
    }
    if (offers + rejections > 0) {
      supportedRates.push(Math.round((offers / (offers + rejections)) * 100)); // outcome win rate
    }

    for (const pm of pctMatches) {
      const claimedPct = parseFloat(pm.replace("%", ""));
      const matchesSupportedRate = supportedRates.some((rate) => Math.abs(rate - claimedPct) < 0.5);
      if (!matchesSupportedRate) {
        return { isValid: false, reason: `Unsupported derived percentage '${claimedPct}%'` };
      }
    }
  }

  // 6. Normalize English number words to integer digits
  // e.g. "two interviews" -> "2 interviews", "zero pending offers" -> "0 pending offers"
  text = normalizeEnglishNumberWordsInText(text);

  // 7. Split citation into independent metric clauses
  // Delimiters: semicolon, comma, and, with, from, out of, beyond, including, where, while, but
  const CLAUSE_DELIMITERS = /\s*(?:;|,|\band\b|\bwith\b|\bfrom\b|\bout\s+of\b|\bbeyond\b|\bincluding\b|\bwhere\b|\bwhile\b|\bbut\b)\s*/i;
  const rawClauses = text.split(CLAUSE_DELIMITERS).map((c) => c.trim()).filter((c) => c.length > 0);

  const telemetry = pipelineTelemetry;
  const stageMap = new Map();
  for (const s of telemetry.stageDistribution || []) {
    if (s && typeof s.status === "string" && typeof s.count === "number") {
      stageMap.set(s.status.toLowerCase(), s.count);
    }
  }

  const metricChecks = [
    {
      keywords: [/\bpending\s+offers?\b/, /\boffers?\s+pending\b/],
      getValue: () => telemetry.pendingOffers,
      name: "pendingOffers",
    },
    {
      keywords: [
        /\bcumulative\s+offers?\b/,
        /\btotal\s+offers?\b/,
        /\boffers?\s+received\b/,
        /\boffers?\s+extended\b/,
        /\boffers?\s+accepted\b/,
        /\boffers?\b/,
      ],
      getValue: () => telemetry.cumulativeOffers,
      name: "cumulativeOffers",
    },
    {
      keywords: [/\binterviews?\s+in\s+progress\b/, /\bactive\s+interviews?\b/, /\binterviews?\b/],
      getValue: () => telemetry.interviewsInProgress,
      name: "interviewsInProgress",
    },
    {
      keywords: [/\bsubmitted\s+applications?\b/, /\bapplications?\s+submitted\b/, /\bapplications?\s+sent\b/, /\bapplied\b/, /\bapplications?\b/],
      getValue: () => telemetry.submittedApplications,
      name: "submittedApplications",
    },
    {
      keywords: [/\btracked\s+opportunit(?:y|ies)\b/, /\bopportunities\s+tracked\b/, /\btotal\s+tracked\b/, /\btracked\s+jobs?\b/, /\btracked\s+listings?\b/],
      getValue: () => telemetry.trackedOpportunities,
      name: "trackedOpportunities",
    },
    {
      keywords: [/\bsaved\s+count\b/, /\bsaved\s+jobs?\b/, /\bsaved\s+listings?\b/, /\bbookmarked\b/, /\bsaved\b/],
      getValue: () => telemetry.savedCount,
      name: "savedCount",
    },
    {
      keywords: [/\bactive\s+in\s+pipeline\b/, /\bin\s+pipeline\b/, /\bactive\s+pipeline\b/],
      getValue: () => telemetry.activeInPipeline,
      name: "activeInPipeline",
    },
    {
      keywords: [/\brejections?\b/, /\brejected\b/, /\brejections?\s+received\b/],
      getValue: () => telemetry.cumulativeRejections,
      name: "cumulativeRejections",
    },
    {
      keywords: [/\bstale\s+alerts?\b/, /\bstale\s+applications?\b/, /\bstale\s+count\b/, /\binactive\s+applications?\b/],
      getValue: () => telemetry.staleAlerts?.staleCount,
      name: "staleAlerts.staleCount",
    },
    {
      keywords: [/\bthreshold\s+days?\b/, /\binactivity\s+threshold\b/, /\bthreshold\b/],
      getValue: () => telemetry.staleAlerts?.thresholdDays,
      name: "staleAlerts.thresholdDays",
    },
  ];

  for (const [status, count] of stageMap.entries()) {
    metricChecks.push({
      keywords: [new RegExp(`\\b${status}\\b`, "i")],
      getValue: () => count,
      name: `stageDistribution[${status}]`,
    });
  }

  // 8. Validate each clause independently
  for (const clause of rawClauses) {
    const hasClausePct = /\b\d+(?:\.\d+)?%/.test(clause);
    const clauseWithoutPct = clause.replace(/\b\d+(?:\.\d+)?%/g, "").trim();
    const clauseNumbers = clauseWithoutPct.match(/\b\d+\b/g);

    if (!clauseNumbers || clauseNumbers.length === 0) {
      if (hasClausePct) {
        // Percentage was already validated in Step 5 and this clause has no other numbers
        continue;
      }

      // Purely qualitative clause: must reference an established verified status
      const isQualitativeInterview = clause.includes("interview") && (telemetry.interviewsInProgress || 0) > 0;
      const isQualitativeStale = clause.includes("stale") && (telemetry.staleAlerts?.staleCount || 0) > 0;
      const isQualitativeOffer = clause.includes("offer") && ((telemetry.pendingOffers || 0) > 0 || (telemetry.cumulativeOffers || 0) > 0);
      const isQualitativeApplied = (clause.includes("applied") || clause.includes("application")) && (telemetry.submittedApplications || 0) > 0;
      const isQualitativePipeline = clause.includes("pipeline") && (telemetry.activeInPipeline || 0) > 0;

      if (isQualitativeInterview || isQualitativeStale || isQualitativeOffer || isQualitativeApplied || isQualitativePipeline) {
        continue;
      }
      return { isValid: false, reason: `Qualitative citation '${clause}' has no verifiable telemetry evidence` };
    }

    // Numeric clause: find associations matching this specific clause
    const clauseAssociations = [];
    for (const check of metricChecks) {
      for (const kw of check.keywords) {
        if (kw.test(clause)) {
          clauseAssociations.push({
            name: check.name,
            expectedValue: check.getValue(),
          });
          break;
        }
      }
    }

    if (clauseAssociations.length === 0) {
      return { isValid: false, reason: `Ambiguous metric terminology in '${clause}'` };
    }

    const extractedNumbers = clauseNumbers.map((n) => parseInt(n, 10));
    const expectedValues = new Set(clauseAssociations.map((a) => a.expectedValue));

    for (const num of extractedNumbers) {
      if (!expectedValues.has(num)) {
        return {
          isValid: false,
          reason: `Value '${num}' in '${clause}' does not match associated metric value (${Array.from(expectedValues).join(", ")})`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Independently audits model factual claims against the minimized candidate evidence.
 *
 * @param {Object} candidateProfile - Minimized candidate profile.
 * @param {Object} pipelineTelemetry - Minimized pipeline telemetry.
 * @param {Object} rawAssessment - Model assessment output.
 * @param {string[]} discrepancies - Array collecting factual violation descriptions.
 * @returns {Object} Claims analysis breakdown.
 */
function auditEvidenceGrounding(candidateProfile, pipelineTelemetry, rawAssessment, discrepancies) {
  const claimsAnalysis = {
    validatedSkills: [],
    unsupportedSkills: [],
    validatedMetrics: [],
    unsupportedMetrics: [],
    experienceAssessment: {
      claimedStage: rawAssessment.candidateSummary?.careerStage || "unspecified",
      supported: true,
    },
    unsupportedFactualClaims: [],
  };

  // =========================================================================
  // 1. SKILL SUBSET AUDIT (Strict Case-Insensitive Subset Check)
  // =========================================================================
  const declaredSkillMap = new Map();
  for (const skill of candidateProfile.declaredSkills || []) {
    declaredSkillMap.set(normalizeSkill(skill), skill);
  }

  const verifiedSkills = rawAssessment.skillGapAnalysis?.verifiedCandidateSkills || [];
  for (const claimedSkill of verifiedSkills) {
    if (typeof claimedSkill !== "string") continue;

    const normalized = normalizeSkill(claimedSkill);
    if (declaredSkillMap.has(normalized)) {
      claimsAnalysis.validatedSkills.push(claimedSkill);
    } else {
      // Model claimed candidate has a skill they never declared
      claimsAnalysis.unsupportedSkills.push(claimedSkill);
      discrepancies.push(
        `Unsupported skill claim: verifiedCandidateSkills contains '${claimedSkill}', which was not declared in candidate profile`
      );
    }
  }

  // Check for contradiction: missing skills already in declared skills
  const missingSkills = rawAssessment.skillGapAnalysis?.criticalMissingSkills || [];
  for (const missingSkill of missingSkills) {
    if (typeof missingSkill !== "string") continue;

    const normalized = normalizeSkill(missingSkill);
    if (declaredSkillMap.has(normalized)) {
      discrepancies.push(
        `Contradiction: '${missingSkill}' listed in criticalMissingSkills was already declared by candidate as an existing skill`
      );
    }
  }

  // =========================================================================
  // 2. EXPERIENCE & CAREER STAGE FLOORS
  // =========================================================================
  const candidateYears = candidateProfile.yearsOfExperience || 0;
  const claimedStage = rawAssessment.candidateSummary?.careerStage;

  if (candidateYears === 0 || candidateYears < 1.0) {
    if (claimedStage === "senior" || claimedStage === "lead_architect") {
      claimsAnalysis.experienceAssessment.supported = false;
      claimsAnalysis.experienceAssessment.reason = `Candidate has ${candidateYears} years experience but was classified as '${claimedStage}'`;
      discrepancies.push(
        `Inflated career stage claim: candidate has ${candidateYears} years of experience but was classified as '${claimedStage}'`
      );
    }
  } else if (candidateYears < 3.0 && claimedStage === "lead_architect") {
    claimsAnalysis.experienceAssessment.supported = false;
    claimsAnalysis.experienceAssessment.reason = `Candidate has ${candidateYears} years experience but was classified as 'lead_architect'`;
    discrepancies.push(
      `Inflated career stage claim: candidate has ${candidateYears} years of experience but was classified as 'lead_architect'`
    );
  }

  // Text rationale inflated experience duration audit
  const textCorpus = [
    rawAssessment.candidateSummary?.primaryBottleneck || "",
    rawAssessment.pipelineDiagnostics?.volumeAssessment || "",
    ...(rawAssessment.strategicRecommendations || []).map((r) => r.rationale || ""),
  ].join(" ");

  const expRegex = /(?:with|has|having|boasts|brings|over)\s+(\d+(?:\.\d+)?)\+?\s+years(?:\s+of)?\s+experience/gi;
  let match;
  while ((match = expRegex.exec(textCorpus)) !== null) {
    const citedYears = parseFloat(match[1]);
    if (Number.isFinite(citedYears) && citedYears > candidateYears + 1.0) {
      claimsAnalysis.experienceAssessment.supported = false;
      discrepancies.push(
        `Inflated experience claim in text: model asserted ${citedYears} years of experience, but candidate evidence establishes ${candidateYears} years`
      );
    }
  }

  // =========================================================================
  // 3. PIPELINE METRIC CITATION GROUNDING (Stage 2B.4A HIGH-01)
  // =========================================================================
  const citedMetrics = rawAssessment.evidenceGrounding?.citedMetrics || [];
  for (const metricStr of citedMetrics) {
    if (typeof metricStr !== "string") continue;

    const auditRes = auditMetricCitation(metricStr, pipelineTelemetry);
    if (!auditRes.isValid) {
      claimsAnalysis.unsupportedMetrics.push(metricStr);
      discrepancies.push(
        `Fabricated metric citation: cited '${metricStr}', reason: ${auditRes.reason}`
      );
    } else {
      claimsAnalysis.validatedMetrics.push(metricStr);
    }
  }

  // =========================================================================
  // 4. FACTUAL DEGREE & CERTIFICATION ASSERTIONS (Stage 2B.4A MED-02)
  // =========================================================================
  // Check all factual free-text sections for fabricated credentials
  const factualSectionsText = [
    rawAssessment.candidateSummary?.primaryBottleneck || "",
    rawAssessment.pipelineDiagnostics?.volumeAssessment || "",
    rawAssessment.pipelineDiagnostics?.stageProgressionVelocity || "",
    rawAssessment.pipelineDiagnostics?.staleApplicationRisk || "",
    rawAssessment.skillGapAnalysis?.skillBridgingAdvice || "",
    rawAssessment.evidenceGrounding?.dataLimitationsNoted || "",
  ].join(" ");

  const credentialClaimsRegex =
    /\b(?:graduated\s+from|holds\s+(?:a|an)\s+(?:bachelor|master|phd|degree|doctorate|diploma)|certified\s+(?:as|in|by)\s+[A-Za-z]+|holds\s+(?:a|an)\s+certification|certified\s+solutions\s+architect|certified\s+kubernetes\s+administrator)\b/gi;

  let credMatch;
  while ((credMatch = credentialClaimsRegex.exec(factualSectionsText)) !== null) {
    const phrase = credMatch[0];
    claimsAnalysis.unsupportedFactualClaims.push(phrase);
    discrepancies.push(
      `Unsupported educational or certification claim: model asserted candidate credential '${phrase}' without input evidence`
    );
  }

  return claimsAnalysis;
}

/**
 * Reconstructs and sanitizes the assessment object using strict schema allowlisting.
 * Discards arbitrary unknown properties, strips model self-verification claims
 * (e.g. hallucinationCheckPassed), and eliminates prototype pollution keys.
 *
 * Stage 2B.4A — MED-03 Remediation.
 *
 * @param {Object} raw
 * @returns {Object|null}
 */
function sanitizeAssessmentPayload(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  // 1. Candidate Summary
  const cs = raw.candidateSummary || {};
  const sanitizedCandidateSummary = {
    careerStage: cs.careerStage,
    pipelineHealth: cs.pipelineHealth,
    primaryBottleneck: typeof cs.primaryBottleneck === "string" ? cs.primaryBottleneck : "",
  };

  // 2. Pipeline Diagnostics
  const pd = raw.pipelineDiagnostics || {};
  const sanitizedPipelineDiagnostics = {
    volumeAssessment: typeof pd.volumeAssessment === "string" ? pd.volumeAssessment : "",
    stageProgressionVelocity: typeof pd.stageProgressionVelocity === "string" ? pd.stageProgressionVelocity : "",
    staleApplicationRisk: typeof pd.staleApplicationRisk === "string" ? pd.staleApplicationRisk : "",
  };

  // 3. Skill Gap Analysis
  const sga = raw.skillGapAnalysis || {};
  const sanitizedSkillGapAnalysis = {
    verifiedCandidateSkills: Array.isArray(sga.verifiedCandidateSkills)
      ? sga.verifiedCandidateSkills.filter((s) => typeof s === "string")
      : [],
    criticalMissingSkills: Array.isArray(sga.criticalMissingSkills)
      ? sga.criticalMissingSkills.filter((s) => typeof s === "string")
      : [],
    skillBridgingAdvice: typeof sga.skillBridgingAdvice === "string" ? sga.skillBridgingAdvice : "",
  };

  // 4. Strategic Recommendations
  const sanitizedRecommendations = [];
  if (Array.isArray(raw.strategicRecommendations)) {
    for (const rec of raw.strategicRecommendations) {
      if (!rec || typeof rec !== "object" || Array.isArray(rec)) continue;
      sanitizedRecommendations.push({
        id: typeof rec.id === "string" ? rec.id : "",
        category: rec.category,
        priority: rec.priority,
        title: typeof rec.title === "string" ? rec.title : "",
        rationale: typeof rec.rationale === "string" ? rec.rationale : "",
        actionSteps: Array.isArray(rec.actionSteps) ? rec.actionSteps.filter((s) => typeof s === "string") : [],
        expectedImpact: typeof rec.expectedImpact === "string" ? rec.expectedImpact : "",
      });
    }
  }

  // 5. Evidence Grounding
  const eg = raw.evidenceGrounding || {};
  const sanitizedEvidenceGrounding = {
    citedMetrics: Array.isArray(eg.citedMetrics) ? eg.citedMetrics.filter((m) => typeof m === "string") : [],
    dataLimitationsNoted: typeof eg.dataLimitationsNoted === "string" ? eg.dataLimitationsNoted : "",
  };

  return {
    candidateSummary: sanitizedCandidateSummary,
    pipelineDiagnostics: sanitizedPipelineDiagnostics,
    skillGapAnalysis: sanitizedSkillGapAnalysis,
    strategicRecommendations: sanitizedRecommendations,
    evidenceGrounding: sanitizedEvidenceGrounding,
  };
}

/**
 * Validates a model-generated career strategy assessment against minimized candidate evidence.
 *
 * @param {any} minimizedRequest - Minimized candidate assessment request DTO.
 * @param {any} rawAssessmentOutput - Raw provider assessment output or payload.
 * @param {Object} [options]
 * @param {boolean} [options.throwOnError=false] - If true, throws AiSchemaValidationError on failure.
 * @returns {{
 *   isValid: boolean,
 *   status: "VALID"|"UNSUPPORTED_CLAIMS"|"STRUCTURAL_INVALID"|"REQUIRES_REVIEW",
 *   validationAudit: { schemaValid: boolean, evidenceGrounded: boolean, discrepancies: string[] },
 *   claimsAnalysis: Object,
 *   sanitizedAssessment: Object|null
 * }}
 */
function validateCareerAssessmentEvidence(minimizedRequest, rawAssessmentOutput, { throwOnError = false } = {}) {
  // 1. Input Guardrails (minimizedRequest)
  const reqDto = minimizedRequest?.minimizedRequest || minimizedRequest;
  const reqValidation = validateCareerAssessmentRequest(reqDto);
  if (!reqValidation.isValid) {
    throw new AiConfigurationError(
      `Validator input failed CareerAssessmentRequest validation: ${reqValidation.errors.join("; ")}`,
      { diagnosticContext: { reason: "INVALID_MINIMIZED_REQUEST" } }
    );
  }

  // 2. Input Guardrails (rawAssessmentOutput)
  if (!rawAssessmentOutput || typeof rawAssessmentOutput !== "object" || Array.isArray(rawAssessmentOutput)) {
    throw new AiConfigurationError("rawAssessmentOutput must be a non-null object", {
      diagnosticContext: { reason: "INVALID_RAW_OUTPUT" }
    });
  }

  const rawPayload = rawAssessmentOutput.rawData || rawAssessmentOutput;

  // Output size sanity check
  try {
    const serializedSize = Buffer.byteLength(JSON.stringify(rawPayload), "utf8");
    if (serializedSize > MAX_OUTPUT_BYTES) {
      throw new AiConfigurationError(
        `Assessment payload size (${Math.round(serializedSize / 1024)} KB) exceeds safe limit (512 KB)`,
        { diagnosticContext: { reason: "OUTPUT_PAYLOAD_TOO_LARGE" } }
      );
    }
  } catch (err) {
    if (err instanceof AiConfigurationError) throw err;
    throw new AiConfigurationError("rawAssessmentOutput contains circular or malformed JSON structure", {
      originalError: err,
      diagnosticContext: { reason: "CIRCULAR_OR_MALFORMED_OUTPUT" },
    });
  }

  const discrepancies = [];

  // 3. Structural Schema Validation
  const schemaValid = validateAssessmentStructure(rawPayload, discrepancies);

  if (!schemaValid) {
    const result = {
      isValid: false,
      status: "STRUCTURAL_INVALID",
      validationAudit: {
        schemaValid: false,
        evidenceGrounded: false,
        discrepancies,
      },
      claimsAnalysis: {
        validatedSkills: [],
        unsupportedSkills: [],
        validatedMetrics: [],
        unsupportedMetrics: [],
        experienceAssessment: { claimedStage: "unknown", supported: false },
        unsupportedFactualClaims: [],
      },
      sanitizedAssessment: null,
    };

    if (throwOnError) {
      throw new AiSchemaValidationError("Career assessment output failed structural schema validation", {
        diagnosticContext: { reason: "STRUCTURAL_INVALID", discrepanciesCount: discrepancies.length },
      });
    }

    return result;
  }

  // 4. Evidence Grounding Audit
  const candidateProfile = reqDto.candidateProfile;
  const pipelineTelemetry = reqDto.pipelineTelemetry;

  const claimsAnalysis = auditEvidenceGrounding(candidateProfile, pipelineTelemetry, rawPayload, discrepancies);

  const evidenceGrounded = discrepancies.length === 0;
  const isValid = schemaValid && evidenceGrounded;

  // Determine outcome status
  let status = "VALID";
  if (!schemaValid) {
    status = "STRUCTURAL_INVALID";
  } else if (!evidenceGrounded) {
    status = "UNSUPPORTED_CLAIMS";
  }

  // 5. Sanitize Assessment (Stage 2B.4A MED-05: Strictly null whenever isValid is false)
  const sanitizedAssessment = isValid ? sanitizeAssessmentPayload(rawPayload) : null;

  const result = {
    isValid,
    status,
    validationAudit: {
      schemaValid,
      evidenceGrounded,
      discrepancies,
    },
    claimsAnalysis,
    sanitizedAssessment,
  };

  if (throwOnError && !isValid) {
    throw new AiSchemaValidationError("Career assessment failed factual evidence grounding audit", {
      diagnosticContext: { reason: status, discrepanciesCount: discrepancies.length },
    });
  }

  return result;
}

module.exports = {
  validateCareerAssessmentEvidence,
  normalizeSkill,
  auditMetricCitation,
  MAX_OUTPUT_BYTES,
  VALID_CAREER_STAGES,
  VALID_PIPELINE_HEALTH,
  VALID_REC_CATEGORIES,
  VALID_REC_PRIORITIES,
};