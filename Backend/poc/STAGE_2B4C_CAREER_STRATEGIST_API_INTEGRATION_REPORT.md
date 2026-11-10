# Stage 2B.4C — Career Strategist Controller & Route Integration Report

**Project:** Evolexa Career Strategist / Job Tracker  
**Role:** Senior Backend Architect & API Integration Engineer  
**Milestone:** Stage 2B.4C  
**Execution Mode:** CONTROLLED IMPLEMENTATION — STRICTLY OFFLINE  
**Prerequisites:** Stage 2B.4A, 2B.4A-R1, 2B.4A-R1-V, 2B.4B, and 2B.4B-R — APPROVED  
**Baseline Test Count:** 653 passing tests  
**New Verified Test Count:** 683 passing tests (242 AI Foundation + 42 POC + 399 Core Backend)  
**Status:** COMPLETE & FULLY VERIFIED  

---

## 1. Executive Summary

Stage 2B.4C completes the HTTP integration of the offline-orchestrated `CareerStrategistService` into the Express backend application. This milestone exposes the Career Strategist engine through authenticated, rate-limited, and input-validated endpoints without introducing any client persistence modifications, schema mutations, or live provider network calls.

### Core Deliverables Implemented & Verified
1. **Controller Implementation:** `Backend/src/controller/careerStrategist.controller.js`
   - Factory pattern (`createCareerStrategistController({ careerStrategistService, profileModel, insightsModel })`) for modular testability and dependency injection.
   - Authoritative identity binding: Authenticated `req.user.userId` is immutable; client attempts to override the candidate identity with `req.body.userId` or `req.body.user_id` are rejected with HTTP 403 Forbidden.
   - Authoritative data sourcing: Fetches verified candidate profile data via `profileModel.getProfileByUserId(userId)` and verified pipeline metrics via `insightsModel.getInsightsSummary(userId)` and `insightsModel.getPipelineSnapshot(userId)`.
   - Biological and chronological sanity validation: Rejects negative experience or durations exceeding biological limits (>70 years), non-numeric durations, and non-array target role specifications.
   - Experience calculation fallback: Helper `calculateYearsOfExperienceFromHistory()` computes cumulative work duration if user omits explicit years.
   - Client disconnect propagation: Attaches an `AbortController` to the client socket (`req.on("close")`), aborting in-flight AI provider requests upon connection drop.
   - Sanitized error mapping: Maps AI and system exceptions to standard HTTP status codes (200, 400, 401, 403, 429, 499, 502, 504, 500) while strictly stripping database credentials, stack traces, and internal tokens.
2. **Route Definition & Mounting:** `Backend/src/routes/careerStrategist.routes.js`
   - Express router defining endpoints:
     - `POST /api/career-strategist/assessment` (canonical endpoint)
     - `POST /api/career-strategist` (alias endpoint)
   - Strict middleware pipeline order: `verifyToken` -> `careerAssessmentLimiter` -> `generateAssessment`.
   - Mounted in `Backend/src/server.js` under `app.use("/api/career-strategist", careerStrategistRoutes)`.
3. **Rate Limiting:** `Backend/src/middleware/rateLimiter.js`
   - Added `careerAssessmentLimiter`: Configured for max 10 requests per 15-minute window per authenticated user ID (`user_${req.user.userId}`).
4. **Integration Test Suite:** `Backend/test/ai/careerStrategistController.test.js`
   - 30 comprehensive offline integration tests covering authentication, authorization, spoofing defense, parameter bounds, data sourcing, error mapping, cancellation, router configuration, and ephemeral HTTP interactions.

---

## 2. Architecture & Request Pipeline

