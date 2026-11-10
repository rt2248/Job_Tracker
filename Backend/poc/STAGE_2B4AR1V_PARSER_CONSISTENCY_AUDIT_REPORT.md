# Stage 2B.4A-R1-V — Numeric Grounding Parser Consistency Audit Report

**Project:** Evolexa Career Strategist / Job Tracker  
**Role:** Senior Backend Security Auditor  
**Milestone:** Stage 2B.4A-R1-V of Stage 2B  
**Execution Mode:** STRICTLY READ-ONLY — OFFLINE AUDIT  
**Date:** November 8, 2026  
**Status:** **PASSED — ALL INCONSISTENCIES RECONCILED & VERIFIED**

---

## 1. Executive Summary & Audit Verdict

### 1.1 Gate Verdict: **PASS**

An independent, code-level consistency audit of the Stage 2B.4A-R1 implementation was performed to resolve two reporting questions raised during project-owner review:
1. **Investigation A (Range Detection vs Derived Percentages):** Reconciled the relationship between numeric range detection and derived-percentage phrases containing the preposition `"to"`. Confirmed that range detection does **not** reject `"to"` unconditionally; it rejects `"to"` **strictly and contextually when both flanking tokens are numeric**. Legitimate conversion language such as `"50% interview to offer conversion"` and `"interview-to-offer conversion of 50%"` is accepted without defect.
2. **Investigation B (Test Count Reconciliation):** Reconciled the test runner output and accounting discrepancy. Demonstrated that the discrepancy arose from a clerical misallocation in the Stage 2B.4A report table (which listed `careerAssessmentValidator.test.js` as 19 instead of its actual count of 25). The addition of 27 new `it()` test blocks in Section 8 yielded $25 + 27 = 52$ tests. The overall baseline of **614 tests** (173 AI + 42 POC + 399 Core) represents 100% unique, executed tests with zero double counting.

| Audit Dimension | Prior Reporting Ambiguity | Code Reality Verified | Audit Verdict |
| :--- | :--- | :--- | :---: |
| **Investigation A: Range vs Percentages** | Report diagram shorthand implied `\bto\b` was rejected unconditionally. | Range detection strictly requires both operands to be numeric (`isNumericTokenOrWord`). Non-numeric phrases pass cleanly. | **PASS** |
| **Investigation B: Test Count Reconciliation** | Discrepancy between +27 new tests and 52 - 19 = 33 apparent increase. | Previous actual count was 25 (clerical typo of 19 in Stage 2B.4A table). $25 + 27 = 52$ tests. Reconciled exactly. | **PASS** |
| **Baseline Regression (614 Tests)** | Verification of unique counts without double counting. | 173 AI + 42 POC + 399 Core = 614 tests. 0 failures across all suites. | **PASS** |

---

## 2. Investigation A — Range Detection vs Derived Percentages

### 2.1 The Issue
The Stage 2B.4A-R1 report's summary diagram in Section 4.2 contained the line:
```
├──> Stage 2: Numeric Range Detection (Reject: /\b\d+\s*-\s*\d+\b/, /\bto\b/, /\bbetween\b/)
```
This shorthand raised the question: If the range detector rejects `\bto\b`, why was `"50% interview to offer conversion"` accepted in Adversarial Test 14?

