/**
 * @file telemetryMinimizer.js
 * @description Deterministic, fail-closed telemetry minimization and PII redaction layer.
 *
 * Stage 2B.3A — Option C Provider Abstraction Foundation.
 *
 * Architecture Invariants:
 * 1. Fail-Closed: Never falls back to raw or partially minimized input under any circumstance.
 * 2. Explicit Allowlisting: Discards all candidate and pipeline telemetry fields not explicitly approved.
 * 3. Comprehensive PII Removal: Scrubs names, emails, phones, locations, IDs, credentials, and attachments.
 * 4. Free-Text Bounds: Clamps notes to 1,000 chars, headlines to 120 chars, and neutralizes prompt injection tags.
 * 5. Immutability: Deeply clones data; never mutates the original request or leaks mutable references.
 * 6. Audit Metadata: Discloses operation flags and key names without leaking removed values or PII.
 */

const { AiConfigurationError } = require("../contracts/errors/AiConfigurationError");
const { registerMinimizedRequest, isVerifiedMinimizedRequest } = require("../contracts/minimizedRequestRegistry");

/**
 * Deeply freezes an object and its nested properties, preventing any mutation.
 * Leaves AbortSignal instances unfrozen.
 *
 * @param {any} obj
 * @returns {any}
 */
function deepFreeze(obj) {
  if (!obj || typeof obj !== "object" || Object.isFrozen(obj)) {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const val = obj[key];
    if (val && typeof val === "object" && !(val instanceof AbortSignal)) {
      deepFreeze(val);
    }
  }
  return obj;
}

/** Maximum total payload size in bytes (256 KB) */
const MAX_PAYLOAD_BYTES = 256 * 1024;

/** Character and element bounds */
const BOUNDS = Object.freeze({
  MAX_HEADLINE_LENGTH: 120,
  MAX_NOTES_LENGTH: 1000,
  MAX_SKILLS_COUNT: 50,
  MAX_SKILL_LENGTH: 40,
  MAX_TARGET_ROLES_COUNT: 10,
  MAX_TARGET_ROLE_LENGTH: 60,
  MAX_STAGE_ENTRIES: 20,
  MAX_EXPERIENCE_YEARS: 70,
  MAX_METRIC_VALUE: 1000000,
});

/**
 * Explicit allowlist of permissible candidateProfile fields.
 */
const ALLOWED_CANDIDATE_KEYS = Object.freeze(
  new Set(["headline", "yearsOfExperience", "declaredSkills", "targetRoles", "userNotes"])
);

/**
 * Disallowed candidate fields that represent known PII, credentials, or irrelevant profile data.
 */
const DISALLOWED_CANDIDATE_PII_KEYS = Object.freeze(
  new Set([
    "id",
    "userId",
    "user_id",
    "accountId",
    "account_id",
    "firstName",
    "first_name",
    "lastName",
    "last_name",
    "middleName",
    "middle_name",
    "fullName",
    "full_name",
    "name",
    "email",
    "emailAddress",
    "email_address",
    "phone",
    "phoneNumber",
    "phone_number",
    "telephone",
    "mobile",
    "cell",
    "address",
    "residentialAddress",
    "residential_address",
    "street",
    "city",
    "state",
    "zip",
    "zipCode",
    "postalCode",
    "country",
    "location",
    "avatar",
    "avatarUrl",
    "avatar_url",
    "socialLinks",
    "social_links",
    "portfolio",
    "portfolio_url",
    "github",
    "github_url",
    "linkedin",
    "linkedin_url",
    "twitter",
    "twitter_url",
    "resume",
    "resumeId",
    "resume_id",
    "resumeFilename",
    "resume_filename",
    "resumePath",
    "resume_path",
    "filePath",
    "file_path",
    "password",
    "password_hash",
    "passwordHash",
    "token",
    "tokenVersion",
    "token_version",
    "createdAt",
    "created_at",
    "updatedAt",
    "updated_at",
    "passwordChangedAt",
    "password_changed_at",
    "isPublicProfile",
    "is_public_profile",
    "visibilitySettings",
    "visibility_settings",
    "ssn",
    "socialSecurityNumber",
    "nationalId",
    "creditCard",
    "billingInfo",
  ])
);

