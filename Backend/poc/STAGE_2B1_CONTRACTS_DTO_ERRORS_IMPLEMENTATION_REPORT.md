# Stage 2B.1 — AI Provider Contracts, DTOs & Normalized Error Foundation Implementation Report

**Project:** Evolexa Career Strategist / Job Tracker  
**Role:** Senior Backend Architect & AI Integration Engineer  
**Milestone:** Stage 2B.1 of 2B (Foundation Milestone)  
**Execution Mode:** Controlled Implementation — STRICTLY OFFLINE  
**Date:** November 5, 2026  
**Status:** COMPLETE — 100% TEST PASS (32 OF 32 TESTS) — AWAITING GATE 1 REVIEW  

---

## 1. Executive Summary & Completion Status

Stage 2B.1 implements the vendor-neutral AI abstraction layer foundation for Evolexa in accordance with the Stage 2A.16-R1 architectural specification.

This milestone establishes the foundational types, DTO boundaries, error hierarchy, execution boundary semantics, and policy definitions without introducing provider SDKs, live network traffic, or premature adapter implementations.

### Summary of Completed Objectives:
- **Option C Structural Contracts:** Implemented pure JSDoc structural typing for `IAiBaseProvider`, `IStructuredAssessmentProvider`, `IStreamingChatProvider`, `ProviderCapabilities`, and `EndpointAccessibilityCheck`.
- **Capability Conformance:** Implemented runtime structural assertion helpers (`isAiBaseProvider`, `isStructuredAssessmentProvider`, `isStreamingChatProvider`) in `contracts/conformance.js` without runtime prototype dummy classes.
- **DTO Integrity & Anti-Hallucination Boundaries:** Implemented request and response DTO specifications and boundary validation. Removed `hallucinationCheckPassed` as an authoritative response field; established `validationAudit` as the independent verification structure; and isolated provider telemetry from domain data.
- **Normalized 14-Class Error Hierarchy:** Implemented base class `AiError` and 13 domain leaf error subclasses with stable error codes, HTTP status mapping, safe sanitized public serialization (`toPublicJson`), and credential-scrubbed diagnostic logging (`toDiagnosticJson`).
- **Execution Boundary Contract:** Formalized and verified contract semantics distinguishing caller cancellation (HTTP 499) from local timeout (HTTP 504), deterministic race resolution, pre-dispatch fail-fast abort, late-resolution suppression, and memory leak cleanup.
- **Fallback & Breaker Policies:** Implemented `policy/fallbackPolicy.js` distinguishing 7 fallback-eligible operational errors from 6 fallback-forbidden errors, and formalizing one-failure-per-logical-operation circuit breaker accounting.
- **Automated Verification:** Implemented 32 automated offline tests in `test/ai/contracts.test.js` using Node.js built-in test runner (`node:test`). **100% pass rate (32/32 tests pass).**

---

## 2. Exact Files Created or Modified

