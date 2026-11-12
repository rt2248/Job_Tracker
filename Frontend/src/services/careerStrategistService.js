import { getApiUrl } from "../utils/config.js";

const BASE_URL = getApiUrl("/api/career-strategist/assessment");

/**
 * Standard error codes mapped from backend API responses.
 */
export const CAREER_STRATEGIST_ERROR_CODES = {
  INVALID_REQUEST: "INVALID_REQUEST",
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  RATE_LIMITED: "RATE_LIMITED",
  ABORTED: "ABORTED",
  SCHEMA_VALIDATION_ERROR: "SCHEMA_VALIDATION_ERROR",
  MODEL_FAILURE: "MODEL_FAILURE",
  CONTEXT_WINDOW_EXCEEDED: "CONTEXT_WINDOW_EXCEEDED",
  UPSTREAM_UNAVAILABLE: "UPSTREAM_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

const RECOGNIZED_SERVER_ERROR_CODES = Object.freeze({
  [CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST]: CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST,
  [CAREER_STRATEGIST_ERROR_CODES.AUTHENTICATION_REQUIRED]:
    CAREER_STRATEGIST_ERROR_CODES.AUTHENTICATION_REQUIRED,
  [CAREER_STRATEGIST_ERROR_CODES.FORBIDDEN]: CAREER_STRATEGIST_ERROR_CODES.FORBIDDEN,
  [CAREER_STRATEGIST_ERROR_CODES.RATE_LIMITED]: CAREER_STRATEGIST_ERROR_CODES.RATE_LIMITED,
  [CAREER_STRATEGIST_ERROR_CODES.ABORTED]: CAREER_STRATEGIST_ERROR_CODES.ABORTED,
  [CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR]:
    CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
  [CAREER_STRATEGIST_ERROR_CODES.MODEL_FAILURE]: CAREER_STRATEGIST_ERROR_CODES.MODEL_FAILURE,
  [CAREER_STRATEGIST_ERROR_CODES.CONTEXT_WINDOW_EXCEEDED]:
    CAREER_STRATEGIST_ERROR_CODES.CONTEXT_WINDOW_EXCEEDED,
  [CAREER_STRATEGIST_ERROR_CODES.UPSTREAM_UNAVAILABLE]:
    CAREER_STRATEGIST_ERROR_CODES.UPSTREAM_UNAVAILABLE,
  [CAREER_STRATEGIST_ERROR_CODES.TIMEOUT]: CAREER_STRATEGIST_ERROR_CODES.TIMEOUT,
  [CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR]:
    CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR,
  [CAREER_STRATEGIST_ERROR_CODES.NETWORK_ERROR]: CAREER_STRATEGIST_ERROR_CODES.NETWORK_ERROR,
  AI_SCHEMA_VALIDATION_ERROR: CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
  AI_MODEL_FAILURE: CAREER_STRATEGIST_ERROR_CODES.MODEL_FAILURE,
  AI_CONTEXT_WINDOW_EXCEEDED: CAREER_STRATEGIST_ERROR_CODES.CONTEXT_WINDOW_EXCEEDED,
  AI_RATE_LIMITED: CAREER_STRATEGIST_ERROR_CODES.RATE_LIMITED,
  AI_QUOTA_EXHAUSTED: CAREER_STRATEGIST_ERROR_CODES.RATE_LIMITED,
  AI_TIMEOUT: CAREER_STRATEGIST_ERROR_CODES.TIMEOUT,
  AI_GATEWAY_TIMEOUT: CAREER_STRATEGIST_ERROR_CODES.TIMEOUT,
  AI_CANCELLATION: CAREER_STRATEGIST_ERROR_CODES.ABORTED,
  AI_CAPACITY_UNAVAILABLE: CAREER_STRATEGIST_ERROR_CODES.UPSTREAM_UNAVAILABLE,
  AI_BAD_GATEWAY: CAREER_STRATEGIST_ERROR_CODES.UPSTREAM_UNAVAILABLE,
  AI_NETWORK_ERROR: CAREER_STRATEGIST_ERROR_CODES.NETWORK_ERROR,
});

const DEFAULT_MESSAGES_BY_CODE = Object.freeze({
  [CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST]: "Invalid assessment request parameters.",
  [CAREER_STRATEGIST_ERROR_CODES.AUTHENTICATION_REQUIRED]:
    "Authentication required. Please sign in again.",
  [CAREER_STRATEGIST_ERROR_CODES.FORBIDDEN]:
    "Access forbidden. Explicit user identification is not permitted.",
  [CAREER_STRATEGIST_ERROR_CODES.RATE_LIMITED]:
    "Rate limit exceeded. Career assessments are limited to 10 requests per 15-minute window. Please wait a moment before trying again.",
  [CAREER_STRATEGIST_ERROR_CODES.ABORTED]: "The assessment request was cancelled.",
  [CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR]:
    "The AI provider returned an ungrounded or structurally invalid assessment. Please retry.",
  [CAREER_STRATEGIST_ERROR_CODES.MODEL_FAILURE]:
    "The AI provider returned a malformed or unparseable response. Please retry.",
  [CAREER_STRATEGIST_ERROR_CODES.CONTEXT_WINDOW_EXCEEDED]:
    "Assessment prompt exceeds the AI model context window.",
  [CAREER_STRATEGIST_ERROR_CODES.UPSTREAM_UNAVAILABLE]:
    "The AI service is temporarily unavailable. Please try again shortly.",
  [CAREER_STRATEGIST_ERROR_CODES.TIMEOUT]: "The assessment request timed out. Please try again.",
  [CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR]:
    "An unexpected error occurred while generating your career assessment.",
  [CAREER_STRATEGIST_ERROR_CODES.UNKNOWN_ERROR]:
    "An unexpected error occurred while processing your career assessment.",
});

/**
 * Normalizes a potentially unstructured JSON payload into a plain object.
 *
 * @param {any} value
 * @returns {Object}
 */
function normalizePlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

/**
 * Extracts a safe correlationId string from structured or legacy error envelopes.
 *
 * @param {Object} safeData
 * @param {Object|null} serverError
 * @returns {string|null}
 */
function extractCorrelationId(safeData, serverError) {
  const candidates = [safeData.correlationId, serverError?.correlationId];
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
}

/**
 * Extracts optional validation/error details safely from `error.details` or legacy `details`.
 *
 * @param {Object} safeData
 * @param {Object|null} serverError
 * @returns {Object|Array|string|null}
 */
function extractErrorDetails(safeData, serverError) {
  const candidate =
    serverError && serverError.details !== undefined ? serverError.details : safeData.details;

  if (candidate === undefined || candidate === null) {
    return null;
  }

  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(candidate)) {
    return candidate.length > 0 ? [...candidate] : null;
  }

  if (typeof candidate === "object") {
    return Object.keys(candidate).length > 0 ? { ...candidate } : null;
  }

  return null;
}

