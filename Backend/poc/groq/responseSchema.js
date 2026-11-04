/**
 * responseSchema.js
 *
 * Strict JSON Schema definition for Evolexa Career Strategist assessments,
 * configured for Groq Structured Outputs (`response_format: { type: "json_schema", ... }`).
 *
 * Enforces strict typing, required fields, and additionalProperties: false
 * to guarantee 100% deterministic schema compliance at the decoding level.
 */

const CAREER_ASSESSMENT_JSON_SCHEMA = {
  type: "object",
  properties: {
    candidateSummary: {
      type: "object",
      properties: {
        careerStage: {
          type: "string",
          enum: ["entry_level", "mid_level", "senior", "lead_architect", "transitioning", "unspecified"],
          description: "Assessed career stage grounded strictly in verified experience and skill telemetry.",
        },
        pipelineHealth: {
          type: "string",
          enum: ["healthy", "needs_focus", "critical_bottleneck", "insufficient_data", "inconsistent_data"],
          description: "High-level diagnostic rating of application pipeline.",
        },
        primaryBottleneck: {
          type: "string",
          description: "Primary hurdle currently facing the candidate (e.g. low submission volume, resume conversion, skill gap).",
        },
      },
      required: ["careerStage", "pipelineHealth", "primaryBottleneck"],
      additionalProperties: false,
    },
    pipelineDiagnostics: {
      type: "object",
      properties: {
        volumeAssessment: {
          type: "string",
          description: "Analysis of tracked, submitted, and saved opportunities volume.",
        },
        stageProgressionVelocity: {
          type: "string",
          description: "Evaluation of conversion velocity from applied -> OA -> interview -> offer.",
        },
        staleApplicationRisk: {
          type: "string",
          description: "Assessment of dormant or inactive applications based on stage duration.",
        },
      },
      required: ["volumeAssessment", "stageProgressionVelocity", "staleApplicationRisk"],
      additionalProperties: false,
    },
    skillGapAnalysis: {
      type: "object",
      properties: {
        verifiedCandidateSkills: {
          type: "array",
          items: { type: "string" },
          description: "Skills verified from candidate profile; must NOT contain fabricated skills.",
        },
        criticalMissingSkills: {
          type: "array",
          items: { type: "string" },
          description: "High-demand target skills currently missing from candidate profile for their target roles.",
        },
        skillBridgingAdvice: {
          type: "string",
          description: "Concrete strategic advice for bridging the detected skill gaps.",
        },
      },
      required: ["verifiedCandidateSkills", "criticalMissingSkills", "skillBridgingAdvice"],
      additionalProperties: false,
    },
    strategicRecommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Unique recommendation identifier (e.g. REC-01).",
          },
          category: {
            type: "string",
            enum: ["pipeline_velocity", "targeting_alignment", "skill_acquisition", "interview_preparation", "data_hygiene"],
            description: "Functional category of the recommendation.",
          },
          priority: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Urgency and impact rating.",
          },
          title: {
            type: "string",
            description: "Concise actionable headline.",
          },
          rationale: {
            type: "string",
            description: "Evidence-grounded explanation citing candidate's specific metrics or skills.",
          },
          actionSteps: {
            type: "array",
            items: { type: "string" },
            description: "Concrete step-by-step actions candidate should execute.",
          },
          expectedImpact: {
            type: "string",
            description: "Measurable outcome expected from completing this recommendation.",
          },
        },
        required: ["id", "category", "priority", "title", "rationale", "actionSteps", "expectedImpact"],
        additionalProperties: false,
      },
      description: "Ranked list of prioritized, actionable career strategy recommendations.",
    },
    evidenceGrounding: {
      type: "object",
      properties: {
        citedMetrics: {
          type: "array",
          items: { type: "string" },
          description: "Explicit metrics cited from candidate telemetry (e.g. '42 saved jobs', '24 rejections').",
        },
        dataLimitationsNoted: {
          type: "string",
          description: "Any missing data, cold start caveats, or ambiguous telemetry explicitly flagged.",
        },
        hallucinationCheckPassed: {
          type: "boolean",
          description: "True if all claims are strictly grounded in input telemetry with zero assumptions.",
        },
      },
      required: ["citedMetrics", "dataLimitationsNoted", "hallucinationCheckPassed"],
      additionalProperties: false,
    },
  },
  required: [
    "candidateSummary",
    "pipelineDiagnostics",
    "skillGapAnalysis",
    "strategicRecommendations",
    "evidenceGrounding",
  ],
  additionalProperties: false,
};

