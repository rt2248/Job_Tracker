import { describe, it, beforeEach, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { transform } from "sucrase";
import {
  CareerStrategistError,
  CAREER_STRATEGIST_ERROR_CODES,
} from "../src/services/careerStrategistService.js";
import { useCareerStrategist } from "../src/hooks/useCareerStrategist.js";

/**
 * Helper to compile and dynamically load JSX components in Node without adding runtime test dependencies.
 */
async function loadJsxComponent(relativePath) {
  const fullPath = path.resolve(import.meta.dirname, "..", relativePath);
  let code = fs.readFileSync(fullPath, "utf-8");

  // Substitute local imports that may depend on Vite alias or relative CSS
  code = code
    .replace(/import\s*\{\s*cn\s*\}\s*from\s*["'][^"']+["'];?/g, 'const cn = (...args) => args.filter(Boolean).join(" ");')
    .replace(/import\s*Badge\s*from\s*["'][^"']+["'];?/g, 'const Badge = ({ children, className }) => React.createElement("span", { className }, children);')
    .replace(/import\s*\{\s*Card,\s*CardHeader,\s*CardTitle,\s*CardContent\s*\}\s*from\s*["'][^"']+["'];?/g, `
      const Card = ({ children, className }) => React.createElement("div", { className }, children);
      const CardHeader = ({ children, className }) => React.createElement("div", { className }, children);
      const CardTitle = ({ children, className }) => React.createElement("h3", { className }, children);
      const CardContent = ({ children, className }) => React.createElement("div", { className }, children);
    `)
    .replace(/import\s*Button\s*from\s*["'][^"']+["'];?/g, 'const Button = ({ children, className, onClick }) => React.createElement("button", { className, onClick }, children);');

  // Add React import if not present
  if (!code.includes("import React")) {
    code = `import React from "react";\n` + code;
  }

  const transformed = transform(code, {
    transforms: ["jsx"],
    jsxRuntime: "classic",
    production: true,
  }).code;

  const compiledDir = path.resolve(import.meta.dirname, ".compiled");
  if (!fs.existsSync(compiledDir)) {
    fs.mkdirSync(compiledDir, { recursive: true });
  }

  const compiledFile = path.resolve(compiledDir, path.basename(relativePath, ".jsx") + ".js");
  fs.writeFileSync(compiledFile, transformed, "utf-8");

  const fileUrl = new URL("file:///" + compiledFile.replace(/\\/g, "/"));
  const mod = await import(fileUrl.href + "?t=" + Date.now());
  return mod.default;
}

/**
 * Lightweight, zero-dependency hook test runner using React 19's hook dispatcher.
 */
function createHookRunner(hookFn) {
  let hookStates = [];
  let hookIndex = 0;
  let effects = [];
  let cleanups = [];
  let isMounted = true;
  let currentResult = null;

  const dispatcher = {
    useState(initialValue) {
      const idx = hookIndex++;
      if (hookStates[idx] === undefined) {
        hookStates[idx] = typeof initialValue === "function" ? initialValue() : initialValue;
      }
      const setState = (newValue) => {
        hookStates[idx] = typeof newValue === "function" ? newValue(hookStates[idx]) : newValue;
        if (isMounted) {
          rerender();
        }
      };
      return [hookStates[idx], setState];
    },

    useRef(initialValue) {
      const idx = hookIndex++;
      if (hookStates[idx] === undefined) {
        hookStates[idx] = { current: initialValue };
      }
      return hookStates[idx];
    },

    useCallback(callback) {
      return callback;
    },

    useEffect(effect) {
      effects.push(effect);
    },
  };

  function rerender() {
    hookIndex = 0;
    const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const prevDispatcher = internals.H;
    internals.H = dispatcher;
    try {
      currentResult = hookFn();
    } finally {
      internals.H = prevDispatcher;
    }
  }

  // Initial mount
  rerender();

  // Run mount effects
  for (const eff of effects) {
    const cln = eff();
    if (typeof cln === "function") {
      cleanups.push(cln);
    }
  }
  effects = [];

  function unmount() {
    isMounted = false;
    for (const cln of cleanups) {
      cln();
    }
    cleanups = [];
  }

  return {
    get current() {
      return currentResult;
    },
    rerender,
    unmount,
  };
}

describe("Career Strategist Frontend Runtime & Contract Verification", () => {
  let originalFetch;
  let originalLocalStorage;
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = { token: "mock-valid-jwt" };
    originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: (k) => mockStorage[k] ?? null,
      setItem: (k, v) => {
        mockStorage[k] = String(v);
      },
      removeItem: (k) => {
        delete mockStorage[k];
      },
    };
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
  });

  after(() => {
    const compiledDir = path.resolve(import.meta.dirname, ".compiled");
    if (fs.existsSync(compiledDir)) {
      try {
        fs.rmSync(compiledDir, { recursive: true, force: true });
      } catch {}
    }
  });

  describe("1. Hook Runtime: useCareerStrategist", () => {
    it("1.1 Successfully generates assessment and populates reactive state", async () => {
      const mockAssessment = {
        success: true,
        correlationId: "cs-runtime-01",
        fallbackActive: false,
        fallbackMetadata: null,
        assessment: {
          candidateSummary: {
            careerStage: "senior",
            pipelineHealth: "healthy",
            primaryBottleneck: "None detected",
          },
          pipelineDiagnostics: {
            volumeAssessment: "Adequate volume",
            stageProgressionVelocity: "Normal velocity",
            staleApplicationRisk: "Low staleness",
          },
          skillGapAnalysis: {
            verifiedCandidateSkills: ["React", "Node.js"],
            criticalMissingSkills: ["GraphQL"],
            skillBridgingAdvice: "Build a prototype with GraphQL.",
          },
          strategicRecommendations: [
            {
              priority: "high",
              category: "targeting_alignment",
              title: "Focus on Senior Backend Roles",
              rationale: "Profile skills strongly align with senior backend requirements.",
              actionSteps: ["Update resume title", "Target tier-1 backend listings"],
              expectedImpact: "Higher callback rate.",
            },
          ],
          evidenceGrounding: {
            citedMetrics: ["10 submitted applications"],
            dataLimitationsNoted: "No limitations noted",
          },
        },
        validationAudit: {
          status: "VALID",
          isValid: true,
          evidenceCitationCount: 1,
        },
        telemetry: { durationMs: 1200 },
      };

      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockAssessment,
      });

      const hook = createHookRunner(() => useCareerStrategist());
      assert.equal(hook.current.isLoading, false);
      assert.equal(hook.current.assessment, null);

      const promise = hook.current.generateAssessment({
        targetRoles: ["Senior Backend Engineer"],
        yearsOfExperience: 5,
        userNotes: "Focusing on distributed systems",
      });

      assert.equal(hook.current.isLoading, true);
      const result = await promise;

      assert.ok(result);
      assert.equal(hook.current.isLoading, false);
      assert.equal(hook.current.error, null);
      assert.equal(hook.current.correlationId, "cs-runtime-01");
      assert.equal(hook.current.fallbackActive, false);
      assert.equal(hook.current.assessment.candidateSummary.careerStage, "senior");
      assert.equal(hook.current.assessment.candidateSummary.pipelineHealth, "healthy");
      assert.equal(hook.current.assessment.strategicRecommendations[0].category, "targeting_alignment");

      hook.unmount();
    });

    it("1.2 Prevents duplicate submissions and aborts prior in-flight request", async () => {
      let firstSignalAborted = false;
      let requestCount = 0;

      globalThis.fetch = async (url, { signal }) => {
        requestCount++;
        const currentCount = requestCount;

        if (currentCount === 1) {
          signal.addEventListener("abort", () => {
            firstSignalAborted = true;
          });
          // simulate slow request
          return new Promise((resolve) => setTimeout(resolve, 500));
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            correlationId: "cs-runtime-02",
            assessment: { candidateSummary: { careerStage: "mid_level" } },
          }),
        };
      };

      const hook = createHookRunner(() => useCareerStrategist());

      // Trigger first generation
      hook.current.generateAssessment();
      assert.equal(hook.current.isLoading, true);

      // Trigger second generation before first finishes
      const secondPromise = hook.current.generateAssessment();

      // First controller must be immediately aborted
      assert.equal(firstSignalAborted, true);

      await secondPromise;
      assert.equal(hook.current.isLoading, false);
      assert.equal(hook.current.correlationId, "cs-runtime-02");

      hook.unmount();
    });

    it("1.3 Handles user cancellation via cancel() without error banner", async () => {
      let aborted = false;

      globalThis.fetch = async (url, { signal }) => {
        return new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => {
            aborted = true;
            const err = new Error("Aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      };

      const hook = createHookRunner(() => useCareerStrategist());
      const promise = hook.current.generateAssessment();
      assert.equal(hook.current.isLoading, true);

      // User initiates cancel
      hook.current.cancel();

      await promise;
      assert.equal(aborted, true);
      assert.equal(hook.current.isLoading, false);
      // Cancellation must NOT set an error state
      assert.equal(hook.current.error, null);

      hook.unmount();
    });

    it("1.4 Performs component unmount cleanup and aborts active in-flight request", async () => {
      let abortedOnUnmount = false;

      globalThis.fetch = async (url, { signal }) => {
        return new Promise((_resolve) => {
          signal.addEventListener("abort", () => {
            abortedOnUnmount = true;
          });
        });
      };

      const hook = createHookRunner(() => useCareerStrategist());
      hook.current.generateAssessment();
      assert.equal(hook.current.isLoading, true);

      // Unmount the component tree
      hook.unmount();
      assert.equal(abortedOnUnmount, true);
    });

    it("1.5 Handles backend error and populates error state", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          correlationId: "cs-err-500",
          error: { code: "INTERNAL_SERVER_ERROR", message: "Server encountered a fault" },
        }),
      });

      const hook = createHookRunner(() => useCareerStrategist());
      await hook.current.generateAssessment();

      assert.equal(hook.current.isLoading, false);
      assert.ok(hook.current.error);
      assert.equal(hook.current.error.code, CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR);
      assert.equal(hook.current.error.correlationId, "cs-err-500");

      hook.unmount();
    });
  });

  describe("2. Component Runtime Rendering & State Representation", () => {
    it("2.1 FallbackNoticeBanner renders banner when fallbackActive is true with reason and provider", async () => {
      const FallbackNoticeBanner = await loadJsxComponent(
        "src/components/career_strategist/FallbackNoticeBanner.jsx"
      );

      const html = renderToStaticMarkup(
        React.createElement(FallbackNoticeBanner, {
          fallbackActive: true,
          fallbackMetadata: {
            reason: "Upstream AI rate limit reached",
            provider: "groq",
          },
        })
      );

      assert.ok(html.includes("Deterministic Heuristic Mode Engaged"));
      assert.ok(html.includes("Upstream AI rate limit reached"));
      assert.ok(html.includes("groq"));
      assert.ok(html.includes("Offline Fallback"));
    });

    it("2.2 FallbackNoticeBanner renders nothing (null) when fallbackActive is false", async () => {
      const FallbackNoticeBanner = await loadJsxComponent(
        "src/components/career_strategist/FallbackNoticeBanner.jsx"
      );

      const html = renderToStaticMarkup(
        React.createElement(FallbackNoticeBanner, {
          fallbackActive: false,
          fallbackMetadata: null,
        })
      );

      assert.equal(html, "");
    });

    it("2.3 CandidateSummaryCard renders career stage and backend canonical pipeline health enum", async () => {
      const CandidateSummaryCard = await loadJsxComponent(
        "src/components/career_strategist/CandidateSummaryCard.jsx"
      );

      const html = renderToStaticMarkup(
        React.createElement(CandidateSummaryCard, {
          candidateSummary: {
            careerStage: "lead_architect",
            pipelineHealth: "critical_bottleneck",
            primaryBottleneck: "Zero interview movement across 15 active applications",
          },
        })
      );

      assert.ok(html.includes("Lead / Principal / Architect"));
      assert.ok(html.includes("Critical Bottleneck"));
      assert.ok(html.includes("Zero interview movement across 15 active applications"));
    });

    it("2.4 StrategicRecommendationsList renders sorted recommendations with canonical categories", async () => {
      const StrategicRecommendationsList = await loadJsxComponent(
        "src/components/career_strategist/StrategicRecommendationsList.jsx"
      );

      const html = renderToStaticMarkup(
        React.createElement(StrategicRecommendationsList, {
          recommendations: [
            {
              priority: "low",
              category: "data_hygiene",
              title: "Archive Inactive Applications",
              rationale: "Clean out stale entries to sharpen focus.",
              actionSteps: ["Review 30d entries"],
              expectedImpact: "Cleaner dashboard metrics.",
            },
            {
              priority: "high",
              category: "pipeline_velocity",
              title: "Double Weekly High-Match Submissions",
              rationale: "Conversion requires higher top-of-funnel velocity.",
              actionSteps: ["Apply to 5 jobs weekly", "Set daily search alert"],
              expectedImpact: "3x interview invitations in 30 days.",
            },
          ],
        })
      );

      assert.ok(html.includes("Strategic Recommendations"));
      assert.ok(html.includes("Double Weekly High-Match Submissions"));
      assert.ok(html.includes("Pipeline Velocity"));
      assert.ok(html.includes("Data &amp; Pipeline Hygiene") || html.includes("Data & Pipeline Hygiene"));
      // Verify high priority recommendation appears before low priority
      const highIdx = html.indexOf("Double Weekly High-Match Submissions");
      const lowIdx = html.indexOf("Archive Inactive Applications");
      assert.ok(highIdx < lowIdx, "High priority recommendation must appear first");
    });

    it("2.5 SkillGapCard correctly renders verified competencies and critical market gaps", async () => {
      const SkillGapCard = await loadJsxComponent(
        "src/components/career_strategist/SkillGapCard.jsx"
      );

      const html = renderToStaticMarkup(
        React.createElement(SkillGapCard, {
          skillGapAnalysis: {
            verifiedCandidateSkills: ["PostgreSQL", "Node.js"],
            criticalMissingSkills: ["Kubernetes", "Redis"],
            skillBridgingAdvice: "Complete cloud-native containerization exercises.",
          },
        })
      );

      assert.ok(html.includes("PostgreSQL"));
      assert.ok(html.includes("Node.js"));
      assert.ok(html.includes("Kubernetes"));
      assert.ok(html.includes("Redis"));
      assert.ok(html.includes("Complete cloud-native containerization exercises."));
    });

    it("2.6 PipelineDiagnosticsCard renders volume, velocity, and staleness telemetry", async () => {
      const PipelineDiagnosticsCard = await loadJsxComponent(
        "src/components/career_strategist/PipelineDiagnosticsCard.jsx"
      );

      const html = renderToStaticMarkup(
        React.createElement(PipelineDiagnosticsCard, {
          pipelineDiagnostics: {
            volumeAssessment: "Strong volume of 25 active tracked opportunities",
            stageProgressionVelocity: "Interview conversion rate is healthy at 20%",
            staleApplicationRisk: "2 applications stale beyond 14-day threshold",
          },
        })
      );

      assert.ok(html.includes("Strong volume of 25 active tracked opportunities"));
      assert.ok(html.includes("Interview conversion rate is healthy at 20%"));
      assert.ok(html.includes("2 applications stale beyond 14-day threshold"));
    });

    it("2.7 EvidenceGroundingCard handles dataLimitationsNoted as string (backend DTO contract)", async () => {
      const EvidenceGroundingCard = await loadJsxComponent(
        "src/components/career_strategist/EvidenceGroundingCard.jsx"
      );

      const html = renderToStaticMarkup(
        React.createElement(EvidenceGroundingCard, {
          evidenceGrounding: {
            citedMetrics: ["25 tracked opportunities", "5 active interviews"],
            dataLimitationsNoted: "Historical stage transition dates prior to Q3 unavailable.",
          },
          validationAudit: {
            status: "VALID",
            isValid: true,
            evidenceCitationCount: 2,
          },
        })
      );

      assert.ok(html.includes("25 tracked opportunities"));
      assert.ok(html.includes("5 active interviews"));
      assert.ok(html.includes("Historical stage transition dates prior to Q3 unavailable."));
      assert.ok(
        html.includes("Schema &amp; Evidence Verified") || html.includes("Schema & Evidence Verified"),
        "Must render Schema & Evidence Verified without pseudo-confidence percentages"
      );
      assert.ok(!html.includes("100% Grounded"));
    });

    it("2.8 Error banner renders error code, message, and correlationId", async () => {
      // Simulate rendering error view component
      const errorObj = new CareerStrategistError(
        "Rate limit exceeded. Career assessments are limited to 10 requests per 15-minute window.",
        {
          code: CAREER_STRATEGIST_ERROR_CODES.RATE_LIMITED,
          status: 429,
          correlationId: "cs-err-rate-limit-123",
        }
      );

      function ErrorAlertView({ error, onRetry }) {
        if (!error) return null;
        return React.createElement(
          "div",
          { role: "alert", className: "error-banner" },
          React.createElement("h4", null, `Assessment Failed (${error.code || "ERROR"})`),
          React.createElement("p", null, error.message),
          error.correlationId &&
            React.createElement("span", { className: "correlation-id" }, `Correlation ID: ${error.correlationId}`),
          React.createElement("button", { onClick: onRetry }, "Retry")
        );
      }

      const html = renderToStaticMarkup(
        React.createElement(ErrorAlertView, { error: errorObj, onRetry: () => {} })
      );

      assert.ok(html.includes("Assessment Failed (RATE_LIMITED)"));
      assert.ok(html.includes("Rate limit exceeded"));
      assert.ok(html.includes("Correlation ID: cs-err-rate-limit-123"));
      assert.ok(html.includes("Retry"));
    });
  });

  describe("3. Stage 2B.9 UX Refinement & Live DTO Contracts", () => {
    const decodeEntities = (str) =>
      str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"');

    const PROHIBITED_SYMBOLS = ["⚡", "🧭", "📈", "📊", "🎯", "🛡️", "✓", "⚠", "✕", "▲", "▼"];

    it("3.1 SkillGapCard: fallbackActive=true with empty gaps shows unavailable notice and never claims no gaps", async () => {
      const SkillGapCard = await loadJsxComponent("src/components/career_strategist/SkillGapCard.jsx");

      const html = decodeEntities(
        renderToStaticMarkup(
          React.createElement(SkillGapCard, {
            skillGapAnalysis: {
              verifiedCandidateSkills: ["JavaScript", "Node.js"],
              criticalMissingSkills: [],
              skillBridgingAdvice: "Maintain declared skills.",
            },
            fallbackActive: true,
            pipelineHealth: "needs_focus",
          })
        )
      );

      assert.ok(html.includes("Skill-gap comparison unavailable in deterministic fallback"));
      assert.ok(html.includes("Comparison Unavailable"));
      assert.ok(!html.includes("0 Gaps"));
      assert.ok(!html.includes("No critical skill gaps identified"));
      assert.ok(!html.includes("✓"));
    });

    it("3.2 SkillGapCard: empty verified skills and empty gaps without fallback explains incomplete profile", async () => {
      const SkillGapCard = await loadJsxComponent("src/components/career_strategist/SkillGapCard.jsx");

      const html = decodeEntities(
        renderToStaticMarkup(
          React.createElement(SkillGapCard, {
            skillGapAnalysis: {
              verifiedCandidateSkills: [],
              criticalMissingSkills: [],
              skillBridgingAdvice: "Add declared skills.",
            },
            fallbackActive: false,
          })
        )
      );

      assert.ok(html.includes("Insufficient skill profile data for gap comparison"));
      assert.ok(html.includes("Profile Incomplete"));
      assert.ok(!html.includes("0 Gaps"));
      assert.ok(!html.includes("No critical skill gaps identified"));
    });

    it("3.3 SkillGapCard: verified skills with empty gaps (live run) shows scoped wording without checkmark", async () => {
      const SkillGapCard = await loadJsxComponent("src/components/career_strategist/SkillGapCard.jsx");

      const html = decodeEntities(
        renderToStaticMarkup(
          React.createElement(SkillGapCard, {
            skillGapAnalysis: {
              verifiedCandidateSkills: ["TypeScript", "PostgreSQL"],
              criticalMissingSkills: [],
              skillBridgingAdvice: "Continue building production scale examples.",
            },
            fallbackActive: false,
            pipelineHealth: "healthy",
          })
        )
      );

      assert.ok(
        html.includes("No specific missing skills were flagged based on the declared profile skills")
      );
      assert.ok(!html.includes("✓"));
    });

    it("3.4 SkillGapCard: renders specific missing skills when present", async () => {
      const SkillGapCard = await loadJsxComponent("src/components/career_strategist/SkillGapCard.jsx");

      const html = decodeEntities(
        renderToStaticMarkup(
          React.createElement(SkillGapCard, {
            skillGapAnalysis: {
              verifiedCandidateSkills: ["Node.js"],
              criticalMissingSkills: ["Kubernetes", "Terraform"],
              skillBridgingAdvice: "Practice infrastructure as code.",
            },
            fallbackActive: false,
          })
        )
      );

      assert.ok(html.includes("Kubernetes"));
      assert.ok(html.includes("Terraform"));
    });

    it("3.5 PipelineDiagnosticsCard: insufficient_data shows explanation, unavailable items, limitations, and guidance", async () => {
      const PipelineDiagnosticsCard = await loadJsxComponent(
        "src/components/career_strategist/PipelineDiagnosticsCard.jsx"
      );

      const html = decodeEntities(
        renderToStaticMarkup(
          React.createElement(PipelineDiagnosticsCard, {
            pipelineDiagnostics: {
              volumeAssessment: "0 tracked opportunities and 0 submitted applications recorded.",
              stageProgressionVelocity: "Insufficient volume.",
              staleApplicationRisk: "0 stale applications.",
            },
            pipelineHealth: "insufficient_data",
            dataLimitationsNoted: "No submitted applications recorded in database.",
          })
        )
      );

      assert.ok(html.includes("Insufficient Pipeline Activity for Performance Conclusions"));
      assert.ok(html.includes("stage progression speed, bottleneck causality, or meaningful staleness patterns"));
      assert.ok(html.includes("No submitted applications recorded in database."));
      assert.ok(html.includes("track target roles, log submitted applications, and update stage transitions"));
    });

    it("3.6 PipelineDiagnosticsCard: healthy pipeline hides insufficient/inconsistent callouts", async () => {
      const PipelineDiagnosticsCard = await loadJsxComponent(
        "src/components/career_strategist/PipelineDiagnosticsCard.jsx"
      );

      const html = decodeEntities(
        renderToStaticMarkup(
          React.createElement(PipelineDiagnosticsCard, {
            pipelineDiagnostics: {
              volumeAssessment: "12 tracked opportunities.",
              stageProgressionVelocity: "2 active interviews.",
              staleApplicationRisk: "1 stale alert.",
            },
            pipelineHealth: "healthy",
          })
        )
      );

      assert.ok(!html.includes("Insufficient Pipeline Activity"));
      assert.ok(!html.includes("Pipeline Telemetry Review Recommended"));
    });

    it("3.7 PipelineDiagnosticsCard: inconsistent_data displays review caution", async () => {
      const PipelineDiagnosticsCard = await loadJsxComponent(
        "src/components/career_strategist/PipelineDiagnosticsCard.jsx"
      );

      const html = decodeEntities(
        renderToStaticMarkup(
          React.createElement(PipelineDiagnosticsCard, {
            pipelineDiagnostics: {
              volumeAssessment: "Stage totals mismatch submitted count.",
              stageProgressionVelocity: "Uncertain due to stage gap.",
              staleApplicationRisk: "Review needed.",
            },
            pipelineHealth: "inconsistent_data",
          })
        )
      );

      assert.ok(html.includes("Pipeline Telemetry Review Recommended"));
      assert.ok(html.includes("Review tracked application statuses and dates"));
    });

    it("3.8 StrategicRecommendationsList: renders labeled hierarchy, no emojis, and accurate attribution", async () => {
      const StrategicRecommendationsList = await loadJsxComponent(
        "src/components/career_strategist/StrategicRecommendationsList.jsx"
      );

      const htmlFallback = decodeEntities(
        renderToStaticMarkup(
          React.createElement(StrategicRecommendationsList, {
            recommendations: [
              {
                id: "REC-01",
                priority: "high",
                category: "pipeline_velocity",
                title: "Follow Up on Stale Submissions",
                rationale: "1 submission exceeded the 14-day inactivity threshold.",
                actionSteps: ["Send follow-up inquiry", "Update status"],
                expectedImpact: "Clarifies interview status",
              },
            ],
            fallbackActive: true,
            pipelineHealth: "needs_focus",
          })
        )
      );

      assert.ok(htmlFallback.includes("Why It Matters"));
      assert.ok(htmlFallback.includes("Recommended Actions"));
      assert.ok(htmlFallback.includes("Expected Benefit"));
      assert.ok(htmlFallback.includes("Generated by local deterministic heuristic rules"));
      assert.ok(!htmlFallback.includes("📈"));

      const htmlAi = decodeEntities(
        renderToStaticMarkup(
          React.createElement(StrategicRecommendationsList, {
            recommendations: [
              {
                id: "REC-01",
                priority: "medium",
                category: "targeting_alignment",
                title: "Align Portfolio APIs",
                rationale: "Strengthens backend evidence.",
                actionSteps: ["Publish README benchmarks"],
                expectedImpact: "Stronger technical screening",
              },
            ],
            fallbackActive: false,
            pipelineHealth: "healthy",
          })
        )
      );

      assert.ok(htmlAi.includes("AI-synthesized guidance"));
      assert.ok(htmlAi.includes("Evidence & Verification Audit"));
    });

    it("3.9 EvidenceGroundingCard: live backend audit DTO without isValid renders Schema & Evidence Verified and real telemetry", async () => {
      const EvidenceGroundingCard = await loadJsxComponent(
        "src/components/career_strategist/EvidenceGroundingCard.jsx"
      );

      const html = decodeEntities(
        renderToStaticMarkup(
          React.createElement(EvidenceGroundingCard, {
            evidenceGrounding: {
              citedMetrics: ["12 tracked opportunities", "8 submitted applications"],
              dataLimitationsNoted: "No historical interviewer feedback stored.",
            },
            validationAudit: {
              schemaValid: true,
              evidenceGrounded: true,
              discrepancies: [],
            },
            telemetry: {
              providerId: "groq",
              modelIdentifier: "openai/gpt-oss-120b",
              latencyMs: 4702,
              totalTokens: 3053,
              durationMs: 99999, // Must ignore durationMs when latencyMs is present
            },
            verifiedCandidateSkills: ["JavaScript", "Node.js", "PostgreSQL"],
            correlationId: "corr-live-dto-1",
            fallbackActive: false,
            pipelineHealth: "healthy",
            defaultShowTechnicalDetails: true,
          })
        )
      );

      assert.ok(html.includes("Schema & Evidence Verified"));
      assert.ok(!html.includes("Audit Discrepancies Found"));
      assert.ok(!html.includes("100% Grounded"));
      assert.ok(html.includes("JavaScript"));
      assert.ok(html.includes("PostgreSQL"));
      assert.ok(html.includes("12 tracked opportunities"));
      assert.ok(html.includes("No historical interviewer feedback stored."));
      assert.ok(html.includes("AI-generated strategic interpretations, not independently verified facts"));
      assert.ok(html.includes("openai/gpt-oss-120b"));
      assert.ok(html.includes("4702 ms"));
      assert.ok(!html.includes("99999 ms"));
      assert.ok(html.includes("3053 tokens"));
    });

    it("3.10 EvidenceGroundingCard: new-format audit failures cannot be overridden by legacy isValid: true", async () => {
      const EvidenceGroundingCard = await loadJsxComponent(
        "src/components/career_strategist/EvidenceGroundingCard.jsx"
      );

      const htmlEvidenceFail = decodeEntities(
        renderToStaticMarkup(
          React.createElement(EvidenceGroundingCard, {
            evidenceGrounding: { citedMetrics: [], dataLimitationsNoted: "" },
            validationAudit: {
              schemaValid: true,
              evidenceGrounded: false,
              discrepancies: [],
              isValid: true, // legacy claim must NOT override evidenceGrounded: false
            },
          })
        )
      );
      assert.ok(htmlEvidenceFail.includes("Audit Discrepancies Found"));
      assert.ok(!htmlEvidenceFail.includes("Schema & Evidence Verified"));

      const htmlSchemaFail = decodeEntities(
        renderToStaticMarkup(
          React.createElement(EvidenceGroundingCard, {
            evidenceGrounding: { citedMetrics: [], dataLimitationsNoted: "" },
            validationAudit: {
              schemaValid: false,
              evidenceGrounded: true,
              discrepancies: [],
              isValid: true, // legacy claim must NOT override schemaValid: false
            },
          })
        )
      );
      assert.ok(htmlSchemaFail.includes("Audit Discrepancies Found"));
      assert.ok(!htmlSchemaFail.includes("Schema & Evidence Verified"));

      const htmlNonEmptyDiscrepancies = decodeEntities(
        renderToStaticMarkup(
          React.createElement(EvidenceGroundingCard, {
            evidenceGrounding: { citedMetrics: [], dataLimitationsNoted: "" },
            validationAudit: {
              schemaValid: true,
              evidenceGrounded: true,
              discrepancies: ["Unsupported skill claim: Kubernetes"],
              isValid: true,
            },
            defaultShowTechnicalDetails: true,
          })
        )
      );
      assert.ok(htmlNonEmptyDiscrepancies.includes("Audit Discrepancies Found"));
      assert.ok(htmlNonEmptyDiscrepancies.includes("Unsupported skill claim: Kubernetes"));
      assert.ok(!htmlNonEmptyDiscrepancies.includes("Schema & Evidence Verified"));
    });

    it("3.11 EvidenceGroundingCard: missing, incomplete, or empty-discrepancies-only audit fails closed as unverified", async () => {
      const EvidenceGroundingCard = await loadJsxComponent(
        "src/components/career_strategist/EvidenceGroundingCard.jsx"
      );

      for (const badAudit of [
        null,
        undefined,
        [],
        "INVALID",
        { discrepancies: [] },
        { schemaValid: true },
        { schemaValid: true, evidenceGrounded: true }, // missing discrepancies array
      ]) {
        const html = decodeEntities(
          renderToStaticMarkup(
            React.createElement(EvidenceGroundingCard, {
              evidenceGrounding: { citedMetrics: [], dataLimitationsNoted: "" },
              validationAudit: badAudit,
            })
          )
        );
        assert.ok(
          !html.includes("Schema & Evidence Verified"),
          `Must not present audit as verified for: ${JSON.stringify(badAudit)}`
        );
        assert.ok(
          html.includes("Audit Status Unavailable") || html.includes("Audit Incomplete"),
          "Must display explicit unavailable/incomplete audit state"
        );
      }
    });

    it("3.12 EvidenceGroundingCard: uses durationMs only as legacy fallback when latencyMs is absent, and scopes empty limitations", async () => {
      const EvidenceGroundingCard = await loadJsxComponent(
        "src/components/career_strategist/EvidenceGroundingCard.jsx"
      );

      const htmlLegacyTelemetryAndFallback = decodeEntities(
        renderToStaticMarkup(
          React.createElement(EvidenceGroundingCard, {
            evidenceGrounding: { citedMetrics: [], dataLimitationsNoted: "" },
            validationAudit: { schemaValid: true, evidenceGrounded: true, discrepancies: [] },
            telemetry: { durationMs: 1234 },
            fallbackActive: true,
            pipelineHealth: "insufficient_data",
            defaultShowTechnicalDetails: true,
          })
        )
      );

      assert.ok(htmlLegacyTelemetryAndFallback.includes("1234 ms"));
      assert.ok(
        htmlLegacyTelemetryAndFallback.includes("offline deterministic heuristics rather than AI synthesis")
      );
      assert.ok(!htmlLegacyTelemetryAndFallback.includes("No missing-data limitations were flagged"));
    });

    it("3.13 CandidateSummaryCard: uses Unclassified for unspecified stage and Experience-Bounded for classified stages", async () => {
      const CandidateSummaryCard = await loadJsxComponent(
        "src/components/career_strategist/CandidateSummaryCard.jsx"
      );

      const htmlUnspecified = decodeEntities(
        renderToStaticMarkup(
          React.createElement(CandidateSummaryCard, {
            candidateSummary: {
              careerStage: "unspecified",
              pipelineHealth: "insufficient_data",
              primaryBottleneck: "Limited context",
            },
          })
        )
      );
      assert.ok(htmlUnspecified.includes("Unspecified Stage"));
      assert.ok(htmlUnspecified.includes("Unclassified"));
      assert.ok(!htmlUnspecified.includes("Verified"));
      assert.ok(!htmlUnspecified.includes("Experience-Bounded"));

      const htmlEntry = decodeEntities(
        renderToStaticMarkup(
          React.createElement(CandidateSummaryCard, {
            candidateSummary: {
              careerStage: "entry_level",
              pipelineHealth: "needs_focus",
              primaryBottleneck: "Low interview conversion",
            },
          })
        )
      );
      assert.ok(htmlEntry.includes("Entry Level"));
      assert.ok(htmlEntry.includes("Experience-Bounded"));
      assert.ok(!htmlEntry.includes("Verified"));
    });

    it("3.14 Global HARD_RULES Check: zero emojis or decorative Unicode symbols across all Career Strategist components", async () => {
      const SkillGapCard = await loadJsxComponent("src/components/career_strategist/SkillGapCard.jsx");
      const PipelineDiagnosticsCard = await loadJsxComponent(
        "src/components/career_strategist/PipelineDiagnosticsCard.jsx"
      );
      const StrategicRecommendationsList = await loadJsxComponent(
        "src/components/career_strategist/StrategicRecommendationsList.jsx"
      );
      const EvidenceGroundingCard = await loadJsxComponent(
        "src/components/career_strategist/EvidenceGroundingCard.jsx"
      );
      const CandidateSummaryCard = await loadJsxComponent(
        "src/components/career_strategist/CandidateSummaryCard.jsx"
      );
      const FallbackNoticeBanner = await loadJsxComponent(
        "src/components/career_strategist/FallbackNoticeBanner.jsx"
      );
      const CareerStrategistEmptyState = await loadJsxComponent(
        "src/components/career_strategist/CareerStrategistEmptyState.jsx"
      );

      const renderedAll = [
        renderToStaticMarkup(
          React.createElement(SkillGapCard, {
            skillGapAnalysis: { verifiedCandidateSkills: ["Go"], criticalMissingSkills: [] },
            fallbackActive: false,
          })
        ),
        renderToStaticMarkup(
          React.createElement(PipelineDiagnosticsCard, {
            pipelineDiagnostics: {
              volumeAssessment: "0",
              stageProgressionVelocity: "N/A",
              staleApplicationRisk: "0",
            },
            pipelineHealth: "insufficient_data",
          })
        ),
        renderToStaticMarkup(
          React.createElement(StrategicRecommendationsList, {
            recommendations: [
              {
                priority: "high",
                category: "pipeline_velocity",
                title: "Test Rec",
                rationale: "Reason",
                actionSteps: ["Step 1"],
                expectedImpact: "Benefit",
              },
            ],
          })
        ),
        renderToStaticMarkup(
          React.createElement(EvidenceGroundingCard, {
            evidenceGrounding: { citedMetrics: ["0 tracked"], dataLimitationsNoted: "Limited" },
            validationAudit: { schemaValid: true, evidenceGrounded: true, discrepancies: [] },
            defaultShowTechnicalDetails: true,
          })
        ),
        renderToStaticMarkup(
          React.createElement(CandidateSummaryCard, {
            candidateSummary: {
              careerStage: "entry_level",
              pipelineHealth: "healthy",
              primaryBottleneck: "None",
            },
          })
        ),
        renderToStaticMarkup(
          React.createElement(FallbackNoticeBanner, {
            fallbackActive: true,
            fallbackMetadata: { reason: "429" },
          })
        ),
        renderToStaticMarkup(
          React.createElement(CareerStrategistEmptyState, {
            onGenerate: () => {},
            isLoading: false,
          })
        ),
      ].join("\n");

      for (const sym of PROHIBITED_SYMBOLS) {
        assert.ok(!renderedAll.includes(sym), `Rendered HTML must not contain prohibited symbol '${sym}'`);
      }
    });

    it("3.15 Stage 2B.9-R1 Telemetry Latency: zero values, legacy durationMs fallback, and malformed latencyMs unavailable state", async () => {
      const EvidenceGroundingCard = await loadJsxComponent(
        "src/components/career_strategist/EvidenceGroundingCard.jsx"
      );

      const renderWithTelemetry = (telemetry) =>
        decodeEntities(
          renderToStaticMarkup(
            React.createElement(EvidenceGroundingCard, {
              evidenceGrounding: { citedMetrics: [], dataLimitationsNoted: "" },
              validationAudit: { schemaValid: true, evidenceGrounded: true, discrepancies: [] },
              telemetry,
              defaultShowTechnicalDetails: true,
            })
          )
        );

      // 1. Valid latencyMs overrides differing durationMs
      const htmlPrecedence = renderWithTelemetry({ latencyMs: 410, durationMs: 999 });
      assert.ok(htmlPrecedence.includes("Inference Latency:"));
      assert.ok(htmlPrecedence.includes("410 ms"));
      assert.ok(!htmlPrecedence.includes("999 ms"));

      // 2. latencyMs: 0 is valid and supersedes non-zero durationMs
      const htmlZeroLatency = renderWithTelemetry({ latencyMs: 0, durationMs: 850 });
      assert.ok(htmlZeroLatency.includes("0 ms"));
      assert.ok(!htmlZeroLatency.includes("850 ms"));
      assert.ok(!htmlZeroLatency.includes("Unavailable"));

      // 3. Absent latencyMs with valid durationMs: 0 renders 0 ms
      const htmlZeroLegacy = renderWithTelemetry({ durationMs: 0 });
      assert.ok(htmlZeroLegacy.includes("0 ms"));
      assert.ok(!htmlZeroLegacy.includes("Unavailable"));

      // 4. Absent latencyMs with positive durationMs renders legacy value
      const htmlPosLegacy = renderWithTelemetry({ durationMs: 1234 });
      assert.ok(htmlPosLegacy.includes("1234 ms"));

      // 5–9. Malformed-but-present latencyMs NEVER falls back to valid durationMs and renders Unavailable
      const malformedLatencyCases = ["4702", null, NaN, Infinity, -Infinity, -5, undefined];
      for (const badLatency of malformedLatencyCases) {
        const htmlBadLatency = renderWithTelemetry({ latencyMs: badLatency, durationMs: 1234 });
        assert.ok(
          htmlBadLatency.includes("Inference Latency:") && htmlBadLatency.includes("Unavailable"),
          `Malformed present latencyMs (${String(badLatency)}) must render Unavailable state`
        );
        assert.ok(
          !htmlBadLatency.includes("1234 ms"),
          `Malformed present latencyMs (${String(badLatency)}) must never fall back to durationMs`
        );
        assert.ok(!htmlBadLatency.includes("4702 ms"));
        assert.ok(!htmlBadLatency.includes("NaN ms"));
        assert.ok(!htmlBadLatency.includes("Infinity ms"));
        assert.ok(!htmlBadLatency.includes("-5 ms"));
      }

      // 10. Absent latencyMs with invalid legacy durationMs renders Unavailable (never NaN/Infinity/negative)
      for (const badDuration of ["bad", null, NaN, Infinity, -10]) {
        const htmlBadDuration = renderWithTelemetry({ durationMs: badDuration });
        assert.ok(
          htmlBadDuration.includes("Inference Latency:") && htmlBadDuration.includes("Unavailable"),
          `Invalid legacy durationMs (${String(badDuration)}) must render Unavailable`
        );
        assert.ok(!htmlBadDuration.includes("NaN ms"));
        assert.ok(!htmlBadDuration.includes("Infinity ms"));
        assert.ok(!htmlBadDuration.includes("-10 ms"));
      }
    });

    it("3.16 Stage 2B.9-R1 Audit State: legacy compatibility strictly when absent, malformed new-format fails closed", async () => {
      const EvidenceGroundingCard = await loadJsxComponent(
        "src/components/career_strategist/EvidenceGroundingCard.jsx"
      );

      const renderAudit = (validationAudit) =>
        decodeEntities(
          renderToStaticMarkup(
            React.createElement(EvidenceGroundingCard, {
              evidenceGrounding: { citedMetrics: [], dataLimitationsNoted: "" },
              validationAudit,
            })
          )
        );

      // 1. Both new-format booleans absent + isValid: true -> Legacy compatibility applies
      const htmlLegacyValid = renderAudit({ isValid: true });
      assert.ok(htmlLegacyValid.includes("Schema & Evidence Verified"));

      // 2. Both new-format booleans absent + isValid: false -> Legacy invalid state preserved
      const htmlLegacyInvalid = renderAudit({ isValid: false });
      assert.ok(htmlLegacyInvalid.includes("Audit Discrepancies Found"));
      assert.ok(!htmlLegacyInvalid.includes("Schema & Evidence Verified"));

      // 3–6. Malformed or partial new-format properties present MUST NOT consult legacy isValid: true
      const nonVerifiedNewFormatCases = [
        { schemaValid: null, evidenceGrounded: true, discrepancies: [], isValid: true },
        { schemaValid: true, evidenceGrounded: "yes", discrepancies: [], isValid: true },
        { schemaValid: null, evidenceGrounded: "yes", isValid: true },
        { schemaValid: "true", evidenceGrounded: 1, discrepancies: [], isValid: true },
        { schemaValid: true, discrepancies: [], isValid: true },
        { evidenceGrounded: true, discrepancies: [], isValid: true },
        { schemaValid: undefined, evidenceGrounded: undefined, isValid: true },
      ];

      for (const auditCase of nonVerifiedNewFormatCases) {
        const html = renderAudit(auditCase);
        assert.ok(
          html.includes("Audit Incomplete"),
          `Payload ${JSON.stringify(auditCase)} must report Audit Incomplete and never consult isValid`
        );
        assert.ok(!html.includes("Schema & Evidence Verified"));
      }
    });
  });
});
