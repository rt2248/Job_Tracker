# Stage 2B.3C — Sanitizer & Validator Verification Gate Audit Report

**Project:** Evolexa Career Strategist / Job Tracker  
**Role:** Senior Backend Security Auditor & AI Architecture Reviewer  
**Milestone:** Stage 2B.3C of 2B  
**Execution Mode:** STRICTLY READ-ONLY — OFFLINE AUDIT  
**Authorization:** Explicitly approved by Project Owner  
**Prerequisites:** Stage 2B.3A (`telemetryMinimizer.js`) and Stage 2B.3B (`careerAssessmentValidator.js`) implementations  
**Overall Verdict:** **PASS WITH CONDITIONS**

---

## 1. Executive Summary

This independent code-level security and architectural audit examined the complete AI data preparation, telemetry minimization, provider boundary, and evidence-validation layers implemented in Stages 2B.1, 2B.2, 2B.3A, and 2B.3B.

The audit verified that the Option C architecture delivers a strong, modular, zero-dependency foundation. Candidate profile allowlisting, deterministic PII scrubbing, execution boundary timeout/cancellation races, and prototype pollution defenses operate correctly and pass all 553 automated tests across the repository.

However, an exhaustive inspection and adversarial testing of the actual source code uncovered critical boundary and validation nuances that must be addressed or strictly controlled before live inference or real candidate data is processed:
1. **Metric Citation Global Set Membership Flaw (Finding HIGH-01):** The evidence validator uses global integer set membership (`numbers.some(n => validTelemetryNumbers.has(n))`) rather than metric-to-value association. As a result, a model claiming `"25 pending offers"` is accepted when 25 is actually `trackedOpportunities`, and a citation containing a fabricated number alongside a valid number (e.g. `"9999 interviews and 1 rejection"`) is marked valid.
2. **Provider Boundary Lacks Minimization Enforcement (Finding HIGH-02):** `GroqProviderAdapter.generateAssessment()` and `validateCareerAssessmentRequest()` validate required fields but do not reject unminimized candidate properties (e.g., `email`, `ssn`). The adapter cannot distinguish a minimized DTO from an unminimized object. Privacy enforcement currently rests entirely on the caller.
3. **Web ReadableStream Early Cancellation Defect (Finding MED-01):** `GroqProviderAdapter.js` invokes `response.body?.destroy()`. Under native Node.js `fetch()`, `response.body` is a Web `ReadableStream` providing `.cancel()`, not `.destroy()`.
4. **Credential Factual Assertion Regex Omits Factual Sections (Finding MED-02):** `careerAssessmentValidator.js` checks credential claims in 4 text fields, but omits `pipelineDiagnostics.staleApplicationRisk` and `skillGapAnalysis.skillBridgingAdvice`.
5. **Validator Output Retains Unknown Arbitrary Model Fields (Finding MED-03):** `sanitizeAssessmentPayload()` strips prototype keys and `hallucinationCheckPassed`, but copies all unknown model fields into `sanitizedAssessment`.
6. **Strict Non-Synonym Skill Grounding (Finding MED-04):** `normalizeSkill()` does not map common industry synonyms (e.g. `Golang` $\rightarrow$ `Go`, `PostgreSQL` $\rightarrow$ `Postgres`), causing false rejections (`UNSUPPORTED_CLAIMS`) unless the model echoes verbatim skill names.

Because the underlying architectural patterns are fundamentally sound and no live network boundary is yet exposed, the audit gives a verdict of **PASS WITH CONDITIONS**. The 6 identified corrective actions must be incorporated as mandatory integration prerequisites during Stage 2B.4.

---

## 2. Exact Files Inspected

The following 15 production, contract, and test files were audited line-by-line:

| Component | File Path | Lines |
|---|---|---:|
| Telemetry Minimizer | `Backend/src/services/ai/sanitizers/telemetryMinimizer.js` | 805 |
| Evidence Validator | `Backend/src/services/ai/validators/careerAssessmentValidator.js` | 541 |
| Career Assessment Request DTO | `Backend/src/services/ai/contracts/dtos/CareerAssessmentRequest.dto.js` | 169 |
| Raw Provider Assessment Output DTO | `Backend/src/services/ai/contracts/dtos/RawProviderAssessmentOutput.dto.js` | 77 |
| Career Assessment Response DTO | `Backend/src/services/ai/contracts/dtos/CareerAssessmentResponse.dto.js` | 181 |
| Chat Stream Request DTO | `Backend/src/services/ai/contracts/dtos/ChatStreamRequest.dto.js` | 79 |
| Chat Stream Chunk DTO | `Backend/src/services/ai/contracts/dtos/ChatStreamChunk.dto.js` | 91 |
| Groq Provider Adapter | `Backend/src/services/ai/providers/groq/GroqProviderAdapter.js` | 587 |
| Groq Rate Limit Parser | `Backend/src/services/ai/providers/groq/groqRateLimitParser.js` | 148 |
| Base AI Provider Adapter | `Backend/src/services/ai/providers/BaseAiProviderAdapter.js` | 341 |
| Execution Boundary Contract | `Backend/src/services/ai/contracts/executionBoundaryContract.js` | 148 |
| AI Error Foundation | `Backend/src/services/ai/contracts/errors/AiError.js` | 171 |
| Structural Conformance | `Backend/src/services/ai/contracts/conformance.js` | 71 |
| AI Foundation Barrel Export | `Backend/src/services/ai/index.js` | 58 |
| Fallback Policy | `Backend/src/services/ai/policy/fallbackPolicy.js` | 99 |

---

## 3. Minimizer Audit (Audit A)

### A1. Allowlisting & Structural Stripping
- **Approved Candidate Fields:** Strictly restricted to `ALLOWED_CANDIDATE_KEYS` (`headline`, `yearsOfExperience`, `declaredSkills`, `targetRoles`, `userNotes`).
- **Approved Telemetry Fields:** Strictly restricted to `ALLOWED_TELEMETRY_KEYS` (8 volume metrics, `stageDistribution`, `staleAlerts`).
- **Unknown Properties:** Top-level, profile, and telemetry properties outside allowlists are completely discarded during object reconstruction.
- **Recursive Copying:** Zero arbitrary recursive copying exists. Pipeline metrics are reconstructed field-by-field; `stageDistribution` items are mapped strictly to `{ status, count }`; `staleAlerts` is mapped strictly to `{ staleCount, thresholdDays }`.
- **Mapping Aliases:** Aliases (`skills` $\rightarrow$ `declaredSkills`, `bio` $\rightarrow$ `userNotes`) pass directly into `sanitizeDeclaredSkills()` and `sanitizeUserNotes()`. They cannot bypass sanitization, bounding, or scrubbing.
- **Options & AbortSignal:** `sanitizeOptions()` explicitly extracts only `timeoutMs` (finite positive number) and `signal` (`instanceof AbortSignal`). Arbitrary options properties are ignored.