/**
 * Explicit allowlist of permissible pipelineTelemetry fields.
 */
const ALLOWED_TELEMETRY_KEYS = Object.freeze(
  new Set([
    "trackedOpportunities",
    "submittedApplications",
    "savedCount",
    "activeInPipeline",
    "interviewsInProgress",
    "pendingOffers",
    "cumulativeOffers",
    "cumulativeRejections",
    "stageDistribution",
    "staleAlerts",
  ])
);

/**
 * Disallowed pipeline telemetry fields that represent known PII, recruiter data, or database metadata.
 */
const DISALLOWED_TELEMETRY_PII_KEYS = Object.freeze(
  new Set([
    "id",
    "userId",
    "user_id",
    "accountId",
    "account_id",
    "userEmail",
    "user_email",
    "userName",
    "user_name",
    "recruiterName",
    "recruiterEmail",
    "recruiterPhone",
    "recruiterContact",
    "recruiter_info",
    "employerContact",
    "employer_contact",
    "companyNotes",
    "rawNotes",
    "interviewNotes",
    "privateNotes",
    "staleApplications",
    "dailySeries",
    "created_at",
    "updated_at",
    "createdAt",
    "updatedAt",
    "token",
    "sessionId",
    "session_id",
  ])
);

/**
 * Normalizes text, removes control characters, and neutralizes prompt-injection tag delimiters.
 *
 * @param {string} text
 * @returns {string}
 */
function cleanControlCharsAndDelimiters(text) {
  if (!text || typeof text !== "string") return "";

  // 1. Normalize line endings
  let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Remove non-printable control characters (except tab, newline)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Neutralize instruction injection tags (e.g., <system>, <instructions>, <admin>)
  cleaned = cleaned.replace(/<\/?(?:system|instruction|instructions|prompt|admin|context|output)[^>]*>/gi, "[TAG]");

  // 4. Neutralize markdown instruction fences (e.g., ```system, ```instructions)
  cleaned = cleaned.replace(/```(?:system|instruction|prompt)/gi, "```untrusted");

  return cleaned.trim();
}

/**
 * Deterministic PII regex scrubbing for free-text fields.
 *
 * @param {string} text - Raw input text.
 * @param {Set<string>} redactionTypes - Set to record redaction categories (safe audit metadata).
 * @returns {string} Sanitized text with redacted placeholders.
 */
function scrubFreeTextPii(text, redactionTypes) {
  if (!text || typeof text !== "string") return "";

  let result = text;

  // 1. Email Addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(result)) {
    redactionTypes.add("email");
    result = result.replace(emailRegex, "[REDACTED_EMAIL]");
  }

  // 2. Phone Numbers (International, US domestic, labeled phones)
  const phoneLabeledRegex = /(?:\b(?:phone|tel|mobile|cell|fax|contact)[:\s]+)[+\d\s().-]{7,20}\b/gi;
  if (phoneLabeledRegex.test(result)) {
    redactionTypes.add("phone");
    result = result.replace(phoneLabeledRegex, "[REDACTED_PHONE]");
  }

  const phoneStandardRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  if (phoneStandardRegex.test(result)) {
    redactionTypes.add("phone");
    result = result.replace(phoneStandardRegex, "[REDACTED_PHONE]");
  }

  // 3. URLs and Web / Social Media Links
  const urlRegex = /https?:\/\/[^\s"'<>]+|www\.[^\s"'<>]+/gi;
  if (urlRegex.test(result)) {
    redactionTypes.add("url");
    result = result.replace(urlRegex, "[REDACTED_URL]");
  }

  const socialHandleRegex = /(?:github|linkedin|twitter|instagram|facebook)\.com\/[a-zA-Z0-9_.-]+/gi;
  if (socialHandleRegex.test(result)) {
    redactionTypes.add("url");
    result = result.replace(socialHandleRegex, "[REDACTED_URL]");
  }

  // 4. IP Addresses
  const ipRegex = /\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  if (ipRegex.test(result)) {
    redactionTypes.add("ip_address");
    result = result.replace(ipRegex, "[REDACTED_IP]");
  }

  // 5. Street / Physical Addresses
  const streetRegex = /\b\d{1,5}\s+[A-Za-z0-9.\s]{2,25}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Terrace|Ter|Place|Pl|Square|Sq)\b/gi;
  if (streetRegex.test(result)) {
    redactionTypes.add("physical_address");
    result = result.replace(streetRegex, "[REDACTED_ADDRESS]");
  }

  // 6. National IDs / SSN
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  if (ssnRegex.test(result)) {
    redactionTypes.add("government_id");
    result = result.replace(ssnRegex, "[REDACTED_ID]");
  }

  // 7. Payment Cards
  const ccRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  if (ccRegex.test(result)) {
    redactionTypes.add("financial_info");
    result = result.replace(ccRegex, "[REDACTED_PAYMENT]");
  }

  // 8. API Credentials and Bearer Tokens
  const apiKeyRegex = /\b(?:gsk_|AIza)[a-zA-Z0-9_-]{10,}\b/g;
  if (apiKeyRegex.test(result)) {
    redactionTypes.add("api_key");
    result = result.replace(apiKeyRegex, "[REDACTED_API_KEY]");
  }

  const bearerRegex = /Bearer\s+[A-Za-z0-9_\-.]+/gi;
  if (bearerRegex.test(result)) {
    redactionTypes.add("credential_token");
    result = result.replace(bearerRegex, "Bearer [REDACTED]");
  }

  return result;
}

