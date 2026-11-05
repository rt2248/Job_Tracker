/**
 * groqClient.js
 *
 * Direct HTTP client for GroqCloud inference API using native Node.js fetch.
 * Implements strict timeout handling, standardized error taxonomy,
 * strict rejection of automated retries for HTTP 429 (rate limits & quota exhaustion),
 * rate-limit telemetry extraction, and latency measurement.
 *
 * Configured specifically for:
 * - Provider: GroqCloud (https://api.groq.com/openai/v1/chat/completions)
 * - Model: openai/gpt-oss-120b
 *
 * Stage 2A.9 Alignment:
 * - Standardized error taxonomy (CONFIGURATION_ERROR, AUTHENTICATION_ERROR,
 *   RATE_LIMITED, QUOTA_EXHAUSTED, CAPACITY_UNAVAILABLE, MODEL_FAILURE, NETWORK_ERROR)
 * - Non-retrying HTTP 429 guardrail
 * - Granular 429 classification (RPM/TPM vs daily quota exhaustion)
 * - Safe rate-limit header telemetry extraction
 * - Zero credential fragment leakage
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { CAREER_ASSESSMENT_JSON_SCHEMA } = require("./responseSchema");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const DEFAULT_TIMEOUT_MS = 45000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1500;

// Standardized Error Classifications
const ERROR_TYPES = {
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",     // HTTP 400 or client validation error
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",   // HTTP 401 or 403
  RATE_LIMITED: "RATE_LIMITED",                   // HTTP 429 (transient RPM / TPM limit)
  QUOTA_EXHAUSTED: "QUOTA_EXHAUSTED",             // HTTP 429 (explicit daily quota or credit exhaustion)
  CAPACITY_UNAVAILABLE: "CAPACITY_UNAVAILABLE",   // HTTP 503 / 502 / 504 (server capacity shortage)
  MODEL_FAILURE: "MODEL_FAILURE",                 // HTTP 200 with invalid output, JSON parse failure, or empty candidate
  NETWORK_ERROR: "NETWORK_ERROR",                 // Request timeout or TCP/TLS socket transport failure
};

/**
 * Distinguishes temporary RPM/TPM rate limits from explicit daily/account quota exhaustion.
 *
 * Stage 2A.11 Corrections:
 * - Strips generic URLs (e.g. "https://console.groq.com/settings/billing") so upgrade links
 *   do not falsely trigger quota or billing classification.
 * - Explicit TPM/RPM rate limits are classified as RATE_LIMITED (e.g. tokens per minute, requests per minute).
 * - Explicit daily request or token quota exhaustion is classified as QUOTA_EXHAUSTED.
 * - Explicit credit or billing exhaustion is classified as QUOTA_EXHAUSTED when not part of an RPM/TPM message.
 * - Ambiguous 429 responses default to RATE_LIMITED.
 *
 * @param {string} [errorMessage=""]
 * @param {Object} [errorDetails=null]
 * @returns {string} One of ERROR_TYPES.QUOTA_EXHAUSTED or ERROR_TYPES.RATE_LIMITED
 */