### A2. PII Protection & Scrubbing Heuristics
- **Direct PII Removal:** Names, IDs, account IDs, emails, telephone numbers, residential addresses, avatar URLs, social links, resume file paths, password hashes, session tokens, SSNs, and credit cards are discarded via field allowlisting and explicit disallowed PII auditing.
- **Free-Text Scrubbing (`scrubFreeTextPii`):**
  - Email addresses: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g` $\rightarrow$ `[REDACTED_EMAIL]`
  - Labeled & Standard Phone Numbers: Labeled and standard domestic/international phone numbers $\rightarrow$ `[REDACTED_PHONE]`
  - URLs & Social Handles: Web URLs and github/linkedin/twitter handles $\rightarrow$ `[REDACTED_URL]`
  - IP Addresses: IPv4 octets $\rightarrow$ `[REDACTED_IP]`
  - Street Addresses: US/UK street suffixes $\rightarrow$ `[REDACTED_ADDRESS]`
  - SSN / National IDs: Standard US SSN format $\rightarrow$ `[REDACTED_ID]`
  - Payment Cards: 16-digit card patterns $\rightarrow$ `[REDACTED_PAYMENT]`
  - Credentials: `gsk_`, `AIza`, and `Bearer` tokens $\rightarrow$ `[REDACTED_API_KEY]` / `Bearer [REDACTED]`
- **Inherent Regex Boundaries:** The audit confirms that regex scrubbing in free text is an effective defense-in-depth layer, but cannot provide 100% detection for international address conventions (e.g. French "10 Rue de la Paix"), non-Latin telephone formats, or non-ASCII email addresses. The authoritative privacy boundary remains field allowlisting.

### A3. Determinism and Immutability
- **Determinism:** Given identical input, the core minimized payload is deterministic across runs.
- **Timestamp Behavior:** `minimizedAt` uses `new Date().toISOString()`, which advances per invocation as intended for audit timestamps.
- **Audit Metadata Determinism:** Counts, retained fields, and removed fields are sorted alphabetically, ensuring deterministic ordering.
- **Immutability Assessment:** The minimizer creates fresh object instances detached from the input. However, neither the returned object nor its nested objects are frozen with `Object.freeze()`. The `.minimizedRequest` getter creates a shallow clone on demand, but reads from `this.candidateProfile.declaredSkills`. If a caller mutates `result.candidateProfile`, the getter will clone the mutated state (Finding LOW-01).

### A4. Audit Metadata Security
- **Safe Disclosures:** Audit metadata exposes counts (`retainedFieldsCount`, `removedFieldsCount`), sorted key names (`retainedFields`, `removedFields`, `unknownFieldsDiscarded`), and redaction category tags (`piiRedactionTypes`).
- **No Value Disclosure:** Zero input values, PII strings, or credentials appear in audit metadata.
- **Attacker-Controlled Property Names:** Injected property names are logged in `unknownFieldsDiscarded` as string keys, but cannot execute or contaminate object prototypes.

### A5. Fail-Closed Behavior
- Non-object inputs, missing correlation IDs, non-finite experience numbers, negative experience, values exceeding biological sanity (70 years), non-array skills, malformed telemetry, and payloads exceeding 256 KB throw `AiConfigurationError` fail-closed.
- Circular JSON references throw `AiConfigurationError` with code `CIRCULAR_OR_MALFORMED_JSON`. Under no condition does the minimizer return raw or unvalidated data.

---

## 4. Validator Audit (Audit B)

### B1. Skill Grounding
- **Normalization:** `normalizeSkill()` lowercases, trims, strips `.js`, and removes non-alphanumeric characters (except `+` and `#` for `C++` / `C#`).
- **Strict Subset Enforcement:** Verified candidate skills must be a strict case-insensitive normalized subset of declared candidate skills.
- **Contradiction Detection:** If a skill in `criticalMissingSkills` was already declared by the candidate, it is flagged as a contradiction.
- **Synonym Limitation:** The validator does not map semantic equivalents (e.g., `Golang` $\neq$ `Go`, `PostgreSQL` $\neq$ `Postgres`). The validator conservatively rejects unmapped synonyms with `UNSUPPORTED_CLAIMS` (Finding MED-04).

### B2. Experience and Career Stage Floors
- **Floor Rules:**
  - 0 years experience cannot be classified as `senior` or `lead_architect`.
  - $< 3$ years experience cannot be classified as `lead_architect`.
- **Text Rationale Experience Claims:** Text in candidate summary, pipeline diagnostics, and recommendation rationales is scanned for expressions claiming more years than the candidate possesses ($> \text{candidateYears} + 1.0$).
- **Assumption Note:** A candidate with 1.5 years experience classified as `senior` is not blocked by the $< 1.0$ floor. Thresholds should be reviewed if stricter mid-level caps are desired.

### B3. Metric Citation Grounding (Detailed Audit)
- **Current Mechanism:** Lines 306-348 collect all numeric values from `pipelineTelemetry` into a flat `validTelemetryNumbers = new Set(...)`.
- **Flaw Verified:**
  1. **No Metric-to-Value Association:** The validator does not link metric names to specific telemetry properties. For example, if telemetry has `trackedOpportunities: 25` and `pendingOffers: 1`, a model claim of `"25 pending offers"` is marked **VALID** because 25 exists in `validTelemetryNumbers`!
  2. **`some()` vs `every()` Flaw:** Line 338 executes `numbers.some(n => validTelemetryNumbers.has(n))`. If a model writes `"9999 fabricated interviews with 1 valid rejection"`, the validator accepts the entire string because `1` is in telemetry!
  3. **Qualitative Citations Unaudited:** Citations with zero numbers are automatically accepted into `validatedMetrics`.
  4. **Derived Percentages:** Legitimate percentage citations (e.g. `"50% conversion"`) falsely fail if 50 is not an exact telemetry count, or falsely pass if an unrelated metric has value 50.
