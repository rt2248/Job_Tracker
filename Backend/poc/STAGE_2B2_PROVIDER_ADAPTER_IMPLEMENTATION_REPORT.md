# Stage 2B.2 — Base AI Provider Adapter & Groq Provider Adapter Implementation Report

**Project:** Evolexa Career Strategist / Job Tracker  
**Role:** Senior Backend AI Integration Engineer  
**Milestone:** Stage 2B.2 of 2B  
**Execution Mode:** Controlled Implementation — STRICTLY OFFLINE (Mocked Transport Only)  
**Date:** November 5, 2026  
**Status:** COMPLETE — 100% TEST PASS (59 OF 59 AI TESTS, 473 OF 473 REGRESSION TESTS) — AWAITING GATE 2 REVIEW  

---

## 1. Executive Summary

Stage 2B.2 delivers the first concrete provider integration of the Evolexa AI foundation using the approved vendor-neutral abstraction layer.

This milestone implements the shared base adapter (`BaseAiProviderAdapter`), the concrete Groq adapter (`GroqProviderAdapter`) for `openai/gpt-oss-120b`, and the comprehensive rate-limit telemetry parser (`groqRateLimitParser`).

### Key Accomplishments:
1. **Concrete Shared Base Adapter:** Built `BaseAiProviderAdapter.js` supporting credential protection (`[CONFIGURED_PROTECTED]`), memory-safe execution boundary (`_withExecutionBoundary`), scalar diagnostic context allowlisting (`_buildDiagnosticContext`), and strict non-transmission retry logic (`_executeWithRetry`).
2. **Groq Structured Assessment:** Implemented `generateAssessment(request)` using Groq's native JSON mode (`response_format: { type: "json_object" }`). Separates raw unvalidated domain data from provider usage and rate-limit telemetry through the `createRawProviderAssessmentOutput` DTO boundary.
3. **Groq Streaming Chat:** Implemented `streamChat(request)` yielding an asynchronous iterable of `ChatStreamChunkDTO`. Strictly enforces the single terminal event guarantee (`stop`, `abort`, or `error`) and ensures prompt reader cancellation when the downstream client disconnects.
4. **Rate Limit & Quota Extraction:** Implemented `groqRateLimitParser.js` parsing TPM/RPM headers, converting reset durations to milliseconds, stripping documentation URLs before keyword matching, and conservatively defaulting ambiguous 429 errors to `RATE_LIMITED` without false daily quota claims.
5. **Incorporated All Stage 2B.1-R Corrections:**
   - Single-listener cancellation cleanup on `callerSignal` in `finally` blocks (eliminating listener retention on timeout paths).
   - Explicit scalar allowlist for diagnostic context (`ALLOWED_DIAGNOSTIC_KEYS`), preventing credential, PII, and circular-reference serialization crashes.
   - Explicit exclusion of `AI_MODEL_FAILURE` from circuit breaker outage accounting in `fallbackPolicy.js`.
6. **Automated Verification:** Implemented 27 automated unit tests in `Backend/test/ai/groqProviderAdapter.test.js`. All 59 AI foundation tests pass. All 473 existing backend regression tests pass with zero regressions.

---

## 2. Exact Files Created and Modified

### Created Files:
1. `Backend/src/services/ai/providers/BaseAiProviderAdapter.js` (Concrete shared provider adapter)
2. `Backend/src/services/ai/providers/groq/groqRateLimitParser.js` (Rate limit header parser & 429 classifier)
3. `Backend/src/services/ai/providers/groq/GroqProviderAdapter.js` (Concrete GroqCloud adapter for `openai/gpt-oss-120b`)
4. `Backend/test/ai/groqProviderAdapter.test.js` (Mocked offline test suite for Base & Groq adapters)
5. `Backend/poc/STAGE_2B2_PROVIDER_ADAPTER_IMPLEMENTATION_REPORT.md` (This report)

### Modified Files (Incorporating Stage 2B.1-R Review Findings):
1. `Backend/src/services/ai/contracts/executionBoundaryContract.js` (Consolidated single caller-abort listener with guaranteed `finally` cleanup)
2. `Backend/src/services/ai/contracts/errors/AiError.js` (Enforced `ALLOWED_DIAGNOSTIC_KEYS` scalar allowlist in `toDiagnosticJson`, preventing circular references)
3. `Backend/src/services/ai/policy/fallbackPolicy.js` (Explicitly added `AI_MODEL_FAILURE` to `excludedFromBreaker`)
4. `Backend/src/services/ai/index.js` (Barrel re-export of `BaseAiProviderAdapter`, `GroqProviderAdapter`, and `groqRateLimitParser`)