/**
 * Status-based fallback classification strictly for legacy or unstructured responses.
 *
 * @param {number} status
 * @returns {string}
 */
function mapStatusToFallbackCode(status) {
  switch (status) {
    case 400:
      return CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST;
    case 401:
      return CAREER_STRATEGIST_ERROR_CODES.AUTHENTICATION_REQUIRED;
    case 403:
      return CAREER_STRATEGIST_ERROR_CODES.FORBIDDEN;
    case 429:
      return CAREER_STRATEGIST_ERROR_CODES.RATE_LIMITED;
    case 499:
      return CAREER_STRATEGIST_ERROR_CODES.ABORTED;
    case 502:
      return CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR;
    case 503:
      return CAREER_STRATEGIST_ERROR_CODES.UPSTREAM_UNAVAILABLE;
    case 504:
      return CAREER_STRATEGIST_ERROR_CODES.TIMEOUT;
    default:
      return CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Custom Error class for Career Strategist API failures.
 */
export class CareerStrategistError extends Error {
  constructor(message, { code = "UNKNOWN_ERROR", status = 0, correlationId = null, details = null } = {}) {
    super(message);
    this.name = "CareerStrategistError";
    this.code = code;
    this.status = status;
    this.correlationId = correlationId;
    this.details = details;
  }
}

/**
 * Maps structured or legacy backend error responses to canonical client error codes,
 * safe messages, correlation IDs, and validation details.
 *
 * Precedence:
 * 1. When backend provides a non-empty `error.code`:
 *    - If recognized (or canonical AI_* alias), map to canonical code directly.
 *    - Never drop recognized `error.code` (e.g. 502 `MODEL_FAILURE`) into status fallback
 *      even when `error.message` is absent.
 *    - If unrecognized, classify as `UNKNOWN_ERROR` rather than silently mislabeling.
 * 2. When `error.code` is absent or malformed (legacy `{ message }` or raw proxy body),
 *    preserve HTTP status fallback mapping.
 *
 * @param {number} status
 * @param {any} [responseData]
 * @returns {{ code: string, message: string, correlationId: string|null, details: any }}
 */
function mapStatusToError(status, responseData = {}) {
  const safeData = normalizePlainObject(responseData);
  const serverError =
    safeData.error && typeof safeData.error === "object" && !Array.isArray(safeData.error)
      ? safeData.error
      : null;

  const rawServerMessage =
    typeof serverError?.message === "string" && serverError.message.trim().length > 0
      ? serverError.message.trim()
      : typeof safeData.message === "string" && safeData.message.trim().length > 0
      ? safeData.message.trim()
      : null;

  const rawServerCode = typeof serverError?.code === "string" ? serverError.code.trim() : "";

  const correlationId = extractCorrelationId(safeData, serverError);
  const details = extractErrorDetails(safeData, serverError);

  if (rawServerCode.length > 0) {
    const recognizedCode = RECOGNIZED_SERVER_ERROR_CODES[rawServerCode.toUpperCase()] || null;
    if (recognizedCode) {
      return {
        code: recognizedCode,
        message:
          rawServerMessage ||
          DEFAULT_MESSAGES_BY_CODE[recognizedCode] ||
          DEFAULT_MESSAGES_BY_CODE[CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR],
        correlationId,
        details,
      };
    }

    return {
      code: CAREER_STRATEGIST_ERROR_CODES.UNKNOWN_ERROR,
      message:
        rawServerMessage || DEFAULT_MESSAGES_BY_CODE[CAREER_STRATEGIST_ERROR_CODES.UNKNOWN_ERROR],
      correlationId,
      details,
    };
  }

  const fallbackCode = mapStatusToFallbackCode(status);
  return {
    code: fallbackCode,
    message:
      rawServerMessage ||
      DEFAULT_MESSAGES_BY_CODE[fallbackCode] ||
      DEFAULT_MESSAGES_BY_CODE[CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR],
    correlationId,
    details,
  };
}

/**
 * Generates an evidence-grounded Career Strategist assessment from the backend API.
 *
 * CRITICAL INVARIANT: Never send `userId` in the request body. Identity is authoritatively
 * derived from the authenticated JWT session on the backend.
 *
 * @param {Object} [options]
 * @param {string[]} [options.targetRoles] - Optional target roles overriding profile defaults
 * @param {number} [options.yearsOfExperience] - Optional years of experience (0-70)
 * @param {string} [options.userNotes] - Optional candidate notes (max 1000 characters)
 * @param {AbortSignal} [options.signal] - AbortSignal for user cancellation
 * @returns {Promise<Object>} Assessment response payload
 * @throws {CareerStrategistError}
 */
export async function generateCareerAssessment({
  targetRoles,
  yearsOfExperience,
  userNotes,
  signal,
} = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new CareerStrategistError("Authentication token not found. Please log in.", {
      code: CAREER_STRATEGIST_ERROR_CODES.AUTHENTICATION_REQUIRED,
      status: 401,
    });
  }

  // Construct request payload cleanly; omit undefined fields
  const payload = {};

  if (Array.isArray(targetRoles) && targetRoles.length > 0) {
    payload.targetRoles = targetRoles.filter((r) => typeof r === "string" && r.trim().length > 0);
  }

  if (typeof yearsOfExperience === "number" && !Number.isNaN(yearsOfExperience)) {
    if (yearsOfExperience < 0 || yearsOfExperience > 70) {
      throw new CareerStrategistError("Years of experience must be between 0 and 70.", {
        code: CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST,
        status: 400,
      });
    }
    payload.yearsOfExperience = yearsOfExperience;
  }

  if (typeof userNotes === "string" && userNotes.trim().length > 0) {
    const trimmedNotes = userNotes.trim();
    if (trimmedNotes.length > 1000) {
      throw new CareerStrategistError("User notes must not exceed 1000 characters.", {
        code: CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST,
        status: 400,
      });
    }
    payload.userNotes = trimmedNotes;
  }

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    let data;
    try {
      data = typeof response?.json === "function" ? await response.json() : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const mapped = mapStatusToError(response.status, data);
      throw new CareerStrategistError(mapped.message, {
        code: mapped.code,
        status: response.status,
        correlationId: mapped.correlationId,
        details: mapped.details,
      });
    }

    const safeSuccessData = normalizePlainObject(data);
    if (!safeSuccessData.success) {
      const mapped = mapStatusToError(response.status, safeSuccessData);
      const serverError =
        safeSuccessData.error && typeof safeSuccessData.error === "object"
          ? safeSuccessData.error
          : null;
      const hasExplicitMessage =
        (typeof serverError?.message === "string" && serverError.message.trim().length > 0) ||
        (typeof safeSuccessData.message === "string" && safeSuccessData.message.trim().length > 0);

      throw new CareerStrategistError(
        hasExplicitMessage ? mapped.message : "Assessment response indicated failure.",
        {
          code: mapped.code,
          status: response.status,
          correlationId: mapped.correlationId,
          details: mapped.details,
        }
      );
    }

    return data;
  } catch (err) {
    if (err instanceof CareerStrategistError) {
      throw err;
    }

    if (err.name === "AbortError" || signal?.aborted) {
      throw new CareerStrategistError("Assessment generation was cancelled.", {
        code: CAREER_STRATEGIST_ERROR_CODES.ABORTED,
        status: 499,
      });
    }

    throw new CareerStrategistError(
      err.message || "Network error occurred while connecting to Career Strategist service.",
      {
        code: CAREER_STRATEGIST_ERROR_CODES.NETWORK_ERROR,
        status: 0,
      }
    );
  }
}
