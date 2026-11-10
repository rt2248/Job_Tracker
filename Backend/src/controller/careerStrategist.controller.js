/**
 * @file careerStrategist.controller.js
 * @description HTTP Controller for Evolexa Career Strategist Assessment API.
 *
 * Stage 2B.4C — Option C Provider Abstraction Foundation.
 *
 * Architecture Invariants:
 * 1. Thin Controller: Delegates all minimization, provider dispatch, validation, and fallback
 *    to CareerStrategistService. Never reimplements AI orchestration or fallback heuristics.
 * 2. Mandatory Authentication: Identity is derived exclusively from trusted server-side JWT middleware (req.user.userId).
 *    Never trusts client-supplied user IDs.
 * 3. Authoritative Data Sourcing: Slices candidate profile and pipeline telemetry from existing verified
 *    database models (profile.model.js, insights.model.js). Prevents client-side telemetry injection.
 * 4. Cancellation Propagation: Listens to client socket disconnect (req.on("close")) and cleanly
 *    propagates AbortSignal through the service execution boundary.
 * 5. Sanitized Error Mapping: Translates internal AI error taxonomy into appropriate HTTP status codes
 *    (400, 401, 403, 429, 499, 502, 504, 500) without exposing stack traces, credentials, or PII.
 */

const crypto = require("crypto");
const { CareerStrategistService } = require("../services/ai/CareerStrategistService");
const profileModelDefault = require("../models/files/profile.model");
const insightsModelDefault = require("../models/files/insights.model");

const {
  AiError,
  AiCancellationError,
  AiTimeoutError,
  AiRateLimitError,
  AiAuthenticationError,
  AiConfigurationError,
  AiSchemaValidationError,
  AiModelFailureError,
  AI_ERROR_CODES,
} = require("../services/ai/contracts/errors");

/**
 * Derives verified total years of experience from profile experience array.
 *
 * @param {Array} experienceList
 * @returns {number}
 */
function calculateYearsOfExperienceFromHistory(experienceList) {
  if (!Array.isArray(experienceList) || experienceList.length === 0) {
    return 0;
  }

  let totalMonths = 0;
  const now = new Date();

  for (const exp of experienceList) {
    if (!exp || !exp.startDate) continue;
    const start = new Date(exp.startDate);
    if (isNaN(start.getTime())) continue;

    const end = exp.current || !exp.endDate ? now : new Date(exp.endDate);
    if (isNaN(end.getTime()) || end < start) continue;

    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, diffMonths);
  }

  const years = Math.round((totalMonths / 12) * 10) / 10;
  return Math.min(70, Math.max(0, years));
}

/**
 * Controller factory supporting dependency injection for testing and runtime.
 *
 * @param {Object} [dependencies]
 * @param {CareerStrategistService} [dependencies.careerStrategistService]
 * @param {Object} [dependencies.profileModel]
 * @param {Object} [dependencies.insightsModel]
 * @returns {{ generateAssessment: Function }}
 */
