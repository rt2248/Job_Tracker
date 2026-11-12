import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  generateCareerAssessment,
  CareerStrategistError,
  CAREER_STRATEGIST_ERROR_CODES,
} from "../src/services/careerStrategistService.js";

describe("Career Strategist Frontend Service Integration", () => {
  let originalFetch;
  let originalLocalStorage;
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = { token: "mock-jwt-test-token" };
    originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: (key) => mockStorage[key] ?? null,
      setItem: (key, val) => {
        mockStorage[key] = String(val);
      },
      removeItem: (key) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };

    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
  });

  describe("1. Authentication & Security Guardrails", () => {
    it("throws 401 CareerStrategistError when authentication token is missing", async () => {
      delete mockStorage.token;

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.ok(err instanceof CareerStrategistError);
          assert.equal(err.status, 401);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.AUTHENTICATION_REQUIRED);
          assert.match(err.message, /token not found/i);
          return true;
        }
      );
    });

    it("attaches Authorization Bearer header to outbound request", async () => {
      let capturedHeaders = null;

      globalThis.fetch = async (url, options) => {
        capturedHeaders = options.headers;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            correlationId: "cs-test-123",
            assessment: { candidateSummary: {} },
          }),
        };
      };

      await generateCareerAssessment();

      assert.ok(capturedHeaders);
      assert.equal(capturedHeaders.Authorization, "Bearer mock-jwt-test-token");
      assert.equal(capturedHeaders["Content-Type"], "application/json");
    });

    it("CRITICAL INVARIANT: never injects or sends userId in outbound payload", async () => {
      let capturedBody = null;

      globalThis.fetch = async (url, options) => {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            correlationId: "cs-test-security",
            assessment: { candidateSummary: {} },
          }),
        };
      };

      await generateCareerAssessment({
        targetRoles: ["Staff Engineer"],
        yearsOfExperience: 8,
      });

      assert.ok(capturedBody);
      assert.equal(capturedBody.userId, undefined);
      assert.equal("userId" in capturedBody, false);
    });
  });

  describe("2. Request Construction & Payload Parameter Validation", () => {
    it("submits empty payload when no overrides provided", async () => {
      let capturedBody = null;

      globalThis.fetch = async (url, options) => {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, assessment: {} }),
        };
      };

      await generateCareerAssessment({});
      assert.deepEqual(capturedBody, {});
    });

    it("serializes valid targetRoles, yearsOfExperience, and userNotes", async () => {
      let capturedBody = null;

      globalThis.fetch = async (url, options) => {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, assessment: {} }),
        };
      };

      await generateCareerAssessment({
        targetRoles: ["Backend Architect", "Systems Engineer", ""],
        yearsOfExperience: 7,
        userNotes: "Focusing on high-throughput distributed systems.",
      });

      assert.deepEqual(capturedBody, {
        targetRoles: ["Backend Architect", "Systems Engineer"],
        yearsOfExperience: 7,
        userNotes: "Focusing on high-throughput distributed systems.",
      });
    });

    it("rejects negative yearsOfExperience client-side with 400", async () => {
      await assert.rejects(
        () => generateCareerAssessment({ yearsOfExperience: -1 }),
        (err) => {
          assert.ok(err instanceof CareerStrategistError);
          assert.equal(err.status, 400);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST);
          assert.match(err.message, /between 0 and 70/);
          return true;
        }
      );
    });

    it("rejects excessive yearsOfExperience (>70) client-side with 400", async () => {
      await assert.rejects(
        () => generateCareerAssessment({ yearsOfExperience: 75 }),
        (err) => {
          assert.ok(err instanceof CareerStrategistError);
          assert.equal(err.status, 400);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST);
          assert.match(err.message, /between 0 and 70/);
          return true;
        }
      );
    });

    it("rejects userNotes exceeding 1,000 characters client-side with 400", async () => {
      const oversizedNotes = "x".repeat(1001);

      await assert.rejects(
        () => generateCareerAssessment({ userNotes: oversizedNotes }),
        (err) => {
          assert.ok(err instanceof CareerStrategistError);
          assert.equal(err.status, 400);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST);
          assert.match(err.message, /must not exceed 1000 characters/);
          return true;
        }
      );
    });
  });

  describe("3. Successful Response & Fallback Handling", () => {
    it("returns parsed assessment payload on HTTP 200", async () => {
      const mockResult = {
        success: true,
        correlationId: "cs-valid-200",
        fallbackActive: false,
        fallbackMetadata: { active: false, provider: null, reason: null },
        assessment: {
          candidateSummary: {
            careerStage: "senior",
            pipelineHealth: "healthy",
            primaryBottleneck: "None detected",
          },
          pipelineDiagnostics: {
            volumeAssessment: "Strong application volume",
            stageProgressionVelocity: "Optimal conversion",
            staleApplicationRisk: "Zero stale records",
          },
          skillGapAnalysis: {
            verifiedCandidateSkills: ["Node.js", "React", "PostgreSQL"],
            criticalMissingSkills: ["Kubernetes"],
            skillBridgingAdvice: "Complete container orchestration certifications.",
          },
          strategicRecommendations: [
            {
              priority: "high",
              category: "positioning",
              title: "Refine Lead Architectural Scope",
              rationale: "Align bullet points with high-concurrency systems.",
              actionSteps: ["Update resume summary", "Add distributed metrics"],
              expectedImpact: "Higher interview callback rate.",
            },
          ],
          evidenceGrounding: {
            citedMetrics: ["8 tracked opportunities", "2 active interviews"],
            dataLimitationsNoted: [],
          },
        },
        validationAudit: {
          status: "VALID",
          isValid: true,
          evidenceCitationCount: 2,
        },
        telemetry: { durationMs: 1420 },
      };

      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockResult,
      });

      const response = await generateCareerAssessment();
      assert.deepEqual(response, mockResult);
      assert.equal(response.fallbackActive, false);
      assert.equal(response.assessment.candidateSummary.careerStage, "senior");
    });

    it("parses fallback active response cleanly without throwing", async () => {
      const fallbackResult = {
        success: true,
        correlationId: "cs-fallback-200",
        fallbackActive: true,
        fallbackMetadata: {
          active: true,
          provider: "groq",
          reason: "Upstream timeout after 15000ms",
        },
        assessment: {
          candidateSummary: {
            careerStage: "mid_level",
            pipelineHealth: "needs_attention",
            primaryBottleneck: "Application volume bottleneck",
          },
          pipelineDiagnostics: {
            volumeAssessment: "Limited pipeline volume",
            stageProgressionVelocity: "Slow movement",
            staleApplicationRisk: "1 stale opportunity detected",
          },
          skillGapAnalysis: {
            verifiedCandidateSkills: ["JavaScript"],
            criticalMissingSkills: ["TypeScript"],
            skillBridgingAdvice: "Transition codebases to TypeScript.",
          },
          strategicRecommendations: [
            {
              priority: "high",
              category: "pipeline_hygiene",
              title: "Increase Weekly Application Volume",
              rationale: "Target at least 5 weekly qualified submissions.",
              actionSteps: ["Set daily application target"],
              expectedImpact: "Expands pipeline top-of-funnel.",
            },
          ],
          evidenceGrounding: {
            citedMetrics: ["1 active application"],
            dataLimitationsNoted: ["Fallback deterministic rules used"],
          },
        },
        validationAudit: {
          status: "VALID",
          isValid: true,
        },
      };

      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => fallbackResult,
      });

      const response = await generateCareerAssessment();
      assert.equal(response.fallbackActive, true);
      assert.equal(response.fallbackMetadata.reason, "Upstream timeout after 15000ms");
    });
  });

  describe("4. Error Status Mapping & Categorization", () => {
    it("maps 400 Bad Request to INVALID_REQUEST error code", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: "INVALID_REQUEST", message: "Invalid candidate payload structure" },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 400);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST);
          assert.match(err.message, /invalid/i);
          return true;
        }
      );
    });

    it("maps 403 Forbidden to FORBIDDEN error code", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: { code: "FORBIDDEN", message: "Explicit userId parameter is forbidden" },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 403);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.FORBIDDEN);
          return true;
        }
      );
    });

    it("maps 429 Rate Limited to RATE_LIMITED error code with 10 req/15 min guidance", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 429);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.RATE_LIMITED);
          return true;
        }
      );
    });

    it("maps 499 Client Closed Request to ABORTED error code", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 499,
        json: async () => ({
          success: false,
          error: { code: "ABORTED", message: "Client cancelled the request" },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 499);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.ABORTED);
          return true;
        }
      );
    });

    it("maps 502 Bad Gateway to SCHEMA_VALIDATION_ERROR error code", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 502,
        json: async () => ({
          success: false,
          correlationId: "cs-err-502",
          error: {
            code: "SCHEMA_VALIDATION_ERROR",
            message: "Model output failed structural evidence validation.",
          },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 502);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR);
          assert.equal(err.correlationId, "cs-err-502");
          return true;
        }
      );
    });

    it("maps 504 Gateway Timeout to TIMEOUT error code", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 504,
        json: async () => ({
          success: false,
          error: { code: "TIMEOUT", message: "Assessment timed out." },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 504);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.TIMEOUT);
          return true;
        }
      );
    });

    it("maps 500 Internal Server Error to INTERNAL_SERVER_ERROR error code", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: "INTERNAL_SERVER_ERROR", message: "Unexpected server fault." },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 500);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR);
          return true;
        }
      );
    });
  });

  describe("5. AbortController Cancellation & Network Handling", () => {
    it("handles AbortSignal cancellation cleanly and assigns ABORTED code", async () => {
      const controller = new AbortController();

      globalThis.fetch = async (url, { signal }) => {
        return new Promise((resolve, reject) => {
          if (signal?.aborted) {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            return reject(err);
          }
          signal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      };

      const promise = generateCareerAssessment({ signal: controller.signal });
      controller.abort();

      await assert.rejects(
        promise,
        (err) => {
          assert.ok(err instanceof CareerStrategistError);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.ABORTED);
          assert.equal(err.status, 499);
          return true;
        }
      );
    });

    it("handles underlying network connection failures as NETWORK_ERROR", async () => {
      globalThis.fetch = async () => {
        throw new TypeError("Failed to fetch: Connection refused");
      };

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.ok(err instanceof CareerStrategistError);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.NETWORK_ERROR);
          assert.equal(err.status, 0);
          assert.match(err.message, /connection refused/i);
          return true;
        }
      );
    });
  });

  describe("6. Stage 2B.10B Targeted Error Contract Alignment", () => {
    it("classifies HTTP 502 MODEL_FAILURE strictly as MODEL_FAILURE without mislabeling as SCHEMA_VALIDATION_ERROR", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 502,
        json: async () => ({
          message: "AI provider returned malformed response",
          correlationId: "corr-model-fail-502",
          error: {
            code: "MODEL_FAILURE",
            message: "AI provider returned malformed response",
          },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.ok(err instanceof CareerStrategistError);
          assert.equal(err.status, 502);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.MODEL_FAILURE);
          assert.notEqual(err.code, CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR);
          assert.equal(err.message, "AI provider returned malformed response");
          assert.equal(err.correlationId, "corr-model-fail-502");
          assert.equal(err.details, null);
          return true;
        }
      );
    });

    it("preserves MODEL_FAILURE on incomplete HTTP 502 payload lacking error.message", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 502,
        json: async () => ({
          correlationId: "corr-model-incomplete",
          error: { code: "MODEL_FAILURE" },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 502);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.MODEL_FAILURE);
          assert.equal(err.correlationId, "corr-model-incomplete");
          assert.match(err.message, /malformed or unparseable/i);
          return true;
        }
      );
    });

    it("normalizes canonical AI_* error codes and CONTEXT_WINDOW_EXCEEDED", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          message: "Assessment prompt exceeds the AI model context window",
          correlationId: "corr-ctx-400",
          error: {
            code: "CONTEXT_WINDOW_EXCEEDED",
            message: "Assessment prompt exceeds the AI model context window",
          },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 400);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.CONTEXT_WINDOW_EXCEEDED);
          assert.equal(err.correlationId, "corr-ctx-400");
          return true;
        }
      );

      globalThis.fetch = async () => ({
        ok: false,
        status: 502,
        json: async () => ({
          correlationId: "corr-ai-alias-502",
          error: {
            code: "AI_MODEL_FAILURE",
            message: "Upstream model returned corrupted payload",
          },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.MODEL_FAILURE);
          assert.equal(err.correlationId, "corr-ai-alias-502");
          return true;
        }
      );
    });

    it("parses structured error envelope details and correlationId accurately", async () => {
      const validationDetails = {
        field: "yearsOfExperience",
        constraint: "Must be a finite non-negative number between 0 and 70",
      };

      globalThis.fetch = async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          message: "Invalid yearsOfExperience parameter",
          correlationId: "corr-val-details-400",
          error: {
            code: "INVALID_REQUEST",
            message: "Invalid yearsOfExperience parameter",
            details: validationDetails,
          },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 400);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.INVALID_REQUEST);
          assert.equal(err.message, "Invalid yearsOfExperience parameter");
          assert.equal(err.correlationId, "corr-val-details-400");
          assert.deepEqual(err.details, validationDetails);
          return true;
        }
      );
    });

    it("retains compatibility with legacy flat { message } error responses", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 502,
        json: async () => ({
          message: "Legacy gateway ungrounded response",
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 502);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR);
          assert.equal(err.message, "Legacy gateway ungrounded response");
          assert.equal(err.correlationId, null);
          assert.equal(err.details, null);
          return true;
        }
      );
    });

    it("does not silently misclassify unrecognized backend error.code values", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 502,
        json: async () => ({
          correlationId: "corr-unknown-code",
          error: {
            code: "SOME_UNRECOGNIZED_UPSTREAM_CODE",
            message: "Unhandled vendor proxy state",
          },
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 502);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.UNKNOWN_ERROR);
          assert.notEqual(err.code, "SOME_UNRECOGNIZED_UPSTREAM_CODE");
          assert.notEqual(err.code, CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR);
          assert.equal(err.message, "Unhandled vendor proxy state");
          assert.equal(err.correlationId, "corr-unknown-code");
          return true;
        }
      );
    });

    it("handles malformed, non-JSON, primitive, and incomplete error payloads safely", async () => {
      // 1. response.json() throws on HTML gateway error
      globalThis.fetch = async () => ({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON");
        },
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 502);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.SCHEMA_VALIDATION_ERROR);
          assert.equal(err.correlationId, null);
          assert.equal(err.details, null);
          return true;
        }
      );

      // 2. Malformed nested fields: non-object error, numeric code, whitespace correlationId, empty details
      globalThis.fetch = async () => ({
        ok: false,
        status: 429,
        json: async () => ({
          correlationId: "   ",
          error: {
            code: 429,
            message: "",
            details: {},
          },
          message: "Rate limit exceeded from proxy",
        }),
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 429);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.RATE_LIMITED);
          assert.equal(err.message, "Rate limit exceeded from proxy");
          assert.equal(err.correlationId, null);
          assert.equal(err.details, null);
          return true;
        }
      );

      // 3. Array JSON payload on failure
      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        json: async () => ["not", "an", "object"],
      });

      await assert.rejects(
        () => generateCareerAssessment(),
        (err) => {
          assert.equal(err.status, 500);
          assert.equal(err.code, CAREER_STRATEGIST_ERROR_CODES.INTERNAL_SERVER_ERROR);
          assert.equal(err.correlationId, null);
          return true;
        }
      );
    });
  });
});
