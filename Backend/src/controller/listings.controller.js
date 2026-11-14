/**
 * Listings Controller
 *
 * Implements listing search/filtering, distinct filter facets, and the
 * authenticated deterministic job recommendation endpoint (GET /api/listings/recommendations).
 *
 * Stage 2 — Milestone 2: Authenticated Recommendation API.
 */

const defaultListingsModel = require("../models/files/listings.model");
const defaultProfileModel = require("../models/files/profile.model");
const {
  scoreListing,
  calculateCandidateEvidence,
  TIERS,
} = require("../utils/jobMatchingEngine");

/**
 * Deterministic tie-breaker comparator for recommendation buckets:
 * 1. Unrounded raw score descending
 * 2. posted_date descending (newest first)
 * 3. Stable listing ID ascending
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
function sortRecommendations(a, b) {
  // 1. Unrounded raw score descending
  if (b.rawScore !== a.rawScore) {
    return b.rawScore - a.rawScore;
  }

  // 2. posted_date descending
  const timeA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
  const timeB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
  if (timeB !== timeA) {
    return timeB - timeA;
  }

  // 3. Stable listing ID ascending
  return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
}

/**
 * Controller factory supporting dependency injection for testing and runtime.
 *
 * @param {Object} [dependencies={}]
 * @param {Object} [dependencies.listingsModel]
 * @param {Object} [dependencies.profileModel]
 * @returns {Object} Controller instance with handler methods
 */