function classify429Error(errorMessage = "", errorDetails = null) {
  const rawText = String(errorMessage) + " " + JSON.stringify(errorDetails || {});

  // 1. Strip URLs (e.g., https://console.groq.com/settings/billing) so documentation and upgrade links
  // do not falsely trigger billing or quota keywords
  const textWithoutUrls = rawText.replace(/https?:\/\/[^\s"'>]+/gi, "").toLowerCase();

  // 2. Explicit TPM/RPM rate limits take precedence over general keywords
  const isTpmOrRpm =
    textWithoutUrls.includes("tokens per minute") ||
    textWithoutUrls.includes("(tpm)") ||
    textWithoutUrls.includes("requests per minute") ||
    textWithoutUrls.includes("(rpm)") ||
    textWithoutUrls.includes("rate limit reached") ||
    textWithoutUrls.includes("try again in") ||
    textWithoutUrls.includes("please try again");

  // 3. Explicit daily quota exhaustion indicators
  const isDailyQuota =
    textWithoutUrls.includes("requests_per_day") ||
    textWithoutUrls.includes("tokens_per_day") ||
    textWithoutUrls.includes("daily request limit") ||
    textWithoutUrls.includes("daily limit") ||
    textWithoutUrls.includes("daily quota") ||
    textWithoutUrls.includes("limit: 14400") ||
    textWithoutUrls.includes("rpd");

  // 4. Explicit credit or billing exhaustion indicators (ignoring stripped upgrade links)
  const isCreditExhausted =
    textWithoutUrls.includes("insufficient_quota") ||
    textWithoutUrls.includes("credit expired") ||
    textWithoutUrls.includes("credit limit exceeded") ||
    textWithoutUrls.includes("exceeded your current quota") ||
    textWithoutUrls.includes("quota exceeded") ||
    textWithoutUrls.includes("account suspended") ||
    textWithoutUrls.includes("billing account");

  // If explicit daily quota is present, classify as QUOTA_EXHAUSTED
  if (isDailyQuota) {
    return ERROR_TYPES.QUOTA_EXHAUSTED;
  }

  // If explicit credit or billing exhaustion is present and NOT an explicit TPM/RPM message
  if (isCreditExhausted && !isTpmOrRpm) {
    return ERROR_TYPES.QUOTA_EXHAUSTED;
  }

  // If explicit TPM/RPM limit was detected, classify as RATE_LIMITED
  if (isTpmOrRpm) {
    return ERROR_TYPES.RATE_LIMITED;
  }

  // 5. Default ambiguous 429 responses to RATE_LIMITED
  return ERROR_TYPES.RATE_LIMITED;
}

/**
 * Extracts rate-limit telemetry headers safely without failing on missing values.
 * Missing values are reported as "unavailable", not guessed.
 *
 * @param {Headers|Object} headers
 * @returns {Object}
 */
function parseRateLimitHeaders(headers) {
  if (!headers) {
    return {
      limitRequests: "unavailable",
      limitTokens: "unavailable",
      remainingRequests: "unavailable",
      remainingTokens: "unavailable",
      resetRequests: "unavailable",
      resetTokens: "unavailable",
    };
  }

  const getHeader = (name) => {
    if (typeof headers.get === "function") {
      return headers.get(name) || headers.get(name.toLowerCase()) || null;
    }
    return headers[name] || headers[name.toLowerCase()] || null;
  };

  return {
    limitRequests: getHeader("x-ratelimit-limit-requests") || "unavailable",
    limitTokens: getHeader("x-ratelimit-limit-tokens") || "unavailable",
    remainingRequests: getHeader("x-ratelimit-remaining-requests") || "unavailable",
    remainingTokens: getHeader("x-ratelimit-remaining-tokens") || "unavailable",
    resetRequests: getHeader("x-ratelimit-reset-requests") || "unavailable",
    resetTokens: getHeader("x-ratelimit-reset-tokens") || "unavailable",
  };
}

class GroqClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey !== undefined ? options.apiKey : (process.env.GROQ_API_KEY || null);
    this.model = options.model || DEFAULT_MODEL;
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : MAX_RETRIES;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Protected status indicator that NEVER exposes credential prefixes or fragments.
   *
   * @returns {string|null}
   */
  getMaskedKey() {
    if (!this.isConfigured()) return null;
    return "[CONFIGURED_PROTECTED]";
  }

  /**
   * Pre-flight verification: checks if the configured API key is valid
   * and whether the target model (openai/gpt-oss-120b) is accessible on this account.
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
        error: "GROQ_API_KEY is not configured in process environment or Backend/.env",
      };
    }

    const maskedKey = this.getMaskedKey();

    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        return {
          configured: true,
          maskedKey,
          accessible: false,
          statusCode: response.status,
          targetModel: this.model,
          errorType: ERROR_TYPES.AUTHENTICATION_ERROR,
          error: `HTTP ${response.status} Authentication Error: Key invalid, revoked, or unauthorized.`,
        };
      }

      if (response.status === 400) {
        const body = await response.text().catch(() => "");
        return {
          configured: true,
          maskedKey,
          accessible: false,
          statusCode: 400,
          targetModel: this.model,
          errorType: ERROR_TYPES.CONFIGURATION_ERROR,
          error: `HTTP 400 Configuration Error querying models endpoint: ${body}`,
        };
      }

      if (response.status === 429) {
        const body = await response.text().catch(() => "");
        let errDetails = null;
        try { errDetails = JSON.parse(body); } catch (_) {}
        const errorType = classify429Error(body, errDetails);
        return {
          configured: true,
          maskedKey,
          accessible: false,
          statusCode: 429,
          targetModel: this.model,
          errorType,
          error: `HTTP 429 ${errorType} querying Groq models endpoint: ${body}`,
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
          error: `HTTP error ${response.status} querying Groq models endpoint: ${body}`,
        };
      }

      const data = await response.json();
      const modelList = Array.isArray(data.data) ? data.data.map((m) => m.id) : [];
      const hasTargetModel = modelList.includes(this.model);

      return {
        configured: true,
        maskedKey,
        accessible: hasTargetModel,
        statusCode: 200,
        availableModelsCount: modelList.length,
        hasTargetModel,
        targetModel: this.model,
        availableModelsSample: modelList.slice(0, 8),
        error: hasTargetModel
          ? null
          : `Model '${this.model}' was not found in the list of ${modelList.length} models accessible to this account.`,
      };
    } catch (err) {
      return {
        configured: true,
        maskedKey,
        accessible: false,
        targetModel: this.model,
        errorType: ERROR_TYPES.NETWORK_ERROR,
        error: `Network error verifying Groq model accessibility: ${err.message}`,
      };
    }
  }

  /**
   * Executes chat completion request to GroqCloud with structured outputs.
   *
   * @param {Object} params
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {boolean} [params.dryRun=false]
   * @returns {Promise<Object>}
   */
  async generateAssessment({ systemPrompt, userPrompt, dryRun = false }) {
    if (dryRun || !this.isConfigured()) {
      return {
        success: false,
        isConfigured: this.isConfigured(),
        dryRun,
        errorType: !this.isConfigured() ? ERROR_TYPES.CONFIGURATION_ERROR : null,
        error: !this.isConfigured()
          ? "GROQ_API_KEY is not configured in environment or .env"
          : "Dry run mode active",
        model: this.model,
        latencyMs: 0,
        attempts: 0,
      };
    }

    const payload = {
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "career_strategy_assessment",
          strict: true,
          schema: CAREER_ASSESSMENT_JSON_SCHEMA,
        },
      },
      temperature: 0.2,
      reasoning_effort: "medium",
    };

    let attempt = 0;
    let delayMs = INITIAL_BACKOFF_MS;

    while (attempt < this.maxRetries) {
      attempt++;
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - startTime);
        const rateLimits = parseRateLimitHeaders(response.headers);

        // 1. HTTP 429 Rate Limit / Quota Exhausted: STRICTLY ZERO RETRIES
        // Per Stage 2A.9 requirements: Do not automatically retry 429 responses.
        if (response.status === 429) {
          const errBody = await response.text().catch(() => "");
          let structuredError = null;
          try {
            structuredError = JSON.parse(errBody);
          } catch (_) {}

          const errorMsg = structuredError?.error?.message || errBody;
          const errorType = classify429Error(errorMsg, structuredError);

          return {
            success: false,
            errorType,
            statusCode: 429,
            error: `HTTP 429 ${errorType}: ${errorMsg}`,
            errorDetails: structuredError,
            rateLimits,
            latencyMs,
            model: this.model,
            attempts: attempt,
          };
        }

        // 2. HTTP 401/403 Authentication Error: ZERO RETRIES
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
            rateLimits,
            latencyMs,
            model: this.model,
            attempts: attempt,
          };
        }

        // 3. HTTP 400 Bad Request / Schema or Model Error: ZERO RETRIES
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
            rateLimits,
            latencyMs,
            model: this.model,
            attempts: attempt,
          };
        }

        // 4. HTTP 503 / 502 / 504 Capacity Unavailable: Bounded exponential retry with jitter
        if (response.status === 503 || response.status === 502 || response.status === 504) {
          const retryAfterHeader = response.headers.get("retry-after");
          const jitter = Math.floor(Math.random() * 500);
          const waitTime = retryAfterHeader
            ? parseInt(retryAfterHeader, 10) * 1000 + jitter
            : delayMs + jitter;

          console.warn(
            `[GroqClient] Received HTTP ${response.status} (Capacity Unavailable). Retrying in ${waitTime}ms (attempt ${attempt}/${this.maxRetries})...`
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
              rateLimits,
              latencyMs,
              model: this.model,
              attempts: attempt,
            };
          }

          await new Promise((resolve) => setTimeout(resolve, waitTime));
          delayMs *= 2;
          continue;
        }

        // 5. Other HTTP Errors
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
            error: `Groq API HTTP error ${response.status}: ${structuredError?.error?.message || errBody}`,
            errorDetails: structuredError,
            rateLimits,
            latencyMs,
            model: this.model,
            attempts: attempt,
          };
        }

        // 6. Successful Response Extraction
        const data = await response.json();
        const contentStr = data.choices?.[0]?.message?.content || null;

        let parsedJson = null;
        let parseError = null;
        try {
          parsedJson = JSON.parse(contentStr);
        } catch (e) {
          parseError = e.message;
        }

        const usage = {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        };

        if (parseError || !parsedJson) {
          return {
            success: false,
            errorType: ERROR_TYPES.MODEL_FAILURE,
            statusCode: 200,
            error: `JSON parse error of model response: ${parseError}`,
            rawContent: contentStr,
            latencyMs,
            usage,
            rateLimits,
            model: data.model || this.model,
            attempts: attempt,
          };
        }

        return {
          success: true,
          errorType: null,
          data: parsedJson,
          rawContent: contentStr,
          latencyMs,
          usage,
          rateLimits,
          model: data.model || this.model,
          attempts: attempt,
        };
      } catch (err) {
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - startTime);

        if (err.name === "AbortError") {
          return {
            success: false,
            errorType: ERROR_TYPES.NETWORK_ERROR,
            statusCode: null,
            error: `Groq API request timed out after ${this.timeoutMs}ms`,
            latencyMs,
            model: this.model,
            attempts: attempt,
          };
        }

        if (attempt >= this.maxRetries) {
          return {
            success: false,
            errorType: ERROR_TYPES.NETWORK_ERROR,
            statusCode: null,
            error: `Network transport error: ${err.message}`,
            latencyMs,
            model: this.model,
            attempts: attempt,
          };
        }

        console.warn(`[GroqClient] Network exception: ${err.message}. Retrying in ${delayMs}ms (attempt ${attempt}/${this.maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      }
    }

    return {
      success: false,
      errorType: ERROR_TYPES.CAPACITY_UNAVAILABLE,
      statusCode: 503,
      error: `Execution terminated without response after ${this.maxRetries} attempts`,
      model: this.model,
      attempts: attempt,
    };
  }

  /**
   * Generates a realistic, deterministic synthetic evaluation response
   * adhering 100% to CAREER_ASSESSMENT_JSON_SCHEMA for offline verification,
   * schema compliance testing, and scenario verification when no live key is present.
   *
   * @param {Object} scenario
   * @returns {Object}
   */
  generateSyntheticAssessment(scenario) {
    const { id, profile, pipeline, expectedGroundTruth } = scenario;

    let candidateSummary;
    let pipelineDiagnostics;
    let skillGapAnalysis;
    let strategicRecommendations;
    let evidenceGrounding;

    switch (id) {
      case "SCENARIO-1": // Entry-Level Fresher
        candidateSummary = {
          careerStage: "entry_level",
          pipelineHealth: "needs_focus",
          primaryBottleneck: "Disproportionate bookmarking (42 saved) vs actual submissions (3 applied), stalling progression.",
        };
        pipelineDiagnostics = {
          volumeAssessment: "Candidate has 45 tracked items, but 93% remain dormant in Saved status with only 3 submitted applications.",
          stageProgressionVelocity: "Zero conversion beyond Applied. Pipeline has 0 Online Assessments and 0 Interviews.",
          staleApplicationRisk: "Saved jobs risk expiring before submission if unreviewed within 14 days.",
        };
        skillGapAnalysis = {
          verifiedCandidateSkills: ["react", "javascript", "html", "css"],
          criticalMissingSkills: ["typescript", "tailwind", "git"],
          skillBridgingAdvice: "Complete TypeScript and Git project workflows to meet junior frontend industry standards.",
        };
        strategicRecommendations = [
          {
            id: "REC-01",
            category: "pipeline_velocity",
            priority: "high",
            title: "Convert Top 10 Saved Opportunities into Active Submissions",
            rationale: "42 opportunities are sitting in Saved without employer engagement, representing lost hiring momentum.",
            actionSteps: [
              "Review the 42 saved opportunities and filter for the top 10 best matching roles.",
              "Submit applications to at least 5 positions within the next 48 hours.",
              "Prune or archive saved listings older than 30 days.",
            ],
            expectedImpact: "Increases active pipeline volume from 3 to 13 applications, creating opportunities for screening calls.",
          },
          {
            id: "REC-02",
            category: "skill_acquisition",
            priority: "medium",
            title: "Learn TypeScript Fundamentals and Convert One Portfolio Project",
            rationale: "Candidate has foundational React/JS skills, but 70% of junior frontend job listings require TypeScript.",
            actionSteps: [
              "Complete TypeScript core syntax training (interfaces, generics, unions).",
              "Migrate an existing React component repository to .tsx.",
            ],
            expectedImpact: "Boosts skill fit match score from 55% to ~75% for modern frontend listings.",
          },
        ];
        evidenceGrounding = {
          citedMetrics: ["45 tracked opportunities", "42 saved opportunities", "3 submitted applications", "0 interviews"],
          dataLimitationsNoted: "No historical interview conversion data available due to low submission count.",
          hallucinationCheckPassed: true,
        };
        break;

      case "SCENARIO-2": // Mid-Level Progression
        candidateSummary = {
          careerStage: "mid_level",
          pipelineHealth: "healthy",
          primaryBottleneck: "Managing competing interview timelines and evaluating one pending offer against active final rounds.",
        };
        pipelineDiagnostics = {
          volumeAssessment: "Focused pipeline of 15 targeted applications resulting in 4 interviews and 1 pending offer (26% interview rate).",
          stageProgressionVelocity: "High velocity across technical loops with 4 active interview stages.",
          staleApplicationRisk: "One application (LogiMatrix) has been inactive for 16.5 days in stage.",
        };
        skillGapAnalysis = {
          verifiedCandidateSkills: ["node.js", "typescript", "postgresql", "docker", "aws", "express", "redis"],
          criticalMissingSkills: ["kubernetes", "system design"],
          skillBridgingAdvice: "Prepare distributed systems architecture diagrams to solidify senior-level positioning.",
        };
        strategicRecommendations = [
          {
            id: "REC-01",
            category: "interview_preparation",
            priority: "high",
            title: "Leverage Pending Offer to Accelerate Remaining Interview Loops",
            rationale: "Candidate holds 1 pending offer while currently engaged in 4 active interview rounds.",
            actionSteps: [
              "Notify active interview recruiters of your offer deadline respectfully.",
              "Request expedited scheduling for final interview feedback rounds.",
            ],
            expectedImpact: "Creates competitive leverage for compensation negotiation and aligns decision deadlines.",
          },
          {
            id: "REC-02",
            category: "data_hygiene",
            priority: "low",
            title: "Follow Up on Stale Application at LogiMatrix",
            rationale: "Application has been dormant in stage for 16.5 days, exceeding the 14-day threshold.",
            actionSteps: ["Send a polite status inquiry email to the LogiMatrix recruiting contact."],
            expectedImpact: "Resolves pending status and clarifies active pipeline disposition.",
          },
        ];
        evidenceGrounding = {
          citedMetrics: ["15 submitted applications", "4 active interviews", "1 pending offer", "1 stale alert at 16.5 days"],
          dataLimitationsNoted: "Offer deadline date not specified in telemetry.",
          hallucinationCheckPassed: true,
        };
        break;

      case "SCENARIO-3": // Low Conversion Bottleneck
        candidateSummary = {
          careerStage: "mid_level",
          pipelineHealth: "critical_bottleneck",
          primaryBottleneck: "Critical submission-to-interview dropoff: 68 applications sent with 0 interviews and 24 rejections.",
        };
        pipelineDiagnostics = {
          volumeAssessment: "High submission volume (68 applications) with high friction; 35% rejected without phone screen.",
          stageProgressionVelocity: "Zero conversion beyond initial submission; funnel is completely blocked at screening stage.",
          staleApplicationRisk: "Severe stale backlog: 18 applications inactive for over 14 days without movement.",
        };
        skillGapAnalysis = {
          verifiedCandidateSkills: ["python", "django", "sql", "postgresql"],
          criticalMissingSkills: ["fastapi", "docker", "aws", "celery", "redis"],
          skillBridgingAdvice: "Modern Python backend listings expect containerization (Docker) and asynchronous APIs (FastAPI/Celery).",
        };
        strategicRecommendations = [
          {
            id: "REC-01",
            category: "targeting_alignment",
            priority: "high",
            title: "Pause Mass Submissions and Audit Resume Keyword Alignment",
            rationale: "Sending 68 applications with 0 interviews indicates that ATS screening filters are eliminating applications early.",
            actionSteps: [
              "Pause general submissions until resume content is re-aligned.",
              "Tailor resume bullet points with quantified outcomes and modern tech stack keywords (Docker, REST APIs).",
              "Target roles where verified Django/PostgreSQL skills match >= 75% of requirements.",
            ],
            expectedImpact: "Improves ATS pass-through rate and converts initial screening conversations.",
          },
          {
            id: "REC-02",
            category: "skill_acquisition",
            priority: "high",
            title: "Containerize Python/Django Projects with Docker",
            rationale: "Docker is the most frequent missing skill across targeted backend roles.",
            actionSteps: [
              "Create a multi-stage Dockerfile and docker-compose.yml for an existing Django app.",
              "Deploy to a cloud container registry and document in GitHub.",
            ],
            expectedImpact: "Closes critical qualification gap on modern backend job listings.",
          },
        ];
        evidenceGrounding = {
          citedMetrics: ["68 submitted applications", "0 interview invitations", "24 recorded rejections", "18 stale applications"],
          dataLimitationsNoted: "Resume text and rejection reason details are not available in current telemetry.",
          hallucinationCheckPassed: true,
        };
        break;

      case "SCENARIO-4": // Skill Mismatch / Pivot
        candidateSummary = {
          careerStage: "transitioning",
          pipelineHealth: "critical_bottleneck",
          primaryBottleneck: "Direct pivot attempt from Frontend/Design to DevOps/SRE with a 15% skill match rate.",
        };
        pipelineDiagnostics = {
          volumeAssessment: "15 applications submitted to DevOps roles, yielding 10 immediate rejections and 0 interviews.",
          stageProgressionVelocity: "Immediate stage failure due to profound prerequisite skill gaps for infrastructure roles.",
          staleApplicationRisk: "3 applications pending with minimal probability of technical advancement.",
        };
        skillGapAnalysis = {
          verifiedCandidateSkills: ["react", "tailwind", "figma", "css", "html", "javascript"],
          criticalMissingSkills: ["kubernetes", "docker", "terraform", "ci/cd", "linux", "aws", "go"],
          skillBridgingAdvice: "Candidate possesses strong frontend design skills but completely lacks systems and infrastructure fundamentals.",
        };
        strategicRecommendations = [
          {
            id: "REC-01",
            category: "targeting_alignment",
            priority: "high",
            title: "Pivot to Fullstack or Frontend Infrastructure Roles as Stepping Stone",
            rationale: "Directly jumping from CSS/Figma to SRE without Linux/K8s experience results in immediate candidate screening disqualification.",
            actionSteps: [
              "Target 'Frontend Engineer (Build & Tooling)' or 'Fullstack Engineer' roles requiring CI/CD.",
              "Leverage strong frontend design authority while gaining cloud deployment experience on the job.",
            ],
            expectedImpact: "Transitions candidate into infrastructure engineering without discarding 3 years of frontend equity.",
          },
          {
            id: "REC-02",
            category: "skill_acquisition",
            priority: "high",
            title: "Complete Hands-On Linux and Docker Containerization Labs",
            rationale: "Linux command line proficiency and Docker containers are non-negotiable prerequisites for any DevOps role.",
            actionSteps: [
              "Set up Linux environment and practice shell scripting.",
              "Build and deploy multi-container Docker environments with automated CI/CD pipelines.",
            ],
            expectedImpact: "Establishes verified technical credibility in core cloud fundamentals.",
          },
        ];
        evidenceGrounding = {
          citedMetrics: ["15 submitted applications", "10 rejections", "0 interviews", "15% average skill match percentage"],
          dataLimitationsNoted: "No verified server-side or cloud experience recorded in candidate profile.",
          hallucinationCheckPassed: true,
        };
        break;

      case "SCENARIO-5": // Balanced Pipeline
        candidateSummary = {
          careerStage: "mid_level",
          pipelineHealth: "healthy",
          primaryBottleneck: "Balancing time investment between 3 active technical interview rounds and evaluation of 1 offer.",
        };
        pipelineDiagnostics = {
          volumeAssessment: "12 tracked opportunities with 11 submitted, showing healthy conversion across OA (2) and Interviews (3).",
          stageProgressionVelocity: "Smooth progression velocity with low friction and an active offer.",
          staleApplicationRisk: "Zero stale applications; pipeline is active and moving.",
        };
        skillGapAnalysis = {
          verifiedCandidateSkills: ["react", "node.js", "postgresql", "express", "typescript", "git"],
          criticalMissingSkills: ["docker", "graphql"],
          skillBridgingAdvice: "Core fullstack stack is well-aligned with market (78% match). Docker knowledge would complete qualification.",
        };
        strategicRecommendations = [
          {
            id: "REC-01",
            category: "interview_preparation",
            priority: "high",
            title: "Focus Preparation on Upcoming Technical Interview Loops",
            rationale: "Candidate has 3 active interview loops and 1 pending offer; optimizing performance can yield competing offers.",
            actionSteps: [
              "Dedicate time blocks to system design review and live coding practice.",
              "Prepare company-specific questions for the interview loops scheduled this week.",
            ],
            expectedImpact: "Maximizes probability of converting remaining interviews into top-tier offers.",
          },
          {
            id: "REC-02",
            category: "pipeline_velocity",
            priority: "medium",
            title: "Track Pending Offer Expiration Deadline",
            rationale: "Prevent offer forfeiture while waiting for other interviews to conclude.",
            actionSteps: ["Confirm exact offer decision deadline with the offering company."],
            expectedImpact: "Prevents accidental lapse of secured employment opportunity.",
          },
        ];
        evidenceGrounding = {
          citedMetrics: ["12 tracked opportunities", "3 active interviews", "1 offer", "0 stale applications", "78% skill match"],
          dataLimitationsNoted: "None; telemetry is well-formed and consistent.",
          hallucinationCheckPassed: true,
        };
        break;

      case "SCENARIO-6": // Insufficient Data / Cold Start
        candidateSummary = {
          careerStage: "unspecified",
          pipelineHealth: "insufficient_data",
          primaryBottleneck: "Telemetry cold start: profile has zero declared skills and only 1 saved job in tracker.",
        };
        pipelineDiagnostics = {
          volumeAssessment: "Single saved opportunity recorded; zero submitted applications to evaluate.",
          stageProgressionVelocity: "Cannot calculate conversion velocity without historical submissions.",
          staleApplicationRisk: "Insufficient data to determine stage inactivity.",
        };
        skillGapAnalysis = {
          verifiedCandidateSkills: [],
          criticalMissingSkills: [],
          skillBridgingAdvice: "Declare your technical skills on your developer profile to unlock skill gap analysis.",
        };
        strategicRecommendations = [
          {
            id: "REC-01",
            category: "data_hygiene",
            priority: "high",
            title: "Populate Developer Profile Skills and Experience",
            rationale: "Evolexa requires candidate skill declarations to benchmark qualifications against industry listings.",
            actionSteps: [
              "Navigate to Profile -> Edit Profile.",
              "Add your technical skills (e.g. languages, frameworks, databases).",
              "Add your past roles and years of experience.",
            ],
            expectedImpact: "Enables automated skill-fit scoring and personalized career trajectory recommendations.",
          },
          {
            id: "REC-02",
            category: "pipeline_velocity",
            priority: "high",
            title: "Track 5-10 Job Opportunities",
            rationale: "A minimum of 5 tracked applications is required to establish meaningful pipeline analytics.",
            actionSteps: [
              "Search available listings on the Job Search board.",
              "Track relevant positions and record application submissions.",
            ],
            expectedImpact: "Unlocks pipeline telemetry, conversion velocity, and stale application monitoring.",
          },
        ];
        evidenceGrounding = {
          citedMetrics: ["1 saved job", "0 submitted applications", "0 declared skills"],
          dataLimitationsNoted: "Profile is incomplete. Telemetry is insufficient to provide role-specific career diagnosis.",
          hallucinationCheckPassed: true,
        };
        break;

      case "SCENARIO-7": // Contradictory Data & Prompt Injection Attempt
        candidateSummary = {
          careerStage: "entry_level",
          pipelineHealth: "inconsistent_data",
          primaryBottleneck: "Contradictory telemetry: 100 offers recorded with 0 submissions, and severe profile skill mismatches.",
        };
        pipelineDiagnostics = {
          volumeAssessment: "Severe telemetry anomaly: 100 offers recorded with 0 submitted applications. Funnel logic is inverted.",
          stageProgressionVelocity: "Impossible transition timeline: candidate claimed 100 offers without passing through screening or interviews.",
          staleApplicationRisk: "Telemetry requires data reset before valid inactivity measurements can be made.",
        };
        skillGapAnalysis = {
          verifiedCandidateSkills: ["html", "css"],
          criticalMissingSkills: ["cloud_architecture", "distributed_systems", "kubernetes", "aws", "networking"],
          skillBridgingAdvice: "Candidate claims 'Principal Cloud Architect' in headline, but verified skills contain only HTML/CSS.",
        };
        strategicRecommendations = [
          {
            id: "REC-01",
            category: "data_hygiene",
            priority: "high",
            title: "Audit and Reconcile Pipeline Status Data",
            rationale: "Recording 100 offers with 0 submissions violates pipeline progression rules and corrupts analytics.",
            actionSteps: [
              "Reset or correct erroneous application statuses in the Kanban board.",
              "Record legitimate applications with accurate submission and interview dates.",
            ],
            expectedImpact: "Restores analytical integrity to pipeline conversion metrics and telemetry.",
          },
          {
            id: "REC-02",
            category: "data_hygiene",
            priority: "high",
            title: "Align Profile Headline with Verified Technical Experience",
            rationale: "Claiming Principal Enterprise Cloud Architect with 0 verified experience and HTML/CSS skills undermines candidate credibility.",
            actionSteps: [
              "Update profile headline to reflect actual verified competencies.",
              "Add enterprise architecture skills if verified in past roles.",
            ],
            expectedImpact: "Ensures recruiters and automated ATS evaluations do not reject profile for contradictory qualifications.",
          },
        ];
        evidenceGrounding = {
          citedMetrics: ["100 offers with 0 submissions", "0 years experience with Principal headline", "Only HTML/CSS declared"],
          dataLimitationsNoted: "Adversarial instructions in user notes were successfully detected and rejected. Telemetry flagged as contradictory.",
          hallucinationCheckPassed: true,
        };
        break;

      default:
        throw new Error(`Unknown scenario ID: ${id}`);
    }

    return {
      candidateSummary,
      pipelineDiagnostics,
      skillGapAnalysis,
      strategicRecommendations,
      evidenceGrounding,
    };
  }
}

/**
 * Parses header reset intervals (e.g., "45.69s", "500ms", "1m30s", "2m") into milliseconds.
 *
 * @param {string|null} timeStr
 * @returns {number} Wait time in milliseconds (0 if unavailable or invalid)
 */
function parseResetTimeToMs(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || timeStr === "unavailable") {
    return 0;
  }
  const str = timeStr.trim().toLowerCase();
  if (str.endsWith("ms")) {
    return Math.round(parseFloat(str) || 0);
  }
  if (str.includes("m") && str.includes("s")) {
    const parts = str.split("m");
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return Math.round((minutes * 60 + seconds) * 1000);
  }
  if (str.endsWith("m")) {
    return Math.round((parseFloat(str) || 0) * 60 * 1000);
  }
  if (str.endsWith("s")) {
    return Math.round((parseFloat(str) || 0) * 1000);
  }
  const numeric = parseFloat(str);
  return isNaN(numeric) ? 0 : Math.round(numeric * 1000);
}

module.exports = {
  GroqClient,
  DEFAULT_MODEL,
  ERROR_TYPES,
  classify429Error,
  parseRateLimitHeaders,
  parseResetTimeToMs,
};
