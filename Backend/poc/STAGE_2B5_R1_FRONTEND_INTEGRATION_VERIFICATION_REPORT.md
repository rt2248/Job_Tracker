# Stage 2B.5-R1 — Frontend Integration Contract & Runtime Verification Report

**Project:** Evolexa Career Strategist / Job Tracker  
**Role:** Senior Frontend Architect & AI Integration Reviewer  
**Milestone:** Stage 2B.5-R1  
**Execution Mode:** CONTROLLED VERIFICATION & TARGETED REMEDIATION — STRICTLY OFFLINE  
**Prerequisite:** Stage 2B.5 implementation completed  
**Backend AI Regression Baseline:** 250 passing tests (100%)  
**Frontend Test Suite Baseline:** 32 passing tests (100% across 2 test suites)  
**Vite Production Build:** 530 modules transformed, 0 errors  
**Static Code Analysis:** oxlint 0 errors  
**Date:** November 9, 2026

---

## 1. Objective & Scope

Stage 2B.5-R1 performs a rigorous contract parity verification and runtime execution audit of the newly integrated Evolexa Career Strategist frontend. 

The audit inspects:
1. Exact field-by-field parity between outbound frontend requests and backend accepted schemas (`CareerAssessmentRequestDTO`, `careerStrategist.controller.js`, `CareerStrategistService.js`).
2. Exact response DTO handling and enum alignment against `CareerAssessmentResponseDTO` and `careerAssessmentValidator.js`.
3. Authentication architecture conformity, verifying consistency with existing session token conventions without introducing parallel mechanisms.
4. Comprehensive hook and component runtime tests covering successful generation, in-flight deduplication, cancellation, unmount cleanup, fallback disclosure, and error states.
5. Implementation of minimal targeted remediations for confirmed discrepancies.

---

## 2. Exact Request Contract Comparison

### 2.1 Field-by-Field Parity Analysis

| Field | Frontend Outbound Type / Behavior | Backend Accepted Type / Handling | Parity Status | Verification Notes |
| :--- | :--- | :--- | :---: | :--- |
| `targetRoles` | `string[]` (non-empty strings filtered) | `string[]` (array of strings, filtered in controller line 177) | **100% Match** | Fully supported; defaults to `[profile.headline]` or `["Software Engineer"]` when omitted. |
| `yearsOfExperience` | `number` (validated $0 \le \text{yoe} \le 70$) | `number` (validated finite $0 \le \text{yoe} \le 70$ in controller line 111) | **100% Match** | Fully supported; defaults to history calculation (`calculateYearsOfExperienceFromHistory`) when omitted. |
| `userNotes` | `string` (trimmed, max 1,000 chars) | `string` (sliced to 1,000 chars in controller line 184) | **100% Match** | Fully supported; defaults to `profile.bio` when omitted. Reaches `candidateProfile.userNotes` and model context. |
| `options.timeoutMs` | Handled client-side via `AbortSignal` | `number` ($0 < \text{ms} \le 120,000$) | **Compatible** | Frontend controls timeout and cancellation deterministically via `AbortController`. |
| `userId` / `user_id` | **Strictly omitted** | **Strictly forbidden** in client body (rejected with HTTP 403) | **100% Match** | Enforces zero client spoofing invariant. Identity is exclusively resolved via server-side JWT middleware. |
| `correlationId` | Handled by service or generated server-side | `string` (UUID v4 or random identifier) | **100% Match** | Server generates unique tracing ID when client omits. |

### 2.2 Parameter Reachability Verification
Verification confirmed that `targetRoles`, `yearsOfExperience`, and `userNotes` configured by the user in `CareerStrategistEmptyState.jsx` reach `handleRunAssessment()`, are transmitted across HTTP to `careerStrategist.controller.js`, and are injected into `assessmentRequest.candidateProfile` before invocation of `CareerStrategistService.generateCareerStrategy()`.

---

## 3. Exact Response Contract Comparison & Targeted Remediations

Inspection of `Backend/src/services/ai/contracts/dtos/CareerAssessmentResponse.dto.js` and `careerAssessmentValidator.js` revealed three contract discrepancies in frontend presentation mappings, which were corrected in Stage 2B.5-R1:

