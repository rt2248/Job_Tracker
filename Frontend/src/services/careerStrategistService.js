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
  UPSTREAM_UNAVAILABLE: "UPSTREAM_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
};

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
 * Maps HTTP status codes to user-friendly messages and canonical error codes.
 *
 * @param {number} status
 * @param {Object} [responseData]
 * @returns {{ code: string, message: string }}
 */
function mapStatusToError(status, responseData = {}) {
  const serverError = responseData?.error;
  const serverCode = serverError?.code;
  const serverMessage = serverError?.message || responseData?.message;

  if (serverMessage && serverCode) {
    return { code: serverCode, message: serverMessage };
  }

  switch (status) {
    case 400:
      return {
        code: CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST,
        message: serverMessage || "Invalid assessment request parameters.",
      };
    case 401:
      return {
        code: CAREER_STRATEGIST_ERROR_CODES.AUTHENTICATION_REQUIRED,
        message: serverMessage || "Authentication required. Please sign in again.",
      };
    case 403:
      return {
        code: CAREER_STRATEGIST_ERROR_CODES.FORBIDDEN,
        message: serverMessage || "Access forbidden. Explicit user identification is not permitted.",
      };
    case 429:
      return {
        code: CAREER_STRATEGIST_ERROR_CODES.RATE_LIMITED,
        message:
          serverMessage ||
          "Rate limit exceeded. Career assessments are limited to 10 requests per 15-minute window. Please wait a moment before trying again.",
      };
    case 499:
      return {
        code: CAREER_STRATEGIST_ERROR_CODES.ABORTED,
        message: serverMessage || "The assessment request was cancelled.",
      };
    case 502:
      return {
        code: CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR,
        message:
          serverMessage ||
          "The AI provider returned an ungrounded or structurally invalid assessment. Please retry.",
      };
    case 504:
      return {
        code: CAREER_STRATEGIST_ERROR_CODES.TIMEOUT,
        message: serverMessage || "The assessment request timed out. Please try again.",
      };
    case 503:
      return {
        code: CAREER_STRATEGIST_ERROR_CODES.UPSTREAM_UNAVAILABLE,
        message: serverMessage || "The AI service is temporarily unavailable. Please try again shortly.",
      };
    default:
      return {
        code: CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: serverMessage || "An unexpected error occurred while generating your career assessment.",
      };
  }
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
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const { code, message } = mapStatusToError(response.status, data);
      throw new CareerStrategistError(message, {
        code,
        status: response.status,
        correlationId: data?.correlationId || null,
        details: data?.error?.details || null,
      });
    }

    if (!data || !data.success) {
      throw new CareerStrategistError(data?.error?.message || "Assessment response indicated failure.", {
        code: data?.error?.code || CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR,
        status: response.status,
        correlationId: data?.correlationId || null,
      });
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
