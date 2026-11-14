/**
 * @file listingsRecommendations.test.js
 * @description Unit and integration test suite for GET /api/listings/recommendations.
 *
 * Stage 2 — Milestone 2: Authenticated Recommendation API.
 *
 * Execution: Strictly OFFLINE / Synthetic data and mock models only.
 * Zero database migrations, zero external network calls.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("events");

const {
  createListingsController,
  sortRecommendations,
} = require("../../src/controller/listings.controller");
const listingsRoutes = require("../../src/routes/listings.routes");
const { TIERS } = require("../../src/utils/jobMatchingEngine");

// ----------------------------------------------------------------------------
// TEST HELPERS & MOCKS
// ----------------------------------------------------------------------------

function createMockReqRes({
  userId = "user-uuid-100",
  body = {},
  query = {},
  headers = {},
  includeUser = true,
} = {}) {
  const req = new EventEmitter();
  Object.assign(req, {
    user: includeUser && userId ? { userId } : undefined,
    body,
    query,
    headers: {
      authorization: includeUser ? "Bearer test-jwt-token" : undefined,
      ...headers,
    },
  });

  const res = new EventEmitter();
  Object.assign(res, {
    statusCode: 200,
    body: null,
    statusCalled: false,
    jsonCalled: false,
    status(code) {
      this.statusCalled = true;
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonCalled = true;
      this.body = data;
      return this;
    },
  });

  return { req, res };
}

function createSampleListings() {
  return [
    {
      id: "job-1",
      title: "Senior Frontend Engineer",
      company: "Atlassian",
      location: "Bangalore",
      job_type: "fulltime",
      work_mode: "hybrid",
      experience_level: "senior",
      compensation_min: 2500000,
      compensation_max: 3200000,
      compensation_period: "yearly",
      compensation_currency: "INR",
      posted_date: "2026-09-15T00:00:00.000Z",
      description: "Build scalable web UI.",
      requirements: ["Experience with React and TypeScript"],
      tags: ["react", "typescript"],
      link: "https://example.com/job-1",
      created_at: "2026-09-15T00:00:00.000Z",
    },
    {
      id: "job-2",
      title: "Backend Engineer",
      company: "Razorpay",
      location: "Bangalore",
      job_type: "fulltime",
      work_mode: "hybrid",
      experience_level: "mid",
      compensation_min: 1600000,
      compensation_max: 2000000,
      compensation_period: "yearly",
      compensation_currency: "INR",
      posted_date: "2026-09-10T00:00:00.000Z",
      description: "Design payment APIs.",
      requirements: ["Experience with Node.js and PostgreSQL"],
      tags: ["nodejs", "postgresql"],
      link: "https://example.com/job-2",
      created_at: "2026-09-10T00:00:00.000Z",
    },
    {
      id: "job-3",
      title: "DevOps Engineer",
      company: "Zoho",
      location: "Chennai",
      job_type: "fulltime",
      work_mode: "onsite",
      experience_level: "senior",
      compensation_min: 1800000,
      compensation_max: 2400000,
      compensation_period: "yearly",
      compensation_currency: "INR",
      posted_date: "2026-08-15T00:00:00.000Z",
      description: "Manage AWS and Kubernetes.",
      requirements: ["Docker and Kubernetes"],
      tags: ["docker", "kubernetes", "aws"],
      link: "https://example.com/job-3",
      created_at: "2026-08-15T00:00:00.000Z",
    },
    {
      id: "job-4",
      title: "Full Stack Developer",
      company: "Innovaccer",
      location: "Remote",
      job_type: "fulltime",
      work_mode: "remote",
      experience_level: "mid",
      compensation_min: 1400000,
      compensation_max: 1800000,
      compensation_period: "yearly",
      compensation_currency: "INR",
      posted_date: "2026-08-20T00:00:00.000Z",
      description: "Build healthcare apps.",
      requirements: ["React and Node.js"],
      tags: ["react", "nodejs"],
      link: "https://example.com/job-4",
      created_at: "2026-08-20T00:00:00.000Z",
    },
  ];
}

// ----------------------------------------------------------------------------
// TEST SUITE
// ----------------------------------------------------------------------------

describe("Listings Recommendation API (GET /api/listings/recommendations)", () => {
  describe("1. Authentication and Authorization", () => {
    it("rejects unauthenticated request when req.user is missing with HTTP 401", async () => {
      const controller = createListingsController({
        listingsModel: { getListings: async () => [] },
        profileModel: { getProfileByUserId: async () => ({}) },
      });

      const { req, res } = createMockReqRes({ includeUser: false });
      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.message, "Authentication required");
    });

    it("rejects request when req.user.userId is missing or empty with HTTP 401", async () => {
      const controller = createListingsController({
        listingsModel: { getListings: async () => [] },
        profileModel: { getProfileByUserId: async () => ({}) },
      });

      const { req, res } = createMockReqRes({ userId: null });
      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.message, "Authentication required");
    });

    it("derives identity strictly from req.user.userId, ignoring query parameters and body overrides", async () => {
      let queriedUserId = null;
      const controller = createListingsController({
        listingsModel: { getListings: async () => [] },
        profileModel: {
          getProfileByUserId: async (id) => {
            queriedUserId = id;
            return {
              skills: ["React"],
              headline: "Frontend Dev",
            };
          },
        },
      });

      const { req, res } = createMockReqRes({
        userId: "trusted-jwt-user-id",
        query: { userId: "malicious-query-spoof-id" },
        body: { userId: "malicious-body-spoof-id", user_id: "malicious-body-spoof-id-2" },
      });

      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(queriedUserId, "trusted-jwt-user-id");
    });
  });

  describe("2. Empty & Missing Profiles (Onboarding Baseline)", () => {
    it("returns ONBOARDING_BASELINE when profile record is missing (null)", async () => {
      const sampleListings = createSampleListings();
      const controller = createListingsController({
        listingsModel: { getListings: async () => sampleListings },
        profileModel: { getProfileByUserId: async () => null },
      });

      const { req, res } = createMockReqRes();
      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.profileState, "ONBOARDING_BASELINE");
      assert.strictEqual(res.body.candidateEvidenceCoverage, 0);
      assert.strictEqual(res.body.summary.totalRecommended, 0);
      assert.strictEqual(res.body.summary.onboardingCount, sampleListings.length);
      assert.strictEqual(res.body.recommendations.excellent.length, 0);
      assert.strictEqual(res.body.recommendations.good.length, 0);
      assert.strictEqual(res.body.recommendations.potential.length, 0);

      // Onboarding listings are returned sorted by newest first with score = 0
      assert.strictEqual(res.body.recommendations.onboarding.length, sampleListings.length);
      assert.strictEqual(res.body.recommendations.onboarding[0].score, 0);
      assert.strictEqual(res.body.recommendations.onboarding[0].rawScore, 0);
      assert.strictEqual(res.body.recommendations.onboarding[0].tier, "ONBOARDING_BASELINE");
      // Newest listing was 2026-09-15 (job-1)
      assert.strictEqual(res.body.recommendations.onboarding[0].id, "job-1");
    });

    it("returns ONBOARDING_BASELINE when profile has empty skills, experience, and headline", async () => {
      const sampleListings = createSampleListings();
      const controller = createListingsController({
        listingsModel: { getListings: async () => sampleListings },
        profileModel: {
          getProfileByUserId: async () => ({
            skills: [],
            experience: [],
            headline: "",
            location: "",
          }),
        },
      });

      const { req, res } = createMockReqRes();
      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.profileState, "ONBOARDING_BASELINE");
      assert.strictEqual(res.body.candidateEvidenceCoverage, 0);
      assert.strictEqual(res.body.summary.totalRecommended, 0);
      assert.strictEqual(res.body.recommendations.onboarding.length, sampleListings.length);
    });
  });

  describe("3. Evaluated Profiles & Recommendation Buckets", () => {
    it("correctly buckets and ranks listings for an evaluated candidate", async () => {
      const sampleListings = createSampleListings();
      const mockProfile = {
        headline: "Frontend Developer",
        skills: ["React", "JavaScript", "TypeScript"],
        experience: [
          {
            title: "Frontend Engineer",
            startDate: "2018-01-01",
            endDate: "2024-01-01", // 6 yrs -> senior
          },
        ],
        location: "Bangalore",
      };

      const controller = createListingsController({
        listingsModel: { getListings: async () => sampleListings },
        profileModel: { getProfileByUserId: async () => mockProfile },
      });

      const { req, res } = createMockReqRes();
      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.profileState, "EVALUATED");
      assert.strictEqual(res.body.candidateEvidenceCoverage, 1.0); // all 4 dimensions populated

      // job-1: Senior Frontend Engineer in Bangalore with React/TypeScript -> EXCELLENT
      const excellentMatches = res.body.recommendations.excellent;
      assert.ok(excellentMatches.length >= 1);
      assert.strictEqual(excellentMatches[0].id, "job-1");
      assert.strictEqual(excellentMatches[0].score, 100);
      assert.strictEqual(excellentMatches[0].tier, TIERS.EXCELLENT);
      assert.ok(excellentMatches[0].matchExplanation);
      assert.deepStrictEqual(excellentMatches[0].matchExplanation.matchedSkills.sort(), ["react", "typescript"]);

      // Total recommended equals sum of buckets
      assert.strictEqual(
        res.body.summary.totalRecommended,
        res.body.summary.excellentCount + res.body.summary.goodCount + res.body.summary.potentialCount
      );
    });

    it("evaluates partially populated profile (skills only) without penalty on unevaluated dimensions", async () => {
      const sampleListings = createSampleListings();
      const mockProfile = {
        skills: ["Node.js", "PostgreSQL"],
        // no experience, no headline, no location
      };

      const controller = createListingsController({
        listingsModel: { getListings: async () => sampleListings },
        profileModel: { getProfileByUserId: async () => mockProfile },
      });

      const { req, res } = createMockReqRes();
      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.profileState, "EVALUATED");
      assert.strictEqual(res.body.candidateEvidenceCoverage, 0.50); // only skills = 50 pts

      // job-2 requires Node.js and PostgreSQL -> matches 100% of skills
      const goodMatches = res.body.recommendations.good;
      const job2Match = goodMatches.find((j) => j.id === "job-2");
      assert.ok(job2Match);
      assert.strictEqual(job2Match.score, 50);
      assert.strictEqual(job2Match.tier, TIERS.GOOD);
      assert.strictEqual(job2Match.evaluatedFit, 1.0);
    });
  });

  describe("4. Strict Remote-Location Invariance Through API", () => {
    const remoteListingOnly = [
      {
        id: "job-remote",
        title: "Full Stack Developer",
        company: "Remote Co",
        location: "Remote",
        job_type: "fulltime",
        work_mode: "remote",
        experience_level: "mid",
        posted_date: "2026-09-01T00:00:00.000Z",
        requirements: ["React and Node.js"],
        tags: ["react", "nodejs"],
      },
    ];

    it("ensures candidates with and without location receive identical scores and tiers for remote listings", async () => {
      const baseProfile = {
        headline: "Full Stack Developer",
        skills: ["React", "Node.js"],
        experience: [{ startDate: "2021-01-01", endDate: "2024-01-01" }], // 3 yrs mid
      };

      const candWithLoc = { ...baseProfile, location: "Bangalore, India" };
      const candWithoutLoc = { ...baseProfile, location: "" };

      let currentProfile = candWithLoc;
      const controller = createListingsController({
        listingsModel: { getListings: async () => remoteListingOnly },
        profileModel: { getProfileByUserId: async () => currentProfile },
      });

      // Request 1: Candidate with location
      const res1 = createMockReqRes().res;
      await controller.getRecommendations(createMockReqRes().req, res1);

      // Request 2: Candidate without location
      currentProfile = candWithoutLoc;
      const res2 = createMockReqRes().res;
      await controller.getRecommendations(createMockReqRes().req, res2);

      const match1 = res1.body.recommendations.excellent[0] || res1.body.recommendations.good[0];
      const match2 = res2.body.recommendations.excellent[0] || res2.body.recommendations.good[0];

      assert.ok(match1);
      assert.ok(match2);
      assert.strictEqual(match1.score, match2.score);
      assert.strictEqual(match1.rawScore, match2.rawScore);
      assert.strictEqual(match1.tier, match2.tier);
      assert.strictEqual(match1.matchExplanation.locationFit, "REMOTE_EXCLUDED");
      assert.strictEqual(match2.matchExplanation.locationFit, "REMOTE_EXCLUDED");
    });
  });

  describe("5. Deterministic Sorting & Tie-Breaking", () => {
    it("sorts by unrounded raw score descending, breaking ties by date and ID", () => {
      const items = [
        // Both item A and B round to score 85, but B has higher rawScore (85.4 vs 85.1)
        { id: "job-A", rawScore: 85.1, score: 85, postedDate: "2026-09-01T00:00:00.000Z" },
        { id: "job-B", rawScore: 85.4, score: 85, postedDate: "2026-09-01T00:00:00.000Z" },
        // Items C and D have identical rawScore (70.0), C is newer than D
        { id: "job-D", rawScore: 70.0, score: 70, postedDate: "2026-08-01T00:00:00.000Z" },
        { id: "job-C", rawScore: 70.0, score: 70, postedDate: "2026-08-15T00:00:00.000Z" },
        // Items E and F have identical rawScore and date, tie broken by ID ascending (E before F)
        { id: "job-F", rawScore: 60.0, score: 60, postedDate: "2026-07-01T00:00:00.000Z" },
        { id: "job-E", rawScore: 60.0, score: 60, postedDate: "2026-07-01T00:00:00.000Z" },
      ];

      items.sort(sortRecommendations);

      assert.strictEqual(items[0].id, "job-B"); // rawScore 85.4 > 85.1
      assert.strictEqual(items[1].id, "job-A"); // rawScore 85.1
      assert.strictEqual(items[2].id, "job-C"); // newer date 2026-08-15 > 2026-08-01
      assert.strictEqual(items[3].id, "job-D");
      assert.strictEqual(items[4].id, "job-E"); // ID 'job-E' < 'job-F'
      assert.strictEqual(items[5].id, "job-F");
    });
  });

  describe("6. Empty Listings & Edge Case Handling", () => {
    it("handles zero listings available gracefully with HTTP 200", async () => {
      const controller = createListingsController({
        listingsModel: { getListings: async () => [] },
        profileModel: {
          getProfileByUserId: async () => ({
            skills: ["React"],
          }),
        },
      });

      const { req, res } = createMockReqRes();
      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.summary.totalRecommended, 0);
      assert.strictEqual(res.body.summary.totalEvaluated, 0);
      assert.deepStrictEqual(res.body.recommendations.excellent, []);
      assert.deepStrictEqual(res.body.recommendations.good, []);
      assert.deepStrictEqual(res.body.recommendations.potential, []);
    });

    it("handles listings with missing optional metadata without throwing errors", async () => {
      const sparseListings = [
        {
          id: "sparse-1",
          title: "Programmer",
          // missing requirements, tags, location, seniority
        },
      ];

      const controller = createListingsController({
        listingsModel: { getListings: async () => sparseListings },
        profileModel: {
          getProfileByUserId: async () => ({
            skills: ["React"],
            headline: "Programmer",
          }),
        },
      });

      const { req, res } = createMockReqRes();
      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
    });
  });

  describe("7. Error Handling & Database Failure", () => {
    it("returns HTTP 500 when profileModel.getProfileByUserId throws an error", async () => {
      const controller = createListingsController({
        listingsModel: { getListings: async () => [] },
        profileModel: {
          getProfileByUserId: async () => {
            throw new Error("PostgreSQL connection lost");
          },
        },
      });

      const { req, res } = createMockReqRes();
      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.message, "Server error");
    });

    it("returns HTTP 500 when listingsModel.getListings throws an error", async () => {
      const controller = createListingsController({
        listingsModel: {
          getListings: async () => {
            throw new Error("Timeout querying job_listings");
          },
        },
        profileModel: { getProfileByUserId: async () => ({}) },
      });

      const { req, res } = createMockReqRes();
      await controller.getRecommendations(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.message, "Server error");
    });
  });

  describe("8. Route Registration & Existing Endpoint Regression", () => {
    it("verifies listings router registers /recommendations, /locations, /tags, and /", () => {
      const routes = listingsRoutes.stack
        .filter((layer) => layer.route)
        .map((layer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const paths = routes.map((r) => r.path);
      assert.ok(paths.includes("/recommendations"), "Router must include /recommendations");
      assert.ok(paths.includes("/locations"), "Router must include /locations");
      assert.ok(paths.includes("/tags"), "Router must include /tags");
      assert.ok(paths.includes("/"), "Router must include /");
    });

    it("preserves GET /api/listings behavior without regression", async () => {
      const sampleListings = createSampleListings();
      const controller = createListingsController({
        listingsModel: { getListings: async () => sampleListings },
      });

      const { req, res } = createMockReqRes();
      await controller.getJobListings(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.message, "Listings fetched successfully");
      assert.strictEqual(res.body.listings.length, sampleListings.length);
      assert.strictEqual(res.body.listings[0].company, "Atlassian");
    });

    it("preserves GET /api/listings/locations behavior without regression", async () => {
      const controller = createListingsController({
        listingsModel: { getDistinctLocations: async () => ["Bangalore", "Chennai"] },
      });

      const { req, res } = createMockReqRes();
      await controller.getLocations(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.body.locations, ["Bangalore", "Chennai"]);
    });

    it("preserves GET /api/listings/tags behavior without regression", async () => {
      const controller = createListingsController({
        listingsModel: { getDistinctTags: async () => ["react", "nodejs"] },
      });

      const { req, res } = createMockReqRes();
      await controller.getTags(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.body.tags, ["react", "nodejs"]);
    });
  });
});