/**
 * Sanitizes and bounds a candidate headline.
 *
 * @param {any} rawHeadline
 * @param {Object} auditState
 * @returns {string}
 */
function sanitizeHeadline(rawHeadline, auditState) {
  if (typeof rawHeadline !== "string") {
    throw new AiConfigurationError("candidateProfile.headline must be a string", {
      diagnosticContext: { reason: "INVALID_HEADLINE_TYPE" },
    });
  }

  let cleaned = cleanControlCharsAndDelimiters(rawHeadline);
  cleaned = scrubFreeTextPii(cleaned, auditState.piiRedactionTypes);

  if (cleaned.length > BOUNDS.MAX_HEADLINE_LENGTH) {
    cleaned = cleaned.slice(0, BOUNDS.MAX_HEADLINE_LENGTH).trim();
    auditState.textTruncated = true;
  }

  return cleaned;
}

/**
 * Validates and bounds years of experience.
 *
 * @param {any} rawYears
 * @returns {number}
 */
function sanitizeYearsOfExperience(rawYears) {
  if (typeof rawYears !== "number" || !Number.isFinite(rawYears) || isNaN(rawYears)) {
    throw new AiConfigurationError("candidateProfile.yearsOfExperience must be a finite number", {
      diagnosticContext: { reason: "INVALID_EXPERIENCE_TYPE" },
    });
  }

  if (rawYears < 0) {
    throw new AiConfigurationError("candidateProfile.yearsOfExperience cannot be negative", {
      diagnosticContext: { reason: "NEGATIVE_EXPERIENCE_VALUE" },
    });
  }

  if (rawYears > BOUNDS.MAX_EXPERIENCE_YEARS) {
    throw new AiConfigurationError(
      `candidateProfile.yearsOfExperience exceeds biological sanity limit (${BOUNDS.MAX_EXPERIENCE_YEARS})`,
      { diagnosticContext: { reason: "EXPERIENCE_EXCEEDS_SANITY_LIMIT" } }
    );
  }

  // Round to at most 1 decimal place
  return Math.round(rawYears * 10) / 10;
}

/**
 * Sanitizes, bounds, and deduplicates declared skills.
 *
 * @param {any} rawSkills
 * @param {Object} auditState
 * @returns {string[]}
 */
