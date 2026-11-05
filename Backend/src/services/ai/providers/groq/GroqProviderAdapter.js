/**
 * @file GroqProviderAdapter.js
 * @description Concrete AI provider adapter for GroqCloud (openai/gpt-oss-120b).
 *
 * Stage 2B.2 — Option C Provider Abstraction Foundation.
 *
 * Capabilities:
 * - Structured Assessment: Native JSON mode decoding for career strategy assessments.
 * - Streaming Chat: Server-Sent Events incremental token streaming.
 * - Rate Limit Telemetry: Comprehensive header extraction and 429 classification.
 * - Execution Boundary: Pre-dispatch abort, deterministic cancellation, safe timeout, leak-free listeners.
 * - Non-Transmission Retry: Max 1 retry strictly for early connection drops; zero retries on ambiguous failures.
 */

const { BaseAiProviderAdapter } = require("../BaseAiProviderAdapter");
const { AI_ERROR_CODES } = require("../../contracts/errors/AiError");
const { AiAuthenticationError } = require("../../contracts/errors/AiAuthenticationError");
const { AiConfigurationError } = require("../../contracts/errors/AiConfigurationError");
const { AiContextWindowExceededError } = require("../../contracts/errors/AiContextWindowExceededError");
const { AiRateLimitError } = require("../../contracts/errors/AiRateLimitError");
const { AiQuotaExhaustedError } = require("../../contracts/errors/AiQuotaExhaustedError");
const { AiCapacityError } = require("../../contracts/errors/AiCapacityError");
const { AiBadGatewayError } = require("../../contracts/errors/AiBadGatewayError");
const { AiGatewayTimeoutError } = require("../../contracts/errors/AiGatewayTimeoutError");
const { AiModelFailureError } = require("../../contracts/errors/AiModelFailureError");
const { AiCancellationError } = require("../../contracts/errors/AiCancellationError");

const { validateCareerAssessmentRequest } = require("../../contracts/dtos/CareerAssessmentRequest.dto");
const { createRawProviderAssessmentOutput } = require("../../contracts/dtos/RawProviderAssessmentOutput.dto");
const { validateChatStreamRequest } = require("../../contracts/dtos/ChatStreamRequest.dto");
const { createChatStreamChunk } = require("../../contracts/dtos/ChatStreamChunk.dto");
const { isVerifiedMinimizedRequest } = require("../../contracts/minimizedRequestRegistry");

const {
  parseGroqRateLimitHeaders,
  classifyGroq429Error,
} = require("./groqRateLimitParser");

const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
const DEFAULT_GROQ_ENDPOINT = "https://api.groq.com/openai/v1";

class GroqProviderAdapter extends BaseAiProviderAdapter {
  /**
   * @param {Object} [options]
   * @param {string} [options.apiKey] - Groq API key (defaults to process.env.GROQ_API_KEY).
   * @param {string} [options.modelIdentifier=DEFAULT_GROQ_MODEL] - Target model ID.
   * @param {string} [options.endpoint=DEFAULT_GROQ_ENDPOINT] - Target base API endpoint.
   * @param {number} [options.timeoutMs=15000] - Execution timeout boundary.
   * @param {Function|null} [options.transport=null] - Optional HTTP transport function for offline testing.
   */
  constructor({
    apiKey = null,
    modelIdentifier = DEFAULT_GROQ_MODEL,
    endpoint = DEFAULT_GROQ_ENDPOINT,
    timeoutMs = 15000,
    transport = null,
  } = {}) {
    const resolvedKey = apiKey || process.env.GROQ_API_KEY || null;

    super({
      providerId: "groq",
      modelIdentifier,
      apiKey: resolvedKey,
      timeoutMs,
      transport,
    });

    this._endpoint = endpoint.replace(/\/+$/, "");
  }

  get capabilities() {
    return {
      structuredAssessment: true,
      streamingChat: true,
      nativeThinking: false,
    };
  }

  get endpoint() {
    return this._endpoint;
  }

