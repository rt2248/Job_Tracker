/**
 * geminiClient.js
 *
 * Direct HTTP client for Google Gemini Developer API using native Node.js fetch.
 * Implements strict timeout handling, exponential retry with jitter for transient 503 errors,
 * strict rejection of automated retries for HTTP 429 (quota exhausted), structured JSON
 * schema enforcement, and rigorous error classification.
 *
 * Configured specifically for:
 * - Provider: Google Gemini Developer API (https://generativelanguage.googleapis.com/v1beta/models)
 * - Preferred Model: gemini-3.8-flash
 * - Thinking Configuration: Gemini 3.x thinkingLevel enum ("LOW", "MEDIUM", "HIGH")
 *
 * Reference: https://ai.google.dev/gemini-api/docs/thinking
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { CAREER_ASSESSMENT_JSON_SCHEMA } = require("../groq/responseSchema");

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const DEFAULT_TIMEOUT_MS = 60000;
const MAX_RETRIES = 3; // Bounded retries strictly for transient HTTP 503 capacity errors
const INITIAL_BACKOFF_MS = 2500;

// Standardized Error Classifications
const ERROR_TYPES = {
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",     // HTTP 400 or client-side validation failure
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",   // HTTP 401 or 403
  QUOTA_EXHAUSTED: "QUOTA_EXHAUSTED",             // HTTP 429 (Rate limit or daily limit)
  CAPACITY_UNAVAILABLE: "CAPACITY_UNAVAILABLE",   // HTTP 503 (Temporary model demand spike)
  MODEL_FAILURE: "MODEL_FAILURE",                 // Empty output, JSON parse failure, or unrecoverable API error
  NETWORK_ERROR: "NETWORK_ERROR",                 // AbortError timeout or TCP/TLS socket transport failure
};

// Gemini 3.x Thinking Level Specification
// Per official Google documentation (https://ai.google.dev/gemini-api/docs/thinking),
// gemini-3.8-flash supports LOW, MEDIUM, and HIGH. MINIMAL is NOT supported by 3.8 Flash.
const SUPPORTED_THINKING_LEVELS = ["LOW", "MEDIUM", "HIGH"];
const DEFAULT_THINKING_LEVEL = "MEDIUM";

/**
 * Validates thinkingLevel configuration for Gemini 3.x models.
 * Rejects unsupported values locally before making API requests.
 *
 * @param {string} [level]
 * @param {string} [model=DEFAULT_MODEL]
 * @returns {{ valid: boolean, value: string|null, error: string|null }}
 */
function validateThinkingLevel(level, model = DEFAULT_MODEL) {
  if (level === undefined || level === null || level === "") {
    return { valid: true, value: DEFAULT_THINKING_LEVEL, error: null };
  }

  const rawString = String(level).trim();
  const normalized = rawString.toUpperCase();

  if (SUPPORTED_THINKING_LEVELS.includes(normalized)) {
    return { valid: true, value: normalized, error: null };
  }

  let specificHint = `Supported levels for ${model} are: ${SUPPORTED_THINKING_LEVELS.join(", ")}.`;
  if (normalized === "MINIMAL") {
    specificHint += ` Note: 'MINIMAL' is not supported by ${model} per Google documentation (https://ai.google.dev/gemini-api/docs/thinking).`;
  } else if (!isNaN(Number(rawString)) || rawString === "0") {
    specificHint += ` Note: Numeric token budgets (e.g. thinkingBudget: 0) are legacy Gemini 2.5 parameters and are not accepted on Gemini 3 series.`;
  }

  return {
    valid: false,
    value: null,
    error: `Invalid thinkingLevel '${rawString}'. ${specificHint}`,
  };
}

/**
 * Sanitizes JSON Schema for Google Gemini Developer API.
 * Gemini's OpenAPI Schema dialect does not support `additionalProperties`.
 * Recursively strips `additionalProperties` while preserving all types, properties,
 * items, enums, required fields, and descriptions.
 *
 * @param {Object} schema
 * @returns {Object}
 */