### 2.2 Source Code Audit & Exact Implementation
Inspection of [`Backend/src/services/ai/validators/careerAssessmentValidator.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/validators/careerAssessmentValidator.js) confirms that the implementation does **not** reject `\bto\b` unconditionally. 

Lines 380–393 of `careerAssessmentValidator.js`:
```javascript
// 2. Check for numeric ranges BEFORE any token conversion
// e.g. "2-5", "2 - 5", "2 to 5", "two to five", "between 2 and 5"
if (/\b\d+\s*-\s*\d+\b/.test(text)) {
  return { isValid: false, reason: `Numeric range expression in '${citationStr}' is invalid for discrete metric counts` };
}
const toRangeMatch = text.match(/\b([a-z0-9]+)\s+to\s+([a-z0-9]+)\b/i);
if (toRangeMatch && isNumericTokenOrWord(toRangeMatch[1]) && isNumericTokenOrWord(toRangeMatch[2])) {
  return { isValid: false, reason: `Numeric range expression in '${citationStr}' is invalid for discrete metric counts` };
}
const betweenMatch = text.match(/\bbetween\s+([a-z0-9]+)\s+and\s+([a-z0-9]+)\b/i);
if (betweenMatch && isNumericTokenOrWord(betweenMatch[1]) && isNumericTokenOrWord(betweenMatch[2])) {
  return { isValid: false, reason: `Numeric range expression in '${citationStr}' is invalid for discrete metric counts` };
}
```

And lines 350–354 define the operand guard:
```javascript
function isNumericTokenOrWord(word) {
  if (!word) return false;
  const w = word.toLowerCase();
  return /^\d+$/.test(w) || ALL_NUM_WORDS_SET.has(w);
}
```

### 2.3 Contextual Evaluation Trace
`to` is flagged as a numeric range **only when both flanking tokens are numeric** (digits or number words):

1. **Case: `"two to five interviews"` (REJECT):**
   - `toRangeMatch[1]` = `"two"`. `ALL_NUM_WORDS_SET.has("two")` is `true`.
   - `toRangeMatch[2]` = `"five"`. `ALL_NUM_WORDS_SET.has("five")` is `true`.
   - Both tokens are numeric $\rightarrow$ Condition evaluates to `true`.
   - **Result:** Immediately rejected as an invalid discrete range.

2. **Case: `"2 to 5 applications"` (REJECT):**
   - `toRangeMatch[1]` = `"2"`. `/^\d+$/.test("2")` is `true`.
   - `toRangeMatch[2]` = `"5"`. `/^\d+$/.test("5")` is `true`.
   - Both tokens are numeric $\rightarrow$ Condition evaluates to `true`.
   - **Result:** Immediately rejected as an invalid discrete range.

3. **Case: `"50% interview to offer conversion"` (ACCEPT):**
   - `toRangeMatch[1]` = `"interview"`. `isNumericTokenOrWord("interview")` is `false`.
   - `toRangeMatch[2]` = `"offer"`. `isNumericTokenOrWord("offer")` is `false`.
   - Flanking tokens are non-numeric $\rightarrow$ Range condition evaluates to `false`.
   - Execution proceeds to Stage 5 (Percentage Validation), where `50%` is matched and validated against mathematical derivations ($1 \text{ offer} / 2 \text{ interviews} = 50\%$).
   - In Stage 8 (Clause Validation), the percentage is stripped, leaving `"interview to offer conversion"` with zero ungrounded discrete digits.
   - **Result:** Accepted cleanly.

4. **Case: `"interview-to-offer conversion of 50%"` (ACCEPT):**
   - In `"interview-to-offer"`, the word `"to"` is hyphenated and flanked by non-numeric strings (`"interview"`, `"offer"`).
   - Neither operand is numeric $\rightarrow$ Range check passes.
   - `50%` matches supported derivations.
   - **Result:** Accepted cleanly.

5. **Case: `"between 2 and 5 interviews"` (REJECT):**
   - `betweenMatch[1]` = `"2"`, `betweenMatch[2]` = `"5"`. Both are numeric.
   - **Result:** Immediately rejected as an invalid discrete range.

6. **Case: `"50% offer rate"` (EVALUATED BY DERIVED PERCENTAGE RULES):**
   - For a candidate with 1 cumulative offer and 2 active interviews ($1 / 2 = 50\%$), the derivation matches $\rightarrow$ **ACCEPTED**.
   - If candidate telemetry had 1 offer and 8 applications without matching derivations, it would be **REJECTED** with `"Unsupported derived percentage '50%'"`.
   - For example, `"85% offer rate"` is **REJECTED** with `"Unsupported derived percentage '85%'"`.

### 2.4 Conclusion on Investigation A
The implementation is mathematically sound and contextually precise. The report's ASCII diagram summarized `/\b([a-z0-9]+)\s+to\s+([a-z0-9]+)\b/` as `/\bto\b/` in shorthand, but the underlying code correctly gates rejection on `isNumericTokenOrWord()`. No code defect exists.

---

## 3. Investigation B — Test Count Reconciliation

### 3.1 The Discrepancy
The Stage 2B.4A-R1 report stated:
- Previous validator count: 19.
- Current validator count: 52.
- Difference: $52 - 19 = 33$.
- New tests added: 27.
- Overall baseline: $587 \rightarrow 614$ (+27).

This created apparent confusion: Why did the validator count jump by 33 if only 27 new tests were added?

### 3.2 Audit Findings & Root Cause
To resolve this, we audited the Git history and test structure of all test files in `Backend/test/ai/`.

#### 1. Actual Previous Test Count of `careerAssessmentValidator.test.js`
In Stage 2B.4A (prior to Stage 2B.4A-R1), `careerAssessmentValidator.test.js` contained 7 `describe` blocks with the following `it()` counts:
- `1. Input & Structural Schema Validation`: 9 tests
- `2. Skill Evidence Grounding & Subset Audit`: 3 tests
- `3. Experience & Career Stage Floor Audit`: 3 tests
- `4. Pipeline Metric Citation Grounding`: 2 tests
- `5. Education & Certification Factual Assertions`: 2 tests
- `6. Security & Self-Verification Claim Neutralization`: 3 tests
- `7. Determinism & Immutability`: 3 tests

$$\text{Actual Previous Total} = 9 + 3 + 3 + 2 + 2 + 3 + 3 = \mathbf{25\text{ tests}}$$

#### 2. The Clerical Error in the Stage 2B.4A Report Table
In the Stage 2B.4A report (`STAGE_2B4A_SECURITY_REMEDIATION_REPORT.md` Section 7), the author manually typed the breakdown table as follows:
- `contracts.test.js`: 38 *(clerical typo; actual was 32)*
- `providerAdapter.test.js`: 26 *(clerical typo; actual was 27)*
- `telemetryMinimizer.test.js`: 29 *(clerical typo; actual was 28)*
- `careerAssessmentValidator.test.js`: 19 *(clerical typo; actual was 25)*
- `securityRemediation.test.js`: 34 *(actual: 34)*

Notice that $38 + 26 + 29 + 19 + 34 = \mathbf{146}$.
The test runner output at the time reported `ℹ tests 146`. The runner's aggregate count of 146 was 100% accurate, but the author's manual text allocation across individual rows had a 6-test offset between `contracts.test.js` (+6) and `careerAssessmentValidator.test.js` (-6).

#### 3. Stage 2B.4A-R1 Additions
In Stage 2B.4A-R1, Section 8 was added to `careerAssessmentValidator.test.js`.
Section 8 contains exactly **27 `it()` blocks**.

When Node's test runner executed `careerAssessmentValidator.test.js`, it reported:
$$\text{Previous Real Count (25)} + \text{New Section 8 Tests (27)} = \mathbf{52\text{ tests}}$$

The author of the Stage 2B.4A-R1 report looked at the previous report's table (which mistakenly said 19), saw the current test runner output (52), calculated $52 - 19 = 33$, and speculated that "+33 assertions / 27 tests" occurred.

In reality:
- **No assertions were mixed with test counts.**
- Node's test runner only counts `it()` blocks as tests.
- Exactly 27 new tests were added.
- The previous actual count was 25, not 19.
- $25 + 27 = 52$.

### 3.3 Reconciled Test Table
Executing each test file individually with `node --test` confirms the reconciled counts:

```powershell
node --test Backend/test/ai/contracts.test.js               # ℹ tests 32, ℹ pass 32
node --test Backend/test/ai/groqProviderAdapter.test.js     # ℹ tests 27, ℹ pass 27
node --test Backend/test/ai/telemetryMinimizer.test.js      # ℹ tests 28, ℹ pass 28
node --test Backend/test/ai/careerAssessmentValidator.test.js # ℹ tests 52, ℹ pass 52
node --test Backend/test/ai/securityRemediation.test.js     # ℹ tests 34, ℹ pass 34
```

| Test Suite / File | Pre-R1 Actual | R1 Additions | Current Verified Count |
| :--- | :---: | :---: | :---: |
| `contracts.test.js` | 32 | 0 | 32 |
| `groqProviderAdapter.test.js` | 27 | 0 | 27 |
| `telemetryMinimizer.test.js` | 28 | 0 | 28 |
| `careerAssessmentValidator.test.js` | **25** | **+27** | **52** |
| `securityRemediation.test.js` | 34 | 0 | 34 |
| **AI Foundation Subtotal** | **146** | **+27** | **173** |
| POC Offline Tests (`groq` + `gemini`) | 42 | 0 | 42 |
| Core Backend Suites (4 suites) | 399 | 0 | 399 |
| **GRAND TOTAL** | **587** | **+27** | **614** |

$$\mathbf{173\text{ (AI)}} + \mathbf{42\text{ (POC)}} + \mathbf{399\text{ (Core)}} = \mathbf{614\text{ Total Passing Tests}}$$

Every test in the 614 total represents a unique executed test case. Zero double counting exists.

---

## 4. Full Regression Verification

All test suites were executed in strictly offline mode:

### 4.1 AI Foundation Suite
```
node --test Backend/test/ai/*.test.js
ℹ tests 173
ℹ suites 36
ℹ pass 173
ℹ fail 0
ℹ duration_ms 833.564
```

### 4.2 Proof-of-Concept Offline Suites
```
node Backend/poc/groq/test_groq_config.js; node Backend/poc/gemini/test_gemini_config.js
TEST SUMMARY (Groq):   24 / 24 passed (100%)
TEST SUMMARY (Gemini): 18 / 18 passed (100%)
Subtotal: 42 / 42 passed
```

### 4.3 Core Backend Regression Suites
```
node Backend/src/scripts/testInsightsSuite.js        # 171 passed, 0 failed
node Backend/src/scripts/testProfileSuite.js         # 117 passed, 0 failed
node Backend/src/scripts/testStatusHistorySuite.js   #  46 passed, 0 failed
node Backend/src/scripts/testAccountSecuritySuite.js #  65 passed, 0 failed
Subtotal: 399 / 399 passed
```

---

## 5. Residual Risks & Security Assessment

- **No Code Defects Found:** Range detection and percentage derivation are properly isolated and do not produce false rejections on valid pipeline language.
- **No Test Accounting Flaws:** The 614-test baseline is completely reconciled, verified, and free of double counting.
- **Strict Read-Only Verification:** Zero source code, tests, or configurations were modified during this audit.
- **Mandatory Invariants Preserved:** Mandatory minimization, WeakSet identity registry, response allowlisting, and null assessment on failure contracts remain intact.

---

## 6. Audit Verdict & Authorization Recommendation

Both reporting questions have been conclusively resolved:
1. Investigation A confirmed that range detection contextually checks numeric operands; conversion language is accepted without defect.
2. Investigation B reconciled the test counts: the previous count was 25 (not 19); 27 tests were added; the current validator total is 52; and the repository baseline is 614 passing tests.

**FINAL GATE VERDICT: PASS**  
**Stage 2B.4B (`CareerStrategistService` Orchestration) is recommended for authorization.**

*Mandatory stop condition observed: Verification-only task completed. No Stage 2B.4B implementation initiated.*
