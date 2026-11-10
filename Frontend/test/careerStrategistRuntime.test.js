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
      assert.ok(html.includes("100% Grounded"));
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
});