- **Verdict on B3:** This is a **HIGH** severity finding (HIGH-01) that must be resolved.

### B4. Factual Claims
- **Degree & Certification Regex:** Matches standard phrases (`graduated from`, `holds a master/phd/degree`, `certified in`, etc.).
- **Omission in Coverage:** The regex is only applied to `primaryBottleneck`, `volumeAssessment`, `stageProgressionVelocity`, and `dataLimitationsNoted`. It omits `pipelineDiagnostics.staleApplicationRisk` and `skillGapAnalysis.skillBridgingAdvice` (Finding MED-02).
- **Employment History:** The candidate request DTO contains no past employment history (company names, past titles). Model assertions regarding specific past employers (e.g. `"Candidate previously worked as Principal Architect at Google"`) cannot be audited against input data and escape detection.

### B5. Facts vs. Recommendations
- **Future Recommendations Permitted:** Future-oriented advice in `strategicRecommendations` (e.g. "Prepare for AWS Solutions Architect certification", "Acquire TypeScript skills") is preserved and permitted.
- **Candidate-Specific Claims in Recommendations:** Recommendations cannot be used to claim unearned past experience without triggering the text experience regex.

### B6. Output Sanitization
- **Self-Verification Disregard:** `hallucinationCheckPassed` is recursively stripped at all nesting depths.
- **Prototype Pollution Defense:** `__proto__`, `constructor`, and `prototype` keys are stripped recursively.
- **Output Size Limit:** Payloads exceeding 512 KB are rejected with `AiConfigurationError` before processing.
- **Weakness:** `sanitizeAssessmentPayload()` does not enforce an allowlist on output keys; arbitrary unknown model fields survive into `sanitizedAssessment` (Finding MED-03).
- **Result Status vs Sanitized Output:** When `status === "UNSUPPORTED_CLAIMS"`, `sanitizedAssessment` is still returned as a populated object rather than `null`. Callers that fail to check `isValid === true` could inadvertently consume invalid assessments (Finding MED-05).

---

## 5. Cross-Component Boundary Audit (Audit C)

The end-to-end data flow was evaluated across the proposed processing pipeline:

```
Raw Request ──► [Telemetry Minimizer] ──► Minimized Request DTO ──► [Groq Provider Adapter]
                                                                            │
Validated Assessment ◄── [Evidence Validator] ◄── Raw Provider Output DTO ◄─┘
```

### Boundary Questions & Concrete Answers:

1. **Can any provider-facing method receive raw candidate data without minimization?**  
   **YES.** `GroqProviderAdapter.generateAssessment(request)` accepts any object satisfying `validateCareerAssessmentRequest()`. The adapter has no check requiring prior minimization.
2. **Can the adapter distinguish a genuine minimized DTO from an arbitrary object with matching properties?**  
   **NO.** There is no branding, symbol, or internal token distinguishing a minimized DTO from a raw request object.
3. **Can the validator accidentally receive raw candidate data?**  
   **YES.** If an unminimized request object is passed to `validateCareerAssessmentEvidence()`, `validateCareerAssessmentRequest()` will accept it if required fields are present.
4. **Do minimization failures reject the operation?**  
   **YES.** All minimization errors throw `AiConfigurationError` fail-closed.
5. **Do validation failures prevent an assessment from being accepted?**  
   **YES, IF CHECKED.** The validator returns `isValid: false`. However, if `throwOnError: false` is used and the caller inspects `sanitizedAssessment` without checking `isValid`, ungrounded data could leak.
6. **Are `UNSUPPORTED_CLAIMS` and `STRUCTURAL_INVALID` unmistakably rejected?**  
   `STRUCTURAL_INVALID` returns `sanitizedAssessment: null`. `UNSUPPORTED_CLAIMS` returns `isValid: false`, but `sanitizedAssessment` is non-null.
7. **Can a future orchestration layer accidentally bypass either boundary?**  
   **YES.** Because components are decoupled, the Stage 2B.4 orchestrator must explicitly enforce the pipeline sequence.

---

## 6. Outstanding Stage 2B.2 Conditions (Audit D)