### 3.1 `careerStage` and `pipelineHealth` Enum Realignment
- **Backend Enums:**
  - `VALID_CAREER_STAGES`: `entry_level`, `mid_level`, `senior`, `lead_architect`, `transitioning`, `unspecified`.
  - `VALID_PIPELINE_HEALTH`: `healthy`, `needs_focus`, `critical_bottleneck`, `insufficient_data`, `inconsistent_data`.
- **Targeted Correction:**
  - Updated `CandidateSummaryCard.jsx` to map canonical backend values: `needs_focus` ("Needs Focus"), `critical_bottleneck` ("Critical Bottleneck"), and `inconsistent_data` ("Inconsistent Telemetry"), while retaining previous aliases (`needs_attention`, `critical`) for backward resilience.

### 3.2 Strategic Recommendation Categories Realignment
- **Backend Enums:**
  - `VALID_REC_CATEGORIES`: `pipeline_velocity`, `targeting_alignment`, `skill_acquisition`, `interview_preparation`, `data_hygiene`.
- **Targeted Correction:**
  - Updated `StrategicRecommendationsList.jsx` to map all five canonical backend categories with human-readable labels, while preserving legacy aliases.

### 3.3 `dataLimitationsNoted` Scalar vs Array Handling
- **Backend Contract:** `evidenceGrounding.dataLimitationsNoted` is defined and validated as a **`string`** (e.g. `"No historical interview conversion data prior to October 2026."`), not an array.
- **Targeted Correction:**
  - Updated `EvidenceGroundingCard.jsx` to defensively normalize `dataLimitationsNoted`: if a non-empty string is provided, it is converted to a single-element list for display; if an array is supplied, it is preserved. This prevents `TypeError: dataLimitationsNoted.map is not a function`.

### 3.4 Parameter Retention on Regeneration
- **Issue:** If a user customized assessment parameters (e.g. `userNotes` or `targetRoles`), clicking "Regenerate Assessment" previously defaulted to `{}`.
- **Targeted Correction:**
  - Added `lastParamsRef` in `CareerStrategist.jsx` to persist user-specified parameters across regeneration cycles, resetting only when the user explicitly clicks "Reset".

---

## 4. Authentication Architecture Verification

The frontend authentication architecture was audited against the application baseline:
1. **Token Storage:** All authenticated requests uniformly retrieve the session JWT from `localStorage.getItem("token")`.
2. **Request Headers:** Outbound requests strictly set `Authorization: Bearer ${token}` and `Content-Type: application/json`.
3. **Session Expiry & Guardrails:**
   - Client service validates presence of token before dispatching requests, throwing `CareerStrategistError` with status 401 (`AUTHENTICATION_REQUIRED`) if missing.
   - `ProtectedRoutes.jsx` verifies token validity and expiration (`payload.exp * 1000 < Date.now()`), redirecting unauthenticated or expired users to `/login`.
4. **No Parallel Authentication:** `careerStrategistService.js` does not implement any divergent auth mechanism or independent credential store.
5. **No Credential Exposure:** Provider keys (`GROQ_API_KEY`, etc.) remain strictly confined to the backend server environment.

---

## 5. Hook & Component Runtime Test Suite

A dedicated runtime test suite was implemented in `Frontend/test/careerStrategistRuntime.test.js` using Node.js's native test runner (`node:test`) and React 19's client internals dispatcher (`React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H`).

### 5.1 Test Execution Results