function createCareerStrategistController({
  careerStrategistService = new CareerStrategistService(),
  profileModel = profileModelDefault,
  insightsModel = insightsModelDefault,
} = {}) {
  /**
   * Controller: POST /api/career-strategist/assessment
   * Generates or retrieves structured AI career strategy assessment.
   */
  async function generateAssessment(req, res) {
    // ------------------------------------------------------------------------
    // 1. Identity & Authorization Verification
    // ------------------------------------------------------------------------
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "No token provided or invalid session" });
    }

    // Explicit cross-user spoof protection: reject attempts to override authenticated ID
    const spoofAttempt =
      (req.body?.userId && req.body.userId !== userId) ||
      (req.body?.user_id && req.body.user_id !== userId);

    if (spoofAttempt) {
      return res.status(403).json({
        message: "Unauthorized: Client cannot override authenticated user identity",
      });
    }

    // ------------------------------------------------------------------------
    // 2. Client Parameter Validation
    // ------------------------------------------------------------------------
    let clientYoe = null;
    if (req.body?.yearsOfExperience !== undefined && req.body?.yearsOfExperience !== null) {
      const parsedYoe = Number(req.body.yearsOfExperience);
      if (!Number.isFinite(parsedYoe) || parsedYoe < 0 || parsedYoe > 70) {
        return res.status(400).json({
          message: "Invalid yearsOfExperience. Must be a finite non-negative number between 0 and 70.",
        });
      }
      clientYoe = parsedYoe;
    }

    let effectiveTimeoutMs;
    if (req.body?.options?.timeoutMs !== undefined) {
      const parsedTimeout = Number(req.body.options.timeoutMs);
      if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0 || parsedTimeout > 120000) {
        return res.status(400).json({
          message: "Invalid options.timeoutMs. Must be a positive integer <= 120,000 ms.",
        });
      }
      effectiveTimeoutMs = parsedTimeout;
    }

    if (req.body?.targetRoles !== undefined && !Array.isArray(req.body.targetRoles)) {
      return res.status(400).json({
        message: "Invalid targetRoles. Must be an array of role titles.",
      });
    }

    // ------------------------------------------------------------------------
    // 3. Authoritative Backend Data Sourcing
    // ------------------------------------------------------------------------
    let profile;
    let summary;
    let snapshot;

    try {
      [profile, summary, snapshot] = await Promise.all([
        profileModel.getProfileByUserId(userId),
        insightsModel.getInsightsSummary(userId, { range: "all" }),
        insightsModel.getPipelineSnapshot(userId),
      ]);
    } catch (dbErr) {
      console.error("[CareerStrategistController] Database retrieval error:", dbErr.message);
      return res.status(500).json({
        message: "Failed to retrieve candidate profile and pipeline telemetry",
      });
    }

    // Safe fallback if user profile record does not yet exist
    const safeProfile = profile || {};
    const safeSummary = summary || {};
    const safeSnapshot = snapshot || {};

    // Determine years of experience: client override or derived from profile history
    const computedYoe =
      clientYoe !== null
        ? clientYoe
        : calculateYearsOfExperienceFromHistory(safeProfile.experience);

    // Assemble Candidate Profile Input (DTO boundary)
    const headline =
      typeof req.body?.headline === "string"
        ? req.body.headline.slice(0, 120)
        : (typeof safeProfile.headline === "string" ? safeProfile.headline.slice(0, 120) : "");

    const declaredSkills = Array.isArray(safeProfile.skills) ? safeProfile.skills : [];

    const targetRoles =
      Array.isArray(req.body?.targetRoles) && req.body.targetRoles.length > 0
        ? req.body.targetRoles.filter((r) => typeof r === "string" && r.trim().length > 0)
        : headline
        ? [headline]
        : ["Software Engineer"];

    const userNotes =
      typeof req.body?.userNotes === "string"
        ? req.body.userNotes.slice(0, 1000)
        : typeof safeProfile.bio === "string"
        ? safeProfile.bio.slice(0, 1000)
        : null;

    const candidateProfile = {
      headline,
      yearsOfExperience: computedYoe,
      declaredSkills,
      targetRoles,
      userNotes,
    };

    // Assemble Pipeline Telemetry Input (DTO boundary)
    const activeStages = safeSnapshot.activeSegment?.stages || [];
    const closedStages = safeSnapshot.closedSegment?.stages || [];
    const allStages = [...activeStages, ...closedStages];

    const stageDistribution = allStages.map((s) => ({
      status: String(s.status || ""),
      count: Number(s.count) || 0,
    }));

    const savedStage = activeStages.find((s) => s.status === "saved");
    const savedCount = savedStage ? Number(savedStage.count) || 0 : 0;

    const pipelineTelemetry = {
      trackedOpportunities: Number(safeSummary.volumeMetrics?.trackedOpportunities) || 0,
      submittedApplications: Number(safeSummary.volumeMetrics?.submittedApplications) || 0,
      savedCount,
      activeInPipeline: Number(safeSummary.snapshotMetrics?.activeInPipeline) || 0,
      interviewsInProgress: Number(safeSummary.snapshotMetrics?.interviewsInProgress) || 0,
      pendingOffers: Number(safeSummary.snapshotMetrics?.pendingOffers) || 0,
      cumulativeOffers: Number(safeSummary.volumeMetrics?.cumulativeOffers) || 0,
      cumulativeRejections: Number(safeSummary.volumeMetrics?.cumulativeRejections) || 0,
      stageDistribution,
      staleAlerts: {
        staleCount: Number(safeSummary.staleAlerts?.staleCount) || 0,
        thresholdDays: Number(safeSummary.staleAlerts?.thresholdDays) || 14,
      },
    };

    // Correlation ID
    const correlationId =
      typeof req.body?.correlationId === "string" && req.body.correlationId.trim().length > 0
        ? req.body.correlationId.trim()
        : crypto.randomUUID
        ? crypto.randomUUID()
        : `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // ------------------------------------------------------------------------
    // 4. Cancellation & Disconnect Management (Stage 2B.4C-R2 Lifecycle)
    // ------------------------------------------------------------------------
    let clientDisconnected = false;
    const abortController = new AbortController();

    const isConnectionClosed = () => {
      return (
        clientDisconnected ||
        Boolean(res.writableEnded) ||
        Boolean(res.finished) ||
        Boolean(res.destroyed) ||
        Boolean(res.socket?.destroyed) ||
        (res.socket && res.socket.writable === false)
      );
    };

    const handleDisconnect = (reason) => {
      // A normally completed response must not trigger cancellation
      if (res.writableEnded || res.finished) {
        return;
      }
      if (!abortController.signal.aborted) {
        abortController.abort(reason);
      }
    };

    const onResClose = () => {
      // res emits "close" when the underlying HTTP connection terminates.
      // If res.writableEnded is false, the connection was severed prematurely.
      if (!res.writableEnded && !res.finished) {
        clientDisconnected = true;
        handleDisconnect(new Error("Client disconnected before response completed"));
      }
    };

    const onReqAborted = () => {
      // req emits "aborted" if client aborts incoming request stream.
      clientDisconnected = true;
      handleDisconnect(new Error("Client aborted incoming request"));
    };

    if (typeof res.on === "function") {
      res.on("close", onResClose);
    }
    if (typeof req.on === "function") {
      req.on("aborted", onReqAborted);
    }
    if (req.aborted) {
      clientDisconnected = true;
      handleDisconnect(new Error("Client request was already aborted"));
    }

    const cleanupListeners = () => {
      if (typeof res.removeListener === "function") {
        res.removeListener("close", onResClose);
      } else if (typeof res.off === "function") {
        res.off("close", onResClose);
      }

      if (typeof req.removeListener === "function") {
        req.removeListener("aborted", onReqAborted);
      } else if (typeof req.off === "function") {
        req.off("aborted", onReqAborted);
      }
    };

    const assessmentRequest = {
      correlationId,
      candidateProfile,
      pipelineTelemetry,
      options: {
        ...(effectiveTimeoutMs ? { timeoutMs: effectiveTimeoutMs } : {}),
        signal: abortController.signal,
      },
    };

    // ------------------------------------------------------------------------
    // 5. Invoke CareerStrategistService Orchestration Layer
    // ------------------------------------------------------------------------
    try {
      const assessmentResponse = await careerStrategistService.generateCareerStrategy(
        assessmentRequest,
        {
          ...(effectiveTimeoutMs ? { timeoutMs: effectiveTimeoutMs } : {}),
          signal: abortController.signal,
        }
      );

      if (isConnectionClosed()) {
        return;
      }

      return res.status(200).json(assessmentResponse);
    } catch (err) {
      // ----------------------------------------------------------------------
      // 6. Sanitized HTTP Error Mapping
      // ----------------------------------------------------------------------
      if (isConnectionClosed()) {
        return;
      }

      // Client Disconnection / Cancellation
      if (err instanceof AiCancellationError || err.code === AI_ERROR_CODES.CANCELLATION || abortController.signal.aborted) {
        return res.status(499).json({ message: "Assessment request cancelled" });
      }

      // Request Structure / Configuration Error
      if (err instanceof AiConfigurationError || err.code === AI_ERROR_CODES.CONFIGURATION_ERROR) {
        if (err.diagnosticContext?.reason === "INVALID_REQUEST_STRUCTURE") {
          return res.status(400).json({
            message: "Invalid assessment request structure",
            details: err.message,
          });
        }
        return res.status(500).json({ message: "Internal assessment configuration error" });
      }

      // Provider Rate Limit
      if (err instanceof AiRateLimitError || err.code === AI_ERROR_CODES.RATE_LIMITED) {
        return res.status(429).json({
          message: "AI provider rate limit reached. Please retry shortly.",
        });
      }

      // Provider Timeout
      if (err instanceof AiTimeoutError || err.code === AI_ERROR_CODES.TIMEOUT || err.code === AI_ERROR_CODES.GATEWAY_TIMEOUT) {
        return res.status(504).json({
          message: "Career assessment generation timed out",
        });
      }

      // Evidence Validation Failure (Unsupported Claims / Model Hallucinations)
      if (err instanceof AiSchemaValidationError || err.code === AI_ERROR_CODES.SCHEMA_VALIDATION_ERROR) {
        return res.status(502).json({
          message: "AI provider returned unsupported or ungrounded assessment",
        });
      }

      // Model Malformed JSON
      if (err instanceof AiModelFailureError || err.code === AI_ERROR_CODES.MODEL_FAILURE) {
        return res.status(502).json({
          message: "AI provider returned malformed response",
        });
      }

      // Authentication Defect
      if (err instanceof AiAuthenticationError || err.code === AI_ERROR_CODES.AUTHENTICATION_ERROR) {
        console.error("[CareerStrategistController] AI Provider authentication defect");
        return res.status(500).json({ message: "AI provider authentication failed" });
      }

      // Unhandled / Internal Failure
      console.error("[CareerStrategistController] Unhandled error:", err.message);
      return res.status(500).json({
        message: "Failed to generate career strategy assessment",
      });
    } finally {
      cleanupListeners();
    }
  }

  return {
    generateAssessment,
  };
}

// Default controller instance (lazy-initialized to avoid side-effects upon require)
let _defaultController = null;
function getDefaultController() {
  if (!_defaultController) {
    _defaultController = createCareerStrategistController();
  }
  return _defaultController;
}

const defaultGenerateAssessment = (req, res, next) => {
  return getDefaultController().generateAssessment(req, res, next);
};

module.exports = {
  createCareerStrategistController,
  generateAssessment: defaultGenerateAssessment,
  calculateYearsOfExperienceFromHistory,
};