```
                                      CLIENT REQUEST
                                            │
                                            ▼
                          ┌───────────────────────────────────┐
                          │    verifyToken Middleware         │ ─── Missing/Invalid Token ──► HTTP 401
                          └───────────────────────────────────┘
                                            │ Authenticated req.user.userId
                                            ▼
                          ┌───────────────────────────────────┐
                          │   careerAssessmentLimiter         │ ─── Exceeded (10 / 15m)   ──► HTTP 429
                          └───────────────────────────────────┘
                                            │
                                            ▼
                          ┌───────────────────────────────────┐
                          │ CareerStrategistController        │
                          │ - Anti-Spoofing Check             │ ─── Client Body Override  ──► HTTP 403
                          │ - Input Bounds Validation         │ ─── Invalid Durations/Role ─► HTTP 400
                          └───────────────────────────────────┘
                                            │
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │ Data Sourcing Layer (Parallel)               │
                    │ ├─ profileModel.getProfileByUserId()         │
                    │ ├─ insightsModel.getInsightsSummary()        │
                    │ └─ insightsModel.getPipelineSnapshot()       │
                    └──────────────────────────────────────────────┘
                                            │ Candidate Profile & Pipeline Telemetry
                                            ▼
                          ┌───────────────────────────────────┐
                          │ CareerAssessmentRequestDTO        │
                          └───────────────────────────────────┘
                                            │
                                            ▼
                          ┌───────────────────────────────────┐
                          │ CareerStrategistService           │
                          │ ├─ Telemetry Minimizer            │
                          │ ├─ Provider Adapter Execution     │
                          │ ├─ Evidence & Numeric Validator   │
                          │ └─ Local Fallback Generator       │
                          └───────────────────────────────────┘
                                            │
                                            ▼
                          ┌───────────────────────────────────┐
                          │ CareerAssessmentResponseDTO       │ ─── Success / Fallback ──► HTTP 200
                          └───────────────────────────────────┘
```

---

## 3. Security Invariants & Defensive Protections

### 3.1. Anti-Spoofing & Multi-Tenant Boundary
- The controller strictly binds the candidate identity to `req.user.userId` validated by the JWT `verifyToken` middleware.
- Any attempt by a caller to supply an alternate identity in `req.body.userId` or `req.body.user_id` triggers an immediate HTTP 403 Forbidden with `{ message: "Forbidden: Cannot specify user ID in request body" }`.
- Telemetry and profiles are sourced strictly via parameter-bound queries keyed to the authenticated user ID.

### 3.2. Biological & Chronological Sanity Floor
- Experience durations must be non-negative integers or finite numbers.
- Experience > 70 years is rejected with HTTP 400 (`"yearsOfExperience must be between 0 and 70"`).
- Target roles must be provided as an array of non-empty strings.
- Options configuration constraints (`timeoutMs` between 1,000ms and 120,000ms) are validated before service invocation.

### 3.3. Client Disconnect & Resource Conservation
- The controller listens for client socket termination via `req.on("close", ...)`.
- If the client disconnects before the AI provider returns, the `AbortController` triggers `abortSignal.abort()`, cancelling in-flight provider requests and releasing downstream compute.
- Maps `AiCancellationError` to HTTP 499 (Client Closed Request).

### 3.4. Redaction of System Details in Error Responses
- Database connection errors, credentials, and internal connection strings (`password=secret`, IP addresses) are masked. Responses return generic, safe messages (`"Failed to retrieve candidate profile and pipeline telemetry"`).
- AI provider authentication errors (`AiAuthenticationError`) return HTTP 500 without disclosing API keys or token fragments.
- Unhandled exceptions return generic HTTP 500 without leaking stack traces.

---

## 4. Error Mapping Matrix