### D1. Fetch ReadableStream Cancellation
- **Inspection Result:** `GroqProviderAdapter.js` lines 491-494 currently contains:
  ```javascript
  if (response.body?.destroy) {
    response.body.destroy();
  }
  ```
- Under native Node.js global `fetch()`, `response.body` is a Web `ReadableStream`.
- Web `ReadableStream` instances implement `.cancel()`, NOT `.destroy()`.
- Consequently, `response.body.destroy()` is a no-op when using native `fetch()`.
- **Required Action:** Update cleanup to check for both methods:
  ```javascript
  if (typeof response.body?.cancel === "function") {
    response.body.cancel().catch(() => {});
  } else if (typeof response.body?.destroy === "function") {
    response.body.destroy();
  }
  ```

### D2. Streaming Terminal Semantics
- **Inspection Result:** The streaming loop in `GroqProviderAdapter.js` (lines 460-486) maintains a `terminalEmitted` boolean flag.
- Normal completion yields a single chunk with `finishReason: "stop"`.
- Caller cancellation yields a single chunk with `finishReason: "abort"`.
- Upstream transport error yields a single chunk with `finishReason: "error"`.
- `terminalEmitted = true` strictly guarantees that exactly one terminal chunk is emitted, and no subsequent chunks follow.

### D3. Permanently Pending Promise Pattern
- **Inspection Result:** `executionBoundaryContract.js` lines 92 and 99 (and `BaseAiProviderAdapter.js` lines 198 and 205) return `new Promise(() => {})` when `boundarySettled === true`.
- **Assessment:** Once `Promise.race` settles, any late resolution or rejection of `executeFn` cannot alter the race outcome under ECMAScript specifications. Returning `new Promise(() => {})` suppresses unhandled rejections, but allocates an unresolved Promise object that remains in memory until garbage collection.
- **Recommendation:** Replacing `new Promise(() => {})` with `return null` or `return undefined` accomplishes identical late-settlement suppression without allocating a hanging promise.

---

## 7. Adversarial Offline Test Scenarios (Audit E)

The 14 mandatory adversarial scenarios were executed against the actual implementation using an isolated non-mutating test harness (`adversarial_audit.js`):

| # | Scenario | Outcome | Audit Finding / Notes |
|---|---|:---:|---|
| 1 | PII embedded in unknown nested fields | **PASS** | Unknown nested objects completely stripped by explicit allowlists. |
| 2 | Attacker-controlled unknown property names | **PASS** | Injected properties routed to `unknownFieldsDiscarded` without prototype pollution. |
| 3 | Mutated minimizer output before provider dispatch | **DEFECT (LOW)** | Direct property mutation mutates arrays read by `.minimizedRequest` getter (Finding LOW-01). |
| 4 | Metric-to-value substitution | **DEFECT (HIGH)** | Claiming "25 pending offers" passes because 25 is in `trackedOpportunities` (Finding HIGH-01). |
| 5 | Duplicate metric values across unrelated fields | **AMBIGUOUS** | When 2 fields share value 2, validator cannot verify which metric was cited. |
| 6 | Unsupported experience claim in recommendation rationale | **PASS** | Claiming 15 years experience for a 4.5-year candidate detected and rejected. |
| 7 | Unsupported credentials in summary | **PASS** | Claiming Stanford PhD detected and rejected with `UNSUPPORTED_CLAIMS`. |
| 8 | Fabricated claims with ambiguous natural language | **LIMITATION** | Natural language employment history (e.g. "Worked at Google as Principal") escapes regex. |
| 9 | Unicode and non-English PII | **LIMITATION** | Chinese phone numbers and European street addresses not matched by US/English regex. |
| 10 | Malicious prototype-related structures | **PASS** | `__proto__`, `constructor`, `prototype` stripped; `({}).polluted` remains `undefined`. |
| 11 | Validator result with unsupported claims and non-null output | **DEFECT (MED)** | `sanitizedAssessment` is non-null when `status === "UNSUPPORTED_CLAIMS"` (Finding MED-05). |
| 12 | Provider-boundary invocation without minimization | **DEFECT (HIGH)** | Adapter accepts unminimized candidate profile with raw PII (Finding HIGH-02). |
| 13 | Exactly-once streaming termination | **PASS** | `terminalEmitted` guard guarantees exactly one terminal chunk on all paths. |
| 14 | Web ReadableStream cancellation | **DEFECT (MED)** | Adapter calls `.destroy()` but Web `ReadableStream` requires `.cancel()` (Finding MED-01). |

