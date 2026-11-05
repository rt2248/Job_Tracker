/**
 * @file CareerAssessmentRequest.dto.js
 * @description Request DTO specification and structural validation for career strategy assessments.
 *
 * Stage 2B.1 — Option C Provider Abstraction Foundation.
 */

/**
 * @typedef {Object} CandidateProfileInput
 * @property {string} headline - Professional headline (sanitized, max 120 chars).
 * @property {number} yearsOfExperience - Non-negative verified years of professional experience.
 * @property {string[]} declaredSkills - Array of declared candidate skills.
 * @property {string[]} targetRoles - Array of target career titles.
 * @property {string|null} [userNotes] - Optional sanitized user context notes (max 1,000 chars).
 */

/**
 * @typedef {Object} StageDistributionEntry
 * @property {string} status - Pipeline stage status (e.g. "Applied", "OA", "Interview").
 * @property {number} count - Application count in this stage.
 */

/**
 * @typedef {Object} StaleAlertsTelemetry
 * @property {number} staleCount - Number of applications inactive beyond threshold.
 * @property {number} thresholdDays - Inactivity threshold in days.
 */

/**
 * @typedef {Object} PipelineTelemetryInput
 * @property {number} trackedOpportunities - Total job listings tracked.
 * @property {number} submittedApplications - Total submitted applications (excluding saved/drafts).
 * @property {number} savedCount - Total bookmarked / saved listings.
 * @property {number} activeInPipeline - Applications currently active in pipeline.
 * @property {number} interviewsInProgress - Active interview processes.
 * @property {number} pendingOffers - Offers currently pending decision.
 * @property {number} cumulativeOffers - Historical total offers received.
 * @property {number} cumulativeRejections - Historical total rejections received.
 * @property {StageDistributionEntry[]} stageDistribution - Breakdown of counts per pipeline status.
 * @property {StaleAlertsTelemetry} staleAlerts - Stale application metrics.
 */

/**
 * @typedef {Object} RequestOptions
 * @property {number} [timeoutMs] - Execution timeout boundary in milliseconds.
 * @property {AbortSignal} [signal] - Optional caller cancellation AbortSignal.
 */

/**
 * @typedef {Object} CareerAssessmentRequestDTO
 * @property {string} correlationId - Unique tracing UUID (v4).
 * @property {CandidateProfileInput} candidateProfile - Minimized candidate profile data.
 * @property {PipelineTelemetryInput} pipelineTelemetry - Aggregated pipeline volume metrics.
 * @property {RequestOptions} [options] - Execution boundary options.
 */

/**
 * Validates a CareerAssessmentRequestDTO structure.
 *
 * @param {any} dto - Candidate request object.
 * @returns {{ isValid: boolean, errors: string[] }} Validation result and error descriptions.
 */
function validateCareerAssessmentRequest(dto) {
  const errors = [];

  if (!dto || typeof dto !== "object" || Array.isArray(dto)) {
    return { isValid: false, errors: ["Request must be a non-null object"] };
  }

  // 1. Correlation ID
  if (typeof dto.correlationId !== "string" || dto.correlationId.trim().length === 0) {
    errors.push("correlationId must be a non-empty string");
  }

  // 2. Candidate Profile
  if (!dto.candidateProfile || typeof dto.candidateProfile !== "object" || Array.isArray(dto.candidateProfile)) {
    errors.push("candidateProfile must be a valid object");
  } else {
    const cp = dto.candidateProfile;
    if (typeof cp.headline !== "string") {
      errors.push("candidateProfile.headline must be a string");
    }
    if (typeof cp.yearsOfExperience !== "number" || cp.yearsOfExperience < 0 || !Number.isFinite(cp.yearsOfExperience)) {
      errors.push("candidateProfile.yearsOfExperience must be a non-negative finite number");
    }
    if (!Array.isArray(cp.declaredSkills) || !cp.declaredSkills.every((s) => typeof s === "string")) {
      errors.push("candidateProfile.declaredSkills must be an array of strings");
    }
    if (!Array.isArray(cp.targetRoles) || !cp.targetRoles.every((r) => typeof r === "string")) {
      errors.push("candidateProfile.targetRoles must be an array of strings");
    }
    if (cp.userNotes !== undefined && cp.userNotes !== null && typeof cp.userNotes !== "string") {
      errors.push("candidateProfile.userNotes must be a string, null, or undefined");
    }
  }

  // 3. Pipeline Telemetry
  if (!dto.pipelineTelemetry || typeof dto.pipelineTelemetry !== "object" || Array.isArray(dto.pipelineTelemetry)) {
    errors.push("pipelineTelemetry must be a valid object");
  } else {
    const pt = dto.pipelineTelemetry;
    const requiredNumericFields = [
      "trackedOpportunities",
      "submittedApplications",
      "savedCount",
      "activeInPipeline",
      "interviewsInProgress",
      "pendingOffers",
      "cumulativeOffers",
      "cumulativeRejections",
    ];

    for (const field of requiredNumericFields) {
      if (typeof pt[field] !== "number" || pt[field] < 0 || !Number.isFinite(pt[field])) {
        errors.push(`pipelineTelemetry.${field} must be a non-negative finite number`);
      }
    }

    if (!Array.isArray(pt.stageDistribution)) {
      errors.push("pipelineTelemetry.stageDistribution must be an array");
    } else {
      const allValidEntries = pt.stageDistribution.every(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          typeof entry.status === "string" &&
          typeof entry.count === "number" &&
          entry.count >= 0
      );
      if (!allValidEntries) {
        errors.push("pipelineTelemetry.stageDistribution items must have string status and non-negative count");
      }
    }

    if (!pt.staleAlerts || typeof pt.staleAlerts !== "object") {
      errors.push("pipelineTelemetry.staleAlerts must be an object with staleCount and thresholdDays");
    } else {
      if (typeof pt.staleAlerts.staleCount !== "number" || pt.staleAlerts.staleCount < 0) {
        errors.push("pipelineTelemetry.staleAlerts.staleCount must be a non-negative number");
      }
      if (typeof pt.staleAlerts.thresholdDays !== "number" || pt.staleAlerts.thresholdDays < 0) {
        errors.push("pipelineTelemetry.staleAlerts.thresholdDays must be a non-negative number");
      }
    }
  }

  // 4. Options (optional)
  if (dto.options !== undefined && dto.options !== null) {
    if (typeof dto.options !== "object" || Array.isArray(dto.options)) {
      errors.push("options must be a valid object if provided");
    } else {
      if (dto.options.timeoutMs !== undefined && (typeof dto.options.timeoutMs !== "number" || dto.options.timeoutMs <= 0)) {
        errors.push("options.timeoutMs must be a positive number");
      }
      if (dto.options.signal !== undefined && !(dto.options.signal instanceof AbortSignal)) {
        errors.push("options.signal must be an instance of AbortSignal");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateCareerAssessmentRequest,
};