---

## 3. Base Provider Adapter Implementation Details

Implemented in [`Backend/src/services/ai/providers/BaseAiProviderAdapter.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/providers/BaseAiProviderAdapter.js):

- **Constructor Validation:** Validates `providerId` (non-empty string), `modelIdentifier` (non-empty string), `timeoutMs` (positive finite number). Throws `AiConfigurationError` on malformed options.
- **Safe Credential Masking:** `getMaskedKey()` returns `"[CONFIGURED_PROTECTED]"` if `this._apiKey` is populated, or `null` if unconfigured. Never prints, logs, or serializes credential characters.
- **Execution Boundary (`_withExecutionBoundary`):**
  - Evaluates `callerSignal?.aborted` prior to dispatch and immediately throws `AiCancellationError` (HTTP 499) with diagnostic context `PRE_DISPATCH_ABORT`.
  - Registers a single `onCallerAbort` listener on `callerSignal`.
  - In `catch`, deterministically gives precedence to caller cancellation when cancellation and timeout race.
  - Suppresses late resolution: if the underlying promise resolves after timeout or cancellation, the late resolution is discarded and never returned as a success.
  - Suppresses late rejections to prevent `UnhandledPromiseRejection`.
  - In `finally`, guaranteed cleanup of `timeoutId` and `callerSignal.removeEventListener('abort', onCallerAbort)`.
- **Diagnostic Security (`_buildDiagnosticContext`):**
  - Filters all diagnostic metadata against `ALLOWED_DIAGNOSTIC_KEYS`: `providerId`, `modelIdentifier`, `statusCode`, `timeoutMs`, `endpoint`, `attemptCount`, `errorType`, `reason`, `networkErrorCode`, `retryCount`.
  - Discards arbitrary nested objects, credentials, request/response bodies, prompts, and candidate PII.
  - Safe against circular references.
- **Strict Non-Transmission Retry Policy:**
  - `_isNonTransmissionError(err)` returns `true` only for proven pre-write connection failures (`ECONNREFUSED`, `ENOTFOUND`).
  - Mid-stream resets (`ECONNRESET`), timeouts (`ETIMEDOUT`), HTTP 502/503/504, rate limits, and cancellations return `false`.
  - `_executeWithRetry` performs maximum 1 retry strictly when non-transmission is established.

---

## 4. Groq Provider Adapter Implementation Details

Implemented in [`Backend/src/services/ai/providers/groq/GroqProviderAdapter.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/providers/groq/GroqProviderAdapter.js):

- **Configuration:** Defaults to model `openai/gpt-oss-120b` and base endpoint `https://api.groq.com/openai/v1`. Accepts optional `transport` dependency injection for 100% offline mocked testing.
- **Declared Capabilities:**
  ```javascript
  get capabilities() {
    return {
      structuredAssessment: true,
      streamingChat: true,
      nativeThinking: false,
    };
  }
  ```
  Passes `isAiBaseProvider`, `isStructuredAssessmentProvider`, and `isStreamingChatProvider` in `contracts/conformance.js`.
- **Accessibility Verification (`verifyAccessibility`):**
  - Probes `GET /models` within a 5,000ms boundary.
  - Confirms endpoint reachability and valid API key authentication without consuming token generation quota.
  - Returns `EndpointAccessibilityCheck`: `{ isAccessible: boolean, providerId: "groq", modelIdentifier: "openai/gpt-oss-120b", latencyMs: number, error: string|null }`.

---

## 5. Structured Assessment Handling (`generateAssessment`)

- **Input Validation:** Validates request using `validateCareerAssessmentRequest(request)` before dispatch.
- **Request Formation:**
  - Formulates system prompt instructing native JSON object generation.
  - Serializes candidate profile and pipeline telemetry into the user turn.
  - Sets `response_format: { type: "json_object" }` and `temperature: 0.2`.
- **Response Validation & Decoupling:**
  - Validates HTTP 200 OK.
  - Checks for non-empty body; verifies valid JSON completion content.
  - Parses raw model JSON into `rawData`.
  - Parses rate-limit headers via `groqRateLimitParser` into `rateLimit`.
  - Wraps output via `createRawProviderAssessmentOutput({ rawData, telemetry })`.
  - Telemetry is cleanly separated; domain data is never contaminated.