  /**
   * Non-generation accessibility check verifying credentials and Groq model catalog visibility.
   *
   * @returns {Promise<import('../../contracts/IAiBaseProvider').EndpointAccessibilityCheck>}
   */
  async verifyAccessibility() {
    const startTime = Date.now();
    try {
      if (!this._apiKey) {
        return {
          isAccessible: false,
          providerId: this.providerId,
          modelIdentifier: this.modelIdentifier,
          latencyMs: 0,
          error: "API credential not configured",
        };
      }

      const response = await this._withExecutionBoundary(
        async (signal) => {
          return this._fetch(`${this._endpoint}/models`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${this._apiKey}`,
              Accept: "application/json",
            },
            signal,
          });
        },
        { timeoutMs: 5000 }
      );

      const latencyMs = Date.now() - startTime;
      if (response.ok) {
        return {
          isAccessible: true,
          providerId: this.providerId,
          modelIdentifier: this.modelIdentifier,
          latencyMs,
          error: null,
        };
      }

      return {
        isAccessible: false,
        providerId: this.providerId,
        modelIdentifier: this.modelIdentifier,
        latencyMs,
        error: `HTTP ${response.status} from Groq endpoint`,
      };
    } catch (err) {
      return {
        isAccessible: false,
        providerId: this.providerId,
        modelIdentifier: this.modelIdentifier,
        latencyMs: Date.now() - startTime,
        error: err.message || "Failed to reach Groq endpoint",
      };
    }
  }

  /**
   * Generates a structured career assessment using Groq JSON mode.
   *
   * @param {import('../../contracts/dtos/CareerAssessmentRequest.dto').CareerAssessmentRequestDTO} request
   * @returns {Promise<import('../../contracts/dtos/RawProviderAssessmentOutput.dto').RawProviderAssessmentOutput>}
   */
  async generateAssessment(request) {
    // 1. Mandatory Telemetry Minimization Boundary Verification (Stage 2B.4A HIGH-02)
    if (!isVerifiedMinimizedRequest(request)) {
      throw new AiConfigurationError(
        "Provider boundary violation: request has not been processed through mandatory telemetry minimizer",
        {
          providerId: this.providerId,
          diagnosticContext: this._buildDiagnosticContext({
            providerId: this.providerId,
            modelIdentifier: this.modelIdentifier,
            reason: "UNMINIMIZED_REQUEST_REJECTED",
          }),
        }
      );
    }

    // 2. Validate DTO constraints
    const validation = validateCareerAssessmentRequest(request);
    if (!validation.isValid) {
      throw new AiConfigurationError(`Invalid CareerAssessmentRequest: ${validation.errors.join("; ")}`, {
        providerId: this.providerId,
        diagnosticContext: this._buildDiagnosticContext({
          providerId: this.providerId,
          modelIdentifier: this.modelIdentifier,
          reason: "REQUEST_VALIDATION_FAILED",
        }),
      });
    }

    if (!this._apiKey) {
      throw new AiAuthenticationError("Groq API key not configured", {
        providerId: this.providerId,
      });
    }

    const effectiveTimeoutMs = request.options?.timeoutMs || this.timeoutMs;
    const callerSignal = request.options?.signal || null;

    // 3. Formulate payload with strictly allowlisted minimized candidate properties
    const systemPrompt =
      "You are the Evolexa Career Strategist engine. Analyze the candidate profile and job pipeline telemetry. " +
      "Return ONLY a valid JSON object matching the requested schema. Do not include markdown codeblocks or preamble.";

    const userPrompt = JSON.stringify({
      candidateProfile: {
        headline: request.candidateProfile.headline,
        yearsOfExperience: request.candidateProfile.yearsOfExperience,
        declaredSkills: request.candidateProfile.declaredSkills,
        targetRoles: request.candidateProfile.targetRoles,
        userNotes: request.candidateProfile.userNotes,
      },
      pipelineTelemetry: {
        trackedOpportunities: request.pipelineTelemetry.trackedOpportunities,
        submittedApplications: request.pipelineTelemetry.submittedApplications,
        savedCount: request.pipelineTelemetry.savedCount,
        activeInPipeline: request.pipelineTelemetry.activeInPipeline,
        interviewsInProgress: request.pipelineTelemetry.interviewsInProgress,
        pendingOffers: request.pipelineTelemetry.pendingOffers,
        cumulativeOffers: request.pipelineTelemetry.cumulativeOffers,
        cumulativeRejections: request.pipelineTelemetry.cumulativeRejections,
        stageDistribution: request.pipelineTelemetry.stageDistribution,
        staleAlerts: request.pipelineTelemetry.staleAlerts,
      },
    });

    const bodyPayload = JSON.stringify({
      model: this.modelIdentifier,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const startTime = Date.now();

    // 3. Dispatch through execution boundary and retry wrapper
    return this._withExecutionBoundary(
      async (boundarySignal) => {
        return this._executeWithRetry(
          async () => {
            const response = await this._fetch(`${this._endpoint}/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this._apiKey}`,
                Accept: "application/json",
                "X-Correlation-ID": request.correlationId || "",
              },
              body: bodyPayload,
              signal: boundarySignal,
            });

            const latencyMs = Date.now() - startTime;
            const rateLimit = parseGroqRateLimitHeaders(response.headers);

            if (!response.ok) {
              const errorText = await response.text().catch(() => "");
              throw this._normalizeGroqHttpError(response.status, errorText, response.headers, {
                attemptCount: 1,
                timeoutMs: effectiveTimeoutMs,
              });
            }

            const rawText = await response.text();
            if (!rawText || rawText.trim().length === 0) {
              throw new AiModelFailureError("Groq returned empty response body", {
                providerId: this.providerId,
              });
            }

            let responseData;
            try {
              responseData = JSON.parse(rawText);
            } catch (err) {
              throw new AiModelFailureError("Failed to parse Groq completion response as JSON", {
                providerId: this.providerId,
                originalError: err,
              });
            }

            const contentText = responseData.choices?.[0]?.message?.content;
            if (!contentText || typeof contentText !== "string") {
              throw new AiModelFailureError("Groq response missing valid completion content", {
                providerId: this.providerId,
              });
            }

            let parsedDomainData;
            try {
              parsedDomainData = JSON.parse(contentText);
            } catch (err) {
              throw new AiModelFailureError("Model completion content is not valid JSON", {
                providerId: this.providerId,
                originalError: err,
              });
            }

            if (!parsedDomainData || typeof parsedDomainData !== "object" || Array.isArray(parsedDomainData)) {
              throw new AiModelFailureError("Model completion JSON must be an object", {
                providerId: this.providerId,
              });
            }

            // Extract telemetry
            const usage = responseData.usage || {};
            const telemetry = {
              providerId: this.providerId,
              modelIdentifier: this.modelIdentifier,
              latencyMs,
              inputTokens: usage.prompt_tokens || null,
              outputTokens: usage.completion_tokens || null,
              totalTokens: usage.total_tokens || null,
              rateLimit,
            };

            return createRawProviderAssessmentOutput({
              rawData: parsedDomainData,
              telemetry,
            });
          },
          { signal: boundarySignal }
        );
      },
      { timeoutMs: effectiveTimeoutMs, callerSignal }
    );
  }

  /**
   * Conversational token streaming via Server-Sent Events (SSE).
   *
   * @param {import('../../contracts/dtos/ChatStreamRequest.dto').ChatStreamRequestDTO} request
   * @returns {Promise<AsyncIterable<import('../../contracts/dtos/ChatStreamChunk.dto').ChatStreamChunkDTO>>}
   */
  async streamChat(request) {
    const validation = validateChatStreamRequest(request);
    if (!validation.isValid) {
      throw new AiConfigurationError(`Invalid ChatStreamRequest: ${validation.errors.join("; ")}`, {
        providerId: this.providerId,
      });
    }

    if (!this._apiKey) {
      throw new AiAuthenticationError("Groq API key not configured", {
        providerId: this.providerId,
      });
    }

    const effectiveTimeoutMs = request.options?.timeoutMs || this.timeoutMs;
    const callerSignal = request.options?.signal || null;

    if (callerSignal?.aborted) {
      throw new AiCancellationError("Stream cancelled by caller prior to dispatch", {
        providerId: this.providerId,
      });
    }

    const bodyPayload = JSON.stringify({
      model: this.modelIdentifier,
      messages: request.messages,
      stream: true,
      max_tokens: request.options?.maxTokens,
    });

    const upstreamAbortController = new AbortController();
    const startTime = Date.now();

    // Hook caller signal to abort upstream reader
    const onCallerAbort = () => {
      upstreamAbortController.abort("CALLER_ABORTED");
    };
    if (callerSignal) {
      callerSignal.addEventListener("abort", onCallerAbort, { once: true });
    }

    let response;
    try {
      // Phase 1: Pre-SSE Handshake
      response = await this._fetch(`${this._endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this._apiKey}`,
          Accept: "text/event-stream",
          "X-Correlation-ID": request.correlationId || "",
        },
        body: bodyPayload,
        signal: upstreamAbortController.signal,
      });
    } catch (err) {
      if (callerSignal) {
        callerSignal.removeEventListener("abort", onCallerAbort);
      }
      if (callerSignal?.aborted || upstreamAbortController.signal.aborted) {
        throw new AiCancellationError("Stream cancelled by caller prior to handshake", {
          providerId: this.providerId,
          originalError: err,
        });
      }
      throw err;
    }

    if (!response.ok) {
      if (callerSignal) {
        callerSignal.removeEventListener("abort", onCallerAbort);
      }
      const errorText = await response.text().catch(() => "");
      throw this._normalizeGroqHttpError(response.status, errorText, response.headers, {
        endpoint: "/chat/completions",
      });
    }

    // Phase 2: Async Generator for SSE Chunks
    const adapter = this;
    async function* generateStreamChunks() {
      let chunkIndex = 0;
      let terminalEmitted = false;
      const rateLimit = parseGroqRateLimitHeaders(response.headers);

      try {
        const body = response.body;
        if (!body) {
          throw new AiModelFailureError("Groq streaming response body is missing", {
            providerId: adapter.providerId,
          });
        }

        // Handle async iteration over readable stream chunks
        let buffer = "";
        for await (const rawChunk of body) {
          if (callerSignal?.aborted || upstreamAbortController.signal.aborted) {
            if (!terminalEmitted) {
              terminalEmitted = true;
              yield createChatStreamChunk({
                chunkIndex: chunkIndex++,
                textDelta: "",
                isComplete: true,
                finishReason: "abort",
              });
            }
            return;
          }

          const chunkStr = typeof rawChunk === "string" ? rawChunk : rawChunk.toString("utf8");
          buffer += chunkStr;

          const lines = buffer.split("\n");
          buffer = lines.pop(); // keep partial trailing line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue; // ignore empty or comment lines

            if (trimmed === "data: [DONE]") {
              if (!terminalEmitted) {
                terminalEmitted = true;
                const latencyMs = Date.now() - startTime;
                yield createChatStreamChunk({
                  chunkIndex: chunkIndex++,
                  textDelta: "",
                  isComplete: true,
                  finishReason: "stop",
                  telemetry: {
                    providerId: adapter.providerId,
                    modelIdentifier: adapter.modelIdentifier,
                    latencyMs,
                    rateLimit,
                  },
                });
              }
              return;
            }

            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                const deltaText = parsed.choices?.[0]?.delta?.content || "";
                const finishReason = parsed.choices?.[0]?.finish_reason || null;

                if (deltaText || finishReason) {
                  const isFinal = Boolean(finishReason);
                  if (isFinal) terminalEmitted = true;

                  yield createChatStreamChunk({
                    chunkIndex: chunkIndex++,
                    textDelta: deltaText,
                    isComplete: isFinal,
                    finishReason,
                  });

                  if (isFinal) return;
                }
              } catch {
                // Malformed SSE JSON line ignored safely without crashing stream
              }
            }
          }
        }

        // If stream ended without explicit [DONE]
        if (!terminalEmitted) {
          terminalEmitted = true;
          yield createChatStreamChunk({
            chunkIndex: chunkIndex++,
            textDelta: "",
            isComplete: true,
            finishReason: "stop",
          });
        }
      } catch (err) {
        if (!terminalEmitted) {
          terminalEmitted = true;
          if (callerSignal?.aborted) {
            yield createChatStreamChunk({
              chunkIndex: chunkIndex++,
              textDelta: "",
              isComplete: true,
              finishReason: "abort",
            });
          } else {
            yield createChatStreamChunk({
              chunkIndex: chunkIndex++,
              textDelta: "",
              isComplete: true,
              finishReason: "error",
            });
          }
        }
      } finally {
        if (callerSignal) {
          callerSignal.removeEventListener("abort", onCallerAbort);
        }
        if (response.body) {
          try {
            if (typeof response.body.cancel === "function") {
              // Web ReadableStream cancellation (native fetch)
              response.body.cancel().catch(() => {});
            } else if (typeof response.body.destroy === "function") {
              // Node.js Stream fallback
              response.body.destroy();
            }
          } catch (_) {
            // Ignore synchronous cancellation errors
          }
        }
      }
    }

    return generateStreamChunks();
  }

  /**
   * Normalizes raw Groq HTTP error responses into the approved AiError taxonomy.
   *
   * @private
   * @param {number} status - HTTP status code.
   * @param {string} errorBody - Response body text.
   * @param {any} headers - Response headers.
   * @param {Object} [extraContext] - Safe diagnostic fields.
   * @returns {AiError}
   */
  _normalizeGroqHttpError(status, errorBody, headers, extraContext = {}) {
    const diag = this._buildDiagnosticContext({
      providerId: this.providerId,
      modelIdentifier: this.modelIdentifier,
      statusCode: status,
      ...extraContext,
    });

    if (status === 401 || status === 403) {
      return new AiAuthenticationError("Groq authentication failed: invalid or expired API key", {
        providerId: this.providerId,
        statusCode: status,
        diagnosticContext: diag,
      });
    }

    if (status === 400) {
      const lower = (errorBody || "").toLowerCase();
      if (lower.includes("context_length_exceeded") || lower.includes("context window")) {
        return new AiContextWindowExceededError("Prompt token length exceeds Groq model context window", {
          providerId: this.providerId,
          diagnosticContext: diag,
        });
      }
      return new AiConfigurationError("Groq API rejected request parameters", {
        providerId: this.providerId,
        diagnosticContext: diag,
      });
    }

    if (status === 429) {
      const classification = classifyGroq429Error(status, errorBody, headers);
      if (classification.code === AI_ERROR_CODES.QUOTA_EXHAUSTED) {
        return new AiQuotaExhaustedError("Groq daily or credit quota has been exhausted", {
          providerId: this.providerId,
          diagnosticContext: diag,
        });
      }
      return new AiRateLimitError("Groq rate limit exceeded (transient TPM/RPM)", {
        providerId: this.providerId,
        diagnosticContext: diag,
      });
    }

    if (status === 502) {
      return new AiBadGatewayError("Groq gateway returned HTTP 502 Bad Gateway", {
        providerId: this.providerId,
        diagnosticContext: diag,
      });
    }

    if (status === 503) {
      return new AiCapacityError("Groq model capacity temporarily unavailable (HTTP 503)", {
        providerId: this.providerId,
        diagnosticContext: diag,
      });
    }

    if (status === 504) {
      return new AiGatewayTimeoutError("Groq upstream gateway timed out (HTTP 504)", {
        providerId: this.providerId,
        diagnosticContext: diag,
      });
    }

    return new AiBadGatewayError(`Groq returned unexpected HTTP status ${status}`, {
      providerId: this.providerId,
      statusCode: status,
      diagnosticContext: diag,
    });
  }
}

module.exports = {
  GroqProviderAdapter,
  DEFAULT_GROQ_MODEL,
  DEFAULT_GROQ_ENDPOINT,
};