```
▶ Career Strategist Frontend Runtime & Contract Verification
  ▶ 1. Hook Runtime: useCareerStrategist
    ✔ 1.1 Successfully generates assessment and populates reactive state (2.2701ms)
    ✔ 1.2 Prevents duplicate submissions and aborts prior in-flight request (0.7902ms)
    ✔ 1.3 Handles user cancellation via cancel() without error banner (0.7479ms)
    ✔ 1.4 Performs component unmount cleanup and aborts active in-flight request (0.5153ms)
    ✔ 1.5 Handles backend error and populates error state (0.7385ms)
  ✔ 1. Hook Runtime: useCareerStrategist (6.1013ms)
  ▶ 2. Component Runtime Rendering & State Representation
    ✔ 2.1 FallbackNoticeBanner renders banner when fallbackActive is true with reason and provider (22.1896ms)
    ✔ 2.2 FallbackNoticeBanner renders nothing (null) when fallbackActive is false (6.2133ms)
    ✔ 2.3 CandidateSummaryCard renders career stage and backend canonical pipeline health enum (9.0136ms)
    ✔ 2.4 StrategicRecommendationsList renders sorted recommendations with canonical categories (8.6ms)
    ✔ 2.5 SkillGapCard correctly renders verified competencies and critical market gaps (5.4136ms)
    ✔ 2.6 PipelineDiagnosticsCard renders volume, velocity, and staleness telemetry (5.7956ms)
    ✔ 2.7 EvidenceGroundingCard handles dataLimitationsNoted as string (backend DTO contract) (9.3779ms)
    ✔ 2.8 Error banner renders error code, message, and correlationId (0.7978ms)
  ✔ 2. Component Runtime Rendering & State Representation (67.9399ms)
✔ Career Strategist Frontend Runtime & Contract Verification (74.6627ms)
ℹ tests 13
ℹ suites 3
ℹ pass 13
ℹ fail 0
```

### 5.2 Combined Frontend Test Count

```
node --test Frontend/test/*.test.js
- Frontend/test/careerStrategistService.test.js:  19 passing
- Frontend/test/careerStrategistRuntime.test.js:  13 passing
Total Frontend Tests: 32 passing (100% pass rate)
```

---

## 6. Files Modified During Remediation

1. `Frontend/src/components/career_strategist/CandidateSummaryCard.jsx`
   - Added canonical backend enums `needs_focus`, `critical_bottleneck`, `inconsistent_data`, `transitioning`, `unspecified`.
2. `Frontend/src/components/career_strategist/StrategicRecommendationsList.jsx`
   - Added canonical backend categories `pipeline_velocity`, `targeting_alignment`, `skill_acquisition`, `interview_preparation`, `data_hygiene`.
3. `Frontend/src/components/career_strategist/EvidenceGroundingCard.jsx`
   - Added scalar normalization for `dataLimitationsNoted` string vs array.
4. `Frontend/src/pages/dashboard/CareerStrategist.jsx`
   - Implemented `lastParamsRef` to retain user-configured assessment parameters across regeneration.
5. `Frontend/test/careerStrategistRuntime.test.js`
   - Created comprehensive runtime test suite for hook execution, duplicate suppression, unmount abort, and component rendering.

---

## 7. Verification Summary & Regression Baseline

| Gate | Target | Result | Status |
| :--- | :--- | :---: | :---: |
| **Backend AI Foundation Tests** | 250 tests | **250 / 250 PASS** | **PASS** |
| **Frontend Service Tests** | 19 tests | **19 / 19 PASS** | **PASS** |
| **Frontend Runtime & Component Tests** | 13 tests | **13 / 13 PASS** | **PASS** |
| **Total Frontend Test Suite** | 32 tests | **32 / 32 PASS** | **PASS** |
| **Production Build (`vite build`)** | 530 modules | **0 Errors, 0 Warnings** | **PASS** |
| **Static Analysis (`oxlint`)** | Frontend codebase | **0 Errors** | **PASS** |
| **API Quota / Live Inference Spend** | Zero spend | **$0.00** | **PASS** |

---

## 8. Remaining Limitations

1. **JSDOM Dependency Scope:** The test harness utilizes React 19 client internals and `react-dom/server` with `sucrase` compilation instead of introducing `@testing-library/react` and `jsdom`. This adheres strictly to the requirement of not expanding the dependency stack unnecessarily while providing 100% offline runtime verification.
2. **Ephemeral Assessment State:** As designed in the Stage 2B architecture, career assessments remain ephemeral in React component state and are not persisted across page reloads.

---

## 9. Conclusion

Stage 2B.5-R1 confirms that the Career Strategist frontend is in complete contract parity with the backend API, strictly follows the existing authentication architecture, and passes all focused runtime verification checks without regressions.
