/**
 * @file groqProviderAdapter.test.js
 * @description Comprehensive automated test suite for Stage 2B.2 Base & Groq Provider Adapters.
 *
 * Execution: Strictly OFFLINE / Mocked HTTP Transport Only.
 * Zero live API calls, zero quota consumed, zero external network traffic.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");

const {
  BaseAiProviderAdapter,
  GroqProviderAdapter,
  DEFAULT_GROQ_MODEL,
  DEFAULT_GROQ_ENDPOINT,
  parseResetTimeToMs,
  parseGroqRateLimitHeaders,
  classifyGroq429Error,
  isAiBaseProvider,
  isStructuredAssessmentProvider,
  isStreamingChatProvider,
  AiError,
  AI_ERROR_CODES,
  AiAuthenticationError,
  AiConfigurationError,
  AiContextWindowExceededError,
  AiRateLimitError,
  AiQuotaExhaustedError,
  AiCapacityError,
  AiBadGatewayError,
  AiGatewayTimeoutError,
  AiModelFailureError,
  AiCancellationError,
  AiTimeoutError,
  AiNetworkError,
  minimizeCareerAssessmentTelemetry,
} = require("../../src/services/ai");

// Helper: standard valid CareerAssessmentRequest fixture processed through minimizer
const createValidAssessmentRequest = (overrides = {}) => {
  const raw = {
    correlationId: "corr-test-123e4567-e89b",
    candidateProfile: {
      headline: "Senior Cloud Engineer",
      yearsOfExperience: 7,
      declaredSkills: ["Go", "Kubernetes", "AWS", "Terraform"],
      targetRoles: ["Cloud Architect", "Staff DevOps Engineer"],
      userNotes: "Prefers remote or hybrid distributed systems roles.",
    },
    pipelineTelemetry: {
      trackedOpportunities: 10,
      submittedApplications: 6,
      savedCount: 4,
      activeInPipeline: 3,
      interviewsInProgress: 1,
      pendingOffers: 1,
      cumulativeOffers: 1,
      cumulativeRejections: 1,
      stageDistribution: [
        { status: "Applied", count: 2 },
        { status: "Interview", count: 1 },
      ],
      staleAlerts: {
        staleCount: 1,
        thresholdDays: 14,
      },
    },
    options: {},
    ...overrides,
  };
  return minimizeCareerAssessmentTelemetry(raw).minimizedRequest;
};

// Helper: create mock HTTP Response
function createMockResponse({
  status = 200,
  ok = true,
  headers = {},
  bodyText = "",
  bodyStream = null,
}) {
  const headerMap = new Map();
  for (const [k, v] of Object.entries(headers)) {
    headerMap.set(k.toLowerCase(), String(v));
  }

  return {
    status,
    ok,
    headers: {
      get: (name) => headerMap.get(name.toLowerCase()) || null,
      entries: () => headerMap.entries(),
    },
    text: async () => bodyText,
    json: async () => JSON.parse(bodyText),
    body: bodyStream,
  };
}

// ============================================================================
// 1. BASE AI PROVIDER ADAPTER TESTS
// ============================================================================
describe("1. BaseAiProviderAdapter (Shared Core Mechanics)", () => {
  class TestAdapter extends BaseAiProviderAdapter {
    get capabilities() {
      return { structuredAssessment: true, streamingChat: true, nativeThinking: false };
    }
    async verifyAccessibility() {
      return { isAccessible: true, providerId: this.providerId, modelIdentifier: this.modelIdentifier, latencyMs: 5, error: null };
    }
  }

  it("validates required configuration on construction", () => {
    assert.throws(
      () => new TestAdapter({ providerId: "", modelIdentifier: "model-1" }),
      (err) => err instanceof AiConfigurationError && err.message.includes("providerId")
    );
    assert.throws(
      () => new TestAdapter({ providerId: "test", modelIdentifier: "" }),
      (err) => err instanceof AiConfigurationError && err.message.includes("modelIdentifier")
    );
    assert.throws(
      () => new TestAdapter({ providerId: "test", modelIdentifier: "model-1", timeoutMs: -50 }),
      (err) => err instanceof AiConfigurationError && err.message.includes("timeoutMs")
    );
  });

  it("safely masks credentials via getMaskedKey() without fragment leakage", () => {
    const adapterWithKey = new TestAdapter({
      providerId: "test",
      modelIdentifier: "m1",
      apiKey: "gsk_superSecretApiKey1234567890",
    });
    assert.equal(adapterWithKey.getMaskedKey(), "[CONFIGURED_PROTECTED]");

    const adapterWithoutKey = new TestAdapter({
      providerId: "test",
      modelIdentifier: "m1",
      apiKey: null,
    });
    assert.equal(adapterWithoutKey.getMaskedKey(), null);
  });

  it("enforces safe diagnostic allowlisting and discards arbitrary objects/PII", () => {
    const adapter = new TestAdapter({ providerId: "test", modelIdentifier: "m1" });
    const rawContext = {
      providerId: "test",
      modelIdentifier: "m1",
      statusCode: 429,
      timeoutMs: 15000,
      endpoint: "/chat/completions",
      attemptCount: 1,
      // Unallowlisted fields that must be scrubbed:
      apiKey: "secret_token_123",
      userPrompt: "Sensitive candidate data: Jane Doe",
      rawHeaders: { Authorization: "Bearer xyz" },
      nestedObject: { foo: "bar" },
    };

    const sanitized = adapter._buildDiagnosticContext(rawContext);
    assert.equal(sanitized.providerId, "test");
    assert.equal(sanitized.statusCode, 429);
    assert.equal(sanitized.timeoutMs, 15000);
    assert.equal(sanitized.endpoint, "/chat/completions");
    assert.equal(sanitized.attemptCount, 1);

    // Verify unapproved fields are stripped
    assert.equal(sanitized.apiKey, undefined);
    assert.equal(sanitized.userPrompt, undefined);
    assert.equal(sanitized.rawHeaders, undefined);
    assert.equal(sanitized.nestedObject, undefined);
  });

  it("handles circular references in diagnostic context safely without crashing", () => {
    const adapter = new TestAdapter({ providerId: "test", modelIdentifier: "m1" });
    const circularObj = {
      providerId: "test",
      statusCode: 500,
    };
    circularObj.self = circularObj; // circular reference

    const sanitized = adapter._buildDiagnosticContext(circularObj);
    assert.equal(sanitized.providerId, "test");
    assert.equal(sanitized.statusCode, 500);
    assert.equal(sanitized.self, undefined); // omitted since it is an object
  });

  it("execution boundary enforces pre-dispatch cancellation without executing function", async () => {
    const adapter = new TestAdapter({ providerId: "test", modelIdentifier: "m1" });
    const controller = new AbortController();
    controller.abort(); // already aborted

    let executed = false;
    await assert.rejects(
      adapter._withExecutionBoundary(async () => {
        executed = true;
        return "success";
      }, { callerSignal: controller.signal }),
      (err) => {
        assert.ok(err instanceof AiCancellationError);
        assert.equal(err.statusCode, 499);
        return true;
      }
    );

    assert.equal(executed, false, "Must never dispatch if caller signal is already aborted");
  });

  it("execution boundary distinguishes timeout (504) from caller cancellation (499)", async () => {
    const adapter = new TestAdapter({ providerId: "test", modelIdentifier: "m1" });

    // 1. Timeout
    await assert.rejects(
      adapter._withExecutionBoundary(async (signal) => {
        return new Promise((resolve) => setTimeout(resolve, 150));
      }, { timeoutMs: 30 }),
      (err) => {
        assert.ok(err instanceof AiTimeoutError);
        assert.equal(err.statusCode, 504);
        return true;
      }
    );

    // 2. Cancellation
    const controller = new AbortController();
    const runPromise = adapter._withExecutionBoundary(async (signal) => {
      return new Promise((resolve) => setTimeout(resolve, 200));
    }, { timeoutMs: 1000, callerSignal: controller.signal });

    setTimeout(() => controller.abort(), 20);

    await assert.rejects(runPromise, (err) => {
      assert.ok(err instanceof AiCancellationError);
      assert.equal(err.statusCode, 499);
      return true;
    });
  });

  it("execution boundary gives deterministic precedence to caller cancellation during race", async () => {
    const adapter = new TestAdapter({ providerId: "test", modelIdentifier: "m1" });
    const controller = new AbortController();

    const runPromise = adapter._withExecutionBoundary(async (signal) => {
      return new Promise((resolve) => setTimeout(resolve, 300));
    }, { timeoutMs: 40, callerSignal: controller.signal });

    setTimeout(() => controller.abort(), 40);

    await assert.rejects(runPromise, (err) => {
      assert.ok(err instanceof AiCancellationError || err instanceof AiTimeoutError);
      return true;
    });
  });

  it("execution boundary cleans up caller abort listener on timeout paths (no memory leak)", async () => {
    const adapter = new TestAdapter({ providerId: "test", modelIdentifier: "m1" });
    const emitter = new EventEmitter();
    const callerSignal = {
      aborted: false,
      listenersCount: 0,
      addEventListener(event, fn) {
        this.listenersCount++;
        emitter.on(event, fn);
      },
      removeEventListener(event, fn) {
        this.listenersCount--;
        emitter.removeListener(event, fn);
      },
    };

    await assert.rejects(
      adapter._withExecutionBoundary(async () => {
        return new Promise((r) => setTimeout(r, 100));
      }, { timeoutMs: 25, callerSignal }),
      (err) => err instanceof AiTimeoutError
    );

    // Verify listener was removed in finally block
    assert.equal(callerSignal.listenersCount, 0, "Caller abort listener must be cleaned up in finally");
  });

  it("suppresses retry on ambiguous failures, timeouts, and HTTP errors", async () => {
    const adapter = new TestAdapter({ providerId: "test", modelIdentifier: "m1" });

    assert.equal(adapter._isNonTransmissionError({ code: "ECONNREFUSED" }), true);
    assert.equal(adapter._isNonTransmissionError({ code: "ENOTFOUND" }), true);

    // Ambiguous midstream disconnects or timeouts must NOT be classified as non-transmission
    assert.equal(adapter._isNonTransmissionError({ code: "ECONNRESET" }), false);
    assert.equal(adapter._isNonTransmissionError({ code: "ETIMEDOUT" }), false);
    assert.equal(adapter._isNonTransmissionError(new AiBadGatewayError()), false);
    assert.equal(adapter._isNonTransmissionError(new AiCapacityError()), false);
    assert.equal(adapter._isNonTransmissionError(new AiCancellationError()), false);
  });

  it("_executeWithRetry retries exactly once on ECONNREFUSED then propagates", async () => {
    const adapter = new TestAdapter({ providerId: "test", modelIdentifier: "m1" });
    let attempts = 0;

    await assert.rejects(
      adapter._executeWithRetry(async (attempt) => {
        attempts++;
        const err = new Error("Connection refused");
        err.code = "ECONNREFUSED";
        throw err;
      }),
      (err) => err instanceof AiNetworkError
    );

    // Initial attempt (0) + 1 retry (1) = 2 attempts total
    assert.equal(attempts, 2, "Must retry exactly once on proven non-transmission failure");
  });
});

// ============================================================================
// 2. GROQ RATE LIMIT PARSER TESTS
// ============================================================================
describe("2. Groq Rate Limit Parser (Telemetry & 429 Classification)", () => {
  it("parses reset duration strings across all formats to milliseconds", () => {
    assert.equal(parseResetTimeToMs("2s"), 2000);
    assert.equal(parseResetTimeToMs("1m30s"), 90000);
    assert.equal(parseResetTimeToMs("6m0s"), 360000);
    assert.equal(parseResetTimeToMs("500ms"), 500);
    assert.equal(parseResetTimeToMs("1h"), 3600000);
    assert.equal(parseResetTimeToMs("2.5s"), 2500);
    assert.equal(parseResetTimeToMs("5"), 5000); // numeric string
    assert.equal(parseResetTimeToMs(3), 3000); // numeric
    assert.equal(parseResetTimeToMs(null), null);
    assert.equal(parseResetTimeToMs("invalid"), null);
  });

  it("extracts all standard Groq rate limit headers when present", () => {
    const headers = {
      "x-ratelimit-limit-requests": "1000",
      "x-ratelimit-remaining-requests": "995",
      "x-ratelimit-reset-requests": "2s",
      "x-ratelimit-limit-tokens": "8000",
      "x-ratelimit-remaining-tokens": "7200",
      "x-ratelimit-reset-tokens": "1m15s",
    };

    const telemetry = parseGroqRateLimitHeaders(headers);
    assert.equal(telemetry.limitRequests, 1000);
    assert.equal(telemetry.remainingRequests, 995);
    assert.equal(telemetry.resetRequestsMs, 2000);
    assert.equal(telemetry.limitTokens, 8000);
    assert.equal(telemetry.remainingTokens, 7200);
    assert.equal(telemetry.resetTokensMs, 75000);
  });

  it("handles missing or malformed rate limit headers gracefully", () => {
    const telemetry = parseGroqRateLimitHeaders({});
    assert.equal(telemetry.limitRequests, null);
    assert.equal(telemetry.remainingRequests, null);
    assert.equal(telemetry.resetRequestsMs, null);
    assert.equal(telemetry.limitTokens, null);

    const malformed = parseGroqRateLimitHeaders({
      "x-ratelimit-limit-requests": "notANumber",
      "x-ratelimit-reset-requests": "garbage",
    });
    assert.equal(malformed.limitRequests, null);
    assert.equal(malformed.resetRequestsMs, null);
  });

  it("classifies transient TPM limits as RATE_LIMITED", () => {
    const errorBody = {
      error: {
        message: "Rate limit reached for model `openai/gpt-oss-120b` in organization `org-123` on tokens per minute (TPM): Limit 8000, Used 7950, Requested 300. Please try again in 4.5s.",
      },
    };
    const classification = classifyGroq429Error(429, errorBody, { "retry-after": "5" });
    assert.equal(classification.code, AI_ERROR_CODES.RATE_LIMITED);
    assert.equal(classification.retryAfterMs, 5000);
  });

  it("classifies explicit daily or credit exhaustion as QUOTA_EXHAUSTED", () => {
    const errorBody = {
      error: {
        message: "You have exceeded your daily request limit of 14400 requests per day (RPD). Please wait until midnight UTC.",
      },
    };
    const classification = classifyGroq429Error(429, errorBody);
    assert.equal(classification.code, AI_ERROR_CODES.QUOTA_EXHAUSTED);
  });

  it("strips documentation URLs to prevent false-positive daily quota classification", () => {
    // Message contains a doc link with 'quota' word, but is actually a transient TPM limit
    const errorBody = {
      error: {
        message: "Rate limit reached on tokens per minute (TPM). For details visit https://console.groq.com/docs/rate-limits-and-daily-quotas",
      },
    };
    const classification = classifyGroq429Error(429, errorBody);
    assert.equal(classification.code, AI_ERROR_CODES.RATE_LIMITED);
  });

  it("defaults ambiguous 429 errors to RATE_LIMITED without false daily quota claims", () => {
    const errorBody = { error: { message: "Too many requests" } };
    const classification = classifyGroq429Error(429, errorBody);
    assert.equal(classification.code, AI_ERROR_CODES.RATE_LIMITED);
  });
});

// ============================================================================
// 3. GROQ PROVIDER ADAPTER STRUCTURED ASSESSMENT TESTS
// ============================================================================
describe("3. GroqProviderAdapter (Structured Assessment & Error Mapping)", () => {
  it("satisfies Option C conformance helpers (isAiBaseProvider, isStructuredAssessmentProvider, isStreamingChatProvider)", () => {
    const adapter = new GroqProviderAdapter({ apiKey: "gsk_testKey123" });
    assert.equal(isAiBaseProvider(adapter), true);
    assert.equal(isStructuredAssessmentProvider(adapter), true);
    assert.equal(isStreamingChatProvider(adapter), true);
  });

  it("verifyAccessibility reports success on 200 OK without making external calls", async () => {
    const mockTransport = async (url, init) => {
      assert.ok(url.endsWith("/models"));
      assert.equal(init.method, "GET");
      assert.ok(init.headers.Authorization.startsWith("Bearer "));
      return createMockResponse({ status: 200, ok: true, bodyText: JSON.stringify({ data: [{ id: "openai/gpt-oss-120b" }] }) });
    };

    const adapter = new GroqProviderAdapter({
      apiKey: "gsk_testKey123",
      transport: mockTransport,
    });

    const check = await adapter.verifyAccessibility();
    assert.equal(check.isAccessible, true);
    assert.equal(check.providerId, "groq");
    assert.equal(check.modelIdentifier, DEFAULT_GROQ_MODEL);
    assert.equal(check.error, null);
  });

  it("generateAssessment succeeds with valid structured response and separate telemetry", async () => {
    const mockAssessmentPayload = {
      candidateSummary: {
        careerStage: "senior",
        pipelineHealth: "healthy",
        primaryBottleneck: "interview_conversion",
      },
      pipelineDiagnostics: {
        volumeAssessment: "Sufficient search volume",
        stageProgressionVelocity: "Healthy progression from application to interview",
        staleApplicationRisk: "Low",
      },
      skillGapAnalysis: {
        verifiedCandidateSkills: ["Go", "Kubernetes"],
        criticalMissingSkills: ["Rust"],
        skillBridgingAdvice: "Focus on systems programming projects",
      },
      strategicRecommendations: [
        {
          id: "REC-01",
          category: "targeting_alignment",
          priority: "high",
          title: "Target Staff Systems Roles",
          rationale: "Skills match infrastructure demands",
          actionSteps: ["Refactor resume"],
          expectedImpact: "Higher callback rate",
        },
      ],
      evidenceGrounding: {
        citedMetrics: ["6 submitted applications", "1 active interview"],
        dataLimitationsNoted: "No historical rejection notes available",
      },
    };

    const mockTransport = async (url, init) => {
      assert.ok(url.endsWith("/chat/completions"));
      assert.equal(init.method, "POST");

      const body = JSON.parse(init.body);
      assert.equal(body.model, DEFAULT_GROQ_MODEL);
      assert.equal(body.response_format.type, "json_object");

      return createMockResponse({
        status: 200,
        ok: true,
        headers: {
          "x-ratelimit-remaining-tokens": "7500",
          "x-ratelimit-reset-tokens": "2.5s",
        },
        bodyText: JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(mockAssessmentPayload),
              },
            },
          ],
          usage: {
            prompt_tokens: 420,
            completion_tokens: 280,
            total_tokens: 700,
          },
        }),
      });
    };

    const adapter = new GroqProviderAdapter({
      apiKey: "gsk_testKey123",
      transport: mockTransport,
    });

    const result = await adapter.generateAssessment(createValidAssessmentRequest());

    // Domain data matches
    assert.equal(result.rawData.candidateSummary.careerStage, "senior");
    assert.equal(result.rawData.strategicRecommendations.length, 1);

    // Telemetry separated cleanly
    assert.equal(result.telemetry.providerId, "groq");
    assert.equal(result.telemetry.modelIdentifier, DEFAULT_GROQ_MODEL);
    assert.equal(result.telemetry.totalTokens, 700);
    assert.equal(result.telemetry.rateLimit.remainingTokens, 7500);
  });

  it("generateAssessment throws AiModelFailureError on empty response or malformed JSON", async () => {
    // 1. Empty body
    const adapterEmpty = new GroqProviderAdapter({
      apiKey: "gsk_testKey123",
      transport: async () => createMockResponse({ status: 200, ok: true, bodyText: "" }),
    });
    await assert.rejects(
      adapterEmpty.generateAssessment(createValidAssessmentRequest()),
      (err) => err instanceof AiModelFailureError && err.statusCode === 502
    );

    // 2. Corrupted JSON completion
    const adapterCorrupt = new GroqProviderAdapter({
      apiKey: "gsk_testKey123",
      transport: async () =>
        createMockResponse({
          status: 200,
          ok: true,
          bodyText: JSON.stringify({
            choices: [{ message: { content: "This is not valid JSON at all!" } }],
          }),
        }),
    });
    await assert.rejects(
      adapterCorrupt.generateAssessment(createValidAssessmentRequest()),
      (err) => err instanceof AiModelFailureError && err.statusCode === 502
    );
  });

  it("normalizes HTTP error codes correctly into AiError taxonomy", async () => {
    const testCases = [
      { status: 401, body: "Invalid API Key", expectedClass: AiAuthenticationError, expectedStatus: 401 },
      { status: 400, body: "context_length_exceeded", expectedClass: AiContextWindowExceededError, expectedStatus: 400 },
      { status: 400, body: "bad parameter", expectedClass: AiConfigurationError, expectedStatus: 400 },
      { status: 429, body: "tokens per minute rate limit exceeded", expectedClass: AiRateLimitError, expectedStatus: 429 },
      { status: 429, body: "daily request limit reached", expectedClass: AiQuotaExhaustedError, expectedStatus: 429 },
      { status: 502, body: "Bad Gateway", expectedClass: AiBadGatewayError, expectedStatus: 502 },
      { status: 503, body: "Capacity Unavailable", expectedClass: AiCapacityError, expectedStatus: 503 },
      { status: 504, body: "Gateway Timeout", expectedClass: AiGatewayTimeoutError, expectedStatus: 504 },
    ];

    for (const tc of testCases) {
      const adapter = new GroqProviderAdapter({
        apiKey: "gsk_testKey123",
        transport: async () => createMockResponse({ status: tc.status, ok: false, bodyText: tc.body }),
      });

      await assert.rejects(
        adapter.generateAssessment(createValidAssessmentRequest()),
        (err) => {
          assert.ok(err instanceof tc.expectedClass, `Expected ${tc.expectedClass.name} for status ${tc.status}`);
          assert.equal(err.statusCode, tc.expectedStatus);
          return true;
        }
      );
    }
  });

  it("prevents credential leakage in normalized public error serialization", async () => {
    const adapter = new GroqProviderAdapter({
      apiKey: "gsk_secretKeyShouldNotAppearInClient",
      transport: async () =>
        createMockResponse({
          status: 401,
          ok: false,
          bodyText: JSON.stringify({ error: { message: "Invalid key gsk_secretKeyShouldNotAppearInClient" } }),
        }),
    });

    try {
      await adapter.generateAssessment(createValidAssessmentRequest());
      assert.fail("Should have thrown");
    } catch (err) {
      assert.ok(err instanceof AiAuthenticationError);
      const publicJson = err.toPublicJson("corr-trace-999");

      // Verify safe public message
      assert.equal(publicJson.error.code, "AI_AUTHENTICATION_ERROR");
      assert.equal(publicJson.error.statusCode, 401);
      assert.equal(publicJson.error.correlationId, "corr-trace-999");
      assert.ok(!JSON.stringify(publicJson).includes("gsk_secretKeyShouldNotAppearInClient"));
    }
  });
});

// ============================================================================
// 4. STREAMING CHAT CAPABILITY TESTS
// ============================================================================
describe("4. GroqProviderAdapter (Conversational Streaming Chat)", () => {
  const createValidChatRequest = (overrides = {}) => ({
    correlationId: "chat-corr-uuid",
    messages: [
      { role: "system", content: "You are a career assistant." },
      { role: "user", content: "Help me optimize my backend resume." },
    ],
    options: {},
    ...overrides,
  });

  it("pre-handshake failure throws normalized AiError before returning stream", async () => {
    const adapter = new GroqProviderAdapter({
      apiKey: "gsk_testKey123",
      transport: async () =>
        createMockResponse({
          status: 429,
          ok: false,
          bodyText: JSON.stringify({ error: { message: "Rate limit reached on TPM" } }),
        }),
    });

    await assert.rejects(
      adapter.streamChat(createValidChatRequest()),
      (err) => err instanceof AiRateLimitError && err.statusCode === 429
    );
  });

  it("yields ordered chunks and emits exactly one terminal event on clean [DONE]", async () => {
    const sseLines = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
      "data: [DONE]\n\n",
    ];

    async function* mockStreamBody() {
      for (const line of sseLines) {
        yield Buffer.from(line, "utf8");
      }
    }

    const adapter = new GroqProviderAdapter({
      apiKey: "gsk_testKey123",
      transport: async () =>
        createMockResponse({
          status: 200,
          ok: true,
          headers: { "x-ratelimit-remaining-tokens": "7800" },
          bodyStream: mockStreamBody(),
        }),
    });

    const stream = await adapter.streamChat(createValidChatRequest());
    const receivedChunks = [];

    for await (const chunk of stream) {
      receivedChunks.push(chunk);
    }

    assert.equal(receivedChunks.length, 4);

    // Chunk ordering and delta text
    assert.equal(receivedChunks[0].chunkIndex, 0);
    assert.equal(receivedChunks[0].textDelta, "Hello");
    assert.equal(receivedChunks[0].isComplete, false);

    assert.equal(receivedChunks[1].chunkIndex, 1);
    assert.equal(receivedChunks[1].textDelta, " world");

    assert.equal(receivedChunks[2].chunkIndex, 2);
    assert.equal(receivedChunks[2].textDelta, "!");

    // Terminal chunk
    assert.equal(receivedChunks[3].chunkIndex, 3);
    assert.equal(receivedChunks[3].isComplete, true);
    assert.equal(receivedChunks[3].finishReason, "stop");
    assert.equal(receivedChunks[3].telemetry.providerId, "groq");
  });

  it("emits abort terminal event and cleans up upstream reader on caller cancellation", async () => {
    let readerCancelled = false;

    async function* cancellableStream() {
      yield Buffer.from('data: {"choices":[{"delta":{"content":"Starting"}}]}\n\n', "utf8");
      // Simulate delay
      await new Promise((r) => setTimeout(r, 60));
      yield Buffer.from('data: {"choices":[{"delta":{"content":"Never reached"}}]}\n\n', "utf8");
    }

    const mockBody = cancellableStream();
    mockBody.destroy = () => {
      readerCancelled = true;
    };

    const controller = new AbortController();
    const adapter = new GroqProviderAdapter({
      apiKey: "gsk_testKey123",
      transport: async () => createMockResponse({ status: 200, ok: true, bodyStream: mockBody }),
    });

    const stream = await adapter.streamChat(createValidChatRequest({ options: { signal: controller.signal } }));
    const receivedChunks = [];

    for await (const chunk of stream) {
      receivedChunks.push(chunk);
      if (chunk.chunkIndex === 0) {
        // Abort immediately after receiving first chunk
        controller.abort();
      }
    }

    const finalChunk = receivedChunks[receivedChunks.length - 1];
    assert.equal(finalChunk.isComplete, true);
    assert.equal(finalChunk.finishReason, "abort");
    assert.equal(readerCancelled, true, "Upstream body must be destroyed on abort");
  });

  it("handles malformed SSE lines without breaking the stream", async () => {
    const sseLines = [
      'data: {"choices":[{"delta":{"content":"Valid chunk"}}]}\n\n',
      "data: corrupted_non_json_line\n\n",
      ": keepalive comment\n\n",
      'data: {"choices":[{"delta":{"content":" after corruption"}}]}\n\n',
      "data: [DONE]\n\n",
    ];

    async function* corruptStream() {
      for (const line of sseLines) {
        yield Buffer.from(line, "utf8");
      }
    }

    const adapter = new GroqProviderAdapter({
      apiKey: "gsk_testKey123",
      transport: async () => createMockResponse({ status: 200, ok: true, bodyStream: corruptStream() }),
    });

    const stream = await adapter.streamChat(createValidChatRequest());
    const textDeltas = [];

    for await (const chunk of stream) {
      if (chunk.textDelta) textDeltas.push(chunk.textDelta);
    }

    assert.equal(textDeltas.join(""), "Valid chunk after corruption");
  });
});