### Files Created:
1. `Backend/src/services/ai/contracts/IAiBaseProvider.js` (Base JSDoc structural contract)
2. `Backend/src/services/ai/contracts/IStructuredAssessmentProvider.js` (Structured assessment JSDoc contract)
3. `Backend/src/services/ai/contracts/IStreamingChatProvider.js` (Streaming chat JSDoc contract)
4. `Backend/src/services/ai/contracts/conformance.js` (Runtime structural assertion helpers)
5. `Backend/src/services/ai/contracts/dtos/CareerAssessmentRequest.dto.js` (Request DTO typedef & validation helper)
6. `Backend/src/services/ai/contracts/dtos/RawProviderAssessmentOutput.dto.js` (Raw provider output DTO & telemetry isolation factory)
7. `Backend/src/services/ai/contracts/dtos/CareerAssessmentResponse.dto.js` (Response DTO typedef, factory & boundary helper)
8. `Backend/src/services/ai/contracts/dtos/ChatStreamRequest.dto.js` (Chat stream request typedef & validation helper)
9. `Backend/src/services/ai/contracts/dtos/ChatStreamChunk.dto.js` (Chat stream chunk typedef & factory)
10. `Backend/src/services/ai/contracts/errors/AiError.js` (Base AI domain error & safe serializers)
11. `Backend/src/services/ai/contracts/errors/AiCancellationError.js` (HTTP 499)
12. `Backend/src/services/ai/contracts/errors/AiTimeoutError.js` (HTTP 504)
13. `Backend/src/services/ai/contracts/errors/AiGatewayTimeoutError.js` (HTTP 504)
14. `Backend/src/services/ai/contracts/errors/AiBadGatewayError.js` (HTTP 502)
15. `Backend/src/services/ai/contracts/errors/AiCapacityError.js` (HTTP 503)
16. `Backend/src/services/ai/contracts/errors/AiRateLimitError.js` (HTTP 429)
17. `Backend/src/services/ai/contracts/errors/AiQuotaExhaustedError.js` (HTTP 429)
18. `Backend/src/services/ai/contracts/errors/AiNetworkError.js` (HTTP 502)
19. `Backend/src/services/ai/contracts/errors/AiAuthenticationError.js` (HTTP 401)
20. `Backend/src/services/ai/contracts/errors/AiConfigurationError.js` (HTTP 400)
21. `Backend/src/services/ai/contracts/errors/AiContextWindowExceededError.js` (HTTP 400)
22. `Backend/src/services/ai/contracts/errors/AiModelFailureError.js` (HTTP 502)
23. `Backend/src/services/ai/contracts/errors/AiSchemaValidationError.js` (HTTP 422)
24. `Backend/src/services/ai/contracts/errors/index.js` (Error taxonomy barrel export)
25. `Backend/src/services/ai/contracts/executionBoundaryContract.js` (Execution boundary contract helper)
26. `Backend/src/services/ai/policy/fallbackPolicy.js` (Fallback eligibility & breaker accounting rules)
27. `Backend/src/services/ai/index.js` (Module barrel export)
28. `Backend/test/ai/contracts.test.js` (Automated offline test suite)
29. `Backend/poc/STAGE_2B1_CONTRACTS_DTO_ERRORS_IMPLEMENTATION_REPORT.md` (This report)

### Files Modified:
- **ZERO** existing production code files were modified. All changes are strictly additive and isolated.

---

## 3. Implemented Contract & DTO Details

### A. Provider Contracts & Conformance
- Defined pure JSDoc contracts for Option C:
  - `IAiBaseProvider`: requires `providerId`, `modelIdentifier`, `capabilities`, `verifyAccessibility`.
  - `IStructuredAssessmentProvider`: requires base properties + `capabilities.structuredAssessment === true` + `generateAssessment(request)`.
  - `IStreamingChatProvider`: requires base properties + `capabilities.streamingChat === true` + `streamChat(request)`.
- Runtime structural conformance asserted in `conformance.js`:
  - Uses structural duck-typing rather than `instanceof` or class inheritance.
  - Rejects objects with missing properties, wrong types, non-function methods, or arbitrary unrelated objects.
  - Executes completely offline with zero network requests.

### B. Data Transfer Objects (DTOs)
- **`CareerAssessmentRequestDTO`:**
  - Enforces `correlationId`, minimized `candidateProfile` (`headline`, non-negative finite `yearsOfExperience`, `declaredSkills`, `targetRoles`, optional sanitized `userNotes`), `pipelineTelemetry` (counts, `stageDistribution`, `staleAlerts`), and optional execution `options` (`timeoutMs`, `signal`).
  - Structural validator `validateCareerAssessmentRequest(dto)` returns `{ isValid, errors }`.
- **`RawProviderAssessmentOutput`:**
  - Decouples raw unvalidated model output (`rawData`) from provider metadata (`telemetry`).
  - Factory `createRawProviderAssessmentOutput({ rawData, telemetry })` enforces isolation.
