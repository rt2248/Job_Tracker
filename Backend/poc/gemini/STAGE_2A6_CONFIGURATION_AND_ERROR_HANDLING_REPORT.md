# Stage 2A.6 — Gemini 3.8 Flash Configuration & Error Handling Correction Report

**Project:** Evolexa Career Strategist / Job Tracker  
**Subsystem:** `Backend/poc/gemini/`  
**Target Provider:** Google Gemini Developer API (`v1beta`)  
**Target Model:** `gemini-3.8-flash`  
**Stage:** 2A.6 (Implementation & Offline Verification — Strictly Isolated POC)  
**Status:** COMPLETE & VERIFIED (Offline / Zero Live API Inference)  
**Author:** Senior Backend AI Integration Engineer & AI Evaluation Auditor  
**Date:** November 2026

---

## Executive Summary

Stage 2A.6 successfully resolves the configuration discrepancies, benchmark integrity vulnerabilities, and error-handling deficits identified during the Stage 2A.4 and Stage 2A.5 audits of the Evolexa Gemini Proof of Concept.

Specifically, this stage implemented four architectural corrections:
1. **Gemini 3.x Native Thinking Specification:** Completely replaced the legacy integer `thinkingBudget` with the documented `thinkingLevel` enum (`LOW`, `MEDIUM`, `HIGH`; default: `MEDIUM`). Local validation guardrails enforce that unsupported configurations (including `MINIMAL`, `0`, and arbitrary strings) are rejected before any network request is initiated.
2. **Standardized Error Classification Taxonomy:** Implemented a six-category error classification engine in `geminiClient.js` (`CONFIGURATION_ERROR`, `AUTHENTICATION_ERROR`, `QUOTA_EXHAUSTED`, `CAPACITY_UNAVAILABLE`, `MODEL_FAILURE`, `NETWORK_ERROR`) with tailored retry and termination semantics.
3. **Non-Retrying Quota Exhaustion Guardrail:** Eliminated automated retry loops on HTTP 429 (`QUOTA_EXHAUSTED`). When a rate limit or daily quota ceiling is encountered, the harness halts further scenario execution immediately, avoiding wasteful requests against an exhausted quota.
4. **Benchmark Integrity & Score Isolation:** Overhauled `GeminiMetricsReporter` so that operational blocks (quota exhaustion, network timeouts, auth failures) are assigned a status of `BLOCKED` with `scores: null` (rendered as `N/A (Blocked)`). Aggregate rubric scores are calculated strictly from completed, successful inferences, guaranteeing that rate-limiting never artificially depresses the composite model quality score to 0/5.00.
5. **Comprehensive Privacy & Governance Analysis:** Audited Google Developer API Terms of Service, Zero Data Retention (ZDR) documentation ([ai.google.dev/gemini-api/docs/zdr](https://ai.google.dev/gemini-api/docs/zdr)), and Vertex AI enterprise compliance frameworks to establish data governance boundaries for Evolexa.

All implementations were verified via an offline test suite (`Backend/poc/gemini/test_gemini_config.js`) achieving 100% test pass rate (18/18 tests) with zero live API calls.

---

## 1. Thinking Configuration Implementation Details

### 1.1 Root Cause of Previous Configuration Mismatch
In Stage 2A.4, the harness attempted to disable thinking on `gemini-3.8-flash` using `thinkingBudget: 0`. As proven in the Stage 2A.5 audit, `thinkingBudget` was an integer parameter introduced in Gemini 2.5. For the Gemini 3 series (`gemini-3.8-flash`, `gemini-3-flash`, `gemini-3-pro`), Google overhauled the thinking architecture to use `thinkingLevel`.

### 1.2 Official Documentation Reference
According to Google's official Gemini API Thinking documentation ([https://ai.google.dev/gemini-api/docs/thinking](https://ai.google.dev/gemini-api/docs/thinking)):
- Gemini 3 models control reasoning depth via `generationConfig.thinkingConfig.thinkingLevel`.
- For `gemini-3.8-flash`, the supported thinking levels are:
  - `LOW`: Minimal reasoning latency, suitable for lightweight classification and high-throughput tasks.
  - `MEDIUM`: Balanced depth and latency (Google recommended default).
  - `HIGH`: Deep multi-step reasoning, higher latency and token usage.
- `MINIMAL` is **NOT supported** on `gemini-3.8-flash` (it is restricted to specific Pro models).
- Thinking **cannot be disabled** on Gemini 3.8 Flash; reasoning is intrinsic to the architecture.

### 1.3 Implementation in `geminiClient.js`
The thinking configuration is validated and mapped in [Backend/poc/gemini/geminiClient.js](file:///d:/Dev/GitHub/Job_Tracker/Backend/poc/gemini/geminiClient.js):

```javascript
const SUPPORTED_THINKING_LEVELS = ["LOW", "MEDIUM", "HIGH"];
const DEFAULT_THINKING_LEVEL = "MEDIUM";

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
```

### 1.4 API Payload Structure
In `geminiClient.js`, the request payload incorporates `thinkingConfig` within `generationConfig`:

```javascript
generationConfig: {
  temperature: 0.2,
  responseMimeType: "application/json",
  responseSchema: sanitizedSchema,
  thinkingConfig: {
    thinkingLevel: this.thinkingLevel, // "LOW" | "MEDIUM" | "HIGH"
  },
}
```

### 1.5 CLI Configuration in `harness.js`
In [Backend/poc/gemini/harness.js](file:///d:/Dev/GitHub/Job_Tracker/Backend/poc/gemini/harness.js), the runner accepts:
- `--thinking-level=<LOW|MEDIUM|HIGH>` (case-insensitive, trims whitespace, defaults to `MEDIUM`).
- Rejects legacy `--thinking-budget` with an actionable error message directing the engineer to `--thinking-level`.
- Rejects invalid levels (`MINIMAL`, `OFF`, `0`) before initiating any network requests.

---

## 2. API Error Classification Taxonomy & Handling Strategies

To eliminate ambiguity between environment failures (quota ceilings, auth invalidity) and model quality failures (schema violations, hallucinated skills), the harness introduces six discrete error categories:

| Error Type | Trigger Conditions | HTTP Status / Codes | Harness Action & Retry Policy | Impact on Benchmark Integrity |
| :--- | :--- | :--- | :--- | :--- |
| `CONFIGURATION_ERROR` | Local thinking level validation failure, missing API key, malformed request schema, invalid model slug | HTTP 400, Local validation throw | **Abort Immediately.** Zero retries. Logs specific configuration error. | Marked as `BLOCKED`. Excluded from model quality scoring. Run invalidated. |
| `AUTHENTICATION_ERROR` | Expired key, invalid credentials, unauthorized project access | HTTP 401, HTTP 403 | **Abort Immediately.** Zero retries. Logs masked key and error details. | Marked as `BLOCKED`. Excluded from model quality scoring. Run invalidated. |
| `QUOTA_EXHAUSTED` | Free-tier 15 RPM exceeded, daily 20 RPD / 1M TPM project ceiling reached (`RESOURCE_EXHAUSTED`) | HTTP 429 | **Abort Immediately.** STRICTLY ZERO RETRIES. Halts all subsequent scenarios in benchmark. | Marked as `BLOCKED` with `scores: null`. Excluded from model rubric score. |
| `CAPACITY_UNAVAILABLE` | Transient Google backend overload, temporary model server unavailable | HTTP 503, HTTP 502, HTTP 504 | **Bounded Exponential Backoff with Jitter.** Retries up to 3 times (initial backoff: 2500ms). | If resolved: Scored normally. If 3 attempts exhausted: Marked as `BLOCKED` (operational). |
| `MODEL_FAILURE` | Empty candidate part, invalid JSON output syntax, missing required fields | HTTP 200 with unparseable body | **Zero retries.** Records raw payload and parse exception. | Marked as `FAILED_INFERENCE`. Scored as model quality failure (0/5.00 for consistency). |
| `NETWORK_ERROR` | Request timeout (>60,000ms), DNS resolution failure, TCP/TLS socket transport hang | `AbortError`, `ECONNRESET`, `ETIMEDOUT` | **Zero retries.** Logs network transport exception. | Marked as `BLOCKED`. Excluded from model rubric score. |

---

## 3. Quota Handling Improvements and Retry Policies

### 3.1 Elimination of HTTP 429 Retry Loops
In Stage 2A.4, `geminiClient.js` treated HTTP 429 as a retryable error and executed 3 exponential backoff cycles (2.5s, 5.0s, 10.0s). When the free-tier daily ceiling (20 requests/day) was exhausted, these retries repeatedly hit Google's rate limiter, generating redundant 429 errors and wasting execution time.

**Corrected Policy in Stage 2A.6:**
- HTTP 429 returns immediately with `errorType: ERROR_TYPES.QUOTA_EXHAUSTED`.
- Zero automated retries are permitted for HTTP 429.
- `harness.js` detects the 429, sets `dailyQuotaExhausted = true`, and skips all remaining scenarios in the benchmark run.

```javascript
// geminiClient.js
if (response.status === 429) {
  const errBody = await response.text().catch(() => "");
  let structuredError = null;
  try { structuredError = JSON.parse(errBody); } catch (_) {}

  return {
    success: false,
    errorType: ERROR_TYPES.QUOTA_EXHAUSTED,
    statusCode: 429,
    error: `HTTP 429 Quota Exhausted: ${structuredError?.error?.message || errBody}`,
    errorDetails: structuredError,
    latencyMs,
    model: this.model,
    thinkingLevel: this.thinkingLevel,
    attempts: attempt, // Exactly 1 attempt
  };
}
```

### 3.2 Bounded Backoff Strictly for HTTP 503 Capacity Spikes
HTTP 503 indicates transient server capacity shortages rather than account budget depletion. For 503/502/504 errors:
- Up to `maxRetries = 3` attempts are allowed.
- Exponential backoff (`INITIAL_BACKOFF_MS = 2500ms`) with randomized jitter (+0 to 1000ms).
- Respects `Retry-After` response header if provided by Google.

### 3.3 Free-Tier Pacing Buffer
To eliminate intra-run RPM contention, `REQUEST_PACING_MS` in `harness.js` was increased from 3,500ms to **4,000ms** (guaranteeing $\le 15\text{ requests/min}$).

---

## 4. Benchmark Integrity Protections and Score Calculation Rules

### 4.1 Root Cause of Score Distortion in Stage 2A.4
In Stage 2A.4, when Scenarios 4 through 7 failed due to HTTP 429 quota exhaustion, `MetricsReporter` assigned them composite scores of `0.00 / 5.00`. It then averaged all 7 scenarios ($5.00 + 4.80 + 4.00 + 0 + 0 + 0 + 0 = 13.80 / 7$), producing an artificially depressed composite score of `2.69 / 5.00`.

This misrepresented operational rate limiting as poor model reasoning quality.

### 4.2 Score Isolation Guardrails
In `Backend/poc/gemini/harness.js`:
1. **Blocked Runs Have `scores: null`:**
   Any run terminated due to `QUOTA_EXHAUSTED`, `CONFIGURATION_ERROR`, `AUTHENTICATION_ERROR`, `CAPACITY_UNAVAILABLE`, or `NETWORK_ERROR` is categorized as `BLOCKED`. Its score object is set to `null` and displayed in reports as `N/A (Blocked)`.
2. **Quality Metrics Derived Strictly from Completed Inferences:**
   Composite score, rubric dimension averages (Evidence Grounding, Actionability, Relevance, Reasoning, Consistency), token consumption, and latency are computed **exclusively across successful inferences** ($N_{\text{completed}}$).
   $$\text{Composite Score} = \frac{1}{N_{\text{completed}}} \sum_{i \in \text{completed}} \text{Score}_i$$
   If $N_{\text{completed}} = 0$, the composite score is reported as `N/A`, avoiding division-by-zero errors or false 0.00 scores.
3. **Transparent Operational Reporting:**
   The benchmark summary explicitly distinguishes operational status:
   - `Total Planned Scenarios`
   - `Scenario Coverage Rate` ($\frac{N_{\text{completed}}}{N_{\text{planned}}} \times 100\%$)
   - `Successful Executions`
   - `Failed Inferences` (model output syntax/structure failures)
   - `Blocked Executions` (with breakdown by Quota, Capacity, Auth, Config, Network)

---

## 5. Gemini Developer API Privacy Analysis & Candidate Data Implications

### 5.1 Free Tier Data Privacy Risks (CRITICAL)
Under Google AI Studio / Gemini Developer API Free Tier terms:
- **Human Review:** Google reviewers may read, annotate, and evaluate user prompts, candidate data, and model outputs.
- **Model Training:** Prompt and response data **is used to train and improve Google models and products**.
- **Retention:** De-identified reviewer records may be retained for up to 18 months.
- **Application to Evolexa:** **Under NO circumstances may actual candidate resumes, full names, emails, career histories, or proprietary platform telemetry be transmitted to the Gemini Developer API Free Tier.** The Free Tier is strictly permissible for synthetic, anonymized POC evaluations.

### 5.2 Paid Tier Data Privacy Protections
When billing is enabled on Google AI Studio / Gemini Developer API (Pay-as-you-go):
- **Model Training:** Google does **not** use customer prompt or completion data to train models.
- **Human Review:** Prompts and completions are not subject to human review.
- **Abuse Monitoring Window:** Google retains prompts and responses for **up to 55 days** in an encrypted, access-restricted abuse logging pipeline to detect violations of Acceptable Use Policies.

### 5.3 Zero Data Retention (ZDR) on Developer API
Per Google documentation ([ai.google.dev/gemini-api/docs/zdr](https://ai.google.dev/gemini-api/docs/zdr)):
- ZDR allows customers to prevent prompt/response logging beyond the time required to generate the response.
- **Mandatory Prerequisites for Developer API ZDR:**
  1. Project must be on a Paid Plan.
  2. The application must explicitly pass `store: false` on Interactions API requests.
  3. Grounding with Google Search or Google Maps **must be disabled** (grounded requests retain query data for 30 days).
  4. Persistent File API uploads must not be used (or deleted immediately).
  5. `SessionResumptionConfig` must be disabled.

---

## 6. Data Governance Comparison: Free Tier vs. Paid Tier vs. Vertex AI

| Feature / Governance Criterion | Gemini Developer API (Free Tier) | Gemini Developer API (Paid Tier) | Vertex AI (Google Cloud Platform) |
| :--- | :--- | :--- | :--- |
| **Model Training on Customer Data** | **YES** (Google trains models on prompts/outputs) | **NO** (Strictly excluded from model training) | **NO** (Strict contractual guarantee) |
| **Human Review of Prompts** | **YES** (De-identified prompts reviewed) | **NO** | **NO** |
| **Data Retention Window** | Up to 18 months (reviewer data) | Up to 55 days (abuse monitoring) | Zero retention options; customer-controlled storage |
| **Zero Data Retention (ZDR)** | Not available | Available with `store: false` & feature restrictions | Supported natively across enterprise endpoints |
| **Data Residency / Regional Sovereignty** | Global (Google routed) | Global (Google routed) | **Strict Regional Guarantees** (e.g. `us-central1`, `europe-west1`) |
| **Compliance & Accreditations** | None | Limited Developer API ToS | **SOC 1/2/3, ISO 27001, ISO 27018, HIPAA BAA, GDPR DPA** |
| **Security Controls** | API Key only | API Key only | **IAM, VPC Service Controls (VPC-SC), CMEK, Private Endpoints** |
| **SLA & Availability Guarantees** | None (best-effort, rate-limited) | Standard web tier SLA | **Enterprise Financial SLA (99.9% uptime)** |
| **Suitability for Evolexa Production** | **UNSUITABLE** (Data leak risk) | **Conditional** (Only with ZDR enabled) | **RECOMMENDED ENTERPRISE ARCHITECTURE** |

---

## 7. Offline Verification Test Results

To verify the implementation without making external network calls or consuming API quota, a dedicated test harness was executed: [Backend/poc/gemini/test_gemini_config.js](file:///d:/Dev/GitHub/Job_Tracker/Backend/poc/gemini/test_gemini_config.js).

### Test Suite Execution Output
```
================================================================================
       STAGE 2A.6 OFFLINE VERIFICATION: GEMINI CONFIG & ERROR TAXONOMY          
================================================================================

--- 1. Thinking Level Validation (Gemini 3.x Specification) ---
  ✓ defaults to MEDIUM when level is undefined, null, or empty string
  ✓ accepts valid thinking levels: LOW, MEDIUM, HIGH
  ✓ handles case-insensitivity and trimming for thinking levels
  ✓ explicitly rejects MINIMAL with guidance that gemini-3.8-flash does not support it
  ✓ explicitly rejects numeric token budgets (e.g. 0) with legacy 2.5 guidance
  ✓ rejects unsupported arbitrary levels (OFF, NONE, EXTREME, -1)

--- 2. Error Classification Taxonomy Constants ---
  ✓ defines all six mandatory error classifications

--- 3. Client Local Guardrails (No API Call for Invalid Config) ---
  ✓ halts immediately with CONFIGURATION_ERROR when client instantiated with invalid thinkingLevel

--- 4. API Error Mapping & Non-Retrying Quota Guardrail (Mocked) ---
  ✓ maps HTTP 400 Bad Request to CONFIGURATION_ERROR
  ✓ maps HTTP 401 & 403 to AUTHENTICATION_ERROR
  ✓ HTTP 429 returns QUOTA_EXHAUSTED immediately with ZERO retries
  ✓ HTTP 503 triggers bounded retries and maps to CAPACITY_UNAVAILABLE
  ✓ Timeout / AbortError maps to NETWORK_ERROR
  ✓ Malformed non-JSON output maps to MODEL_FAILURE

--- 5. Benchmark Integrity & Score Isolation ---
  ✓ marks operational blocks as BLOCKED with null scores (never 0/5.00)
  ✓ calculates rubric composite scores exclusively from completed runs
  ✓ reports N/A rubric scores when all executions are blocked (no division by zero or 0.00 score)

--- 6. Schema Sanitization for Gemini OpenAPI Dialect ---
  ✓ recursively removes additionalProperties from schema while preserving structure

================================================================================
TEST SUMMARY: 18 / 18 passed (100%)
================================================================================
```

### CLI Flag Validation Verification
The CLI interface was verified against multiple valid and invalid permutations:
- `node Backend/poc/gemini/harness.js --dry-run`: **SUCCESS** (100% scenario coverage, 4.63/5.00 score, 0ms latency).
- `node Backend/poc/gemini/harness.js --thinking-level=LOW --dry-run`: **SUCCESS** (Correctly passed `LOW`).
- `node Backend/poc/gemini/harness.js --thinking-level=MINIMAL --dry-run`: **HALTED WITH EXIT CODE 1** (`Invalid thinkingLevel 'MINIMAL'. Supported levels for gemini-3.8-flash are: LOW, MEDIUM, HIGH`).
- `node Backend/poc/gemini/harness.js --thinking-budget=0 --dry-run`: **HALTED WITH EXIT CODE 1** (`Legacy flag '--thinking-budget=0' is deprecated and unsupported. Use --thinking-level=<LOW|MEDIUM|HIGH>`).
- `node Backend/poc/gemini/harness.js --thinking-level=OFF --dry-run`: **HALTED WITH EXIT CODE 1** (`Invalid thinkingLevel 'OFF'. Supported levels for gemini-3.8-flash are: LOW, MEDIUM, HIGH`).

---

## 8. Readiness Checklist for Subsequent Benchmark Execution

Before authorizing Stage 2A.7 live benchmark execution, all prerequisite conditions must be verified:

| Check | Item | Status | Verification Detail |
| :---: | :--- | :---: | :--- |
| [x] | **Thinking Level Implementation** | **READY** | Configured to native Gemini 3.x enum (`LOW`, `MEDIUM`, `HIGH`). |
| [x] | **Local Configuration Guardrail** | **READY** | Invalid configurations halt locally before dispatching network calls. |
| [x] | **Error Taxonomy Mapping** | **READY** | 6 distinct error classes implemented with granular handling. |
| [x] | **Non-Retrying 429 Guardrail** | **READY** | HTTP 429 halts immediate retry loops and prevents quota exhaustion spam. |
| [x] | **Benchmark Score Isolation** | **READY** | Blocked runs assigned `scores: null`; composite score calculated from completed runs only. |
| [x] | **Pacing Safety Interval** | **READY** | Pacing set to 4,000ms between calls (safe $\le 15\text{ RPM}$). |
| [x] | **Schema Compatibility** | **READY** | `additionalProperties` stripped recursively for OpenAPI compliance. |
| [ ] | **Daily Quota Reset Confirmation** | **PENDING** | Free-tier daily quota (20 RPD) resets at 00:00 UTC. Live execution requires confirmed quota availability. |
| [ ] | **User Authorization for Live Calls** | **PENDING** | Strict adherence to read-only/offline protocol until user explicitly commands live execution. |

---

## 9. Recommendations for Stage 2A.7 Benchmark Execution

When proceeding to Stage 2A.7 (Gemini 3.8 Flash Controlled Benchmark Execution), the following protocol is recommended:

1. **Verify Quota Reset Window:**
   Ensure Google AI Studio daily quotas have reset (00:00 UTC / 05:30 IST) before starting the benchmark run.
2. **Execute Single-Run Evaluation First:**
   Execute a single full-suite pass (`--runs=1 --all`) with `--thinking-level=MEDIUM` to evaluate the 7 scenarios within the 20 RPD quota envelope (consuming 7 of 20 daily requests).
3. **Pacing Compliance:**
   Maintain the 4,000ms inter-scenario pacing delay to avoid hitting the 15 RPM burst ceiling.
4. **Compare Thinking Levels Systematically (If Quota Permits):**
   Evaluate the latency and token differential between `LOW` and `MEDIUM` thinking levels across representative scenarios (e.g. Scenario 1 and Scenario 2) rather than running all 7 scenarios across multiple thinking levels simultaneously.
5. **Production Architecture Recommendation:**
   When transitioning Evolexa Career Strategist from POC to production, migrate from Gemini Developer API to **Google Cloud Vertex AI** to ensure HIPAA/GDPR compliance, Zero Data Retention, VPC Service Controls, and regional data sovereignty for actual candidate telemetry.
