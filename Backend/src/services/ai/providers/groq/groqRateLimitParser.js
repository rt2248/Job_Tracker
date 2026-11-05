/**
 * @file groqRateLimitParser.js
 * @description Rate limit telemetry parser and 429 error classifier for GroqCloud API responses.
 *
 * Stage 2B.2 — Option C Provider Abstraction Foundation.
 *
 * Rules:
 * 1. Handle missing, empty, or malformed headers gracefully (returns null/unavailable, never crashes).
 * 2. Parse reset duration strings (e.g., "2s", "1m30s", "120ms") to milliseconds deterministically.
 * 3. Distinguish transient TPM/RPM limits from explicit daily or credit quota exhaustion.
 * 4. Never classify an ambiguous 429 as daily quota exhaustion without explicit evidence.
 * 5. Strip documentation URLs before keyword scanning to prevent false-positive quota claims.
 * 6. Zero network requests.
 */

const { AI_ERROR_CODES } = require("../../contracts/errors/AiError");

/**
 * Parses Groq reset duration strings (e.g. "6m0s", "1m30s", "2s", "500ms", "1500") into milliseconds.
 *
 * @param {string|number|null|undefined} timeStr
 * @returns {number|null} Milliseconds or null if invalid/unavailable.
 */
function parseResetTimeToMs(timeStr) {
  if (timeStr === null || timeStr === undefined) return null;
  if (typeof timeStr === "number") {
    return Number.isFinite(timeStr) && timeStr >= 0 ? Math.round(timeStr * 1000) : null;
  }

  const str = String(timeStr).trim().toLowerCase();
  if (!str || str === "unavailable" || str === "unknown") return null;

  // Raw numeric string (e.g., "5" -> 5000ms)
  if (/^\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    return Number.isFinite(num) && num >= 0 ? Math.round(num * 1000) : null;
  }

  // Explicit millisecond format (e.g., "500ms")
  const msMatch = str.match(/^(\d+(?:\.\d+)?)ms$/);
  if (msMatch) {
    const ms = parseFloat(msMatch[1]);
    return Number.isFinite(ms) && ms >= 0 ? Math.round(ms) : null;
  }

  let totalMs = 0;
  let matched = false;

  const hoursMatch = str.match(/(\d+(?:\.\d+)?)h/);
  if (hoursMatch) {
    totalMs += parseFloat(hoursMatch[1]) * 3600 * 1000;
    matched = true;
  }

  const minsMatch = str.match(/(\d+(?:\.\d+)?)m(?!s)/);
  if (minsMatch) {
    totalMs += parseFloat(minsMatch[1]) * 60 * 1000;
    matched = true;
  }

  const secsMatch = str.match(/(\d+(?:\.\d+)?)s/);
  if (secsMatch) {
    totalMs += parseFloat(secsMatch[1]) * 1000;
    matched = true;
  }

  return matched && Number.isFinite(totalMs) ? Math.round(totalMs) : null;
}

/**
 * Extracts normalized integer value from header.
 *
 * @param {string|number|null|undefined} val
 * @returns {number|null}
 */
