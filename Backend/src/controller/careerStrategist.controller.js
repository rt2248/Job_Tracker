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
  AiGatewayTimeoutError,
  AiBadGatewayError,
  AiCapacityError,
  AiRateLimitError,
  AiQuotaExhaustedError,
  AiNetworkError,
  AiAuthenticationError,
  AiConfigurationError,
  AiContextWindowExceededError,
  AiSchemaValidationError,
  AiModelFailureError,
  AI_ERROR_CODES,
} = require("../services/ai/contracts/errors");

/**
 * Resolves a single request-scoped correlation identifier at controller entry.
 * Reuses an explicit request/assessment correlation ID when provided; otherwise
 * generates one deterministic UUID/fallback ID reused across success or error paths.
 *
 * @param {Object} req
 * @returns {string}
 */
function resolveCorrelationId(req) {
  const candidates = [
    req?.body?.correlationId,
    req?.correlationId,
    req?.headers?.["x-correlation-id"],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed.slice(0, 128);
      }
    }
  }

  return crypto.randomUUID
    ? crypto.randomUUID()
    : `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sends a standardized, backward-compatible error envelope while preserving
 * top-level `message` alongside structured `correlationId` and `error`.
 *
 * @param {Object} res
 * @param {Object} params
 * @param {number} params.status
 * @param {string} params.code
 * @param {string} params.message
 * @param {string} params.correlationId
 * @param {Object} [params.details]
 */
function sendErrorResponse(res, { status, code, message, correlationId, details }) {
  const errorPayload = {
    code,
    message,
  };

  if (details !== undefined && details !== null) {
    errorPayload.details = details;
  }

  return res.status(status).json({
    message,
    correlationId,
    error: errorPayload,
  });
}

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
    // Establish a single request-scoped correlation ID reused across success and all error branches
    const correlationId = resolveCorrelationId(req);

    // ------------------------------------------------------------------------
    // 1. Identity & Authorization Verification
    // ------------------------------------------------------------------------
    const userId = req.user?.userId;
    if (!userId) {
      return sendErrorResponse(res, {
        status: 401,
        code: "AUTHENTICATION_REQUIRED",
        message: "No token provided or invalid session",
        correlationId,
      });
    }

    // Explicit cross-user spoof protection: reject attempts to override authenticated ID
    const spoofAttempt =
      (req.body?.userId && req.body.userId !== userId) ||
      (req.body?.user_id && req.body.user_id !== userId);

    if (spoofAttempt) {
      return sendErrorResponse(res, {
        status: 403,
        code: "FORBIDDEN",
        message: "Unauthorized: Client cannot override authenticated user identity",
        correlationId,
      });
    }

    // ------------------------------------------------------------------------
    // 2. Client Parameter Validation
    // ------------------------------------------------------------------------
    let clientYoe = null;
    if (req.body?.yearsOfExperience !== undefined && req.body?.yearsOfExperience !== null) {
      const parsedYoe = Number(req.body.yearsOfExperience);
      if (!Number.isFinite(parsedYoe) || parsedYoe < 0 || parsedYoe > 70) {
        return sendErrorResponse(res, {
          status: 400,
          code: "INVALID_REQUEST",
          message: "Invalid yearsOfExperience. Must be a finite non-negative number between 0 and 70.",
          correlationId,
          details: {
            field: "yearsOfExperience",
            constraint: "Must be a finite non-negative number between 0 and 70",
          },
        });
      }
      clientYoe = parsedYoe;
    }

    let effectiveTimeoutMs;
    if (req.body?.options?.timeoutMs !== undefined) {
      const parsedTimeout = Number(req.body.options.timeoutMs);
      if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0 || parsedTimeout > 120000) {
        return sendErrorResponse(res, {
          status: 400,
          code: "INVALID_REQUEST",
          message: "Invalid options.timeoutMs. Must be a positive integer <= 120,000 ms.",
          correlationId,
          details: {
            field: "options.timeoutMs",
            constraint: "Must be a positive integer <= 120,000 ms",
          },
        });
      }
      effectiveTimeoutMs = parsedTimeout;
    }

    if (req.body?.targetRoles !== undefined && !Array.isArray(req.body.targetRoles)) {
      return sendErrorResponse(res, {
        status: 400,
        code: "INVALID_REQUEST",
        message: "Invalid targetRoles. Must be an array of role titles.",
        correlationId,
        details: {
          field: "targetRoles",
          constraint: "Must be an array of role titles",
        },
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
      return sendErrorResponse(res, {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve candidate profile and pipeline telemetry",
        correlationId,
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
      if (
        err instanceof AiCancellationError ||
        err?.code === AI_ERROR_CODES.CANCELLATION ||
        abortController.signal.aborted
      ) {
        return sendErrorResponse(res, {
          status: 499,
          code: "ABORTED",
          message: "Assessment request cancelled",
          correlationId,
        });
      }

      // Prompt Context Window Exceeded
      if (
        err instanceof AiContextWindowExceededError ||
        err?.code === AI_ERROR_CODES.CONTEXT_WINDOW_EXCEEDED
      ) {
        return sendErrorResponse(res, {
          status: 400,
          code: "CONTEXT_WINDOW_EXCEEDED",
          message: "Assessment prompt exceeds the AI model context window",
          correlationId,
        });
      }

      // Request Structure / Configuration Error
      if (err instanceof AiConfigurationError || err?.code === AI_ERROR_CODES.CONFIGURATION_ERROR) {
        if (err?.diagnosticContext?.reason === "INVALID_REQUEST_STRUCTURE") {
          return sendErrorResponse(res, {
            status: 400,
            code: "INVALID_REQUEST",
            message: "Invalid assessment request structure",
            correlationId,
            details: {
              reason: "INVALID_REQUEST_STRUCTURE",
              ...(typeof err?.message === "string" && err.message.trim().length > 0
                ? { validationError: err.message }
                : {}),
            },
          });
        }
        return sendErrorResponse(res, {
          status: 500,
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal assessment configuration error",
          correlationId,
        });
      }

      // Provider Rate Limit / Quota Exhausted
      if (
        err instanceof AiRateLimitError ||
        err?.code === AI_ERROR_CODES.RATE_LIMITED ||
        err instanceof AiQuotaExhaustedError ||
        err?.code === AI_ERROR_CODES.QUOTA_EXHAUSTED
      ) {
        return sendErrorResponse(res, {
          status: 429,
          code: "RATE_LIMITED",
          message: "AI provider rate limit reached. Please retry shortly.",
          correlationId,
        });
      }

      // Provider Timeout / Gateway Timeout
      if (
        err instanceof AiTimeoutError ||
        err?.code === AI_ERROR_CODES.TIMEOUT ||
        err instanceof AiGatewayTimeoutError ||
        err?.code === AI_ERROR_CODES.GATEWAY_TIMEOUT
      ) {
        return sendErrorResponse(res, {
          status: 504,
          code: "TIMEOUT",
          message: "Career assessment generation timed out",
          correlationId,
        });
      }

      // Evidence Validation Failure (Unsupported Claims / Model Hallucinations)
      if (
        err instanceof AiSchemaValidationError ||
        err?.code === AI_ERROR_CODES.SCHEMA_VALIDATION_ERROR
      ) {
        return sendErrorResponse(res, {
          status: 502,
          code: "SCHEMA_VALIDATION_ERROR",
          message: "AI provider returned unsupported or ungrounded assessment",
          correlationId,
        });
      }

      // Model Malformed JSON / Unparseable Completion
      if (err instanceof AiModelFailureError || err?.code === AI_ERROR_CODES.MODEL_FAILURE) {
        return sendErrorResponse(res, {
          status: 502,
          code: "MODEL_FAILURE",
          message: "AI provider returned malformed response",
          correlationId,
        });
      }

      // Upstream Capacity Unavailable
      if (
        err instanceof AiCapacityError ||
        err?.code === AI_ERROR_CODES.CAPACITY_UNAVAILABLE
      ) {
        return sendErrorResponse(res, {
          status: 503,
          code: "UPSTREAM_UNAVAILABLE",
          message: "AI provider is temporarily unavailable. Please retry shortly.",
          correlationId,
        });
      }

      // Upstream Bad Gateway / Network Error
      if (
        err instanceof AiBadGatewayError ||
        err?.code === AI_ERROR_CODES.BAD_GATEWAY ||
        err instanceof AiNetworkError ||
        err?.code === AI_ERROR_CODES.NETWORK_ERROR
      ) {
        return sendErrorResponse(res, {
          status: 502,
          code: "UPSTREAM_UNAVAILABLE",
          message: "AI provider gateway or network communication failed",
          correlationId,
        });
      }

      // Authentication Defect
      if (
        err instanceof AiAuthenticationError ||
        err?.code === AI_ERROR_CODES.AUTHENTICATION_ERROR
      ) {
        console.error("[CareerStrategistController] AI Provider authentication defect");
        return sendErrorResponse(res, {
          status: 500,
          code: "INTERNAL_SERVER_ERROR",
          message: "AI provider authentication failed",
          correlationId,
        });
      }

      // Unhandled / Internal Failure
      console.error("[CareerStrategistController] Unhandled error:", err?.message || String(err));
      return sendErrorResponse(res, {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate career strategy assessment",
        correlationId,
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
