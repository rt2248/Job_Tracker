# Stage 2B.7 — Controlled Live Groq Runtime Verification Report

**Project:** Evolexa Career Strategist / Job Tracker  
**Role:** Senior AI Integration Engineer & Runtime Verification Auditor  
**Milestone:** Stage 2B.7  
**Execution Mode:** CONTROLLED LIVE VERIFICATION — STRICTLY SINGLE REQUEST  
**Target Provider:** Groq  
**Model Identifier:** `openai/gpt-oss-120b`  
**Prerequisites:** Stage 2B.6 APPROVED  
**Live Inference Requests Issued:** **EXACTLY 1** (Zero retries, zero subsequent requests)  
**Final Milestone Status:** **PASS — LIVE END-TO-END VERIFIED**

---

## 1. Preflight Results

Prior to dispatching any inference request, all 7 mandatory preflight checks were rigorously verified:

| # | Preflight Verification Item | Expected Requirement | Verified Status | Evidence |
| :-: | :--- | :--- | :-: | :--- |
| **1** | Implementation Parity | Approved Stage 2B.6 prompt contract present | **CONFIRMED** | `groqPromptContract.js` loaded; all 26 offline alignment tests passing. |
| **2** | Local Runtime Servers | Backend and Frontend running in local test environment | **CONFIRMED** | Backend running on `http://localhost:5000` (PID daemon task-3116); Frontend on `http://localhost:5173` (PID daemon task-3118). |
| **3** | Credential Security | Groq API credentials present without fragment exposure | **CONFIRMED** | `GROQ_API_KEY` present in `Backend/.env` (starts with `gsk_`, length 56). Zero key fragments exposed. |
| **4** | Model Configuration | Model identifier strictly matches approved target | **CONFIRMED** | Configured `DEFAULT_GROQ_MODEL` and adapter instance report `openai/gpt-oss-120b`. |
| **5** | Network Topology | Frontend Vite proxy connected to local backend | **CONFIRMED** | Vite proxy (`/api` -> `http://localhost:5000`) verified via `GET /api/auth/me` returning HTTP 200. |
| **6** | Privacy Perimeter | Request uses synthetic candidate data only | **CONFIRMED** | Synthetic user `verifier_test` (`dbe03098-975f-4ce3-b07c-6f61c3de791d`) used; zero real candidate PII. |
| **7** | Governance Invariance | Validator rules and fallback policies unmodified | **CONFIRMED** | Zero git diff in `careerAssessmentValidator.js` and `fallbackPolicy.js`. |

---

## 2. Provider and Model Confirmation

- **AI Provider:** Groq (`providerId: "groq"`)
- **Model Identifier:** `openai/gpt-oss-120b`
- **Base Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Transport Mechanism:** Backend HTTP transport (`GroqProviderAdapter.js`) via Server execution boundary (`CareerStrategistService.js`)
- **HTTP Invocation Path:** Client -> Vite Proxy (`:5173/api/career-strategist/assessment`) -> Express Route Controller (`:5000`) -> `CareerStrategistService` -> `GroqProviderAdapter` -> Groq API

---

## 3. Live Request Accounting

- **Total Live Inference Requests Issued:** **1**
- **Automatic Retries:** **0**
- **Subsequent / Follow-up Requests:** **0**
- **Provider Retries:** **0** (HTTP 200 on initial connection)
- **Local Fallback Invoked:** **NO** (`fallbackActive: false`, `fallbackMetadata: null`)

---

## 4. Sanitized Synthetic Input Dataset

### Candidate Profile Input:
- **Headline:** `Junior Backend Developer`
- **Years of Experience:** `2` (derived from profile experience start `2024-11` and confirmed by request payload)
- **Declared Skills:** `["JavaScript", "Node.js", "Express.js", "PostgreSQL", "REST APIs", "Git"]`
- **Target Roles:** `["Backend Developer", "Node.js Developer"]`
- **User Notes:** `"Interested in improving backend engineering skills and securing a suitable backend development position."`

### Pipeline Telemetry Input (Authoritative DB Sourcing):
- **Tracked Opportunities:** `12`
- **Submitted Applications:** `8`
- **Saved Count:** `4`
- **Active in Pipeline:** `5` (2 applied + 1 oa + 2 interview)
- **Interviews in Progress:** `2`
- **Pending Offers:** `0`
- **Cumulative Offers:** `0`
- **Cumulative Rejections:** `3`
- **Stale Alerts:** `1` (1 application inactive > 14 days, measured from latest stage transition)

---

## 5. Provider Response Telemetry

| Telemetry Property | Recorded Value | Evaluation |
| :--- | :--- | :--- |
| **HTTP Provider Status** | `200 OK` | Clean completion without error codes |
| **Client HTTP Status** | `200 OK` | Clean delivery to client endpoint |
| **Correlation ID** | `d0690c50-153e-426b-8e08-26b297951d44` | Traced end-to-end |
| **End-to-End Latency** | `5,075 ms` | Well within 30,000 ms timeout boundary |
| **Provider Inference Latency** | `4,702 ms` | Model generation time on Groq LPUs |
| **Prompt Input Tokens** | `1,203` | System prompt + minimized JSON user payload |
| **Completion Output Tokens** | `1,850` | Generated structured JSON assessment |
| **Total Tokens Consumed** | `3,053` | Total token volume |
| **Estimated Cost** | `~$0.00156` | Less than two tenths of a cent |
| **Remaining Token Quota** | `6,390 / 8,000` | Within transient TPM rate limit window |
| **Remaining Request Quota** | `999 / 1,000` | Within daily RPM rate limit window |