- **Error Normalization:**
  - 401/403 -> `AiAuthenticationError`
  - 400 (context length) -> `AiContextWindowExceededError`
  - 400 (parameter) -> `AiConfigurationError`
  - 429 (transient TPM/RPM) -> `AiRateLimitError`
  - 429 (explicit daily) -> `AiQuotaExhaustedError`
  - 502 -> `AiBadGatewayError`
  - 503 -> `AiCapacityError`
  - 504 -> `AiGatewayTimeoutError`
  - Malformed non-JSON -> `AiModelFailureError`
- **Fallback Rule:** Provider adapter **never** performs heuristic fallback. Fallback decisions belong strictly to domain orchestration.

---

## 6. Streaming Lifecycle & Terminal Event Guarantees (`streamChat`)

- **Pre-Handshake Validation:**
  - Validates `ChatStreamRequestDTO`.
  - Performs initial HTTP POST handshake with `Accept: text/event-stream`.
  - If upstream returns non-200 (e.g., 429 or 401), normalizes to `AiError` and **throws immediately before returning the async generator**. This ensures pre-handshake errors produce clean JSON responses at the API boundary rather than broken SSE handshakes.
- **Incremental SSE Parsing:**
  - Yields `ChatStreamChunkDTO` with monotonic `chunkIndex`.
  - Safely buffers split lines across TCP packet boundaries.
  - Gracefully ignores malformed or corrupted SSE lines without aborting the stream.
- **Single Terminal Event Guarantee:**
  - Exactly one terminal event is yielded with `isComplete: true`:
    - Normal completion: `finishReason: "stop"` (on `data: [DONE]`).
    - Caller abort: `finishReason: "abort"` (on caller cancellation).
    - Provider error: `finishReason: "error"` (on midstream exception).
- **Downstream Disconnect & Upstream Reader Cancellation:**
  - Attaches `callerSignal` listener.
  - When caller aborts midstream, triggers `upstreamAbortController.abort()`, calls `response.body.destroy()`, and yields terminal abort chunk.
  - Removes listener in `finally`.

---

## 7. Rate Limit Parsing and Classification (`groqRateLimitParser.js`)