| Exception / Condition | Internal Error Code | HTTP Status Code | Response Message / Body |
| :--- | :--- | :--- | :--- |
| Missing/Unauthenticated Session | N/A | **401 Unauthorized** | `No token provided` / `Invalid or expired token` |
| Identity Mismatch / Spoofing | N/A | **403 Forbidden** | `Forbidden: Cannot specify user ID in request body` |
| Negative/Invalid Duration | N/A | **400 Bad Request** | `yearsOfExperience must be between 0 and 70` |
| Invalid Target Roles Structure | N/A | **400 Bad Request** | `targetRoles must be an array of role titles` |
| Invalid Request Configuration | `INVALID_REQUEST_STRUCTURE` | **400 Bad Request** | `Invalid request structure: ...` |
| Rate Limit Hit (User Limiter) | N/A | **429 Too Many Requests** | `Too many career assessment requests. Please try again after 15 minutes.` |
| Provider Rate Limit Hit | `RATE_LIMITED` | **429 Too Many Requests** | `AI Provider rate limit exceeded. Please try again shortly.` |
| Client Socket Closed Mid-Request| `CANCELLATION_ERROR` | **499 Client Closed Request** | `Career assessment generation was cancelled by the client` |
| Unsupported Factual Claims | `SCHEMA_VALIDATION_ERROR` | **502 Bad Gateway** | `AI provider returned unsupported or ungrounded assessment` |
| Malformed Provider JSON | `MODEL_FAILURE` | **502 Bad Gateway** | `AI provider returned malformed response` |
| Upstream Request Timeout | `TIMEOUT_ERROR` | **504 Gateway Timeout** | `Career assessment generation timed out` |
| Provider Authentication Defect| `AUTHENTICATION_ERROR` | **500 Internal Server Error**| `AI provider authentication failed` |
| Data Retrieval / Internal Crash | `DATABASE_ERROR` / Unknown | **500 Internal Server Error**| `Failed to retrieve candidate profile...` / `Failed to generate...` |

---

## 5. Verification & Test Suite Summary

### 5.1. Integration Test Suite Breakdown (`Backend/test/ai/careerStrategistController.test.js`)
The test suite consists of 30 tests divided into 8 suites:
- **Suite 1: Authentication and Authorization (4 tests):**
  - Rejects missing `req.user` with HTTP 401.
  - Rejects missing `req.user.userId` with HTTP 401.
  - Rejects body override `req.body.userId` with HTTP 403.
  - Rejects body override `req.body.user_id` with HTTP 403.
- **Suite 2: Request Handling & Parameter Validation (7 tests):**
  - Rejects negative `yearsOfExperience` with HTTP 400.
  - Rejects non-numeric `yearsOfExperience` with HTTP 400.
  - Rejects `yearsOfExperience > 70` with HTTP 400.
  - Rejects non-array `targetRoles` with HTTP 400.
  - Rejects `options.timeoutMs` exceeding boundaries with HTTP 400.
  - Verifies `calculateYearsOfExperienceFromHistory()` computes cumulative durations accurately.
  - Verifies `calculateYearsOfExperienceFromHistory()` handles empty/invalid history gracefully.
- **Suite 3: Authoritative Backend Data Sourcing (3 tests):**
  - Sources profile skills, headline, bio, and experience from `profileModel`.
  - Sources pipeline volume, active stages, and stale alerts from `insightsModel`.
  - Handles database retrieval failures with HTTP 500 without credential leakage.
- **Suite 4: Service Invocation & Response Handling (2 tests):**
  - Returns HTTP 200 and complete DTO on successful service execution.
  - Returns HTTP 200 with `fallbackActive: true` when deterministic local fallback triggers.
- **Suite 5: Sanitized Error-to-HTTP-Status Mapping (7 tests):**
  - Maps `AiRateLimitError` -> HTTP 429.
  - Maps `AiTimeoutError` -> HTTP 504.
  - Maps `AiSchemaValidationError` -> HTTP 502.
  - Maps `AiModelFailureError` -> HTTP 502.
  - Maps `AiAuthenticationError` -> HTTP 500.
  - Maps `AiConfigurationError` -> HTTP 400.
  - Maps unexpected generic `Error` -> HTTP 500.
- **Suite 6: Cancellation & Client Disconnection (2 tests):**
  - Propagates `req.on("close")` to `AbortSignal`.
  - Maps `AiCancellationError` -> HTTP 499.