function sanitizeDeclaredSkills(rawSkills, auditState) {
  if (!Array.isArray(rawSkills)) {
    throw new AiConfigurationError("candidateProfile.declaredSkills must be an array of strings", {
      diagnosticContext: { reason: "INVALID_SKILLS_TYPE" },
    });
  }

  const seen = new Set();
  const sanitized = [];

  for (const item of rawSkills) {
    if (typeof item !== "string") continue; // drop non-strings safely

    let skill = cleanControlCharsAndDelimiters(item);
    skill = scrubFreeTextPii(skill, auditState.piiRedactionTypes);

    if (skill.length > BOUNDS.MAX_SKILL_LENGTH) {
      skill = skill.slice(0, BOUNDS.MAX_SKILL_LENGTH).trim();
      auditState.textTruncated = true;
    }

    if (!skill) continue;

    const lower = skill.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      sanitized.push(skill);
    }

    if (sanitized.length >= BOUNDS.MAX_SKILLS_COUNT) {
      auditState.textTruncated = true;
      break;
    }
  }

  return sanitized;
}

/**
 * Sanitizes, bounds, and deduplicates target roles.
 *
 * @param {any} rawRoles
 * @param {Object} auditState
 * @returns {string[]}
 */
function sanitizeTargetRoles(rawRoles, auditState) {
  if (!Array.isArray(rawRoles)) {
    throw new AiConfigurationError("candidateProfile.targetRoles must be an array of strings", {
      diagnosticContext: { reason: "INVALID_TARGET_ROLES_TYPE" },
    });
  }

  const seen = new Set();
  const sanitized = [];

  for (const item of rawRoles) {
    if (typeof item !== "string") continue;

    let role = cleanControlCharsAndDelimiters(item);
    role = scrubFreeTextPii(role, auditState.piiRedactionTypes);

    if (role.length > BOUNDS.MAX_TARGET_ROLE_LENGTH) {
      role = role.slice(0, BOUNDS.MAX_TARGET_ROLE_LENGTH).trim();
      auditState.textTruncated = true;
    }

    if (!role) continue;

    const lower = role.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      sanitized.push(role);
    }

    if (sanitized.length >= BOUNDS.MAX_TARGET_ROLES_COUNT) {
      auditState.textTruncated = true;
      break;
    }
  }

  return sanitized;
}

/**
 * Sanitizes, bounds, and scrubs free-text candidate notes.
 *
 * @param {any} rawNotes
 * @param {Object} auditState
 * @returns {string|null}
 */