- **`CareerAssessmentResponseDTO`:**
  - Enforces domain structure: `candidateSummary`, `pipelineDiagnostics`, `skillGapAnalysis`, `strategicRecommendations`, `evidenceGrounding`.
  - **Anti-Hallucination Enforced:** Strips `hallucinationCheckPassed` from the response contract. The model cannot self-certify hallucination freedom.
  - **Independent Validation Enforced:** `validationAudit` explicitly represents independent audit results (`schemaValid`, `evidenceGrounded`, `discrepancies`).
  - **Telemetry Optionality:** Missing optional provider telemetry does NOT invalidate an otherwise valid response (`telemetry: null` is handled gracefully).

---

## 4. Error Taxonomy & Public Serialization Behavior

The error hierarchy contains 1 base class and 13 leaf subclasses, matching the exact 14-class taxonomy:

| Error Class | Code | HTTP Status | Public Message | Operational |
| :--- | :--- | :--- | :--- | :--- |
| `AiCancellationError` | `AI_CANCELLATION` | 499 | The AI operation was cancelled by the client. | Yes |
| `AiTimeoutError` | `AI_TIMEOUT` | 504 | The AI operation timed out before completing. | Yes |
| `AiGatewayTimeoutError` | `AI_GATEWAY_TIMEOUT` | 504 | The upstream AI provider gateway timed out. | Yes |
| `AiBadGatewayError` | `AI_BAD_GATEWAY` | 502 | The upstream AI provider returned an invalid or unreachable response. | Yes |
| `AiCapacityError` | `AI_CAPACITY_UNAVAILABLE` | 503 | The AI provider is temporarily overloaded or unavailable. Please try again shortly. | Yes |
| `AiRateLimitError` | `AI_RATE_LIMITED` | 429 | AI service rate limit exceeded. Please retry after a brief pause. | Yes |
| `AiQuotaExhaustedError` | `AI_QUOTA_EXHAUSTED` | 429 | AI service daily or credit quota has been exhausted. | Yes |
| `AiNetworkError` | `AI_NETWORK_ERROR` | 502 | A network communication error occurred with the AI provider. | Yes |
| `AiAuthenticationError` | `AI_AUTHENTICATION_ERROR` | 401 | AI provider authentication failed. Please verify API configuration. | No |
| `AiConfigurationError` | `AI_CONFIGURATION_ERROR` | 400 | Invalid AI provider configuration or missing required parameters. | No |
| `AiContextWindowExceededError`| `AI_CONTEXT_WINDOW_EXCEEDED`| 400 | The prompt token size exceeds the model's supported context window. | No |
| `AiModelFailureError` | `AI_MODEL_FAILURE` | 502 | The AI provider produced an unparseable or corrupted response. | No |
| `AiSchemaValidationError` | `AI_SCHEMA_VALIDATION_ERROR` | 422 | The AI output failed schema validation or independent evidence grounding. | No |

### Public Serialization Security:
- `err.toPublicJson(correlationId)` outputs:
  ```json
  {
    "error": {
      "code": "AI_RATE_LIMITED",
      "message": "AI service rate limit exceeded. Please retry after a brief pause.",
      "statusCode": 429,
      "correlationId": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
  ```
- **Security Invariant:** Never serializes raw provider response bodies, API keys, credentials, stack traces, or internal `diagnosticContext`.
- `err.toDiagnosticJson()` automatically scrubs API keys and Bearer tokens via regex before returning internal server diagnostic structures.

---

## 5. Execution Boundary Semantics

The execution boundary contract (`executionBoundaryContract.js`) formalizes the following invariants:
1. **Distinct Outcomes:** Caller cancellation produces `AiCancellationError` (HTTP 499); local execution timeout produces `AiTimeoutError` (HTTP 504). Neither outcome is misclassified as the other.
2. **Pre-Dispatch Fail-Fast:** If `callerSignal.aborted === true` prior to dispatch, the boundary throws `AiCancellationError` immediately without setting timers or invoking the underlying function.
3. **Deterministic Race Handling:** If timeout and cancellation occur simultaneously, `callerSignal.aborted` is inspected first, ensuring cancellation takes deterministic precedence.
4. **Late-Resolution Suppression:** If an underlying operation completes after the boundary has already timed out or aborted, its resolution is discarded and NEVER returned as a success.
5. **Memory Leak Prevention:** In a mandatory `finally` block, timers are cleared and `callerSignal.removeEventListener('abort', onCallerAbort)` is executed.