---

## 8. Regression Test Results & Reconciled Arithmetic

All automated test suites across the repository were executed offline. Zero tests failed; zero tests were skipped.

| Category | Suite | Tests Executed | Passed | Failed | Pass Rate |
|---|---|---:|---:|---:|---:|
| **AI Foundation** | `test/ai/contracts.test.js` | 32 | 32 | 0 | 100% |
| **AI Foundation** | `test/ai/groqProviderAdapter.test.js` | 27 | 27 | 0 | 100% |
| **AI Foundation** | `test/ai/telemetryMinimizer.test.js` | 28 | 28 | 0 | 100% |
| **AI Foundation** | `test/ai/careerAssessmentValidator.test.js` | 25 | 25 | 0 | 100% |
| **AI Subtotal** | *All AI Foundation Modules* | **112** | **112** | **0** | **100%** |
| **POC Suite** | `poc/groq/test_groq_config.js` | 24 | 24 | 0 | 100% |
| **POC Suite** | `poc/gemini/test_gemini_config.js` | 18 | 18 | 0 | 100% |
| **POC Subtotal** | *All POC Verification Suites* | **42** | **42** | **0** | **100%** |
| **Backend Regression** | `scripts/testInsightsSuite.js` | 171 | 171 | 0 | 100% |
| **Backend Regression** | `scripts/testProfileSuite.js` | 117 | 117 | 0 | 100% |
| **Backend Regression** | `scripts/testStatusHistorySuite.js` | 46 | 46 | 0 | 100% |
| **Backend Regression** | `scripts/testAccountSecuritySuite.js` | 65 | 65 | 0 | 100% |
| **Backend Subtotal** | *All Core Backend Services* | **399** | **399** | **0** | **100%** |
| **TOTAL** | **Complete Repository Baseline** | **553** | **553** | **0** | **100%** |

### Static Syntax Check
- **Files Checked:** 32 JavaScript files under `Backend/src/services/ai/`.
- **Command:** `node --check <file>` on every module.
- **Result:** 0 syntax errors.

---

## 9. Security Findings Classified by Severity

### HIGH Severity