function sanitizeUserNotes(rawNotes, auditState) {
  if (rawNotes === null || rawNotes === undefined) {
    return null;
  }

  if (typeof rawNotes !== "string") {
    throw new AiConfigurationError("candidateProfile.userNotes must be a string, null, or undefined", {
      diagnosticContext: { reason: "INVALID_NOTES_TYPE" },
    });
  }

  let cleaned = cleanControlCharsAndDelimiters(rawNotes);
  cleaned = scrubFreeTextPii(cleaned, auditState.piiRedactionTypes);

  if (cleaned.length > BOUNDS.MAX_NOTES_LENGTH) {
    cleaned = cleaned.slice(0, BOUNDS.MAX_NOTES_LENGTH).trim();
    auditState.textTruncated = true;
  }

  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Sanitizes and validates pipeline volume metrics.
 *
 * @param {any} rawTelemetry
 * @param {Object} auditState
 * @returns {Object} Minimized pipeline telemetry.
 */
function sanitizePipelineTelemetry(rawTelemetry, auditState) {
  if (!rawTelemetry || typeof rawTelemetry !== "object" || Array.isArray(rawTelemetry)) {
    throw new AiConfigurationError("pipelineTelemetry must be a non-null object", {
      diagnosticContext: { reason: "INVALID_TELEMETRY_STRUCTURE" },
    });
  }

  // Audit unexpected/disallowed telemetry keys
  for (const key of Object.keys(rawTelemetry)) {
    if (!ALLOWED_TELEMETRY_KEYS.has(key)) {
      if (DISALLOWED_TELEMETRY_PII_KEYS.has(key)) {
        auditState.removedFields.add(key);
      } else {
        auditState.unknownFieldsDiscarded.add(key);
      }
    }
  }

  const requiredMetricFields = [
    "trackedOpportunities",
    "submittedApplications",
    "savedCount",
    "activeInPipeline",
    "interviewsInProgress",
    "pendingOffers",
    "cumulativeOffers",
    "cumulativeRejections",
  ];

  const sanitized = {};

  for (const field of requiredMetricFields) {
    const val = rawTelemetry[field];
    if (typeof val !== "number" || !Number.isFinite(val) || isNaN(val) || val < 0) {
      throw new AiConfigurationError(`pipelineTelemetry.${field} must be a non-negative finite number`, {
        diagnosticContext: { reason: "INVALID_METRIC_VALUE" },
      });
    }

    if (val > BOUNDS.MAX_METRIC_VALUE) {
      throw new AiConfigurationError(`pipelineTelemetry.${field} exceeds realistic bounds`, {
        diagnosticContext: { reason: "METRIC_EXCEEDS_MAX_VALUE" },
      });
    }

    sanitized[field] = Math.floor(val);
    auditState.retainedFields.add(`pipelineTelemetry.${field}`);
  }

  // Stage Distribution
  if (!Array.isArray(rawTelemetry.stageDistribution)) {
    throw new AiConfigurationError("pipelineTelemetry.stageDistribution must be an array", {
      diagnosticContext: { reason: "INVALID_STAGE_DISTRIBUTION" },
    });
  }

  sanitized.stageDistribution = [];
  const seenStatuses = new Set();

  for (const entry of rawTelemetry.stageDistribution) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;

    const rawStatus = typeof entry.status === "string" ? cleanControlCharsAndDelimiters(entry.status) : "";
    const rawCount = typeof entry.count === "number" && Number.isFinite(entry.count) ? Math.floor(entry.count) : null;

    if (!rawStatus || rawCount === null || rawCount < 0) continue;

    const statusKey = rawStatus.toLowerCase();
    if (!seenStatuses.has(statusKey)) {
      seenStatuses.add(statusKey);
      sanitized.stageDistribution.push({
        status: rawStatus.slice(0, 40),
        count: Math.min(rawCount, BOUNDS.MAX_METRIC_VALUE),
      });
    }

    if (sanitized.stageDistribution.length >= BOUNDS.MAX_STAGE_ENTRIES) {
      auditState.textTruncated = true;
      break;
    }
  }
  auditState.retainedFields.add("pipelineTelemetry.stageDistribution");

  // Stale Alerts
  if (!rawTelemetry.staleAlerts || typeof rawTelemetry.staleAlerts !== "object" || Array.isArray(rawTelemetry.staleAlerts)) {
    throw new AiConfigurationError("pipelineTelemetry.staleAlerts must be an object", {
      diagnosticContext: { reason: "INVALID_STALE_ALERTS" },
    });
  }

  const rawStaleCount = rawTelemetry.staleAlerts.staleCount;
  const rawThresholdDays = rawTelemetry.staleAlerts.thresholdDays;

  if (typeof rawStaleCount !== "number" || !Number.isFinite(rawStaleCount) || rawStaleCount < 0) {
    throw new AiConfigurationError("pipelineTelemetry.staleAlerts.staleCount must be a non-negative number", {
      diagnosticContext: { reason: "INVALID_STALE_COUNT" },
    });
  }

  if (typeof rawThresholdDays !== "number" || !Number.isFinite(rawThresholdDays) || rawThresholdDays < 0) {
    throw new AiConfigurationError("pipelineTelemetry.staleAlerts.thresholdDays must be a non-negative number", {
      diagnosticContext: { reason: "INVALID_STALE_THRESHOLD" },
    });
  }

  sanitized.staleAlerts = {
    staleCount: Math.floor(rawStaleCount),
    thresholdDays: Math.floor(rawThresholdDays),
  };
  auditState.retainedFields.add("pipelineTelemetry.staleAlerts");

  return sanitized;
}

/**
 * Sanitizes execution options (timeoutMs, signal).
 *
 * @param {any} rawOptions
 * @returns {Object|undefined}
 */