function createListingsController({
  listingsModel = defaultListingsModel,
  profileModel = defaultProfileModel,
} = {}) {
  /**
   * GET /api/listings
   * Public / Authenticated search and filter listing catalog.
   */
  async function getJobListings(req, res) {
    try {
      const {
        search,
        type,
        workMode,
        experienceLevel,
        location,
        salaryMin,
        salaryMax,
        postedWithin,
        tags,
      } = req.query;

      const filters = {
        search,
        type,
        workMode,
        experienceLevel,
        location,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        postedWithin,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      };

      const listings = await listingsModel.getListings(filters);

      const formattedListings = listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        company: listing.company,
        location: listing.location,
        jobType: listing.job_type,
        workMode: listing.work_mode,
        experienceLevel: listing.experience_level,
        compensationMin: listing.compensation_min,
        compensationMax: listing.compensation_max,
        compensationPeriod: listing.compensation_period,
        compensationCurrency: listing.compensation_currency,
        postedDate: listing.posted_date,
        description: listing.description,
        requirements: listing.requirements,
        link: listing.link,
        createdAt: listing.created_at,
        tags: listing.tags,
      }));

      res.status(200).json({
        message: "Listings fetched successfully",
        listings: formattedListings,
      });
    } catch (error) {
      console.error("[ListingsController] Error fetching job listings:", error.message || error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * GET /api/listings/locations
   * Distinct locations facet.
   */
  async function getLocations(req, res) {
    try {
      const locations = await listingsModel.getDistinctLocations();
      res.status(200).json({ locations });
    } catch (error) {
      console.error("[ListingsController] Error fetching locations:", error.message || error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * GET /api/listings/tags
   * Distinct tags facet.
   */
  async function getTags(req, res) {
    try {
      const tags = await listingsModel.getDistinctTags();
      res.status(200).json({ tags });
    } catch (error) {
      console.error("[ListingsController] Error fetching tags:", error.message || error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * GET /api/listings/recommendations
   * Generates deterministic, evidence-based personalized job recommendations for the authenticated candidate.
   *
   * Derived exclusively from req.user.userId.
   */
  async function getRecommendations(req, res) {
    try {
      // 1. Enforce strict server-derived authentication
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // 2. Fetch candidate profile and catalog listings concurrently (avoid N+1)
      const [rawProfile, rawListings] = await Promise.all([
        profileModel.getProfileByUserId(userId),
        listingsModel.getListings({}),
      ]);

      const candidateProfile = rawProfile || {};
      const candidateEvidence = calculateCandidateEvidence(candidateProfile);

      // 3. Format listings safely
      const formattedListings = (Array.isArray(rawListings) ? rawListings : []).map((listing) => ({
        id: listing.id,
        title: listing.title,
        company: listing.company,
        location: listing.location,
        jobType: listing.job_type,
        employmentType: listing.job_type,
        workMode: listing.work_mode,
        experienceLevel: listing.experience_level,
        compensationMin: listing.compensation_min,
        compensationMax: listing.compensation_max,
        compensationPeriod: listing.compensation_period,
        compensationCurrency: listing.compensation_currency,
        postedDate: listing.posted_date,
        description: listing.description,
        requirements: listing.requirements,
        tags: listing.tags,
        link: listing.link,
        createdAt: listing.created_at,
      }));

      // 4. Handle Completely Empty Profile (Onboarding Baseline)
      if (candidateEvidence.isBaseline) {
        const onboardingListings = [...formattedListings]
          .sort((a, b) => {
            const timeA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
            const timeB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
            if (timeB !== timeA) return timeB - timeA;
            return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
          })
          .map((listing) => ({
            ...listing,
            score: 0,
            rawScore: 0,
            tier: TIERS.ONBOARDING_BASELINE,
          }));

        return res.status(200).json({
          success: true,
          profileState: "ONBOARDING_BASELINE",
          candidateEvidenceCoverage: 0,
          summary: {
            totalRecommended: 0,
            excellentCount: 0,
            goodCount: 0,
            potentialCount: 0,
            totalEvaluated: formattedListings.length,
            onboardingCount: onboardingListings.length,
          },
          recommendations: {
            excellent: [],
            good: [],
            potential: [],
            onboarding: onboardingListings,
          },
          meta: {
            generatedAt: new Date().toISOString(),
            evaluatedListingsCount: formattedListings.length,
            candidateDimensions: [],
            message: "Add skills, work experience, or a professional headline to unlock personalized recommendations.",
          },
        });
      }

      // 5. Evaluate Candidate Profile Against All Available Listings
      const buckets = {
        excellent: [],
        good: [],
        potential: [],
      };

      for (const listing of formattedListings) {
        const matchResult = scoreListing(candidateProfile, listing);

        // Skip excluded listings from the recommendation buckets
        if (
          matchResult.tier === TIERS.EXCLUDED ||
          matchResult.tier === TIERS.ONBOARDING_BASELINE
        ) {
          continue;
        }

        const recommendedItem = {
          ...listing,
          score: matchResult.score,
          rawScore: matchResult.rawScore,
          tier: matchResult.tier,
          evaluatedFit: matchResult.evaluatedFit,
          evidence: matchResult.evidence,
          matchExplanation: {
            matchedSkills: matchResult.breakdown.skills.matchedSkills,
            transferableMatches: matchResult.breakdown.skills.transferableMatches,
            missingSkills: matchResult.breakdown.skills.missingSkills,
            seniority: {
              evaluated: matchResult.breakdown.seniority.evaluated,
              candidateLevel: matchResult.breakdown.seniority.candidateLevel,
              listingLevel: matchResult.breakdown.seniority.listingLevel,
            },
            titleFit: matchResult.breakdown.title.matchType,
            locationFit: matchResult.breakdown.location.matchType,
          },
        };

        if (matchResult.tier === TIERS.EXCELLENT) {
          buckets.excellent.push(recommendedItem);
        } else if (matchResult.tier === TIERS.GOOD) {
          buckets.good.push(recommendedItem);
        } else if (
          matchResult.tier === TIERS.POTENTIAL ||
          matchResult.tier === TIERS.POTENTIAL_PARTIAL_EVIDENCE
        ) {
          buckets.potential.push(recommendedItem);
        }
      }

      // 6. Sort within each bucket deterministically
      buckets.excellent.sort(sortRecommendations);
      buckets.good.sort(sortRecommendations);
      buckets.potential.sort(sortRecommendations);

      const totalRecommended =
        buckets.excellent.length + buckets.good.length + buckets.potential.length;

      return res.status(200).json({
        success: true,
        profileState: "EVALUATED",
        candidateEvidenceCoverage: candidateEvidence.candidateCoverage,
        summary: {
          totalRecommended,
          excellentCount: buckets.excellent.length,
          goodCount: buckets.good.length,
          potentialCount: buckets.potential.length,
          totalEvaluated: formattedListings.length,
        },
        recommendations: {
          excellent: buckets.excellent,
          good: buckets.good,
          potential: buckets.potential,
        },
        meta: {
          generatedAt: new Date().toISOString(),
          evaluatedListingsCount: formattedListings.length,
          candidateDimensions: candidateEvidence.dimensions,
        },
      });
    } catch (error) {
      console.error("[ListingsController] Error generating recommendations:", error.message || error);
      res.status(500).json({ message: "Server error" });
    }
  }

  return {
    getJobListings,
    getLocations,
    getTags,
    getRecommendations,
  };
}

let _defaultController = null;
function getDefaultController() {
  if (!_defaultController) {
    _defaultController = createListingsController();
  }
  return _defaultController;
}

module.exports = {
  createListingsController,
  sortRecommendations,
  getJobListings: (req, res) => getDefaultController().getJobListings(req, res),
  getLocations: (req, res) => getDefaultController().getLocations(req, res),
  getTags: (req, res) => getDefaultController().getTags(req, res),
  getRecommendations: (req, res) => getDefaultController().getRecommendations(req, res),
};