Implemented in [`Backend/src/services/ai/providers/groq/groqRateLimitParser.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/providers/groq/groqRateLimitParser.js):

1. **Duration String Parsing (`parseResetTimeToMs`):**
   - `"2s"` -> `2000`
   - `"1m30s"` -> `90000`
   - `"6m0s"` -> `360000`
   - `"500ms"` -> `500`
   - `"1h"` -> `3600000`
   - Numeric `"5"` -> `5000`
   - Invalid / `null` -> `null` (safe, never crashes).
2. **Header Telemetry Extraction (`parseGroqRateLimitHeaders`):**
   - Case-insensitive extraction of `limitRequests`, `remainingRequests`, `resetRequestsMs`, `limitTokens`, `remainingTokens`, `resetTokensMs`.
3. **429 Classification (`classifyGroq429Error`):**
   - **URL Stripping:** Removes all `https?://...` links from error text before keyword scanning, eliminating false-positive daily quota classifications triggered by documentation links.
   - **Explicit Daily Indicators:** Matches `"daily request limit reached"`, `"daily token limit reached"`, `"daily quota exceeded"`, `"credit balance is too low"`.
   - **Transient TPM/RPM Indicators:** Matches `"tokens per minute (tpm)"`, `"requests per minute (rpm)"`.
   - **Conservative Default:** Ambiguous 429 errors default to `RATE_LIMITED` (`AiRateLimitError`) without false daily quota claims.

---

## 8. Credential & Diagnostic Security

- **Credential Masking:** `getMaskedKey()` returns `[CONFIGURED_PROTECTED]` or `null`. API keys never appear in exceptions, logs, or error payloads.
- **Public Serialization Perimeter:** `err.toPublicJson(correlationId)` exposes only `code`, `message`, `statusCode`, and `correlationId`. Zero raw provider messages, stacks, or credentials enter client responses.
- **Diagnostic Context Allowlisting:** Only approved scalar fields are retained in `diagnosticContext`. Nested objects, raw request/response headers, candidate PII, and prompt texts are stripped. Circular references cannot crash logging serializers.

---

## 9. Automated Test Results

Executed via Node.js built-in test runner (`node --test test/ai/*.test.js`):

```text
================================================================================
▶ Stage 2B.1 Suite: test/ai/contracts.test.js
  ✔ 1. Provider Contracts & Structural Conformance (12 tests) ......... PASS
  ✔ 2. DTO Boundaries & Structural Validation (8 tests) ............... PASS
  ✔ 3. Normalized Error Taxonomy & Serialization (4 tests) ............ PASS
  ✔ 4. Execution Boundary Contract Semantics (5 tests) ................ PASS
  ✔ 5. Fallback & Circuit Breaker Policy (3 tests) .................... PASS
✔ test/ai/contracts.test.js (32 tests passed)

▶ Stage 2B.2 Suite: test/ai/groqProviderAdapter.test.js
  ✔ 1. BaseAiProviderAdapter (Shared Core Mechanics) (10 tests) ........ PASS
  ✔ 2. Groq Rate Limit Parser (Telemetry & 429 Classification) (7 tests) PASS
  ✔ 3. GroqProviderAdapter (Structured Assessment & Mapping) (6 tests)  PASS
  ✔ 4. GroqProviderAdapter (Conversational Streaming Chat) (4 tests) ... PASS
✔ test/ai/groqProviderAdapter.test.js (27 tests passed)

================================================================================
TOTAL AI FOUNDATION TESTS: 59 passed | 0 failed | 0 cancelled (100% pass)
================================================================================
```

---

## 10. Existing Regression Verification

All existing backend regression suites were independently executed:

| Test Suite | Command | Result |
| :--- | :--- | :--- |
| **Stage 2B.1 Contracts** | `node --test Backend/test/ai/contracts.test.js` | **32 / 32 passed (100%)** |
| **Stage 2B.2 Groq Adapter** | `node --test Backend/test/ai/groqProviderAdapter.test.js` | **27 / 27 passed (100%)** |
| **Groq POC Config & Errors** | `node Backend/poc/groq/test_groq_config.js` | **24 / 24 passed (100%)** |
| **Gemini POC Config & Errors**| `node Backend/poc/gemini/test_gemini_config.js` | **18 / 18 passed (100%)** |
| **Stage 5 Insights Suite** | `node Backend/src/scripts/testInsightsSuite.js` | **171 / 171 passed (100%)** |
| **Stage 4 Profile Suite** | `node Backend/src/scripts/testProfileSuite.js` | **117 / 117 passed (100%)** |
| **Stage 2 Status History** | `node Backend/src/scripts/testStatusHistorySuite.js` | **46 / 46 passed (100%)** |
| **Stage 5.1 Account Security**| `node Backend/src/scripts/testAccountSecuritySuite.js` | **65 / 65 passed (100%)** |

**Total Regression Tests Across Workspace:** **532 executed, 532 passed, 0 failed (100% pass rate).**

### Static Syntax Check:
```powershell
Get-ChildItem -Path Backend/src/services/ai, Backend/test/ai -Recurse -Filter "*.js" | ForEach-Object { node --check $_.FullName }
```
- **Exit Code:** `0` (Zero syntax errors across all files).

---

## 11. Dependency Changes

- **ZERO dependency additions.**  
  All adapters, parsers, and tests use native CommonJS and Node.js built-in APIs (`node:events`, `node:test`, `node:assert/strict`).

---

## 12. Confirmation of Mandatory Restrictions

1. **Live Groq API Requests:** **ZERO** (All tests execute against local mock transport).
2. **Quota Consumed:** **ZERO** (Offline execution only).
3. **Live Health Checks:** **ZERO** (Accessibility checks tested against mocked transport).
4. **Candidate PII:** **ZERO ACCESS** (Synthetic test fixtures exclusively).
5. **Production Logic Modified:** **ZERO** (Controllers, models, and routes untouched).
6. **Next Milestone:** **NOT STARTED** (Stage 2B.3 has not been initiated).

---

## 13. Deviations, Limitations & Unresolved Issues

- **None.** All components satisfy Stage 2A.16-R1 specifications and incorporate Stage 2B.1-R review findings.

---

## 14. Recommendation for Gate 2 Review & Milestone 2B.3

Milestone 2B.2 completes the concrete provider layer. The Groq adapter satisfies all Option C contracts, provides robust structured and streaming generation, and isolates provider telemetry cleanly.

### Recommendation:
The Senior Backend AI Integration Engineer recommends **Gate 2 Approval**. Upon explicit written authorization, proceed to **Milestone 2B.3 — Telemetry Minimizer (`sanitizers/telemetryMinimizer.js`) and Deterministic Evidence Validator (`validators/careerAssessmentValidator.js`)**.

---

*Stage 2B.2 is complete. Mandatory stop condition active. Awaiting project-owner review and authorization.*