function sanitizeOptions(rawOptions) {
  if (!rawOptions || typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    return undefined;
  }

  const sanitized = {};
  if (typeof rawOptions.timeoutMs === "number" && Number.isFinite(rawOptions.timeoutMs) && rawOptions.timeoutMs > 0) {
    sanitized.timeoutMs = rawOptions.timeoutMs;
  }
  if (rawOptions.signal instanceof AbortSignal) {
    sanitized.signal = rawOptions.signal;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Primary telemetry minimization and PII sanitization function.
 *
 * Enforces strict fail-closed security, explicit field allowlisting, and PII scrubbing.
 * Never mutates original request and never falls back to unminimized data.
 *
 * @param {any} request - Raw input request object.
 * @returns {import('../contracts/dtos/CareerAssessmentRequest.dto').CareerAssessmentRequestDTO & { auditMetadata: Object, minimizedRequest: import('../contracts/dtos/CareerAssessmentRequest.dto').CareerAssessmentRequestDTO }}
 */
function minimizeCareerAssessmentTelemetry(request) {
  // 1. Structural Fail-Closed Guardrails
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new AiConfigurationError("Request must be a non-null object", {
      diagnosticContext: { reason: "INVALID_TOP_LEVEL_REQUEST" },
    });
  }

  // 2. Safe Payload Size Limit Check
  try {
    const serializedSize = Buffer.byteLength(JSON.stringify(request), "utf8");
    if (serializedSize > MAX_PAYLOAD_BYTES) {
      throw new AiConfigurationError(
        `Payload size (${Math.round(serializedSize / 1024)} KB) exceeds maximum safe threshold (256 KB)`,
        { diagnosticContext: { reason: "PAYLOAD_TOO_LARGE" } }
      );
    }
  } catch (err) {
    if (err instanceof AiConfigurationError) throw err;
    throw new AiConfigurationError("Request contains non-serializable circular structure", {
      originalError: err,
      diagnosticContext: { reason: "CIRCULAR_OR_MALFORMED_JSON" },
    });
  }

  // 3. Correlation ID
  if (typeof request.correlationId !== "string" || request.correlationId.trim().length === 0) {
    throw new AiConfigurationError("correlationId must be a non-empty string", {
      diagnosticContext: { reason: "MISSING_CORRELATION_ID" },
    });
  }
  const correlationId = request.correlationId.trim();

  // 4. Candidate Profile Presence & Type
  if (!request.candidateProfile || typeof request.candidateProfile !== "object" || Array.isArray(request.candidateProfile)) {
    throw new AiConfigurationError("candidateProfile must be a valid object", {
      diagnosticContext: { reason: "MISSING_CANDIDATE_PROFILE" },
    });
  }

  // Audit state tracking (never contains values or PII)
  const auditState = {
    retainedFields: new Set(),
    removedFields: new Set(),
    unknownFieldsDiscarded: new Set(),
    piiRedactionTypes: new Set(),
    textTruncated: false,
    warnings: [],
  };

  auditState.retainedFields.add("correlationId");

  // Audit top-level request extra keys
  for (const key of Object.keys(request)) {
    if (!["correlationId", "candidateProfile", "pipelineTelemetry", "options"].includes(key)) {
      if (DISALLOWED_CANDIDATE_PII_KEYS.has(key) || DISALLOWED_TELEMETRY_PII_KEYS.has(key)) {
        auditState.removedFields.add(key);
      } else {
        auditState.unknownFieldsDiscarded.add(key);
      }
    }
  }

  // Audit candidateProfile extra/disallowed keys
  const rawProfile = request.candidateProfile;
  for (const key of Object.keys(rawProfile)) {
    if (!ALLOWED_CANDIDATE_KEYS.has(key)) {
      if (DISALLOWED_CANDIDATE_PII_KEYS.has(key)) {
        auditState.removedFields.add(key);
      } else {
        auditState.unknownFieldsDiscarded.add(key);
      }
    }
  }

  // 5. Minimize Candidate Profile Fields
  // Headline
  const headline = sanitizeHeadline(rawProfile.headline, auditState);
  auditState.retainedFields.add("candidateProfile.headline");

  // Years of Experience
  const yearsOfExperience = sanitizeYearsOfExperience(rawProfile.yearsOfExperience);
  auditState.retainedFields.add("candidateProfile.yearsOfExperience");

  // Declared Skills (supports rawProfile.declaredSkills or fallback to rawProfile.skills)
  const skillsInput = rawProfile.declaredSkills !== undefined ? rawProfile.declaredSkills : rawProfile.skills;
  const declaredSkills = sanitizeDeclaredSkills(skillsInput, auditState);
  auditState.retainedFields.add("candidateProfile.declaredSkills");

  // Target Roles
  const targetRoles = sanitizeTargetRoles(rawProfile.targetRoles, auditState);
  auditState.retainedFields.add("candidateProfile.targetRoles");

  // User Notes (supports rawProfile.userNotes or fallback to rawProfile.bio)
  const notesInput = rawProfile.userNotes !== undefined ? rawProfile.userNotes : rawProfile.bio;
  const userNotes = sanitizeUserNotes(notesInput, auditState);
  if (userNotes !== null) {
    auditState.retainedFields.add("candidateProfile.userNotes");
  }

  const sanitizedCandidateProfile = deepFreeze({
    headline,
    yearsOfExperience,
    declaredSkills,
    targetRoles,
    userNotes,
  });

  // 6. Minimize Pipeline Telemetry
  const sanitizedPipelineTelemetry = deepFreeze(sanitizePipelineTelemetry(request.pipelineTelemetry, auditState));

  // 7. Sanitize Options
  const sanitizedOptions = sanitizeOptions(request.options);
  if (sanitizedOptions) {
    auditState.retainedFields.add("options");
  }
  const frozenOptions = sanitizedOptions ? deepFreeze({ ...sanitizedOptions }) : undefined;

  // 8. Construct Safe Audit Metadata (Strictly zero values / PII)
  const piiRedacted = auditState.piiRedactionTypes.size > 0;
  const auditMetadata = deepFreeze({
    minimizedAt: new Date().toISOString(),
    success: true,
    retainedFieldsCount: auditState.retainedFields.size,
    removedFieldsCount: auditState.removedFields.size + auditState.unknownFieldsDiscarded.size,
    retainedFields: Array.from(auditState.retainedFields).sort(),
    removedFields: Array.from(auditState.removedFields).sort(),
    unknownFieldsDiscarded: Array.from(auditState.unknownFieldsDiscarded).sort(),
    textTruncated: auditState.textTruncated,
    piiRedacted,
    piiRedactionTypes: Array.from(auditState.piiRedactionTypes).sort(),
    warnings: auditState.warnings,
  });

  // Pre-construct canonical immutable clean minimized request DTO
  const cleanRequest = deepFreeze({
    correlationId,
    candidateProfile: sanitizedCandidateProfile,
    pipelineTelemetry: sanitizedPipelineTelemetry,
    ...(frozenOptions ? { options: frozenOptions } : {}),
  });

  // Register cleanRequest in the module-private identity registry
  registerMinimizedRequest(cleanRequest);

  // 9. Build Result with Dual-Access Pattern (Direct Property Access + .minimizedRequest Getter)
  const result = {
    correlationId,
    candidateProfile: sanitizedCandidateProfile,
    pipelineTelemetry: sanitizedPipelineTelemetry,
    ...(frozenOptions ? { options: frozenOptions } : {}),
    auditMetadata,
  };

  // Register result as well for direct property access compatibility
  registerMinimizedRequest(result);

  Object.defineProperty(result, "minimizedRequest", {
    get() {
      return cleanRequest;
    },
    enumerable: true,
    configurable: false,
  });

  return deepFreeze(result);

  return result;
}

module.exports = {
  minimizeCareerAssessmentTelemetry,
  BOUNDS,
  ALLOWED_CANDIDATE_KEYS,
  DISALLOWED_CANDIDATE_PII_KEYS,
  ALLOWED_TELEMETRY_KEYS,
  DISALLOWED_TELEMETRY_PII_KEYS,
  registerMinimizedRequest,
  isVerifiedMinimizedRequest,
};