function parseHeaderInt(val) {
  if (val === null || val === undefined) return null;
  const num = parseInt(val, 10);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

/**
 * Safely extracts header by case-insensitive name from Headers instance, Map, or plain object.
 *
 * @param {any} headers
 * @param {string} name
 * @returns {string|null}
 */
function getHeaderCaseInsensitive(headers, name) {
  if (!headers || typeof headers !== "object") return null;

  // Fetch Headers instance
  if (typeof headers.get === "function") {
    return headers.get(name) || headers.get(name.toLowerCase());
  }

  // Plain object
  const target = name.toLowerCase();
  for (const [key, val] of Object.entries(headers)) {
    if (key.toLowerCase() === target) {
      return val !== null && val !== undefined ? String(val) : null;
    }
  }

  return null;
}

/**
 * Parses Groq standard rate limit headers.
 *
 * @param {any} headers - Headers object or plain object from HTTP response.
 * @returns {import('../../contracts/dtos/RawProviderAssessmentOutput.dto').ProviderRateLimitTelemetry}
 */
function parseGroqRateLimitHeaders(headers) {
  if (!headers || typeof headers !== "object") {
    return {
      limitRequests: null,
      remainingRequests: null,
      resetRequestsMs: null,
      limitTokens: null,
      remainingTokens: null,
      resetTokensMs: null,
    };
  }

  const limitRequests = parseHeaderInt(getHeaderCaseInsensitive(headers, "x-ratelimit-limit-requests"));
  const remainingRequests = parseHeaderInt(getHeaderCaseInsensitive(headers, "x-ratelimit-remaining-requests"));
  const resetRequestsMs = parseResetTimeToMs(getHeaderCaseInsensitive(headers, "x-ratelimit-reset-requests"));

  const limitTokens = parseHeaderInt(getHeaderCaseInsensitive(headers, "x-ratelimit-limit-tokens"));
  const remainingTokens = parseHeaderInt(getHeaderCaseInsensitive(headers, "x-ratelimit-remaining-tokens"));
  const resetTokensMs = parseResetTimeToMs(getHeaderCaseInsensitive(headers, "x-ratelimit-reset-tokens"));

  return {
    limitRequests,
    remainingRequests,
    resetRequestsMs,
    limitTokens,
    remainingTokens,
    resetTokensMs,
  };
}

/**
 * Strips URLs from error messages to prevent links to documentation or pricing pages
 * from falsely triggering keyword searches (e.g., "docs/rate-limits" or "pricing/daily-quota").
 *
 * @param {string} text
 * @returns {string}
 */
function stripUrls(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/https?:\/\/[^\s"'<>]+/gi, " ");
}

/**
 * Classifies an HTTP 429 response into RATE_LIMITED (transient TPM/RPM)
 * versus QUOTA_EXHAUSTED (daily request/token ceiling or billing exhaustion).
 *
 * Invariant: Never classify an ambiguous 429 as QUOTA_EXHAUSTED without explicit evidence.
 *
 * @param {number} statusCode - HTTP status code (expected 429).
 * @param {any} errorBody - Response body string or parsed JSON object.
 * @param {any} [headers] - Response headers if available.
 * @returns {{ code: string, reason: string, retryAfterMs: number|null }}
 */
function classifyGroq429Error(statusCode, errorBody, headers = null) {
  let messageText = "";
  let errorObject = null;

  if (typeof errorBody === "string") {
    try {
      errorObject = JSON.parse(errorBody);
      messageText = errorObject?.error?.message || errorBody;
    } catch {
      messageText = errorBody;
    }
  } else if (errorBody && typeof errorBody === "object") {
    errorObject = errorBody;
    messageText = errorBody.error?.message || errorBody.message || JSON.stringify(errorBody);
  }

  // Strip documentation URLs to prevent false positive keyword matching
  const cleanedText = stripUrls(messageText).toLowerCase();

  // Parse Retry-After header for cooldown guidance
  let retryAfterMs = null;
  if (headers) {
    const retryAfterHeader = getHeaderCaseInsensitive(headers, "retry-after");
    if (retryAfterHeader) {
      retryAfterMs = parseResetTimeToMs(retryAfterHeader);
    }
    if (!retryAfterMs) {
      const resetTokens = getHeaderCaseInsensitive(headers, "x-ratelimit-reset-tokens");
      if (resetTokens) {
        retryAfterMs = parseResetTimeToMs(resetTokens);
      }
    }
  }

  // 1. Explicit Daily or Billing/Credit Exhaustion Indicators
  const dailyIndicators = [
    "daily request limit reached",
    "daily token limit reached",
    "daily quota exceeded",
    "requests per day (rpd)",
    "tokens per day (tpd)",
    "credit balance is too low",
    "insufficient credits",
    "billing quota exceeded",
    "quota exceeded for today",
    "organization has exceeded its daily limit",
  ];

  const hasExplicitDailyQuota = dailyIndicators.some((indicator) => cleanedText.includes(indicator));
  if (hasExplicitDailyQuota) {
    return {
      code: AI_ERROR_CODES.QUOTA_EXHAUSTED,
      reason: "Explicit daily or billing quota exhausted",
      retryAfterMs,
    };
  }

  // 2. Explicit Transient RPM / TPM Indicators
  const transientIndicators = [
    "tokens per minute (tpm)",
    "requests per minute (rpm)",
    "tpm limit",
    "rpm limit",
    "rate limit reached for model",
    "please try again in",
  ];

  const hasTransientRateLimit = transientIndicators.some((indicator) => cleanedText.includes(indicator));
  if (hasTransientRateLimit) {
    return {
      code: AI_ERROR_CODES.RATE_LIMITED,
      reason: "Transient RPM or TPM rate limit exceeded",
      retryAfterMs,
    };
  }

  // 3. Conservative Default: Ambiguous 429 defaults to RATE_LIMITED without false daily quota claims
  return {
    code: AI_ERROR_CODES.RATE_LIMITED,
    reason: "Rate limit exceeded (transient default)",
    retryAfterMs,
  };
}

module.exports = {
  parseResetTimeToMs,
  parseGroqRateLimitHeaders,
  classifyGroq429Error,
};
