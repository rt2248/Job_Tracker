# Stage 2B.9 — Career Strategist UX Refinement Implementation Plan

**Project:** Evolexa Career Strategist / Job Tracker  
**Role:** Senior Software Architect & Frontend UX Architect  
**Milestone:** Stage 2B.9 (Planning Deliverable Only — Implementation NOT Authorized)  
**Prerequisite:** Stage 2B.8 — APPROVED AND CLOSED (Verified on `main` at commit `249291c`)  
**Planning Cost Policy:** Strictly Offline / Read-Only Inspection (`$0.00`)  
**Production Files Modified During Planning:** `0`

---

## 1. Executive Summary

Stages 2B.1 through 2B.8 established an end-to-end, evidence-grounded Career Strategist backend pipeline (`careerAssessmentValidator.js`, `telemetryMinimizer.js`, `GroqProviderAdapter.js`, `CareerStrategistService.js`, `careerStrategist.controller.js`) and integrated React UI components (`Frontend/src/pages/dashboard/CareerStrategist.jsx` and `Frontend/src/components/career_strategist/*`).

Offline validation in Stage 2B.8 confirmed that the backend validation and fallback engines handle edge-case inputs safely without relaxing security or evidence guarantees. However, a thorough read-only audit of the existing frontend implementation against **four UX clarity priorities**, **actual backend DTO contracts**, and **[`HARD_RULES.md`](file:///d:/Dev/GitHub/Job_Tracker/HARD_RULES.md)** uncovered concrete UX ambiguities, three runtime DTO property mismatches masked by unit-test mocks, and UI styling deviations (including emojis/Unicode icons, pill spam, and nested card boxes).

This plan defines a minimal, strictly frontend-scoped refinement sequence that resolves Priority 1 through Priority 4 **without altering backend code, response schemas, or fallback policies**.

---

## 2. Verified Current-State Findings

All findings below are directly verified from inspecting repository source code; zero unverified assumptions are treated as facts.

### 2.1. Confirmed Data Flow & Parent State (`useCareerStrategist.js` & `CareerStrategist.jsx`)
- [`useCareerStrategist.js`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/hooks/useCareerStrategist.js#L17-L79) exposes: `assessment`, `validationAudit`, `fallbackActive`, `fallbackMetadata`, `correlationId`, `telemetry`, `isLoading`, `error`, `generateAssessment`, `cancel`, `reset`.
- [`CareerStrategist.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/pages/dashboard/CareerStrategist.jsx#L192-L221) currently distributes only partial slices to child cards:
  - `<FallbackNoticeBanner fallbackActive={fallbackActive} fallbackMetadata={fallbackMetadata} />`
  - `<CandidateSummaryCard candidateSummary={assessment.candidateSummary} />`
  - `<StrategicRecommendationsList recommendations={assessment.strategicRecommendations} />`
  - `<SkillGapCard skillGapAnalysis={assessment.skillGapAnalysis} />` *(lacks `fallbackActive` / `pipelineHealth`)*
  - `<PipelineDiagnosticsCard pipelineDiagnostics={assessment.pipelineDiagnostics} />` *(lacks `pipelineHealth` / `fallbackActive` / `dataLimitationsNoted`)*
  - `<EvidenceGroundingCard evidenceGrounding={assessment.evidenceGrounding} validationAudit={validationAudit} telemetry={telemetry} correlationId={correlationId} />` *(lacks `verifiedCandidateSkills`, `fallbackActive`, `pipelineHealth`)*

### 2.2. Verified Priority 1–4 UX & Contract Findings
1. **Priority 1 Defect (`SkillGapCard.jsx` lines 73–77):**
   When `criticalMissingSkills` is `[]`, `SkillGapCard` always renders `"✓ No critical skill gaps identified for your target positioning."` regardless of context. Because [`CareerStrategistService._executeDeterministicFallback`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/CareerStrategistService.js#L394) hardcodes `criticalMissingSkills = []` (no external market skill taxonomy offline), and because minimal profiles may have `verifiedCandidateSkills = []`, the current copy falsely reassures the candidate that zero gaps exist.
2. **Priority 2 Defect (`PipelineDiagnosticsCard.jsx`):**
   `PipelineDiagnosticsCard` receives only the three prose fields (`volumeAssessment`, `stageProgressionVelocity`, `staleApplicationRisk`). When `pipelineHealth` is `"insufficient_data"` or `"inconsistent_data"`, it renders three identical bordered boxes with no callout clarifying why conversion/velocity metrics are unavailable or what user actions unlock meaningful analytics.
3. **Priority 3 Opportunity (`StrategicRecommendationsList.jsx`):**
   `RecommendationCard` displays `title`, `priority` pill, `category` pill, unlabelled `rationale` paragraph, `Action Steps:` numbered list, and nested bordered `Expected Impact:` box. Without explicit section headers (`Why It Matters`, `Recommended Actions`, `Expected Benefit`) or assessment-mode attribution, the relationship between problem justification, actionable steps, benefit, and telemetry limitations is visually muddled.
4. **Priority 4 Bugs & Provenance Gaps (`EvidenceGroundingCard.jsx` & `CareerAssessmentResponse.dto.js`):**
   - **Verified Bug A (`isValid` mismatch):** [`EvidenceGroundingCard.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/components/career_strategist/EvidenceGroundingCard.jsx#L30) evaluates `const isValid = validationAudit ? validationAudit.isValid : true;`. However, [`careerAssessmentValidator.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/validators/careerAssessmentValidator.js#L909-L913) and [`CareerStrategistService.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/CareerStrategistService.js#L228) emit `validationAudit: { schemaValid, evidenceGrounded, discrepancies }` — **there is no `.isValid` field in the live backend response**. Consequently, on live responses where `schemaValid: true` and `evidenceGrounded: true`, `validationAudit.isValid` is `undefined` (falsy), causing the badge to falsely render **"Audit Discrepancies"** (amber)! *(Masked in [`careerStrategistRuntime.test.js`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/test/careerStrategistRuntime.test.js#L519-L523) test `2.7` because the mock passed `{ status: "VALID", isValid: true, evidenceCitationCount: 2 }`.)*
   - **Verified Bug B (`evidenceCitationCount`, `status`, `unsupportedClaimsNeutralized`, `telemetry.durationMs` mismatches):** Live backend responses provide `discrepancies: []` and `telemetry: { providerId, modelIdentifier, latencyMs, inputTokens, outputTokens, totalTokens, rateLimit }` ([`GroqProviderAdapter.js`](file:///d:/Dev/GitHub/Job_Tracker/Backend/src/services/ai/providers/groq/GroqProviderAdapter.js#L280-L288)), NOT `status`, `unsupportedClaimsNeutralized`, or `durationMs`.
   - **Provenance Mixing & Confidence Copy:** Displays `"100% Grounded"` (unsupported percentage framing) and omits `verifiedCandidateSkills` and synthesis-mode provenance (AI model vs. deterministic heuristics) within the audit boundary. When `dataLimitationsNoted` is `""`, the limitations section vanishes silently even under `insufficient_data`.
5. **Verified `CandidateSummaryCard.jsx` Issue (lines 123–125):**
   Renders `<Badge variant="indigo">Verified</Badge>` directly next to `stageLabel`, including when `careerStage === "unspecified"` (`"Unspecified Stage Verified"`), overstating model inference as verified truth.

### 2.3. Verified `HARD_RULES.md` Compliance Gaps & Test Harness Constraint
- **Hard Rule 13 Violations (Prohibited Emojis & Unicode Symbols):**
  - `FallbackNoticeBanner.jsx` line 37 (`⚡`)
  - `CandidateSummaryCard.jsx` line 143 (`⚡`)
  - `StrategicRecommendationsList.jsx` line 124 (`📈`)
  - `SkillGapCard.jsx` line 75 (`✓`)
  - `EvidenceGroundingCard.jsx` lines 76 (`✓`), 98 (`⚠`), 114 (`▲`/`▼`)
  - `CareerStrategistEmptyState.jsx` lines 57 (`🧭`), 75 (`📊`), 83 (`🎯`), 91 (`🛡️`), 107 (`▲`/`▼`)
  - `CareerStrategist.jsx` lines 94 (`🧭`), 159 (`✕`)
- **Hard Rules 1, 8, 10, 11, 12 Violations:** Tiny `text-[11px]` text (`CareerStrategist.jsx` line 168; `CareerStrategistEmptyState.jsx` multiple lines), nested bordered sub-cards inside parent `Card` wrappers (`CandidateSummaryCard`, `PipelineDiagnosticsCard`, `StrategicRecommendationsList`, `EvidenceGroundingCard`), excessive pill badges (`StrategicRecommendationsList`, `FallbackNoticeBanner`), and arbitrary gradients (`CandidateSummaryCard` line 140, `CareerStrategistEmptyState` line 56).
- **Verified Test Harness Constraint ([`Frontend/test/careerStrategistRuntime.test.js`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/test/careerStrategistRuntime.test.js#L17-L55)):**
  `loadJsxComponent()` transforms JSX with `sucrase` and only stubs imports for `cn`, `Badge`, `Card`, and `Button`. Importing external `.svg` asset files via ES `import icon from "...svg"` inside `src/components/career_strategist/*.jsx` will fail in Node's native test runner unless `loadJsxComponent` mocks `.svg` imports **or** components follow the approved inline `<svg viewBox="0 0 24 24" stroke="currentColor">` convention documented in [`ASSET_CATALOG.md`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/assets/ASSET_CATALOG.md#L95-L115) and [`ProfileCompletenessCard.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/components/profile/ProfileCompletenessCard.jsx#L111-L148). **Inline theme-adaptive SVGs inside `career_strategist/*` guarantee full zero-dependency compatibility with both Vite and `node --test`.**

---

## 3. Four Prioritized UX Improvements

### Priority 1 — Fallback & Incomplete Skill-Gap Messaging (`SkillGapCard.jsx`, `CareerStrategist.jsx`)
Clarify three distinct assessment states without fabricating missing-skill taxonomies:
1. **Specific critical gaps identified** (`criticalMissingSkills.length > 0`): Render identified market gaps clearly alongside verified profile skills.
2. **Skill-gap assessment unavailable or incomplete:**
   - **Substate 2A (Offline Fallback Active: `fallbackActive === true`):** Replace checkmark reassurance with neutral informational state: *"Skill-gap comparison is unavailable in offline fallback mode. Heuristic mode validates declared profile skills only and does not query external role requirements."*
   - **Substate 2B (Live Assessment with Empty Profile Skills: `!fallbackActive && verifiedCandidateSkills.length === 0 && criticalMissingSkills.length === 0`):** Render: *"Skill-gap analysis is incomplete because no technical skills are declared on your profile. Add skills in Profile to compare against target roles."*
   - **Substate 2C (Insufficient Pipeline/Context Warning when `!fallbackActive && pipelineHealth === "insufficient_data" && criticalMissingSkills.length === 0 && verifiedCandidateSkills.length > 0`):** Pair neutral no-gaps message with explicit scope note linking to profile/target-role context.
3. **Assessment completed with zero critical gaps identified** (`!fallbackActive && verifiedCandidateSkills.length > 0 && criticalMissingSkills.length === 0` and sufficient context): Render direct, scoped statement without decorative `✓` or absolute guarantees: *"No critical skill gaps were flagged for the declared skills and target roles in this run."*

### Priority 2 — Insufficient-Data Explanations (`PipelineDiagnosticsCard.jsx`, `EvidenceGroundingCard.jsx`, `CareerStrategist.jsx`)
Enhance insufficient/inconsistent pipeline telemetry clarity using `candidateSummary.pipelineHealth` and existing diagnostic strings:
1. When `pipelineHealth === "insufficient_data"`, render a structured explanatory callout at the top of `PipelineDiagnosticsCard` clearly separating:
   - **What is unavailable:** Stage progression rates, bottleneck causality, and reliable staleness patterns cannot be established from zero or sparse pipeline history.
   - **Why & what is currently recorded:** Reference backend-authored `volumeAssessment` (already grounded in exact integer counts) and `dataLimitationsNoted` if provided.
   - **What activity improves diagnostics:** Direct, practical actions — track target roles, log submitted applications, and record stage movements (`Applied`, `Online Assessment`, `Interview`, `Offer`) so future diagnostics reflect real funnel progression.
2. When `pipelineHealth === "inconsistent_data"`, render a diagnostic caution explaining that tracked stage counts or outcomes contain inconsistencies requiring pipeline audit.
3. De-clutter the three metric diagnostics (`Application Volume`, `Stage Velocity`, `Staleness & Pipeline Hygiene`) from stacked bordered sub-cards into cleanly separated rows (`divide-y divide-border-subtle`) per Hard Rules 8 and 10.

### Priority 3 — Recommendation Clarity (`StrategicRecommendationsList.jsx`, `CareerStrategist.jsx`)
Restructure `RecommendationCard` layout strictly within existing `StrategicRecommendationItem` fields (`id`, `category`, `priority`, `title`, `rationale`, `actionSteps`, `expectedImpact`):
1. **Header & Focus:** Direct numbered title (`{index + 1}. {title}`), priority text indicator (`Badge` with `dot`), and plain uppercase category label (`Pipeline Velocity`, etc.) — eliminating excessive pill wrappers (Hard Rule 11).
2. **Problem / Why It Matters:** Label `rationale` explicitly as **Why It Matters** (`text-ink-secondary`, crisp readable spacing).
3. **Recommended Actions:** Label `actionSteps` cleanly as **Recommended Actions** with ordered step numbers (`font-mono`).
4. **Practical Expected Benefit:** Present `expectedImpact` under a clean divider labeled **Expected Benefit** (removing nested box and `📈` emoji per Hard Rules 8 & 13).
5. **Scope & Supporting Evidence Disclosure:** Add a concise list-level attribution note in the `StrategicRecommendationsList` header/footer based on `fallbackActive` and `pipelineHealth` (directing users to the Evidence & Audit panel for grounded `citedMetrics` and `dataLimitationsNoted` without fabricating per-recommendation evidence strings).

### Priority 4 — Evidence Presentation & Runtime Audit Alignment (`EvidenceGroundingCard.jsx`, `CandidateSummaryCard.jsx`, `CareerStrategist.jsx`)
Transform `EvidenceGroundingCard` into an accurate, audit-faithful provenance breakdown and fix the verified live DTO mismatches:
1. **Fix `validationAudit` & `telemetry` Reading:**
   - Compute verification pass cleanly from `{ schemaValid, evidenceGrounded, discrepancies }` (`schemaValid && evidenceGrounded && discrepancies.length === 0`) while retaining backward fallback for legacy mock `isValid`.
   - Replace `"100% Grounded"` with factual status label **`Schema & Evidence Verified`** (or **`Audit Discrepancies Found`** if false), eliminating pseudo-confidence percentages.
   - Display actual backend telemetry in the technical accordion: `latencyMs` (fallback `durationMs`), `providerId`, `modelIdentifier`, and `discrepancies.length` instead of dead fields (`unsupportedClaimsNeutralized`).
2. **Explicit Four-Category Provenance Layout (B5):**
   - **Verified Candidate Profile Skills:** Render `verifiedCandidateSkills` passed from parent state (clearly distinct from unverified assumptions), or explicit empty state `"No declared profile skills verified in this run."`
   - **Telemetry-Supported Findings (`citedMetrics`):** Clean bordered-less list with accessible inline SVG check icons (no `✓` character), or explicit notice `"No numeric pipeline counts cited."`
   - **Missing Evidence & Data Limitations:** Always display when `dataLimitationsNoted` is non-empty **or** when `pipelineHealth === "insufficient_data"` **or** when `fallbackActive === true`. If `dataLimitationsNoted` is `""` on a live sufficient run, explicitly state `"No missing-data limitations flagged for the submitted telemetry."`
   - **Synthesis vs. Fact Boundary Note:** One concise factual line clarifying that diagnostic summaries and recommendations are synthesized (by Groq `modelIdentifier` or `Deterministic Heuristics`) strictly bounded by the verified profile skills and telemetry metrics above.
3. **Candidate Stage Labeling (`CandidateSummaryCard.jsx`):**
   Replace unqualified `<Badge variant="indigo">Verified</Badge>` next to `{stageLabel}` (which reads `"Unspecified Stage Verified"`) with contextual label (`"Unclassified"` when `unspecified`, or subtle `"Experience-Bounded"` indicator only when classified within bounds), and remove the `⚡` emoji and arbitrary gradient.

---

## 4. Exact Affected Files

| File Path | Scope of Planned Change | Touches Production Backend? |
| :--- | :--- | :---: |
| [`Frontend/src/pages/dashboard/CareerStrategist.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/pages/dashboard/CareerStrategist.jsx) | Pass existing parent props (`fallbackActive`, `pipelineHealth`, `verifiedCandidateSkills`, `dataLimitationsNoted`) to child cards; replace `🧭` / `✕` with accessible SVGs; raise `text-[11px]` correlation ID to `text-xs`. | **No** |
| [`Frontend/src/components/career_strategist/SkillGapCard.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/components/career_strategist/SkillGapCard.jsx) | Priority 1 state branching (unavailable fallback vs. incomplete skills vs. no critical gaps vs. identified gaps); remove `✓` character; clean semantic SVG/styling. | **No** |
| [`Frontend/src/components/career_strategist/PipelineDiagnosticsCard.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/components/career_strategist/PipelineDiagnosticsCard.jsx) | Priority 2 `insufficient_data` & `inconsistent_data` explanatory callout; replace stacked bordered sub-cards with clean row dividers. | **No** |
| [`Frontend/src/components/career_strategist/StrategicRecommendationsList.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/components/career_strategist/StrategicRecommendationsList.jsx) | Priority 3 labeled subsections (`Why It Matters`, `Recommended Actions`, `Expected Benefit`), assessment-scope attribution note, pill reduction, remove `📈` & nested box. | **No** |
| [`Frontend/src/components/career_strategist/EvidenceGroundingCard.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/components/career_strategist/EvidenceGroundingCard.jsx) | Priority 4 provenance sections, fix live `validationAudit` (`schemaValid && evidenceGrounded`) and `telemetry.latencyMs` bugs, remove `"100%"` framing, remove `✓` / `⚠` / `▲` / `▼`. | **No** |
| [`Frontend/src/components/career_strategist/CandidateSummaryCard.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/components/career_strategist/CandidateSummaryCard.jsx) | Fix `"Verified"` badge on `unspecified` career stage; remove `⚡` emoji and arbitrary gradient; reduce nested boxes. | **No** |
| [`Frontend/src/components/career_strategist/FallbackNoticeBanner.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/components/career_strategist/FallbackNoticeBanner.jsx) | Remove `⚡` emoji (use clean inline SVG warning icon), check `fallbackMetadata.strategy` cleanly without dropping test compatibility. | **No** |
| [`Frontend/src/components/career_strategist/CareerStrategistEmptyState.jsx`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/src/components/career_strategist/CareerStrategistEmptyState.jsx) *(Secondary / Polish)* | Replace `🧭`, `📊`, `🎯`, `🛡️`, `▲`, `▼` emojis/symbols, fix `text-[11px]`, tighten fluff prose per `HARD_RULES.md`. | **No** |
| [`Frontend/test/careerStrategistRuntime.test.js`](file:///d:/Dev/GitHub/Job_Tracker/Frontend/test/careerStrategistRuntime.test.js) | Update assertion on `"100% Grounded"` if copy changes to `"Schema & Evidence Verified"`, and add comprehensive regression tests covering Priorities 1–4 and live `validationAudit` DTO shape. | **No** |

---

## 5. Proposed Before-and-After Behavior Summary

| Component | Current Behavior | Proposed Stage 2B.9 Behavior |
| :--- | :--- | :--- |
| **`SkillGapCard`** | Shows `"✓ No critical skill gaps identified..."` whenever `criticalMissingSkills` is `[]`, even in fallback or empty-profile runs. | Distinguishes 3 states: (1) missing skills list, (2) unavailable in fallback / incomplete with 0 declared skills (neutral explanatory callout), (3) live run completed with zero gaps identified (scoped factual phrasing, zero `✓`). |
| **`PipelineDiagnosticsCard`** | Always displays 3 stacked bordered boxes without highlighting missing telemetry explanations or next steps when `pipelineHealth === "insufficient_data"`. | Displays dedicated insufficient/inconsistent telemetry explanation block (what is unavailable + what user actions improve accuracy) and uses clean divided rows instead of boxed sub-cards. |
| **`StrategicRecommendationsList`** | Renders double pills, unlabelled `rationale`, nested box for `Expected Impact` with `📈`, and no scope tie-back to evidence limitations. | Clear section labels (`Why It Matters`, `Recommended Actions`, `Expected Benefit`), clean `Badge` dot indicators, attribution header referencing `fallbackActive` / `insufficient_data` / Evidence panel. |
| **`EvidenceGroundingCard`** | Uses broken `validationAudit.isValid` (renders `"Audit Discrepancies"` on real backend responses), `"100% Grounded"`, `telemetry.durationMs` (always undefined), `✓`/`⚠`, hides limitations when `""`. | Accurately evaluates `schemaValid && evidenceGrounded` (backward compatible with `isValid`), renders `"Schema & Evidence Verified"`, shows Verified Skills vs. Telemetry Metrics vs. Limitations vs. Synthesis Mode, displays real `latencyMs` & `modelIdentifier`. |
| **`CandidateSummaryCard`** & **`FallbackNoticeBanner`** & **Page Shell** | Contains `⚡`, `🧭`, `✕`, `"Unspecified Stage Verified"` badge, nested gradient card, and `text-[11px]`. | Zero emojis/Unicode icon characters; theme-adaptive inline SVGs; accurate stage badge handling (`unspecified` not marked `"Verified"`); crisp light/dark typography contrast. |

---

## 6. Available Data & Existing Component Props

Strict audit of existing props and backend response fields confirms **what is directly available without backend edits**:

| Component | Existing Props | New Optional Props (From Parent State Already in `CareerStrategist.jsx`) | Live Backend Fields Used |
| :--- | :--- | :--- | :--- |
| `SkillGapCard` | `skillGapAnalysis`, `className` | `fallbackActive`, `pipelineHealth` | `skillGapAnalysis.verifiedCandidateSkills[]`, `skillGapAnalysis.criticalMissingSkills[]`, `skillGapAnalysis.skillBridgingAdvice`, `fallbackActive`, `candidateSummary.pipelineHealth` |
| `PipelineDiagnosticsCard` | `pipelineDiagnostics`, `className` | `pipelineHealth`, `fallbackActive`, `dataLimitationsNoted` | `pipelineDiagnostics.volumeAssessment`, `stageProgressionVelocity`, `staleApplicationRisk`, `candidateSummary.pipelineHealth`, `evidenceGrounding.dataLimitationsNoted` |
| `StrategicRecommendationsList` | `recommendations`, `className` | `fallbackActive`, `pipelineHealth` | `strategicRecommendations[].id`, `category`, `priority`, `title`, `rationale`, `actionSteps[]`, `expectedImpact`, `fallbackActive`, `pipelineHealth` |
| `EvidenceGroundingCard` | `evidenceGrounding`, `validationAudit`, `telemetry`, `correlationId`, `className` | `verifiedCandidateSkills`, `fallbackActive`, `pipelineHealth` | `evidenceGrounding.citedMetrics[]`, `evidenceGrounding.dataLimitationsNoted`, `validationAudit.schemaValid`, `evidenceGrounded`, `discrepancies[]`, `telemetry.latencyMs`, `providerId`, `modelIdentifier`, `totalTokens` |
| `CandidateSummaryCard` | `candidateSummary`, `className` | *(optional)* `fallbackActive` | `candidateSummary.careerStage`, `pipelineHealth`, `primaryBottleneck` |

*(All new child props MUST be optional with safe defaults so any caller rendering standalone cards—such as existing isolated tests—never breaks.)*

---

## 7. Contract Limitations (Documented Without Modifying Backend)

1. **No Explicit `skillGapAssessmentStatus` Field in `CareerAssessmentResponseDTO`:**  
   When `fallbackActive === false` and `verifiedCandidateSkills.length > 0` and `criticalMissingSkills.length === 0`, the DTO cannot distinguish whether Groq found zero skill gaps after full evaluation OR whether the candidate had vague/minimal `targetRoles` making gap inference shallow. Stage 2B.9 mitigates this purely through hedged, accurate phrasing rather than claiming certainty, while deterministically flagging `fallbackActive === true` and `verifiedCandidateSkills.length === 0`.
2. **No Typed Numeric Telemetry Object in `CareerAssessmentResponseDTO`:**  
   Structured counts (`trackedOpportunities`, `submittedApplications`, `savedCount`) are NOT included as numeric properties in `CareerAssessmentResponseDTO`; only `pipelineHealth`, prose fields (`volumeAssessment`), and `citedMetrics[]` exist. `PipelineDiagnosticsCard` will rely deterministically on `pipelineHealth === "insufficient_data" | "inconsistent_data"` and backend-authored `volumeAssessment` / `dataLimitationsNoted` rather than parsing prose with brittle regexes.
3. **No Per-Recommendation `supportingEvidence` or `dataLimitations` Field:**  
   Individual `StrategicRecommendationItem` objects contain `{ id, category, priority, title, rationale, actionSteps, expectedImpact }` only. Supporting telemetry and limitations reside solely at assessment scope (`evidenceGrounding`). Stage 2B.9 will NOT invent fake per-card citation badges; it will provide list-level scope transparency and clear cross-referencing.
4. **Deterministic Fallback Sparse Threshold (`trackedOpportunities === 0`):**  
   Fallback sets `pipelineHealth = "insufficient_data"` only when `trackedOpportunities === 0`. For `1–2` saved opportunities and `0` submissions in fallback mode, fallback emits `needs_focus`. UI must honor backend `pipelineHealth` rather than overriding backend status classifications client-side.

---

## 8. Testing & Acceptance Criteria

### 8.1. Automated Offline Test Coverage Plan (`Frontend/test/careerStrategistRuntime.test.js`)
1. **Priority 1 Tests (`SkillGapCard`):**
   - `fallbackActive: true` + `criticalMissingSkills: []` -> MUST NOT render `"No critical skill gaps identified"`; MUST render unavailable fallback explanation.
   - `fallbackActive: false` + `verifiedCandidateSkills: []` + `criticalMissingSkills: []` -> MUST render incomplete declared-skills notice.
   - `fallbackActive: false` + `verifiedCandidateSkills: ["Go"]` + `criticalMissingSkills: []` -> renders neutral completed-with-no-gaps copy without `✓`.
   - `criticalMissingSkills: ["Kubernetes"]` -> renders gaps normally.
2. **Priority 2 Tests (`PipelineDiagnosticsCard`):**
   - `pipelineHealth: "insufficient_data"` renders dedicated what-is-unavailable / how-to-improve guidance alongside telemetry diagnostics.
   - `pipelineHealth: "healthy"` renders cleanly without warning banner.
3. **Priority 3 Tests (`StrategicRecommendationsList`):**
   - Renders `Why It Matters`, `Recommended Actions`, and `Expected Benefit` labels without `📈`.
   - Displays heuristic-mode scope cue when `fallbackActive: true`.
4. **Priority 4 Tests (`EvidenceGroundingCard`):**
   - **Real Backend Audit DTO Regression Test:** Passing `{ schemaValid: true, evidenceGrounded: true, discrepancies: [] }` (WITHOUT `isValid`!) renders verified green badge (fixing pre-existing live bug!).
   - Passing `{ schemaValid: true, evidenceGrounded: false, discrepancies: ["Fabricated skill"] }` renders discrepancy warning and lists discrepancy count cleanly.
   - Renders `verifiedCandidateSkills`, `citedMetrics`, explicit limitations state (even when `dataLimitationsNoted: ""` on `insufficient_data`), and real `telemetry.latencyMs` / `modelIdentifier`.
5. **Hard Rule 13 & Accessibility Tests:**
   - Assert zero emoji characters (`⚡`, `🧭`, `📈`, `📊`, `🎯`, `🛡️`, `✓`, `⚠`, `✕`) in rendered HTML markup across all Career Strategist components.
6. **Build Verification:**
   - `npm run build --prefix Frontend` succeeds with 0 errors.

### 8.2. Visual Verification Criteria (Post-Implementation, Offline / Local Dev Server)
- Verify Light Mode (`[data-theme='light']`) and Dark Mode (`:root`) readability, contrast, spacing, and mobile/desktop responsiveness on `/career-strategist`.

---

## 9. Regression Risks & Mitigation

| Risk | Affected Tests / Behavior | Mitigation |
| :--- | :--- | :--- |
| **Test `2.7` breaks if `"100% Grounded"` label changes** | [`careerStrategistRuntime.test.js` line 530](file:///d:/Dev/GitHub/Job_Tracker/Frontend/test/careerStrategistRuntime.test.js#L530) asserts `html.includes("100% Grounded")` | Explicitly update test `2.7` alongside `EvidenceGroundingCard.jsx` to assert the new factual label (`"Schema & Evidence Verified"`) and keep mock backward compatibility (`validationAudit.isValid ?? (schemaValid && evidenceGrounded)`). |
| **Test `2.1` checks `"Offline Fallback"` & `"Deterministic Heuristic Mode Engaged"`** | [`careerStrategistRuntime.test.js` lines 387–390](file:///d:/Dev/GitHub/Job_Tracker/Frontend/test/careerStrategistRuntime.test.js#L387-L390) | Preserve exact heading and status label text inside `FallbackNoticeBanner.jsx` while removing `⚡` emoji and cleaning pill treatment. |
| **Static `.svg` ES imports fail Node test runner (`loadJsxComponent`)** | [`careerStrategistRuntime.test.js` lines 17–55](file:///d:/Dev/GitHub/Job_Tracker/Frontend/test/careerStrategistRuntime.test.js#L17-L55) | Use inline theme-adaptive `<svg viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">` inside `src/components/career_strategist/*.jsx` (aligned with `ASSET_CATALOG.md` §5 and `ProfileCompletenessCard.jsx`), keeping Node test runner green without custom loaders. |
| **Standalone unit calls missing new optional props** | Any test invoking `<SkillGapCard skillGapAnalysis={...} />` directly | Make all newly added props optional with safe backward-compatible defaults (`fallbackActive = false`, etc.). |

---

## 10. Recommended Implementation Sequence

1. **Step 1 — Fix Priority 4 Runtime Audit Mismatches & Provenance (`EvidenceGroundingCard.jsx`):** Fix the live `validationAudit.schemaValid && evidenceGrounded` bug and `telemetry.latencyMs` mapping first, and establish the 4-part provenance layout + zero-emoji SVGs.
2. **Step 2 — Fix Priority 1 Misleading Fallback Skill-Gap State (`SkillGapCard.jsx`):** Add `fallbackActive` and `pipelineHealth` prop support to cleanly isolate unavailable/incomplete states from verified zero-gap completion, removing `✓`.
3. **Step 3 — Implement Priority 2 Insufficient-Data Explanations (`PipelineDiagnosticsCard.jsx`):** Add the `insufficient_data` / `inconsistent_data` diagnostic callout and flatten nested sub-boxes into divided rows.
4. **Step 4 — Implement Priority 3 Recommendation Clarity (`StrategicRecommendationsList.jsx`):** Introduce explicit `Why It Matters`, `Recommended Actions`, and `Expected Benefit` hierarchy, assessment-scope attribution, clean `Badge` usage, and remove `📈` / nested box.
5. **Step 5 — Wire Parent Props & Clean Remaining Hard-Rule Violations (`CareerStrategist.jsx`, `CandidateSummaryCard.jsx`, `FallbackNoticeBanner.jsx`, `CareerStrategistEmptyState.jsx`):** Wire `fallbackActive`, `pipelineHealth`, `dataLimitationsNoted`, and `verifiedCandidateSkills` from `CareerStrategist.jsx`; fix `"Unspecified Stage Verified"` badge in `CandidateSummaryCard`; replace remaining emojis/tiny text across the page.
6. **Step 6 — Regression Tests, Build & Light/Dark Inspection (`Frontend/test/careerStrategistRuntime.test.js`):** Add Priority 1–4 + real-DTO regression tests, update `"100% Grounded"` assertion safely, run `node --test Frontend\test\*.test.js`, run `npm run build --prefix Frontend`, and inspect screenshots cleanly in both themes without running live AI inference.

---

## 11. Explicit Confirmation of Read-Only Planning

- **Production Files Modified:** **0** (`Backend/src/**` and `Frontend/src/**` are completely untouched in Stage 2B.8 Git closure and Stage 2B.9 planning).
- **External AI Requests / Expenditure:** **0 requests / $0.00**.
- **Authorization Gate:** Stage 2B.9 code implementation has **NOT** started and awaits explicit user approval.