/**
 * Validates a parsed JSON payload against the CAREER_ASSESSMENT_JSON_SCHEMA.
 * Lightweight, zero-dependency validation engine.
 *
 * @param {any} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCareerAssessmentSchema(data) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, errors: ["Root payload must be an object"] };
  }

  // 1. Check candidateSummary
  if (!data.candidateSummary || typeof data.candidateSummary !== "object") {
    errors.push("Missing or invalid 'candidateSummary'");
  } else {
    const cs = data.candidateSummary;
    const stages = ["entry_level", "mid_level", "senior", "lead_architect", "transitioning", "unspecified"];
    const healths = ["healthy", "needs_focus", "critical_bottleneck", "insufficient_data", "inconsistent_data"];
    if (!stages.includes(cs.careerStage)) errors.push(`Invalid candidateSummary.careerStage: ${cs.careerStage}`);
    if (!healths.includes(cs.pipelineHealth)) errors.push(`Invalid candidateSummary.pipelineHealth: ${cs.pipelineHealth}`);
    if (!cs.primaryBottleneck || typeof cs.primaryBottleneck !== "string") errors.push("Missing candidateSummary.primaryBottleneck");
  }

  // 2. Check pipelineDiagnostics
  if (!data.pipelineDiagnostics || typeof data.pipelineDiagnostics !== "object") {
    errors.push("Missing or invalid 'pipelineDiagnostics'");
  } else {
    const pd = data.pipelineDiagnostics;
    if (!pd.volumeAssessment || typeof pd.volumeAssessment !== "string") errors.push("Missing pipelineDiagnostics.volumeAssessment");
    if (!pd.stageProgressionVelocity || typeof pd.stageProgressionVelocity !== "string") errors.push("Missing pipelineDiagnostics.stageProgressionVelocity");
    if (!pd.staleApplicationRisk || typeof pd.staleApplicationRisk !== "string") errors.push("Missing pipelineDiagnostics.staleApplicationRisk");
  }

  // 3. Check skillGapAnalysis
  if (!data.skillGapAnalysis || typeof data.skillGapAnalysis !== "object") {
    errors.push("Missing or invalid 'skillGapAnalysis'");
  } else {
    const sg = data.skillGapAnalysis;
    if (!Array.isArray(sg.verifiedCandidateSkills)) errors.push("skillGapAnalysis.verifiedCandidateSkills must be an array");
    if (!Array.isArray(sg.criticalMissingSkills)) errors.push("skillGapAnalysis.criticalMissingSkills must be an array");
    if (!sg.skillBridgingAdvice || typeof sg.skillBridgingAdvice !== "string") errors.push("Missing skillGapAnalysis.skillBridgingAdvice");
  }

  // 4. Check strategicRecommendations
  if (!Array.isArray(data.strategicRecommendations)) {
    errors.push("strategicRecommendations must be an array");
  } else if (data.strategicRecommendations.length === 0) {
    errors.push("strategicRecommendations must contain at least one recommendation");
  } else {
    const allowedCategories = ["pipeline_velocity", "targeting_alignment", "skill_acquisition", "interview_preparation", "data_hygiene"];
    const allowedPriorities = ["high", "medium", "low"];

    data.strategicRecommendations.forEach((rec, idx) => {
      if (!rec || typeof rec !== "object") {
        errors.push(`strategicRecommendations[${idx}] must be an object`);
        return;
      }
      if (!rec.id || typeof rec.id !== "string") errors.push(`rec[${idx}]: missing id`);
      if (!allowedCategories.includes(rec.category)) errors.push(`rec[${idx}]: invalid category '${rec.category}'`);
      if (!allowedPriorities.includes(rec.priority)) errors.push(`rec[${idx}]: invalid priority '${rec.priority}'`);
      if (!rec.title || typeof rec.title !== "string") errors.push(`rec[${idx}]: missing title`);
      if (!rec.rationale || typeof rec.rationale !== "string") errors.push(`rec[${idx}]: missing rationale`);
      if (!Array.isArray(rec.actionSteps) || rec.actionSteps.length === 0) errors.push(`rec[${idx}]: actionSteps must be a non-empty array`);
      if (!rec.expectedImpact || typeof rec.expectedImpact !== "string") errors.push(`rec[${idx}]: missing expectedImpact`);
    });
  }

  // 5. Check evidenceGrounding
  if (!data.evidenceGrounding || typeof data.evidenceGrounding !== "object") {
    errors.push("Missing or invalid 'evidenceGrounding'");
  } else {
    const eg = data.evidenceGrounding;
    if (!Array.isArray(eg.citedMetrics)) errors.push("evidenceGrounding.citedMetrics must be an array");
    if (!eg.dataLimitationsNoted || typeof eg.dataLimitationsNoted !== "string") errors.push("Missing evidenceGrounding.dataLimitationsNoted");
    if (typeof eg.hallucinationCheckPassed !== "boolean") errors.push("evidenceGrounding.hallucinationCheckPassed must be boolean");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  CAREER_ASSESSMENT_JSON_SCHEMA,
  validateCareerAssessmentSchema,
};