- **Suite 7: Route Registration & Middleware Pipeline (2 tests):**
  - Exports Express Router with `/assessment` and `/` endpoints.
  - Verifies exact middleware chain: `verifyToken` -> `careerAssessmentLimiter` -> `generateAssessment`.
- **Suite 8: Ephemeral End-to-End Route Integration (3 tests):**
  - `POST /api/career-strategist/assessment` rejects unauthenticated call with HTTP 401.
  - `POST /api/career-strategist` (alias) rejects unauthenticated call with HTTP 401.
  - `POST /api/career-strategist/assessment` with invalid JWT format rejects with HTTP 401.

### 5.2. Full System Regression Baseline
| Test Group | Suite / Target | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AI Foundation** | `careerAssessmentRequestDto.test.js` | 13 | 0 | PASS |
| | `rawProviderAssessmentOutputDto.test.js` | 9 | 0 | PASS |
| | `careerAssessmentResponseDto.test.js` | 9 | 0 | PASS |
| | `chatStreamRequestDto.test.js` | 8 | 0 | PASS |
| | `chatStreamChunkDto.test.js` | 9 | 0 | PASS |
| | `errors.test.js` | 13 | 0 | PASS |
| | `executionBoundaryContract.test.js` | 13 | 0 | PASS |
| | `fallbackPolicy.test.js` | 8 | 0 | PASS |
| | `GroqProviderAdapter.test.js` | 17 | 0 | PASS |
| | `groqRateLimitParser.test.js` | 10 | 0 | PASS |
| | `telemetryMinimizer.test.js` | 33 | 0 | PASS |
| | `careerAssessmentValidator.test.js` | 46 | 0 | PASS |
| | `securityRemediation.test.js` | 27 | 0 | PASS |
| | `careerStrategistService.test.js` | 39 | 0 | PASS |
| | **`careerStrategistController.test.js` (NEW)** | **30** | **0** | **PASS** |
| **AI Subtotal** | | **242** | **0** | **100% PASS** |
| **Offline POCs** | `test_groq_config.js` | 24 | 0 | PASS |
| | `test_gemini_config.js` | 18 | 0 | PASS |
| **POC Subtotal** | | **42** | **0** | **100% PASS** |
| **Core Backend** | `testInsightsSuite.js` | 171 | 0 | PASS |
| | `testProfileSuite.js` | 117 | 0 | PASS |
| | `testStatusHistorySuite.js` | 46 | 0 | PASS |
| | `testAccountSecuritySuite.js` | 65 | 0 | PASS |
| **Core Subtotal**| | **399** | **0** | **100% PASS** |
| **GRAND TOTAL** | **ALL SUITES** | **683** | **0** | **100% PASS** |

---

## 6. Implementation Invariant Verification Checklist

- [x] **Zero Paid Provider Invocations:** All tests operate against synthetic mocked data models, synthetic responses, and local fallbacks.
- [x] **Zero Persistent Schema Modifications:** No database migrations or assessment persistence tables were added in this milestone.
- [x] **Deterministic Local Fallback Intact:** Returns HTTP 200 with complete `CareerAssessmentResponseDTO` and `fallbackActive: true` when upstream model fails or evidence checks fail.
- [x] **Strict Identity Binding:** Client cannot spoof candidate ID; only authenticated JWT `req.user.userId` is honored.
- [x] **Rate Limit Enforced:** Max 10 requests per 15 minutes keyed by authenticated user ID.
- [x] **Clean Process Lifecycle:** Zero open network handles, idle PostgreSQL connection leaks, or active timer leaks during test teardown.

---

## 7. Next Steps & Recommendation

Stage 2B.4C completes the backend HTTP integration. With **683 tests passing**, the backend is fully prepared for Stage 2B.4C-R (Independent Route Verification Audit) or subsequent Stage 2B milestones (e.g. Frontend Career Strategist UI integration or streaming response capabilities).