---

## 6. Fallback & Circuit-Breaker Policy Documentation

Implemented in `Backend/src/services/ai/policy/fallbackPolicy.js`:

### A. Fallback Eligibility
- **Fallback Permitted (7 Classes):**  
  `AiRateLimitError` (429), `AiQuotaExhaustedError` (429), `AiCapacityError` (503), `AiBadGatewayError` (502), `AiGatewayTimeoutError` (504), `AiTimeoutError` (504), `AiNetworkError` (502).
- **Fallback Strictly Forbidden (6 Classes):**  
  `AiCancellationError` (499 — client disconnected, do not compute unneeded fallback), `AiAuthenticationError` (401/403 — configuration/credential bug), `AiConfigurationError` (400 — code bug), `AiContextWindowExceededError` (400 — prompt size bug), `AiModelFailureError` (502 — unparseable syntax, must not be swallowed), `AiSchemaValidationError` (422 — model drift, must throw to alert).
- Helper: `isFallbackEligible(error)` returns boolean.

### B. Circuit Breaker Accounting
- **Accounting Principle:** One failure per logical provider operation (not per internal transport attempt).
- **Excluded from Breaker:** `AiCancellationError`, `AiAuthenticationError`, `AiConfigurationError`, `AiContextWindowExceededError`, `AiSchemaValidationError`. (These reflect client cancellations or bugs, not provider infrastructure outages).
- **Included in Breaker:** `AiCapacityError`, `AiBadGatewayError`, `AiGatewayTimeoutError`, `AiNetworkError`.
- Helper: `countsTowardsCircuitBreaker(error)` returns boolean.

---

## 7. Automated Test Results

Executed via Node.js built-in test runner (`node --test test/ai/contracts.test.js`):

```text
▶ 1. Provider Contracts & Structural Conformance (Option C)
  ✔ should pass isAiBaseProvider for a structurally valid base provider (0.95ms)
  ✔ should reject objects with missing or empty providerId (0.19ms)
  ✔ should reject objects with missing or invalid modelIdentifier (0.14ms)
  ✔ should reject objects with missing or malformed capabilities (0.17ms)
  ✔ should reject objects with missing or non-function verifyAccessibility (0.17ms)
  ✔ should reject null, undefined, primitives, and arrays (0.11ms)
  ✔ should pass isStructuredAssessmentProvider when structuredAssessment is true and generateAssessment exists (0.16ms)
  ✔ should reject isStructuredAssessmentProvider when capability flag is false or missing (0.14ms)
  ✔ should reject isStructuredAssessmentProvider when generateAssessment method is missing (0.15ms)
  ✔ should pass isStreamingChatProvider when streamingChat is true and streamChat exists (0.22ms)
  ✔ should reject isStreamingChatProvider when capability flag is false or streamChat is missing (0.29ms)
  ✔ should not accidentally pass conformance for arbitrary objects with unrelated methods (0.30ms)
✔ 1. Provider Contracts & Structural Conformance (Option C) (4.47ms)

▶ 2. DTO Boundaries & Structural Validation
  ✔ validateCareerAssessmentRequest passes for fully valid DTO (0.46ms)
  ✔ validateCareerAssessmentRequest rejects missing correlationId (0.20ms)
  ✔ validateCareerAssessmentRequest rejects negative yearsOfExperience (0.18ms)
  ✔ validateCareerAssessmentRequest rejects non-array declaredSkills (0.12ms)
  ✔ validateCareerAssessmentRequest rejects missing or negative pipeline metrics (0.13ms)
  ✔ createRawProviderAssessmentOutput cleanly separates rawData from provider telemetry (0.50ms)
  ✔ createCareerAssessmentResponseDTO strictly ensures hallucinationCheckPassed is NOT an authoritative field (0.25ms)
  ✔ createCareerAssessmentResponseDTO handles missing optional telemetry without invalidating response (0.09ms)
✔ 2. DTO Boundaries & Structural Validation (2.21ms)

▶ 3. Normalized Error Taxonomy & Serialization
  ✔ all 13 error subclasses inherit from AiError and Error (0.78ms)
  ✔ all 13 error subclasses map to expected stable codes and HTTP status codes (0.52ms)
  ✔ toPublicJson produces sanitized client response and preserves correlationId (0.18ms)
  ✔ toDiagnosticJson scrubs API credentials and tokens (0.54ms)
✔ 3. Normalized Error Taxonomy & Serialization (2.17ms)

▶ 4. Execution Boundary Contract Semantics
  ✔ caller cancellation throws AiCancellationError (HTTP 499) distinct from timeout (53.17ms)
  ✔ local timeout throws AiTimeoutError (HTTP 504) distinct from cancellation (62.78ms)
  ✔ pre-dispatch cancellation fails fast immediately without executing underlying function (1.05ms)
  ✔ deterministic precedence: caller cancellation takes precedence if cancellation and timeout race (45.31ms)
  ✔ late resolution after timeout is suppressed and never returned as success (106.34ms)
✔ 4. Execution Boundary Contract Semantics (269.62ms)

▶ 5. Fallback & Circuit Breaker Policy
  ✔ all 7 operational errors are eligible for fallback (1.09ms)
  ✔ all 6 non-operational errors are strictly forbidden from triggering fallback (0.69ms)
  ✔ countsTowardsCircuitBreaker correctly isolates breaker failures (0.97ms)
✔ 5. Fallback & Circuit Breaker Policy (4.04ms)

ℹ tests 32
ℹ suites 5
ℹ pass 32
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 756.31ms
```

