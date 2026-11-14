/**
 * @file jobMatchingEngine.test.js
 * @description Comprehensive test suite for deterministic job recommendation & matching engine.
 *
 * Verifies mathematical formulas, directional transferable skill mechanics,
 * seniority matrix, role disambiguation, strict remote invariance, tier boundaries,
 * and batch ranking.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  scoreListing,
  matchBatch,
  determineTier,
  normalizeRole,
  normalizeLocation,
  normalizeListingSeniority,
  TIERS,
  DIMENSION_WEIGHTS,
} = require("../../src/utils/jobMatchingEngine");

describe("Job Matching Engine", () => {
  const FIXED_REF_DATE = new Date("2025-06-01T00:00:00.000Z");

  // -------------------------------------------------------------------------
  // 1. Skill Matching & Transferability
  // -------------------------------------------------------------------------
  describe("Skills Dimension", () => {
    it("awards 100% of skill points (50 pts) when all listing skills match directly", () => {
      const candidate = {
        skills: ["React", "Node.js", "PostgreSQL"],
      };
      const listing = {
        title: "Developer",
        skills: ["React", "Node.js"],
      };

      const result = scoreListing(candidate, listing);
      assert.strictEqual(result.breakdown.skills.earned, 50);
      assert.deepStrictEqual(result.breakdown.skills.matchedSkills.sort(), ["node.js", "react"]);
      assert.strictEqual(result.breakdown.skills.transferableMatches.length, 0);
      assert.strictEqual(result.breakdown.skills.missingSkills.length, 0);
    });

    it("awards 0.75 credit for directional transferable skills", () => {
      // TypeScript satisfies JavaScript requirement with 0.75 credit
      const candidate = {
        skills: ["TypeScript"],
      };
      const listing = {
        title: "Web Developer",
        skills: ["JavaScript"],
      };

      const result = scoreListing(candidate, listing);
      // 50 * (0.75 / 1) = 37.5 pts
      assert.strictEqual(result.breakdown.skills.earned, 37.5);
      assert.strictEqual(result.breakdown.skills.transferableMatches.length, 1);
      assert.strictEqual(result.breakdown.skills.transferableMatches[0].transferableFrom, "typescript");
      assert.strictEqual(result.breakdown.skills.transferableMatches[0].requiredSkill, "javascript");
    });

    it("strictly rejects reverse transferable skill matches", () => {
      // Having JavaScript does NOT transfer to TypeScript requirement
      const candidate = {
        skills: ["JavaScript"],
      };
      const listing = {
        title: "Web Developer",
        skills: ["TypeScript"],
      };

      const result = scoreListing(candidate, listing);
      assert.strictEqual(result.breakdown.skills.earned, 0);
      assert.strictEqual(result.breakdown.skills.transferableMatches.length, 0);
      assert.deepStrictEqual(result.breakdown.skills.missingSkills, ["typescript"]);
    });

    it("does not stack multiple transferable skills for the same requirement", () => {
      // Candidate has both PostgreSQL and MySQL, listing requires SQL
      // Credit must be exactly 0.75, not 1.50
      const candidate = {
        skills: ["PostgreSQL", "MySQL"],
      };
      const listing = {
        title: "Database Admin",
        skills: ["SQL"],
      };

      const result = scoreListing(candidate, listing);
      assert.strictEqual(result.breakdown.skills.earned, 37.5); // 50 * 0.75
      assert.strictEqual(result.breakdown.skills.transferableMatches.length, 1);
    });

    it("prioritizes direct match (1.0) over transferable match (0.75) without double-counting", () => {
      // Candidate has SQL and PostgreSQL, listing requires SQL
      const candidate = {
        skills: ["SQL", "PostgreSQL"],
      };
      const listing = {
        title: "Database Admin",
        skills: ["SQL"],
      };

      const result = scoreListing(candidate, listing);
      assert.strictEqual(result.breakdown.skills.earned, 50); // 1.0 credit = 50 pts
      assert.strictEqual(result.breakdown.skills.transferableMatches.length, 0);
      assert.deepStrictEqual(result.breakdown.skills.matchedSkills, ["sql"]);
    });

    it("handles duplicates in listing or candidate gracefully without score inflation", () => {
      const candidate = {
        skills: ["React", "react.js", "React"],
      };
      const listing = {
        title: "Frontend Engineer",
        tags: ["React", "reactjs"],
      };

      const result = scoreListing(candidate, listing);
      // Both normalize to canonical 'react'. Listing has 1 distinct canonical skill.
      assert.strictEqual(result.breakdown.skills.earned, 50);
      assert.strictEqual(result.breakdown.skills.matchedSkills.length, 1);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Seniority Compatibility Matrix
  // -------------------------------------------------------------------------
  describe("Seniority Dimension & Matrix", () => {
    const entryCand = {
      experience: [{ startDate: "2024-01-01", endDate: "2024-11-01" }], // 10 mos = 0.8 yr -> entry
    };
    const midCand = {
      experience: [{ startDate: "2021-01-01", endDate: "2024-01-01" }], // 3 yrs -> mid
    };
    const seniorCand = {
      experience: [{ startDate: "2018-01-01", endDate: "2024-01-01" }], // 6 yrs -> senior
    };

    const entryList = { title: "Dev", seniorityLevel: "Entry" };
    const midList = { title: "Dev", seniorityLevel: "Mid-level" };
    const seniorList = { title: "Dev", seniorityLevel: "Senior" };

    it("evaluates Entry candidate across Entry, Mid, and Senior listings", () => {
      assert.strictEqual(scoreListing(entryCand, entryList).breakdown.seniority.earned, 25);
      assert.strictEqual(scoreListing(entryCand, midList).breakdown.seniority.earned, 10);
      assert.strictEqual(scoreListing(entryCand, seniorList).breakdown.seniority.earned, 0);
    });

    it("evaluates Mid candidate across Entry, Mid, and Senior listings", () => {
      assert.strictEqual(scoreListing(midCand, entryList).breakdown.seniority.earned, 15);
      assert.strictEqual(scoreListing(midCand, midList).breakdown.seniority.earned, 25);
      assert.strictEqual(scoreListing(midCand, seniorList).breakdown.seniority.earned, 15);
    });

    it("evaluates Senior candidate across Entry, Mid, and Senior listings", () => {
      assert.strictEqual(scoreListing(seniorCand, entryList).breakdown.seniority.earned, 10);
      assert.strictEqual(scoreListing(seniorCand, midList).breakdown.seniority.earned, 20);
      assert.strictEqual(scoreListing(seniorCand, seniorList).breakdown.seniority.earned, 25);
    });

    it("derives seniority correctly for candidates with valid 0 YOE (fresher)", () => {
      const fresherCand = {
        experience: [{ startDate: "2024-01-05", endDate: "2024-01-20" }], // 0 months
      };
      const result = scoreListing(fresherCand, entryList);
      assert.strictEqual(result.breakdown.seniority.candidateLevel, "entry");
      assert.strictEqual(result.breakdown.seniority.earned, 25);
      assert.strictEqual(result.breakdown.seniority.evaluated, true);
    });

    it("omits seniority dimension when candidate has no valid work history", () => {
      const noHistoryCand = { experience: [] };
      const result = scoreListing(noHistoryCand, entryList);
      assert.strictEqual(result.breakdown.seniority.evaluated, false);
      assert.strictEqual(result.evidence.evaluatedDimensions.includes("seniority"), false);
    });

    it("omits seniority dimension when listing specifies no seniority or min YOE", () => {
      const unspecList = { title: "Engineer" };
      const result = scoreListing(midCand, unspecList);
      assert.strictEqual(result.breakdown.seniority.evaluated, false);
      assert.strictEqual(result.evidence.evaluatedDimensions.includes("seniority"), false);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Title Alignment & Disambiguation
  // -------------------------------------------------------------------------
  describe("Title Alignment Dimension", () => {
    it("awards 20 pts for direct canonical role matches", () => {
      const candidate = { headline: "Frontend Developer" };
      const listing = { title: "Senior Front-End Engineer" };

      const result = scoreListing(candidate, listing);
      assert.strictEqual(result.breakdown.title.earned, 20);
      assert.strictEqual(result.breakdown.title.matchType, "DIRECT");
    });

    it("awards 12 pts for curated adjacent role matches", () => {
      const candidate = { headline: "Full Stack Developer" };
      const listing = { title: "Backend Engineer" };

      const result = scoreListing(candidate, listing);
      assert.strictEqual(result.breakdown.title.earned, 12);
      assert.strictEqual(result.breakdown.title.matchType, "ADJACENT");
    });

    it("strictly prevents false positive direct match between Data Scientist and Data Analyst", () => {
      const candidate = { headline: "Data Scientist" };
      const listing = { title: "Data Analyst" };

      const result = scoreListing(candidate, listing);
      // Data Scientist vs Data Analyst are distinct composite roles, mapped as ADJACENT (12 pts), NOT DIRECT (20 pts)
      assert.notStrictEqual(result.breakdown.title.matchType, "DIRECT");
      assert.strictEqual(result.breakdown.title.matchType, "ADJACENT");
      assert.strictEqual(result.breakdown.title.earned, 12);
    });

    it("scores 0 pts for non-adjacent distinct data roles (e.g. Data Scientist vs Data Engineer)", () => {
      const candidate = { headline: "Data Scientist" };
      const listing = { title: "Data Engineer" };

      const result = scoreListing(candidate, listing);
      assert.strictEqual(result.breakdown.title.matchType, "NONE");
      assert.strictEqual(result.breakdown.title.earned, 0);
    });

    it("rejects generic token overlap alone (e.g. 'Engineer' or 'Developer')", () => {
      const candidate = { headline: "Mechanical Engineer" };
      const listing = { title: "Software Engineer" };

      const result = scoreListing(candidate, listing);
      assert.strictEqual(result.breakdown.title.matchType, "NONE");
      assert.strictEqual(result.breakdown.title.earned, 0);
    });

    it("checks targetRoles and experience job titles if headline is absent", () => {
      const candidate = {
        targetRoles: ["DevOps Engineer"],
        experience: [{ title: "Site Reliability Engineer", startDate: "2023-01-01", endDate: "2024-01-01" }],
      };
      const listing = { title: "Site Reliability Engineer" };

      const result = scoreListing(candidate, listing);
      assert.strictEqual(result.breakdown.title.earned, 20);
      assert.strictEqual(result.breakdown.title.matchType, "DIRECT");
    });
  });

  // -------------------------------------------------------------------------
  // 4. Strict Remote Invariance & Location Scoring
  // -------------------------------------------------------------------------
  describe("Location Dimension & Strict Remote Invariance", () => {
    const remoteListing = {
      title: "Full Stack Developer",
      skills: ["React", "Node.js"],
      seniorityLevel: "Mid",
      workplaceType: "remote",
    };

    const candWithLocation = {
      headline: "Full Stack Developer",
      skills: ["React", "Node.js"],
      experience: [{ startDate: "2021-01-01", endDate: "2024-01-01" }], // 3 yrs mid
      location: "San Francisco, CA",
    };

    const candWithoutLocation = {
      headline: "Full Stack Developer",
      skills: ["React", "Node.js"],
      experience: [{ startDate: "2021-01-01", endDate: "2024-01-01" }], // 3 yrs mid
      // location intentionally omitted
    };

    it("guarantees mathematical invariance for Remote listings regardless of candidate location presence", () => {
      const resultWith = scoreListing(candWithLocation, remoteListing);
      const resultWithout = scoreListing(candWithoutLocation, remoteListing);

      // Both candidates must have identical score, evaluated dimensions, and breakdown
      assert.strictEqual(resultWith.score, resultWithout.score);
      assert.strictEqual(resultWith.rawScore, resultWithout.rawScore);
      assert.strictEqual(resultWith.evaluatedFit, resultWithout.evaluatedFit);
      assert.strictEqual(resultWith.tier, resultWithout.tier);

      // Location must NOT be in evaluated dimensions for either candidate
      assert.strictEqual(resultWith.evidence.evaluatedDimensions.includes("location"), false);
      assert.strictEqual(resultWithout.evidence.evaluatedDimensions.includes("location"), false);
      assert.strictEqual(resultWith.breakdown.location.matchType, "REMOTE_EXCLUDED");
      assert.strictEqual(resultWithout.breakdown.location.matchType, "REMOTE_EXCLUDED");

      // Verify exact values:
      // Evaluated dimensions: skills (50), seniority (25), title (20) = W_eval = 95
      // E_list = 95 / 100 = 0.95
      // C_applicable = 95 / 95 = 1.0
      // P_earned = 50 + 25 + 20 = 95
      // F_eval = 95 / 95 = 1.0
      // S_raw = 1.0 * min(1.0, 0.95) * 100 = 95.0
      // S_verified = 95
      assert.strictEqual(resultWith.score, 95);
      assert.strictEqual(resultWithout.score, 95);
      assert.strictEqual(resultWith.evidence.listingEvaluability, 0.95);
      assert.strictEqual(resultWith.evidence.applicableCoverage, 1.0);
    });

    it("evaluates Onsite / Hybrid location compatibility using metropolitan aliases", () => {
      const onsiteListing = {
        title: "Software Engineer",
        skills: ["React"],
        seniorityLevel: "Mid",
        workplaceType: "onsite",
        location: "Bengaluru, Karnataka",
      };

      const candBangalore = {
        skills: ["React"],
        location: "Bangalore, India",
      };

      const result = scoreListing(candBangalore, onsiteListing);
      assert.strictEqual(result.breakdown.location.evaluated, true);
      assert.strictEqual(result.breakdown.location.earned, 5);
      assert.strictEqual(result.breakdown.location.matchType, "MATCH");
    });

    it("scores 0 pts for location mismatch on Onsite listings", () => {
      const onsiteListing = {
        title: "Software Engineer",
        skills: ["React"],
        workplaceType: "onsite",
        location: "London, UK",
      };

      const candBangalore = {
        skills: ["React"],
        location: "Bangalore, India",
      };

      const result = scoreListing(candBangalore, onsiteListing);
      assert.strictEqual(result.breakdown.location.evaluated, true);
      assert.strictEqual(result.breakdown.location.earned, 0);
      assert.strictEqual(result.breakdown.location.matchType, "MISMATCH");
    });
  });

  // -------------------------------------------------------------------------
  // 5. Incomplete Profile & Sparse Evidence Handling
  // -------------------------------------------------------------------------
  describe("Incomplete Profiles & Evidence Boundaries", () => {
    const listing = {
      title: "Backend Engineer",
      skills: ["Node.js", "PostgreSQL"],
      seniorityLevel: "Mid",
      location: "Bengaluru",
      workplaceType: "onsite",
    };

    it("assigns ONBOARDING_BASELINE when candidate profile has zero usable evidence", () => {
      const emptyProfile = {};
      const result = scoreListing(emptyProfile, listing);

      assert.strictEqual(result.tier, TIERS.ONBOARDING_BASELINE);
      assert.strictEqual(result.score, 0);
      assert.strictEqual(result.evidence.candidateCoverage, 0);
      assert.strictEqual(result.evidence.evaluatedDimensions.length, 0);
    });

    it("evaluates single-dimension candidate (skills only) without penalizing unevaluated dimensions with 0", () => {
      const skillsOnlyCand = {
        skills: ["Node.js", "PostgreSQL"],
      };

      const result = scoreListing(skillsOnlyCand, listing);
      // Evaluated dimensions: only skills (50)
      assert.deepStrictEqual(result.evidence.evaluatedDimensions, ["skills"]);
      assert.strictEqual(result.breakdown.skills.earned, 50);
      assert.strictEqual(result.evaluatedFit, 1.0); // 50 / 50 = 1.0
      // C_applicable = 50 / 100 = 0.50
      assert.strictEqual(result.evidence.applicableCoverage, 0.50);
      // S_raw = 1.0 * min(0.50, 1.0) * 100 = 50.0
      assert.strictEqual(result.score, 50);
      assert.strictEqual(result.tier, TIERS.GOOD);
    });

    it("assigns POTENTIAL_PARTIAL_EVIDENCE to high-fit candidate with sparse profile below tier thresholds", () => {
      // Candidate with only title alignment against 4-dimension listing
      // W_eval = 20, W_list = 100 -> C_applicable = 0.20 < 0.50
      // P_earned = 20, F_eval = 1.0 >= 0.60
      // S_raw = 1.0 * 0.20 * 100 = 20.0 (< 25)
      const titleOnlyCand = {
        headline: "Backend Engineer",
      };

      const result = scoreListing(titleOnlyCand, listing);
      assert.strictEqual(result.score, 20);
      assert.strictEqual(result.evaluatedFit, 1.0);
      assert.strictEqual(result.tier, TIERS.POTENTIAL_PARTIAL_EVIDENCE);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Tier Boundaries & Mathematical Thresholds
  // -------------------------------------------------------------------------
  describe("Tier Boundaries", () => {
    it("correctly evaluates EXCELLENT boundary (sRaw >= 75, coverage >= 0.70, fEval >= 0.80)", () => {
      const tier1 = determineTier({
        cGlobal: 0.80,
        cApplicable: 0.75,
        eList: 0.95,
        fEval: 0.85,
        sRaw: 75.0,
      });
      assert.strictEqual(tier1, TIERS.EXCELLENT);

      // Just below sRaw boundary (74.9) falls back to GOOD
      const tier2 = determineTier({
        cGlobal: 0.80,
        cApplicable: 0.75,
        eList: 0.95,
        fEval: 0.85,
        sRaw: 74.9,
      });
      assert.strictEqual(tier2, TIERS.GOOD);

      // High score (78.0) but low fEval (0.78 < 0.80) falls back to GOOD
      const tier3 = determineTier({
        cGlobal: 0.95,
        cApplicable: 0.95,
        eList: 0.95,
        fEval: 0.78,
        sRaw: 78.0,
      });
      assert.strictEqual(tier3, TIERS.GOOD);
    });

    it("correctly evaluates GOOD boundary (sRaw >= 50, coverage >= 0.50, fEval >= 0.65)", () => {
      const tier1 = determineTier({
        cGlobal: 0.60,
        cApplicable: 0.55,
        eList: 0.95,
        fEval: 0.70,
        sRaw: 50.0,
      });
      assert.strictEqual(tier1, TIERS.GOOD);

      // 49.9 falls back to POTENTIAL
      const tier2 = determineTier({
        cGlobal: 0.60,
        cApplicable: 0.55,
        eList: 0.95,
        fEval: 0.70,
        sRaw: 49.9,
      });
      assert.strictEqual(tier2, TIERS.POTENTIAL);
    });

    it("correctly evaluates POTENTIAL boundary (sRaw >= 25)", () => {
      const tier1 = determineTier({
        cGlobal: 0.50,
        cApplicable: 0.50,
        eList: 0.95,
        fEval: 0.50,
        sRaw: 25.0,
      });
      assert.strictEqual(tier1, TIERS.POTENTIAL);

      // Below 25 with low fEval (< 0.60) is EXCLUDED
      const tier2 = determineTier({
        cGlobal: 0.50,
        cApplicable: 0.50,
        eList: 0.95,
        fEval: 0.40,
        sRaw: 20.0,
      });
      assert.strictEqual(tier2, TIERS.EXCLUDED);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Batch Ranking & Sorting
  // -------------------------------------------------------------------------
  describe("Batch Ranking (matchBatch)", () => {
    it("ranks listings by score descending and breaks ties deterministically", () => {
      const candidate = {
        headline: "Frontend Developer",
        skills: ["React", "JavaScript", "HTML", "CSS"],
        experience: [{ startDate: "2021-01-01", endDate: "2024-01-01" }], // 3 yrs mid
        location: "Bengaluru",
      };

      const listings = [
        {
          id: "job-1",
          title: "DevOps Engineer",
          skills: ["Kubernetes", "AWS"],
          seniorityLevel: "Senior",
          location: "Bengaluru",
          workplaceType: "onsite",
        },
        {
          id: "job-2",
          title: "Frontend Developer",
          skills: ["React", "JavaScript"],
          seniorityLevel: "Mid",
          location: "Bengaluru",
          workplaceType: "onsite",
        },
        {
          id: "job-3",
          title: "Full Stack Developer",
          skills: ["React", "Node.js"],
          seniorityLevel: "Mid",
          location: "Bengaluru",
          workplaceType: "onsite",
        },
      ];

      const ranked = matchBatch(candidate, listings);
      assert.strictEqual(ranked.length, 3);
      // job-2 has direct title, 100% skill match, direct seniority, matching location -> highest score
      assert.strictEqual(ranked[0].listing.id, "job-2");
      assert.strictEqual(ranked[0].match.score, 100);
      assert.strictEqual(ranked[0].match.tier, TIERS.EXCELLENT);

      // job-3 has adjacent title (12 pts) and 50% skill match (25 pts) -> mid score
      assert.strictEqual(ranked[1].listing.id, "job-3");

      // job-1 has no skills and no title match -> lowest score
      assert.strictEqual(ranked[2].listing.id, "job-1");
    });

    it("returns empty array for non-array listings input", () => {
      assert.deepStrictEqual(matchBatch({}, null), []);
      assert.deepStrictEqual(matchBatch({}, undefined), []);
    });
  });

  // -------------------------------------------------------------------------
  // 8. Normalization Helpers
  // -------------------------------------------------------------------------
  describe("Normalization Helpers", () => {
    it("normalizeRole maps composite titles to canonical identifiers", () => {
      assert.strictEqual(normalizeRole("Data Scientist II"), "data_scientist");
      assert.strictEqual(normalizeRole("Senior Data Analyst"), "data_analyst");
      assert.strictEqual(normalizeRole("Lead Data Engineer"), "data_engineer");
      assert.strictEqual(normalizeRole("Staff Frontend Engineer"), "frontend_developer");
      assert.strictEqual(normalizeRole("Backend Developer"), "backend_developer");
      assert.strictEqual(normalizeRole("SRE"), "site_reliability_engineer");
      assert.strictEqual(normalizeRole(null), null);
    });

    it("normalizeLocation handles regional aliases", () => {
      assert.strictEqual(normalizeLocation("Bangalore"), "bengaluru");
      assert.strictEqual(normalizeLocation("Bengaluru"), "bengaluru");
      assert.strictEqual(normalizeLocation("Bombay"), "mumbai");
      assert.strictEqual(normalizeLocation("New Delhi"), "delhi_ncr");
      assert.strictEqual(normalizeLocation("Noida"), "delhi_ncr");
      assert.strictEqual(normalizeLocation("San Francisco"), "san_francisco_bay_area");
      assert.strictEqual(normalizeLocation(null), null);
    });

    it("normalizeListingSeniority parses text and numeric YOE thresholds", () => {
      assert.strictEqual(normalizeListingSeniority("Junior Software Developer"), "entry");
      assert.strictEqual(normalizeListingSeniority("Mid-level Engineer"), "mid");
      assert.strictEqual(normalizeListingSeniority("Senior Architect"), "senior");
      assert.strictEqual(normalizeListingSeniority(null, 1), "entry");
      assert.strictEqual(normalizeListingSeniority(null, 3), "mid");
      assert.strictEqual(normalizeListingSeniority(null, 7), "senior");
      assert.strictEqual(normalizeListingSeniority(null, null), null);
    });
  });
});
