# Stage 2B.3A — Telemetry Minimizer Implementation Report

**Project:** Evolexa Career Strategist / Job Tracker  
**Role:** Senior Backend Privacy Engineer & AI Integration Architect  
**Milestone:** Stage 2B.3A of 2B  
**Execution Mode:** Controlled Implementation — STRICTLY OFFLINE  
**Date:** November 5, 2026  
**Status:** COMPLETE — 100% TEST PASS (87 OF 87 AI TESTS, 528 OF 528 REPOSITORY TESTS) — AWAITING STAGE 2B.3B AUTHORIZATION  

---

## 1. Executive Summary

Stage 2B.3A implements the deterministic, fail-closed telemetry minimization layer for the Evolexa AI foundation.

The primary deliverable is [`Backend/src/services/ai/sanitizers/telemetryMinimizer.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/sanitizers/telemetryMinimizer.js). This component establishes the authoritative privacy perimeter for candidate data before it can be transmitted to external AI providers (such as GroqCloud or Gemini).

### Key Accomplishments:
1. **Authoritative Privacy Perimeter:** Implemented [`minimizeCareerAssessmentTelemetry()`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/sanitizers/telemetryMinimizer.js#L541-L689), providing deterministic field allowlisting, multi-pattern PII scrubbing, and free-text bounding.
2. **Fail-Closed Execution:** Rejects malformed structures, missing mandatory inputs, un-serializable objects, and biological/metric sanity bounds using the approved `AiConfigurationError` error taxonomy. Under zero conditions does it fall back to returning raw, unminimized data.
3. **Comprehensive PII Removal:** Explicitly filters out candidate names, emails, phone numbers, physical locations, profile IDs, avatar URLs, social media links, resume attachments, and session tokens from profile structures, while actively redacting embedded contact details, SSNs, credit cards, and API keys in free-text notes.
4. **Prompt Injection & Delimiter Neutralization:** Neutralizes instruction injection delimiters (`<system>`, `</system>`, `<instructions>`, ````system`), strips non-printable control characters, and enforces strict JSON data encapsulation.
5. **Safe Audit Metadata:** Generates safe telemetry describing minimization operations (field counts, flags for truncation and PII redaction, redaction categories), guaranteeing that removed values or sensitive PII are never disclosed.
6. **Dual-Access Pattern:** Returns a sanitized object supporting both direct property access and `.minimizedRequest` getter, conforming directly to [`CareerAssessmentRequestDTO`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/contracts/dtos/CareerAssessmentRequest.dto.js).
7. **Automated Verification:** Added 28 comprehensive automated tests in [`Backend/test/ai/telemetryMinimizer.test.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/test/ai/telemetryMinimizer.test.js). All 87 AI foundation tests pass. All 528 unique tests across the repository pass with 100% success.

---

## 2. Exact Files Created and Modified

### Created Files:
1. `Backend/src/services/ai/sanitizers/telemetryMinimizer.js` (Deterministic telemetry minimizer and PII scrubbing engine)
2. `Backend/test/ai/telemetryMinimizer.test.js` (28 automated offline unit tests)
3. `Backend/poc/STAGE_2B3A_TELEMETRY_MINIMIZER_IMPLEMENTATION_REPORT.md` (This implementation report)

### Modified Files:
1. `Backend/src/services/ai/index.js` (Re-exported `telemetryMinimizer` and its constants from AI foundation barrel)

---

## 3. Discovered Original Request Schema

Prior to design, existing models and DTOs were audited:

### 1. Database User Profile Schema (`profile.model.js`):
Raw profile rows joined from `users`, `user_profiles`, and `user_resumes` contain:
- Identity & Account: `id`, `firstName`, `middleName`, `lastName`, `email`, `username`, `createdAt`, `passwordChangedAt`
- Profile Details: `headline`, `bio`, `location`, `avatarUrl`
- Social Links: `socialLinks: { portfolio, github, linkedin, twitter }`
- Skills & Experience: `skills` (JSON array), `experience` (nested JSON array with companies, titles, dates, descriptions)
- Attachments: `resume: { id, filename, fileSize, mimeType, uploadedAt }`
- Visibility: `isPublicProfile`, `visibilitySettings`

### 2. Database Pipeline Metrics Schema (`insights.model.js`):
Aggregated pipeline telemetry contains:
- Volume Metrics: `trackedOpportunities`, `submittedApplications`, `activeInPipeline`, `interviewsInProgress`, `pendingOffers`, `cumulativeOffers`, `cumulativeRejections`, `savedCount`
- Stale Applications Detail: `staleApplications: Array<{ id, company, role, status, updatedAt, stageEnteredAt, daysInactive }>`
- Stage Breakdown: `stageDistribution: Array<{ status, count }>`
- Activity Series: `dailySeries: Array<{ date, count }>`
- Identifiers: `userId`

### 3. Target Request Contract (`CareerAssessmentRequest.dto.js`):
- `correlationId: string`
- `candidateProfile: { headline, yearsOfExperience, declaredSkills, targetRoles, userNotes }`
- `pipelineTelemetry: { trackedOpportunities, submittedApplications, savedCount, activeInPipeline, interviewsInProgress, pendingOffers, cumulativeOffers, cumulativeRejections, stageDistribution, staleAlerts }`
- `options: { timeoutMs?, signal? }`

---

## 4. Minimized Output Schema

The output produced by `minimizeCareerAssessmentTelemetry(request)` is an immutable object adhering strictly to the following contract:

```typescript
interface MinimizedCareerAssessmentResult {
  correlationId: string;
  candidateProfile: {
    headline: string;              // Clamped to max 120 chars, control chars stripped, PII scrubbed
    yearsOfExperience: number;     // Validated finite number (0.0 to 70.0), rounded to 1 decimal
    declaredSkills: string[];      // Deduplicated, max 50 items, max 40 chars each
    targetRoles: string[];         // Deduplicated, max 10 items, max 60 chars each
    userNotes: string | null;      // Clamped to max 1,000 chars, PII scrubbed, prompt delimiters neutralized
  };
  pipelineTelemetry: {
    trackedOpportunities: number;  // Non-negative integer
    submittedApplications: number; // Non-negative integer
    savedCount: number;            // Non-negative integer
    activeInPipeline: number;      // Non-negative integer
    interviewsInProgress: number;  // Non-negative integer
    pendingOffers: number;         // Non-negative integer
    cumulativeOffers: number;      // Non-negative integer
    cumulativeRejections: number;  // Non-negative integer
    stageDistribution: Array<{
      status: string;              // Max 40 chars, control chars stripped
      count: number;               // Non-negative integer
    }>;
    staleAlerts: {
      staleCount: number;          // Non-negative integer
      thresholdDays: number;       // Non-negative integer
    };
  };
  options?: {
    timeoutMs?: number;            // Positive finite number
    signal?: AbortSignal;          // AbortSignal instance
  };
  auditMetadata: MinimizationAuditMetadata;
  readonly minimizedRequest: CareerAssessmentRequestDTO; // Getter returning pure DTO without metadata
}
```

---

## 5. Explicit Allowlists

Minimization operates on strict allowlists. Unrecognized fields are never passed through:

### Approved Fields:
- **`candidateProfile`:** `headline`, `yearsOfExperience`, `declaredSkills`, `targetRoles`, `userNotes`.  
  *(Mapping alias: if `declaredSkills` is missing but `skills` is provided, it is mapped; if `userNotes` is missing but `bio` is provided, it is mapped).*
- **`pipelineTelemetry`:** `trackedOpportunities`, `submittedApplications`, `savedCount`, `activeInPipeline`, `interviewsInProgress`, `pendingOffers`, `cumulativeOffers`, `cumulativeRejections`, `stageDistribution`, `staleAlerts`.
- **`stageDistribution[i]`:** `status`, `count` only. All extra keys (e.g. `company`, `notes`, `internalId`) are discarded.
- **`staleAlerts`:** `staleCount`, `thresholdDays` only.
- **`options`:** `timeoutMs`, `signal` only.

### Disallowed Candidate Fields (Explicitly Scrubbed):
`id`, `userId`, `user_id`, `accountId`, `firstName`, `first_name`, `lastName`, `last_name`, `middleName`, `middle_name`, `fullName`, `full_name`, `name`, `email`, `emailAddress`, `phone`, `phoneNumber`, `telephone`, `mobile`, `address`, `residentialAddress`, `street`, `city`, `state`, `zip`, `location`, `avatar`, `avatarUrl`, `socialLinks`, `portfolio`, `github`, `linkedin`, `twitter`, `resume`, `resumeId`, `resumeFilename`, `filePath`, `password`, `password_hash`, `token`, `tokenVersion`, `createdAt`, `updatedAt`, `passwordChangedAt`, `isPublicProfile`, `visibilitySettings`, `ssn`, `creditCard`.

### Disallowed Pipeline Telemetry Fields (Explicitly Scrubbed):
`id`, `userId`, `user_id`, `accountId`, `userEmail`, `userName`, `recruiterName`, `recruiterEmail`, `recruiterPhone`, `recruiterContact`, `employerContact`, `companyNotes`, `rawNotes`, `interviewNotes`, `privateNotes`, `staleApplications`, `dailySeries`, `createdAt`, `updatedAt`, `token`, `sessionId`.

---

## 6. PII Removal Rules

Free-text fields (`userNotes`, `headline`, and skill strings) undergo multi-layered regex scrubbing:

| Category | Detection Pattern | Replacement Indicator | Audit Category |
| :--- | :--- | :--- | :--- |
| **Email Addresses** | `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g` | `[REDACTED_EMAIL]` | `email` |
| **Phone Numbers** | Labeled `(?:phone\|tel\|mobile\|cell\|contact)[:\s]+...` & standard US/Intl `(?:\+?\d{1,3})?\(?\d{3}\)?...` | `[REDACTED_PHONE]` | `phone` |
| **URLs & Links** | `https?://...`, `www....`, `github.com/...`, `linkedin.com/...` | `[REDACTED_URL]` | `url` |
| **IPv4 Addresses** | `\b(?:\d{1,3}\.){3}\d{1,3}\b` | `[REDACTED_IP]` | `ip_address` |
| **Physical Addresses**| Street address regex (`\d{1,5} ... (Street\|St\|Avenue\|Ave\|Road\|Rd\|Boulevard\|Blvd\|Drive\|Dr\|Terrace\|Ter\|Place\|Pl\|Way\|Court\|Ct)`) | `[REDACTED_ADDRESS]` | `physical_address` |
| **Government IDs** | SSN pattern `\b\d{3}-\d{2}-\d{4}\b` | `[REDACTED_ID]` | `government_id` |
| **Payment Cards** | 16-digit card pattern `(?:\d{4}[-\s]?){3}\d{4}` | `[REDACTED_PAYMENT]` | `financial_info` |
| **API Keys** | `gsk_[A-Za-z0-9_-]{10,}`, `AIza[A-Za-z0-9_-]{10,}` | `[REDACTED_API_KEY]` | `api_key` |
| **Bearer Tokens** | `Bearer\s+[A-Za-z0-9_\-.]+` | `Bearer [REDACTED]` | `credential_token` |

---

## 7. Free-Text and Delimiter Handling

1. **Character Normalization:**
   - Carriage returns (`\r\n` and `\r`) are converted to standard `\n`.
   - ASCII non-printable control characters (`[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]`) are stripped.
2. **Prompt-Injection Neutralization:**
   - Instruction tags (`<system>`, `</system>`, `<instructions>`, `</instructions>`, `<prompt>`, `</prompt>`, `<admin>`, `</admin>`, `<context>`) are replaced with `[TAG]`.
   - Markdown code fences targeting instructions (````system`, ````instruction`) are replaced with ````untrusted`.
3. **Field Length Bounds:**
   - `headline`: Max 120 characters (clamped; sets `textTruncated = true`).
   - `userNotes`: Max 1,000 characters (clamped; sets `textTruncated = true`).
   - `declaredSkills`: Max 50 items, max 40 chars per skill.
   - `targetRoles`: Max 10 items, max 60 chars per role.
4. **Encoding Isolation:**
   - In provider serialization, the minimized profile is placed inside a JSON object Turn (`JSON.stringify({ candidateProfile, pipelineTelemetry })`), ensuring that text is processed as data strings by the model rather than instructions.

---

## 8. Pipeline Telemetry Minimization

1. **Volume Metrics Isolation:** Only high-level integers are passed (`trackedOpportunities`, `submittedApplications`, `savedCount`, `activeInPipeline`, `interviewsInProgress`, `pendingOffers`, `cumulativeOffers`, `cumulativeRejections`).
2. **Metric Bounds:** Clamped between `0` and `1,000,000`. Negative or non-finite numbers trigger immediate `AiConfigurationError`.
3. **Application Details Elimination:** Raw `staleApplications` (which contain employer company names, specific job IDs, and candidate notes) are completely stripped. Only the aggregate `{ staleCount, thresholdDays }` object is passed.
4. **Stage Breakdown Cleansing:** `stageDistribution` entries retain only `{ status, count }`. Recruiter names, candidate referral notes, and database IDs are removed.

---

## 9. Fail-Closed Behavior

Under all error conditions, the minimizer throws an `AiConfigurationError` and **never returns partially sanitized or unminimized fallback data**:

- **Missing Mandatory Request:** `request === null` or non-object -> Throws `AiConfigurationError` (`INVALID_TOP_LEVEL_REQUEST`).
- **Oversized Request:** Payload > 256 KB -> Throws `AiConfigurationError` (`PAYLOAD_TOO_LARGE`).
- **Circular Structure:** Object with circular graphs -> Throws `AiConfigurationError` (`CIRCULAR_OR_MALFORMED_JSON`).
- **Missing Correlation ID:** Empty or non-string -> Throws `AiConfigurationError` (`MISSING_CORRELATION_ID`).
- **Missing Candidate Profile:** Not an object -> Throws `AiConfigurationError` (`MISSING_CANDIDATE_PROFILE`).
- **Invalid Experience Value:** Negative, non-finite, NaN, or > 70 years -> Throws `AiConfigurationError` (`NEGATIVE_EXPERIENCE_VALUE`, `INVALID_EXPERIENCE_TYPE`, `EXPERIENCE_EXCEEDS_SANITY_LIMIT`).
- **Invalid Skills or Roles:** Non-array -> Throws `AiConfigurationError` (`INVALID_SKILLS_TYPE`, `INVALID_TARGET_ROLES_TYPE`).
- **Invalid Pipeline Telemetry:** Missing required counts, negative counts -> Throws `AiConfigurationError` (`INVALID_METRIC_VALUE`).
- **Malformed Stale Alerts / Stages:** Non-array or non-object -> Throws `AiConfigurationError` (`INVALID_STAGE_DISTRIBUTION`, `INVALID_STALE_ALERTS`).

---

## 10. Audit Metadata Design

The audit metadata object allows operational monitoring without compromising candidate privacy:

```typescript
interface MinimizationAuditMetadata {
  minimizedAt: string;              // ISO 8601 timestamp
  success: boolean;                  // Always true when returned
  retainedFieldsCount: number;      // Count of retained fields
  removedFieldsCount: number;       // Count of removed fields
  retainedFields: string[];         // Sorted list of retained field names (e.g. ['candidateProfile.headline'])
  removedFields: string[];          // Sorted list of stripped field names (e.g. ['email', 'location'])
  unknownFieldsDiscarded: string[]; // Sorted list of unknown field names discarded
  textTruncated: boolean;           // True if any text field was clamped to bounds
  piiRedacted: boolean;             // True if regex scrubber replaced sensitive patterns
  piiRedactionTypes: string[];      // Categories only (e.g. ['email', 'phone', 'url']), NEVER values!
  warnings: string[];               // Operational warnings if any
}
```

### Privacy Guarantees:
- **Zero Values:** Only field names and category tags are recorded.
- **Zero Raw PII:** No redacted email strings, phone numbers, addresses, or resume filenames appear in audit logs.
- **Zero Credentials:** Configured API keys and Bearer tokens are completely absent.

---

## 11. Test Coverage Matrix

Executed via Node.js built-in test runner (`node --test Backend/test/ai/telemetryMinimizer.test.js`):

| Test Suite / Section | Test Description | Result |
| :--- | :--- | :--- |
| **1. Input Validation & Fail-Closed** | Minimizes clean valid request successfully | **PASS** |
| | Rejects non-object and null top-level requests fail-closed | **PASS** |
| | Rejects missing or empty `correlationId` | **PASS** |
| | Rejects missing or invalid `candidateProfile` | **PASS** |
| | Rejects negative or non-finite `yearsOfExperience` | **PASS** |
| | Rejects `yearsOfExperience` exceeding biological sanity limit (70 years) | **PASS** |
| | Rejects non-array `declaredSkills` | **PASS** |
| | Rejects non-array `targetRoles` | **PASS** |
| | Rejects invalid `pipelineTelemetry` structures | **PASS** |
| | Rejects oversized payloads exceeding 256 KB limit | **PASS** |
| | Handles circular references safely without crashing process | **PASS** |
| **2. PII Removal & Sanitization** | Strips names, emails, addresses, avatar, and social links from profile | **PASS** |
| | Redacts embedded contact info (email, phone, URL) in free-text notes | **PASS** |
| | Redacts physical addresses, SSNs, credit cards, and API keys in notes | **PASS** |
| **3. Explicit Field Allowlisting** | Discards arbitrary unknown fields from profile and top-level request | **PASS** |
| | Maps profile `skills` and `bio` if target DTO fields omitted | **PASS** |
| **4. Text Bounds & Delimiters** | Clamps notes exceeding 1,000 chars and sets `textTruncated` flag | **PASS** |
| | Clamps headline exceeding 120 chars and sets `textTruncated` flag | **PASS** |
| | Neutralizes control characters and instruction-injection delimiters in notes | **PASS** |
| | Preserves unicode and non-latin professional evidence accurately | **PASS** |
| **5. Pipeline Telemetry** | Preserves verified metrics while stripping recruiter and internal telemetry | **PASS** |
| | Sanitizes `stageDistribution` entries strictly to `{ status, count }` | **PASS** |
| **6. Immutability & Determinism** | Never mutates original request input | **PASS** |
| | Mutating output object does not mutate original input | **PASS** |
| | Mutating original input after minimization does not alter output | **PASS** |
| | Produces deterministic output across repeated runs with identical input | **PASS** |
| **7. Audit Metadata Security** | Discloses field names and counts without leaking PII values | **PASS** |
| **8. Dual-Access Pattern** | Supports direct property access and `.minimizedRequest` getter | **PASS** |

**Total Minimizer Tests:** **28 executed, 28 passed, 0 failed (100% pass rate).**

---

## 12. Regression & Static Verification Results

All suites across the repository were executed:

| Suite Name | File / Script Path | Test Count | Classification | Execution Result |
| :--- | :--- | :---: | :--- | :---: |
| **Stage 2B.1 AI Foundation Contracts** | `Backend/test/ai/contracts.test.js` | **32** | AI Foundation | 32 passed, 0 failed |
| **Stage 2B.2 AI Provider Adapter** | `Backend/test/ai/groqProviderAdapter.test.js` | **27** | AI Foundation | 27 passed, 0 failed |
| **Stage 2B.3A Telemetry Minimizer** | `Backend/test/ai/telemetryMinimizer.test.js` | **28** | AI Foundation (NEW) | 28 passed, 0 failed |
| **Stage 2A Groq POC Config & Errors** | `Backend/poc/groq/test_groq_config.js` | **24** | POC Validation | 24 passed, 0 failed |
| **Stage 2A Gemini POC Config & Errors**| `Backend/poc/gemini/test_gemini_config.js` | **18** | POC Validation | 18 passed, 0 failed |
| **Stage 5 Insights Automated Suite** | `Backend/src/scripts/testInsightsSuite.js` | **171** | Backend Regression | 171 passed, 0 failed |
| **Stage 4 Profile & Avatar Suite** | `Backend/src/scripts/testProfileSuite.js` | **117** | Backend Regression | 117 passed, 0 failed |
| **Stage 2 Status History Suite** | `Backend/src/scripts/testStatusHistorySuite.js` | **46** | Backend Regression | 46 passed, 0 failed |
| **Stage 5.1 Account Security Suite** | `Backend/src/scripts/testAccountSecuritySuite.js` | **65** | Backend Regression | 65 passed, 0 failed |

### Test Count Arithmetic Reconciliation:
- **AI Foundation Tests:** $32 \text{ (2B.1)} + 27 \text{ (2B.2)} + 28 \text{ (2B.3A)} = \mathbf{87 \text{ tests}}$
- **AI POC Tests:** $24 + 18 = \mathbf{42 \text{ tests}}$
- **Existing Backend Regression Tests:** $171 + 117 + 46 + 65 = \mathbf{399 \text{ tests}}$
- **Total Unique Tests Across Workspace:** $87 + 42 + 399 = \mathbf{528 \text{ unique tests}}$ (was 500 baseline, $+28$ new minimizer tests).
- **Pass Rate:** **100% (528 / 528 passed, 0 failed).**

### Static Syntax Check:
```powershell
Get-ChildItem -Path Backend/src/services/ai, Backend/test/ai -Recurse -Filter '*.js' | ForEach-Object { node --check $_.FullName }
```
- **Exit Code:** `0` (Zero syntax errors across all 21 files).

---

## 13. Dependency Changes

- **ZERO dependency additions.**  
  All sanitizers, regex scrapers, and tests use standard native CommonJS, Node.js built-ins (`node:test`, `node:assert/strict`, `Buffer`), and existing AI error classes.

---

## 14. Security Verification Findings

1. **Original Input Protection:** Tested that mutating the original request object after minimization does not affect the sanitized output, and mutating the output does not pollute the original object.
2. **Field Stripping Integrity:** Confirmed that arbitrary or adversarial fields (e.g., `adminFlag`, `salaryExpectation`, `rawNotes`, `interviewerScores`) cannot pass through the allowlist.
3. **PII Redaction Efficacy:** Tested that embedded contact details (emails, phones, URLs, addresses, SSNs, credit cards, API keys) inside free-text notes are deterministically scrubbed before payload construction.
4. **Audit Metadata Privacy:** Verified that audit logs report categories and counts only, never leaking candidate values.

---

## 15. Limitations and Unresolved Risks

1. **Heuristic Context vs Deterministic Grounding:** The minimizer prepares safe data for the model, but cannot verify whether the model will invent non-declared skills in its output. That responsibility belongs to **Stage 2B.3B (`careerAssessmentValidator.js`)**.
2. **No Full End-to-End Wiring Yet:** `GroqProviderAdapter` can now safely accept the output of `minimizeCareerAssessmentTelemetry()`, but the complete pipeline wiring belongs to **Stage 2B.4 (`CareerStrategistService`)**.

---

## 16. Confirmation of Mandatory Restrictions

1. **Live Groq/Gemini API Requests:** **ZERO** (Strictly offline execution).
2. **API Quota Consumed:** **ZERO**.
3. **Real Candidate Data Used:** **ZERO** (Synthetic fixtures exclusively).
4. **Next Milestone:** **NOT STARTED** (Stage 2B.3B has not been initiated).

---

## 17. Recommendation for Stage 2B.3B

Stage 2B.3A fulfills all privacy perimeter requirements. The telemetry minimizer is fully tested, fail-closed, and production-ready.

### Recommendation:
The Senior Backend Privacy Engineer & AI Integration Architect recommends **Stage 2B.3A Approval**. Upon explicit written authorization, proceed to **Stage 2B.3B — Deterministic Evidence Validator (`validators/careerAssessmentValidator.js`)**.

---

*Stage 2B.3A is complete. Mandatory stop condition active. Awaiting project-owner review and explicit authorization.*