function sanitizeSchemaForGemini(schema) {
  if (!schema || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(sanitizeSchemaForGemini);

  const sanitized = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "additionalProperties") {
      continue;
    }
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeSchemaForGemini(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

class GeminiClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || null;
    this.model = options.model || DEFAULT_MODEL;
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : MAX_RETRIES;

    // Validate thinkingLevel configuration locally
    const rawLevel = options.thinkingLevel !== undefined
      ? options.thinkingLevel
      : process.env.GEMINI_THINKING_LEVEL;

    const validation = validateThinkingLevel(rawLevel, this.model);
    if (!validation.valid) {
      this.configError = validation.error;
      this.thinkingLevel = null;
    } else {
      this.configError = null;
      this.thinkingLevel = validation.value;
    }
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getMaskedKey() {
    if (!this.isConfigured()) return null;
    const clean = this.apiKey.trim();
    if (clean.length <= 10) return "**********";
    return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
  }

  /**
   * Pre-flight verification: checks if the configured API key is valid
   * and whether the target model is accessible on this account.
   *
   * @returns {Promise<Object>}
   */
  async verifyModelAccess() {
    if (!this.isConfigured()) {
      return {
        configured: false,
        maskedKey: null,
        accessible: false,
        targetModel: this.model,
        errorType: ERROR_TYPES.CONFIGURATION_ERROR,
        error: "GEMINI_API_KEY is not configured in process environment or Backend/.env",
      };
    }

    const maskedKey = this.getMaskedKey();

    try {
      const response = await fetch(`${GEMINI_BASE_URL}`, {
        method: "GET",
        headers: {
          "x-goog-api-key": this.apiKey,
        },
      });

      if (response.status === 400) {
        const errText = await response.text().catch(() => "");
        return {
          configured: true,
          maskedKey,
          accessible: false,
          statusCode: 400,
          targetModel: this.model,
          errorType: ERROR_TYPES.CONFIGURATION_ERROR,
          error: `HTTP 400 Configuration Error querying models: ${errText}`,
        };
      }

      if (response.status === 401 || response.status === 403) {
        const errText = await response.text().catch(() => "");
        return {
          configured: true,
          maskedKey,
          accessible: false,
          statusCode: response.status,
          targetModel: this.model,
          errorType: ERROR_TYPES.AUTHENTICATION_ERROR,
          error: `HTTP ${response.status} Authentication Error: Key invalid or unauthorized: ${errText}`,
        };
      }

      if (response.status === 429) {
        const errText = await response.text().catch(() => "");
        return {
          configured: true,
          maskedKey,
          accessible: false,
          statusCode: 429,
          targetModel: this.model,
          errorType: ERROR_TYPES.QUOTA_EXHAUSTED,
          error: `HTTP 429 Quota Exhausted querying models: ${errText}`,
        };
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return {
          configured: true,
          maskedKey,
          accessible: false,
          statusCode: response.status,
          targetModel: this.model,
          errorType: ERROR_TYPES.MODEL_FAILURE,
          error: `HTTP error ${response.status} querying Gemini models endpoint: ${body}`,
        };
      }

      const data = await response.json();
      const rawModels = Array.isArray(data.models) ? data.models : [];
      const modelNames = rawModels.map((m) => m.name.replace(/^models\//, ""));

      const targetNormalized = this.model.replace(/^models\//, "");
      const hasTargetModel = modelNames.includes(targetNormalized);

      return {
        configured: true,
        maskedKey,
        accessible: hasTargetModel,
        statusCode: 200,
        availableModelsCount: modelNames.length,
        hasTargetModel,
        targetModel: this.model,
        availableModelsSample: modelNames.slice(0, 8),
        error: hasTargetModel
          ? null
          : `Model '${this.model}' was not found in the list of ${modelNames.length} models accessible to this account.`,
      };
    } catch (err) {
      return {
        configured: true,
        maskedKey,
        accessible: false,
        targetModel: this.model,
        errorType: ERROR_TYPES.NETWORK_ERROR,
        error: `Network error verifying Gemini model accessibility: ${err.message}`,
      };
    }
  }

  /**
   * Executes structured career assessment generation via Gemini Developer API.
   *
   * @param {Object} params
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {boolean} [params.dryRun=false]
   * @returns {Promise<Object>}
   */
  async generateAssessment({ systemPrompt, userPrompt, dryRun = false }) {
    // 1. Client-Side Configuration Validation Guardrail
    if (this.configError) {
      return {
        success: false,
        errorType: ERROR_TYPES.CONFIGURATION_ERROR,
        statusCode: 400,
        error: this.configError,
        model: this.model,
        latencyMs: 0,
        attempts: 0,
      };
    }

    if (dryRun || !this.isConfigured()) {
      return {
        success: false,
        isConfigured: this.isConfigured(),
        dryRun,
        errorType: !this.isConfigured() ? ERROR_TYPES.CONFIGURATION_ERROR : null,
        error: !this.isConfigured()
          ? "GEMINI_API_KEY is not configured in environment or .env"
          : "Dry run mode active",
        model: this.model,
        latencyMs: 0,
        attempts: 0,
      };
    }

    const sanitizedSchema = sanitizeSchemaForGemini(CAREER_ASSESSMENT_JSON_SCHEMA);

    // Documented Gemini 3.x payload mapping:
    // Uses thinkingConfig.thinkingLevel with validated enum string ("LOW", "MEDIUM", "HIGH")
    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: sanitizedSchema,
        thinkingConfig: {
          thinkingLevel: this.thinkingLevel,
        },
      },
    };

    const targetModelSlug = this.model.startsWith("models/") ? this.model : `models/${this.model}`;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/${targetModelSlug}:generateContent`;

    let attempt = 0;
    let delayMs = INITIAL_BACKOFF_MS;

    while (attempt < this.maxRetries) {
      attempt++;
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - startTime);

        // 2. HTTP 429 Quota Exhausted: STRICTLY NO AUTOMATED RETRY
        // Per Stage 2A.6 requirements: Do not automatically retry 429 responses.
        if (response.status === 429) {
          const errBody = await response.text().catch(() => "");
          let structuredError = null;
          try {
            structuredError = JSON.parse(errBody);
          } catch (_) {}

          return {
            success: false,
            errorType: ERROR_TYPES.QUOTA_EXHAUSTED,
            statusCode: 429,
            error: `HTTP 429 Quota Exhausted: ${structuredError?.error?.message || errBody}`,
            errorDetails: structuredError,
            latencyMs,
            model: this.model,
            thinkingLevel: this.thinkingLevel,
            attempts: attempt,
          };
        }

        // 3. HTTP 503 Capacity Unavailable: Bounded exponential retry with jitter
        if (response.status === 503 || response.status === 502 || response.status === 504) {
          const retryAfterHeader = response.headers.get("retry-after");
          const jitter = Math.floor(Math.random() * 1000);
          const waitTime = retryAfterHeader
            ? parseInt(retryAfterHeader, 10) * 1000 + jitter
            : delayMs + jitter;

          console.warn(
            `[GeminiClient] Received HTTP ${response.status} (Capacity Unavailable). Retrying in ${waitTime}ms (attempt ${attempt}/${this.maxRetries})...`
          );

          if (attempt >= this.maxRetries) {
            const errBody = await response.text().catch(() => "");
            let structuredError = null;
            try {
              structuredError = JSON.parse(errBody);
            } catch (_) {}

            return {
              success: false,
              errorType: ERROR_TYPES.CAPACITY_UNAVAILABLE,
              statusCode: response.status,
              error: `HTTP ${response.status} Capacity Unavailable after ${this.maxRetries} attempts: ${structuredError?.error?.message || errBody}`,
              errorDetails: structuredError,
              latencyMs,
              model: this.model,
              thinkingLevel: this.thinkingLevel,
              attempts: attempt,
            };
          }

          await new Promise((resolve) => setTimeout(resolve, waitTime));
          delayMs *= 2;
          continue;
        }

        // 4. HTTP 400 Bad Request: Configuration or Schema Error
        if (response.status === 400) {
          const errBody = await response.text().catch(() => "");
          let structuredError = null;
          try {
            structuredError = JSON.parse(errBody);
          } catch (_) {}

          return {
            success: false,
            errorType: ERROR_TYPES.CONFIGURATION_ERROR,
            statusCode: 400,
            error: `HTTP 400 Configuration Error: ${structuredError?.error?.message || errBody}`,
            errorDetails: structuredError,
            latencyMs,
            model: this.model,
            thinkingLevel: this.thinkingLevel,
            attempts: attempt,
          };
        }

        // 5. HTTP 401/403 Authentication Error
        if (response.status === 401 || response.status === 403) {
          const errBody = await response.text().catch(() => "");
          let structuredError = null;
          try {
            structuredError = JSON.parse(errBody);
          } catch (_) {}

          return {
            success: false,
            errorType: ERROR_TYPES.AUTHENTICATION_ERROR,
            statusCode: response.status,
            error: `HTTP ${response.status} Authentication Error: ${structuredError?.error?.message || errBody}`,
            errorDetails: structuredError,
            latencyMs,
            model: this.model,
            thinkingLevel: this.thinkingLevel,
            attempts: attempt,
          };
        }

        // 6. Other HTTP Errors
        if (!response.ok) {
          const errBody = await response.text().catch(() => "Unknown error");
          let structuredError = null;
          try {
            structuredError = JSON.parse(errBody);
          } catch (_) {}

          return {
            success: false,
            errorType: ERROR_TYPES.MODEL_FAILURE,
            statusCode: response.status,
            error: `Gemini API HTTP error ${response.status}: ${structuredError?.error?.message || errBody}`,
            errorDetails: structuredError,
            latencyMs,
            model: this.model,
            thinkingLevel: this.thinkingLevel,
            attempts: attempt,
          };
        }

        // 7. Successful Response Extraction & Verification
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const candidatePart = parts.find((p) => !p.thought && p.text) || parts[0];
        const contentStr = candidatePart?.text || null;

        let parsedJson = null;
        let parseError = null;

        try {
          parsedJson = JSON.parse(contentStr);
        } catch (e) {
          parseError = e.message;
        }

        const usageMetadata = data.usageMetadata || {};
        const usage = {
          promptTokens: usageMetadata.promptTokenCount || 0,
          completionTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
          thinkingTokens: (usageMetadata.totalTokenCount || 0) -
            ((usageMetadata.promptTokenCount || 0) + (usageMetadata.candidatesTokenCount || 0)),
        };

        if (parseError || !parsedJson) {
          return {
            success: false,
            errorType: ERROR_TYPES.MODEL_FAILURE,
            statusCode: 200,
            error: `JSON parse error of model response: ${parseError}`,
            rawText: contentStr,
            latencyMs,
            usage,
            model: this.model,
            thinkingLevel: this.thinkingLevel,
            attempts: attempt,
          };
        }

        return {
          success: true,
          errorType: null,
          data: parsedJson,
          rawText: contentStr,
          latencyMs,
          usage,
          model: this.model,
          thinkingLevel: this.thinkingLevel,
          attempts: attempt,
          finishReason: data.candidates?.[0]?.finishReason || "STOP",
        };
      } catch (err) {
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - startTime);

        if (err.name === "AbortError") {
          return {
            success: false,
            errorType: ERROR_TYPES.NETWORK_ERROR,
            statusCode: null,
            error: `Request timed out after ${this.timeoutMs}ms`,
            latencyMs,
            model: this.model,
            thinkingLevel: this.thinkingLevel,
            attempts: attempt,
          };
        }

        // Non-timeout network/socket transport failure
        return {
          success: false,
          errorType: ERROR_TYPES.NETWORK_ERROR,
          statusCode: null,
          error: `Network transport error: ${err.message}`,
          latencyMs,
          model: this.model,
          thinkingLevel: this.thinkingLevel,
          attempts: attempt,
        };
      }
    }

    return {
      success: false,
      errorType: ERROR_TYPES.CAPACITY_UNAVAILABLE,
      statusCode: 503,
      error: `Execution terminated without response after ${this.maxRetries} attempts`,
      model: this.model,
      thinkingLevel: this.thinkingLevel,
      attempts: attempt,
    };
  }
}

module.exports = {
  GeminiClient,
  DEFAULT_MODEL,
  ERROR_TYPES,
  SUPPORTED_THINKING_LEVELS,
  DEFAULT_THINKING_LEVEL,
  validateThinkingLevel,
  sanitizeSchemaForGemini,
};