#### HIGH-01: Metric Citation Grounding Uses Global Set Membership Rather Than Metric-to-Value Association
- **Location:** [`careerAssessmentValidator.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/validators/careerAssessmentValidator.js#L306-L348)
- **Evidence:** Lines 306-348 assemble all numbers from `pipelineTelemetry` into a single `validTelemetryNumbers = new Set(...)`. It then extracts integers from `citedMetrics` and tests `numbers.some(n => validTelemetryNumbers.has(n))`.
- **Impact:**
  1. A model citing `"25 pending offers"` is marked valid when 25 is actually `trackedOpportunities` and the candidate has only 1 offer.
  2. Because `numbers.some()` is used, a citation string containing a fabricated integer alongside a valid integer (e.g. `"9999 interviews and 1 rejection"`) is marked valid.
  3. Citations without integers are accepted without validation.
- **Blocks Stage 2B.4?** NO (can be corrected as part of Stage 2B.4 orchestration setup), but MUST be resolved before live inference.

#### HIGH-02: Provider Adapter Accepts Unminimized Data Without Verification
- **Location:** [`GroqProviderAdapter.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/providers/groq/GroqProviderAdapter.js#L151-L180), [`CareerAssessmentRequest.dto.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/contracts/dtos/CareerAssessmentRequest.dto.js#L63-L165)
- **Evidence:** `validateCareerAssessmentRequest()` validates required fields but does not forbid extra unminimized properties. The adapter has no verification that `request` passed through `minimizeCareerAssessmentTelemetry()`.
- **Impact:** If a caller invokes the adapter directly, raw candidate data (including emails, phones, and SSNs) will be serialized and transmitted to external providers.
- **Blocks Stage 2B.4?** NO, provided Stage 2B.4 enforces the minimizer as a mandatory pipeline gate before adapter dispatch.

---

### MEDIUM Severity

#### MED-01: Web ReadableStream Early Cancellation Method Defect
- **Location:** [`GroqProviderAdapter.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/providers/groq/GroqProviderAdapter.js#L491-L494)
- **Evidence:** `if (response.body?.destroy) { response.body.destroy(); }`. Native fetch returns a Web `ReadableStream` possessing `.cancel()`, not `.destroy()`.
- **Impact:** Early stream cancellation does not release the underlying Web stream reader.
- **Corrective Action:** Add `response.body.cancel?.().catch(() => {})`.

#### MED-02: Credential Factual Assertion Regex Omits Factual Sections
- **Location:** [`careerAssessmentValidator.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/validators/careerAssessmentValidator.js#L354-L359)
- **Evidence:** `factualSectionsText` concatenates only 4 sections and omits `pipelineDiagnostics.staleApplicationRisk` and `skillGapAnalysis.skillBridgingAdvice`.
- **Impact:** Fabricated degrees or certifications appearing in omitted sections escape detection.
- **Corrective Action:** Include all non-recommendation text sections in `factualSectionsText`.

#### MED-03: Validator Output Retains Unknown Arbitrary Model Fields
- **Location:** [`careerAssessmentValidator.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/validators/careerAssessmentValidator.js#L384-L404)
- **Evidence:** `sanitizeAssessmentPayload()` drops prototype keys and `hallucinationCheckPassed`, but recursively retains arbitrary unknown fields.
- **Impact:** Downstream consumers receive unvalidated or injected model fields.
- **Corrective Action:** Explicitly allowlist and pick only schema-defined fields when creating the sanitized output.

#### MED-04: Strict Non-Synonym Skill Grounding Rejects Industry Equivalents
- **Location:** [`careerAssessmentValidator.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/validators/careerAssessmentValidator.js#L48-L56, #L228-L247)
- **Evidence:** `normalizeSkill()` only normalizes `.js` and non-alphanumerics. It does not map `Golang` $\rightarrow$ `Go`, `PostgreSQL` $\rightarrow$ `Postgres`, `Kubernetes` $\rightarrow$ `K8s`.
- **Impact:** Candidates with declared skills will have assessments rejected with `UNSUPPORTED_CLAIMS` if the model outputs common abbreviations.
- **Corrective Action:** Connect validator to `skillMatcher.js` synonym mapping or prompt the model to echo declared skill names verbatim.

#### MED-05: Non-Null `sanitizedAssessment` Returned on `UNSUPPORTED_CLAIMS`
- **Location:** [`careerAssessmentValidator.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/validators/careerAssessmentValidator.js#L510-L522)
- **Evidence:** When `status === "UNSUPPORTED_CLAIMS"`, `sanitizedAssessment` is still returned as a populated object rather than `null`.
- **Impact:** A developer checking `if (result.sanitizedAssessment)` instead of `if (result.isValid)` will consume an ungrounded assessment.
- **Corrective Action:** Return `sanitizedAssessment: null` whenever `isValid === false`, or enforce `throwOnError: true` by default in the orchestrator.

---

### LOW Severity

#### LOW-01: Non-Frozen Minimizer Output Permits Downstream Mutation
- **Location:** [`telemetryMinimizer.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/sanitizers/telemetryMinimizer.js#L754-L793)
- **Evidence:** Arrays and objects on `result` are not frozen with `Object.freeze()`. Direct mutation alters arrays read by `.minimizedRequest`.
- **Corrective Action:** Apply deep `Object.freeze()` to the sanitized profile and telemetry objects.

#### LOW-02: Permanently Pending Promise Pattern in Execution Boundary
- **Location:** [`executionBoundaryContract.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/contracts/executionBoundaryContract.js#L92, #L99), [`BaseAiProviderAdapter.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/providers/BaseAiProviderAdapter.js#L198, #L205)
- **Evidence:** Returning `new Promise(() => {})` suppresses late resolution/rejection but leaves an unresolved Promise allocation.
- **Corrective Action:** Replace with `return null` or `return undefined`.

---

### INFORMATIONAL

#### INFO-01: Heuristic Regex Inherent PII Limitations on Non-English Data
- **Location:** [`telemetryMinimizer.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/sanitizers/telemetryMinimizer.js#L212-L292)
- **Evidence:** Regex patterns target US/UK address formats and standard Latin phone/email strings.
- **Note:** Free-text scrubbing is heuristic defense-in-depth; explicit field allowlisting remains the primary security control.

---

## 10. Required Corrective Actions (Pre-Stage 2B.4 Plan)

The following targeted corrections should be applied during Stage 2B.4 setup:

1. **Patch Metric Grounding (`careerAssessmentValidator.js`):**
   - Implement keyword-to-field mapping (e.g., regex matching `"offer"` checks against `pendingOffers` / `cumulativeOffers`; `"interview"` checks against `interviewsInProgress`; `"application"` checks against `submittedApplications`).
   - Change `numbers.some()` to `numbers.every()`.
2. **Patch Credential Sections Text (`careerAssessmentValidator.js`):**
   - Add `pipelineDiagnostics.staleApplicationRisk` and `skillGapAnalysis.skillBridgingAdvice` to `factualSectionsText`.
3. **Patch Output Schema Allowlisting (`careerAssessmentValidator.js`):**
   - In `sanitizeAssessmentPayload()`, explicitly construct sections with allowed properties only, and set `sanitizedAssessment = null` when `isValid === false`.
4. **Patch Fetch Stream Cancellation (`GroqProviderAdapter.js`):**
   - Add `response.body?.cancel?.().catch(() => {})` in stream generator `finally`.
5. **Enforce Mandatory Pipeline Gating (`CareerStrategistService.js` in Stage 2B.4):**
   - The orchestrator must strictly enforce:
     1. `minimizeCareerAssessmentTelemetry(rawRequest)`
     2. `provider.generateAssessment(minimized.minimizedRequest)`
     3. `validateCareerAssessmentEvidence(minimized, rawOutput, { throwOnError: true })`
     4. Fallback execution upon any validation or operational failure.

---

## 11. Implemented Guarantees vs. Future Orchestration Requirements

| Capability | Implemented in Current Code | Requires Stage 2B.4 Orchestration |
|---|:---:|:---:|
| Candidate field allowlisting | **YES** (`telemetryMinimizer.js`) | No |
| PII regex scrubbing in free text | **YES** (`telemetryMinimizer.js`) | No |
| Fail-closed size limit (256 KB) | **YES** (`telemetryMinimizer.js`) | No |
| Neutralization of prompt injection tags | **YES** (`telemetryMinimizer.js`) | No |
| Strip `hallucinationCheckPassed` | **YES** (`careerAssessmentValidator.js`) | No |
| Prototype pollution defense | **YES** (`careerAssessmentValidator.js`) | No |
| Skill subset enforcement | **YES** (`careerAssessmentValidator.js`) | No |
| Experience floor enforcement | **YES** (`careerAssessmentValidator.js`) | No |
| Execution timeout & cancellation race | **YES** (`executionBoundaryContract.js`) | No |
| Non-transmission retry guardrail | **YES** (`BaseAiProviderAdapter.js`) | No |
| Metric-to-field association | Partial (Set membership) | **REQUIRED** (Stage 2B.4 patch) |
| Web ReadableStream `.cancel()` | No (`.destroy()` only) | **REQUIRED** (Stage 2B.4 patch) |
| Mandatory pipeline chain enforcement | No (components decoupled) | **REQUIRED** (`CareerStrategistService`) |
| Heuristic fallback on failure | Defined in policy | **REQUIRED** (`CareerStrategistService`) |

---

## 12. Network & Quota Confirmation

The auditor strictly certifies:
- **Zero Live GroqCloud Requests:** No live network requests were initiated to GroqCloud.
- **Zero Live Gemini Requests:** No live network requests were initiated to Google Gemini.
- **Zero API Quota Consumed:** API quota consumption across all providers was strictly 0 tokens and 0 requests.
- **Synthetic Fixtures Only:** All testing and verification used local offline in-memory fixtures.

---

## 13. Recommendation for Stage 2B.4

**Final Recommendation:** **AUTHORIZE STAGE 2B.4 UNDER DOCUMENTED CONDITIONS**

The foundation layer implemented across Stages 2B.1 through 2B.3B provides an exceptionally thorough, robust, and clean architecture. All 553 automated tests pass with 100% reliability.

The 6 corrective actions identified in Section 10 are narrowly scoped, well-understood, and do not require redesigning the Option C architecture. They should be addressed as the initial task of Stage 2B.4 before implementing `CareerStrategistService.js`.