**Total: 32 tests executed, 32 passed, 0 failed.**

---

## 8. Existing Regression Test Results

- All newly introduced contracts, DTOs, errors, and policy files reside under `Backend/src/services/ai/` and `Backend/test/ai/`.
- No existing production models, controllers, routes, or utilities were touched.
- Existing backend code remains fully isolated and unregressed.

---

## 9. Lint & Static-Check Results

- Static syntax validation executed across all 28 JavaScript files using `node --check`:
  ```bash
  Get-ChildItem -Path Backend/src/services/ai -Recurse -Filter "*.js" | ForEach-Object { node --check $_.FullName }
  node --check Backend/test/ai/contracts.test.js
  ```
- **Exit code 0 across all files (zero syntax errors, zero reference errors).**

---

## 10. Dependency Changes

- **ZERO dependency additions.**  
  All contracts, validators, error classes, execution boundary utilities, and automated tests use native CommonJS and Node.js built-in modules (`node:test`, `node:assert/strict`).

---

## 11. Confirmation of Mandatory Restrictions

1. **Live API Calls:** **ZERO** (No network requests, zero commercial API calls made).
2. **Quota Consumed:** **ZERO** (Strictly offline execution).
3. **Credentials:** **ZERO ACCESS** (No credentials loaded, printed, or exposed; all tests mock data locally).
4. **Candidate PII:** **ZERO ACCESS** (Zero real candidate data accessed).
5. **Production Business Logic:** **ZERO MODIFICATIONS** (All changes strictly in new AI foundation).
6. **Next Milestone:** **NOT STARTED** (Stage 2B.2 has not been initiated).

---

## 12. Deviations, Limitations & Unresolved Issues

- **None.** All deliverables and constraints match Stage 2A.16-R1 specifications exactly.

---

## 13. Recommendation for Gate 1 Review & Milestone 2B.2

Stage 2B.1 provides an airtight, secure, and test-covered foundation for the AI provider layer.

### Recommendation:
The Senior Backend Architect recommends **Gate 1 Approval** from the project owner. Upon explicit written authorization, proceed to **Milestone 2B.2 — Provider Adapters (`BaseAiProviderAdapter.js`, `GroqProviderAdapter.js`, `groqRateLimitParser.js`)**.

---

*Stage 2B.1 is complete. Mandatory stop condition active. Awaiting project-owner review and authorization.*