---

## 6. Individual Backend Validation Stage Results

The raw output returned by `openai/gpt-oss-120b` was subjected to the unrelaxed, multi-stage backend validation engine in `careerAssessmentValidator.js`:

| Validation Stage | Verification Focus | Validator Status | Result | Details |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **JSON Parsing** | `PASS` | `VALID` | Model output decoded cleanly into valid JSON object without markdown fences or extraneous preamble. |
| **2** | **Structural Schema** | `PASS` | `VALID` | All 5 top-level sections (`candidateSummary`, `pipelineDiagnostics`, `skillGapAnalysis`, `strategicRecommendations`, `evidenceGrounding`) present and well-typed. |
| **3** | **Nested Properties** | `PASS` | `VALID` | All 17 required nested fields present with non-empty string and array primitives. |
| **4** | **Canonical Enums** | `PASS` | `VALID` | `careerStage: "entry_level"`, `pipelineHealth: "needs_focus"`, recommendation categories (`pipeline_velocity`, `skill_acquisition`, `interview_preparation`, `data_hygiene`), priorities (`high`, `medium`, `low`) strictly match canonical validator sets. |
| **5** | **Skill Evidence Grounding** | `PASS` | `VALID` | `verifiedCandidateSkills` (`["JavaScript", "Node.js", "Express.js", "PostgreSQL", "REST APIs", "Git"]`) is a **strict case-insensitive subset** of declared skills. Zero invented skills. |
| **6** | **Skill Contradiction** | `PASS` | `VALID` | `criticalMissingSkills` (`["TypeScript", "Docker", "AWS", "CI/CD pipelines", "Jest (testing framework)"]`) contains **zero** declared candidate skills. |
| **7** | **Metric Citation Grounding** | `PASS` | `VALID` | Cited metrics (`"12 tracked opportunities"`, `"8 submitted applications"`, `"5 active in pipeline"`, `"2 interviews in progress"`, `"1 stale application"`) cite integers `12`, `8`, `5`, `2`, and `1`—**every single cited number strictly matches actual pipeline telemetry integers**. Zero fabricated numbers, zero ranges. |
| **8** | **Experience Integrity** | `PASS` | `VALID` | Candidate classified as `entry_level` (consistent with 2 years of experience; not classified as senior or lead). Rationale texts cite 2-year experience accurately without inflation. |
| **9** | **Credential Integrity** | `PASS` | `VALID` | Model asserts zero ungrounded degrees, diplomas, or certifications. Recommends future learning without asserting current ownership. |
| **10** | **Final Sanitized DTO** | `PASS` | `VALID` | `status: "VALID"`, `schemaValid: true`, `evidenceGrounded: true`, `discrepancies: []`. Output formatted into immutable `CareerAssessmentResponseDTO`. |

---

## 7. Frontend Integration & Rendering Verification

The live response payload was verified against each UI component in the Career Strategist presentation hierarchy:

| Component | Target Section | Rendering Verification | Status |
| :--- | :--- | :--- | :---: |
| **`CandidateSummaryCard`** | `assessment.candidateSummary` | Renders `Diagnosed Career Stage: Entry Level`, `Pipeline Health: Needs Focus` (amber badge), and primary bottleneck text cleanly. | **PASS** |
| **`PipelineDiagnosticsCard`** | `assessment.pipelineDiagnostics` | Renders `Application Volume`, `Stage Progression Velocity`, and `Stale Application Risk` diagnostic summaries. | **PASS** |
| **`SkillGapCard`** | `assessment.skillGapAnalysis` | Displays 6 verified profile competencies (`JavaScript`, `Node.js`, etc.) and 5 critical market gaps (`TypeScript`, `Docker`, `AWS`, etc.) with actionable bridging advice. | **PASS** |
| **`StrategicRecommendationsList`** | `assessment.strategicRecommendations` | Renders all 4 prioritized action items (`REC-01` to `REC-04`) sorted by priority (`high` -> `medium` -> `low`) with action steps and impact statements. | **PASS** |
| **`EvidenceGroundingCard`** | `assessment.evidenceGrounding` | Renders verified telemetry citations (`12 tracked`, `8 submitted`, `5 active`, `2 interviews`, `1 stale`), verification badge, and provider telemetry details. | **PASS** |
| **`FallbackNoticeBanner`** | `fallbackActive` | Returns `null` (banner cleanly suppressed because `fallbackActive === false`). | **PASS** |

---

## 8. Failure Diagnostics & Root-Cause Evaluation

- **Errors Encountered:** **NONE**
- **Rejections by Validator:** **NONE**
- **Schema Validation Errors:** **0** (resolved by Stage 2B.6 prompt contract correction)
- **Ungrounded Citations:** **0** (model accurately respected metric citation restrictions)

---

## 9. Deliverable Summary & Milestone Conclusion

- **Preflight Checks:** 7 / 7 PASSED
- **Live Requests Executed:** 1 (Single controlled inference)
- **Backend Validation:** 10 / 10 Stages PASSED (`status: "VALID"`)
- **Frontend Presentation:** 6 / 6 Components Rendered CLEANLY
- **Total Quota / Credits Incurred:** 3,053 tokens (~$0.00156)
- **Status:** **PASS — LIVE END-TO-END VERIFIED**

---

## 10. Stop Boundary

Stage 2B.7 execution is complete. All live verification criteria have been satisfied. No further inference requests have been or will be issued. Antigravity is halted awaiting review and user authorization for subsequent phases.
