/**
 * Deterministic Job Recommendation & Matching Engine
 *
 * Implements a pure, rule-based multi-dimensional scoring engine:
 * 1. Skills Compatibility (Max: 50 pts) - Directional transferable mappings (0.75 credit), non-stacking.
 * 2. Seniority Alignment (Max: 25 pts) - 3x3 Experience Matrix derived from verified work history.
 * 3. Title Alignment (Max: 20 pts) - Canonical composite role taxonomy and curated adjacent mappings.
 * 4. Location Compatibility (Max: 5 pts) - Normalized geographic aliases with strict Remote invariance.
 *
 * Mathematical Invariants:
 * - C_global = sum(W(d) for d in D_cand) / 100
 * - E_list = sum(W(d) for d in D_list) / 100
 * - D_eval = D_cand ∩ D_list
 * - W_eval = sum(W(d) for d in D_eval)
 * - C_applicable = W_eval / sum(W(d) for d in D_list)
 * - F_eval = P_earned / W_eval (if W_eval > 0 else 0)
 * - S_raw = F_eval * min(C_applicable, E_list) * 100
 * - S_verified = round(clamp(S_raw, 0, 100))
 *
 * Pure, offline execution: Zero external AI services, zero database migrations, zero network calls.
 */

const { normalizeSkillToken, parseAndClassifyListing } = require('./skillMatcher');
const { analyzeExperienceHistory } = require('./experienceCalculator');

const DIMENSION_WEIGHTS = Object.freeze({
  skills: 50,
  seniority: 25,
  title: 20,
  location: 5,
});

const MAX_POSSIBLE_SCORE = 100;

const TIERS = Object.freeze({
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  POTENTIAL: 'POTENTIAL',
  POTENTIAL_PARTIAL_EVIDENCE: 'POTENTIAL_PARTIAL_EVIDENCE',
  ONBOARDING_BASELINE: 'ONBOARDING_BASELINE',
  EXCLUDED: 'EXCLUDED',
});

/**
 * Directional Transferable Skills Map.
 * Key: Candidate's verified skill (canonical).
 * Value: Array of listing requirements (canonical) that this skill partially satisfies (0.75 credit).
 * Reverse transfers are NOT permitted.
 */
const DIRECTIONAL_TRANSFERABLE_SKILLS = Object.freeze({
  'typescript': ['javascript'],
  'postgresql': ['sql'],
  'mysql': ['sql'],
  'next.js': ['react'],
  'kubernetes': ['docker'],
  'express': ['node.js'],
});

/**
 * Seniority compatibility matrix.
 * Rows: Candidate derived level.
 * Columns: Listing requirement level.
 */
const SENIORITY_MATRIX = Object.freeze({
  entry: Object.freeze({ entry: 25, mid: 10, senior: 0 }),
  mid: Object.freeze({ entry: 15, mid: 25, senior: 15 }),
  senior: Object.freeze({ entry: 10, mid: 20, senior: 25 }),
});

/**
 * Canonical composite role identifiers to prevent false positive token overlaps
 * (e.g. Data Scientist vs Data Analyst vs Data Engineer must NOT match as direct).
 */
const CANONICAL_ROLE_SYNONYMS = Object.freeze({
  'data scientist': 'data_scientist',
  'data science': 'data_scientist',
  'data analyst': 'data_analyst',
  'bi analyst': 'data_analyst',
  'business intelligence analyst': 'data_analyst',
  'data engineer': 'data_engineer',
  'machine learning engineer': 'machine_learning_engineer',
  'ml engineer': 'machine_learning_engineer',
  'ai engineer': 'machine_learning_engineer',
  'frontend developer': 'frontend_developer',
  'frontend engineer': 'frontend_developer',
  'front end developer': 'frontend_developer',
  'front end engineer': 'frontend_developer',
  'front-end developer': 'frontend_developer',
  'front-end engineer': 'frontend_developer',
  'backend developer': 'backend_developer',
  'backend engineer': 'backend_developer',
  'back end developer': 'backend_developer',
  'back end engineer': 'backend_developer',
  'back-end developer': 'backend_developer',
  'back-end engineer': 'backend_developer',
  'full stack developer': 'full_stack_developer',
  'full stack engineer': 'full_stack_developer',
  'fullstack developer': 'full_stack_developer',
  'fullstack engineer': 'full_stack_developer',
  'full-stack developer': 'full_stack_developer',
  'full-stack engineer': 'full_stack_developer',
  'devops engineer': 'devops_engineer',
  'devops': 'devops_engineer',
  'site reliability engineer': 'site_reliability_engineer',
  'sre': 'site_reliability_engineer',
  'cloud engineer': 'cloud_engineer',
  'cloud architect': 'cloud_engineer',
  'software engineer': 'software_engineer',
  'software developer': 'software_engineer',
  'product manager': 'product_manager',
  'product owner': 'product_manager',
  'ui/ux designer': 'product_designer',
  'ux designer': 'product_designer',
  'product designer': 'product_designer',
  'qa engineer': 'qa_engineer',
  'qa developer': 'qa_engineer',
  'quality assurance engineer': 'qa_engineer',
  'test engineer': 'qa_engineer',
  'systems engineer': 'systems_engineer',
  'security engineer': 'security_engineer',
});

const ROLE_SYNONYM_KEYS_DESC = Object.keys(CANONICAL_ROLE_SYNONYMS).sort(
  (a, b) => b.length - a.length
);

/**
 * Curated adjacent role mappings (Score: 12 pts).
 */
const ADJACENT_ROLE_MAP = Object.freeze({
  'full_stack_developer': ['frontend_developer', 'backend_developer', 'software_engineer'],
  'frontend_developer': ['full_stack_developer', 'software_engineer'],
  'backend_developer': ['full_stack_developer', 'software_engineer', 'data_engineer'],
  'software_engineer': ['full_stack_developer', 'frontend_developer', 'backend_developer'],
  'devops_engineer': ['site_reliability_engineer', 'cloud_engineer'],
  'site_reliability_engineer': ['devops_engineer', 'cloud_engineer'],
  'cloud_engineer': ['devops_engineer', 'site_reliability_engineer'],
  'machine_learning_engineer': ['data_scientist'],
  'data_scientist': ['machine_learning_engineer', 'data_analyst'],
  'data_analyst': ['data_scientist'],
  'data_engineer': ['backend_developer'],
});

/**
 * Standardized geographic aliases for metropolitan regions.
 */
const LOCATION_ALIASES = Object.freeze({
  'bangalore': 'bengaluru',
  'bengaluru': 'bengaluru',
  'mumbai': 'mumbai',
  'bombay': 'mumbai',
  'delhi': 'delhi_ncr',
  'new delhi': 'delhi_ncr',
  'noida': 'delhi_ncr',
  'gurgaon': 'delhi_ncr',
  'gurugram': 'delhi_ncr',
  'delhi ncr': 'delhi_ncr',
  'kolkata': 'kolkata',
  'calcutta': 'kolkata',
  'chennai': 'chennai',
  'madras': 'chennai',
  'hyderabad': 'hyderabad',
  'pune': 'pune',
  'san francisco': 'san_francisco_bay_area',
  'sf': 'san_francisco_bay_area',
  'bay area': 'san_francisco_bay_area',
  'san jose': 'san_francisco_bay_area',
  'sunnyvale': 'san_francisco_bay_area',
  'new york': 'new_york_city',
  'nyc': 'new_york_city',
  'new york city': 'new_york_city',
  'seattle': 'seattle',
  'london': 'london',
  'toronto': 'toronto',
  'berlin': 'berlin',
});

/**
 * Normalizes a role string to its canonical composite identifier or cleaned string.
 *
 * @param {string} rawTitle
 * @returns {string|null}
 */
function normalizeRole(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') return null;
  const clean = rawTitle.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return null;

  for (const key of ROLE_SYNONYM_KEYS_DESC) {
    const normKey = key.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const escaped = normKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
    if (regex.test(clean)) {
      return CANONICAL_ROLE_SYNONYMS[key];
    }
  }

  return clean;
}

/**
 * Normalizes a location string to a standardized metropolitan identifier.
 *
 * @param {string} rawLocation
 * @returns {string|null}
 */
function normalizeLocation(rawLocation) {
  if (!rawLocation || typeof rawLocation !== 'string') return null;
  const clean = rawLocation.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return null;

  for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
    if (regex.test(clean)) {
      return canonical;
    }
  }

  return clean;
}

/**
 * Extracts and canonicalizes candidate data from various profile schema variants.
 *
 * @param {Object} candidate
 * @returns {{
 *   rawSkills: string[],
 *   rawExperience: Object[],
 *   headline: string,
 *   rawTargetRoles: string[],
 *   location: string
 * }}
 */
function extractCandidateData(candidate) {
  const profile = candidate?.profile || candidate?.candidateProfile || candidate || {};

  let rawSkills = profile.skills || candidate?.skills || profile.declaredSkills || [];
  if (!Array.isArray(rawSkills)) rawSkills = [];

  let rawExperience = profile.experience || candidate?.experience || [];
  if (!Array.isArray(rawExperience)) rawExperience = [];

  const headline =
    typeof profile.headline === 'string'
      ? profile.headline.trim()
      : typeof candidate?.headline === 'string'
      ? candidate.headline.trim()
      : '';

  let rawTargetRoles = profile.targetRoles || candidate?.targetRoles || [];
  if (typeof rawTargetRoles === 'string') rawTargetRoles = [rawTargetRoles];
  if (!Array.isArray(rawTargetRoles)) rawTargetRoles = [];

  const location =
    typeof profile.location === 'string'
      ? profile.location.trim()
      : typeof candidate?.location === 'string'
      ? candidate.location.trim()
      : '';

  return { rawSkills, rawExperience, headline, rawTargetRoles, location };
}

/**
 * Extracts and canonicalizes job listing fields.
 *
 * @param {Object} listing
 * @returns {{
 *   title: string,
 *   tags: string[],
 *   requirements: string[],
 *   directSkills: string[],
 *   isRemote: boolean,
 *   location: string,
 *   seniorityLevel: string|null,
 *   minExperienceYears: number|null
 * }}
 */
function extractListingData(listing) {
  const safe = listing || {};

  const title = typeof safe.title === 'string' ? safe.title.trim() : '';
  const tags = Array.isArray(safe.tags) ? safe.tags : [];
  const requirements = Array.isArray(safe.requirements) ? safe.requirements : [];
  const directSkills = Array.isArray(safe.skills) ? safe.skills : [];

  const workModeRaw = safe.workMode || safe.work_mode || safe.workplaceType || safe.locationType || '';
  const workplaceType = typeof workModeRaw === 'string' ? workModeRaw.trim().toLowerCase() : '';
  const isRemoteFlag = Boolean(safe.isRemote);
  const rawLocation = typeof safe.location === 'string' ? safe.location.trim() : '';
  const isRemoteLocation = rawLocation.toLowerCase() === 'remote';
  const isRemoteTitle = /\b(remote)\b/i.test(title);

  const isRemote = isRemoteFlag || workplaceType === 'remote' || isRemoteLocation || (isRemoteTitle && !rawLocation);

  const seniorityLevel = safe.seniorityLevel || safe.experienceLevel || safe.experience_level || null;
  const minExperienceYears = safe.minExperienceYears !== undefined ? safe.minExperienceYears : safe.requiredExperienceYears;

  return {
    title,
    tags,
    requirements,
    directSkills,
    isRemote,
    location: rawLocation,
    seniorityLevel,
    minExperienceYears,
  };
}

/**
 * Classifies listing seniority level into 'entry', 'mid', 'senior', or null.
 *
 * @param {string|null} seniorityLevel
 * @param {number|null} minExperienceYears
 * @returns {string|null}
 */
function normalizeListingSeniority(seniorityLevel, minExperienceYears) {
  if (seniorityLevel && typeof seniorityLevel === 'string') {
    const norm = seniorityLevel.toLowerCase();
    if (/\b(entry|junior|intern|associate|trainee|fresher)\b/.test(norm)) {
      return 'entry';
    }
    if (/\b(mid|intermediate|middle)\b/.test(norm)) {
      return 'mid';
    }
    if (/\b(senior|sr|lead|staff|principal|director|head|vp)\b/.test(norm)) {
      return 'senior';
    }
  }

  if (minExperienceYears !== undefined && minExperienceYears !== null) {
    const yoe = Number(minExperienceYears);
    if (Number.isFinite(yoe) && yoe >= 0) {
      if (yoe < 2) return 'entry';
      if (yoe < 5) return 'mid';
      return 'senior';
    }
  }

  return null;
}

/**
 * Assigns recommendation tier based on score, evaluated fit, and evidence coverage thresholds.
 *
 * @param {Object} params
 * @param {number} params.cGlobal - Global candidate evidence coverage
 * @param {number} params.cApplicable - Applicable candidate evidence coverage
 * @param {number} params.eList - Listing evaluability
 * @param {number} params.fEval - Evaluated dimension fit ratio [0, 1]
 * @param {number} params.sRaw - Raw unrounded score [0, 100]
 * @returns {string}
 */
function determineTier({ cGlobal, cApplicable, eList, fEval, sRaw }) {
  if (cGlobal === 0) {
    return TIERS.ONBOARDING_BASELINE;
  }
  if (sRaw >= 75 && cApplicable >= 0.70 && eList >= 0.70 && fEval >= 0.80) {
    return TIERS.EXCELLENT;
  }
  if (sRaw >= 50 && cApplicable >= 0.50 && eList >= 0.50 && fEval >= 0.65) {
    return TIERS.GOOD;
  }
  if (sRaw >= 25) {
    return TIERS.POTENTIAL;
  }
  if (fEval >= 0.60 && (cApplicable < 0.50 || eList < 0.50)) {
    return TIERS.POTENTIAL_PARTIAL_EVIDENCE;
  }
  return TIERS.EXCLUDED;
}

/**
 * Evaluates candidate compatibility against a single job listing.
 *
 * @param {Object} candidate - Candidate profile data
 * @param {Object} listing - Job listing data
 * @param {Object} [options={}]
 * @param {Date} [options.referenceDate] - Controllable date for ongoing experience calculation
 * @returns {Object} Complete match evaluation with score, tier, evidence, and dimension breakdown
 */
function scoreListing(candidate, listing, options = {}) {
  const candData = extractCandidateData(candidate);
  const listData = extractListingData(listing);

  // -------------------------------------------------------------------------
  // 1. Skills Dimension (Weight: 50)
  // -------------------------------------------------------------------------
  const candidateNormalizedSkills = new Set();
  for (const s of candData.rawSkills) {
    const norm = normalizeSkillToken(s);
    if (norm) candidateNormalizedSkills.add(norm);
  }

  const classified = parseAndClassifyListing(listData.tags, listData.requirements);
  const canonicalListingSkills = new Set(classified.identifiableSkills);
  for (const s of listData.directSkills) {
    const norm = normalizeSkillToken(s);
    if (norm) canonicalListingSkills.add(norm);
  }

  const hasSkillsCand = candidateNormalizedSkills.size > 0;
  const hasSkillsList = canonicalListingSkills.size > 0;

  let earnedSkills = 0;
  const matchedDirectSkills = [];
  const matchedTransferableSkills = [];
  const missingSkills = [];

  if (hasSkillsCand && hasSkillsList) {
    let creditTotal = 0;

    for (const reqSkill of canonicalListingSkills) {
      if (candidateNormalizedSkills.has(reqSkill)) {
        creditTotal += 1.0;
        matchedDirectSkills.push(reqSkill);
      } else {
        let transferSource = null;
        for (const candSkill of candidateNormalizedSkills) {
          const targets = DIRECTIONAL_TRANSFERABLE_SKILLS[candSkill];
          if (targets && targets.includes(reqSkill)) {
            transferSource = candSkill;
            break;
          }
        }

        if (transferSource) {
          creditTotal += 0.75;
          matchedTransferableSkills.push({
            requiredSkill: reqSkill,
            transferableFrom: transferSource,
            credit: 0.75,
          });
        } else {
          missingSkills.push(reqSkill);
        }
      }
    }

    const ratio = creditTotal / canonicalListingSkills.size;
    earnedSkills = 50 * ratio;
  } else if (hasSkillsList && !hasSkillsCand) {
    for (const reqSkill of canonicalListingSkills) {
      missingSkills.push(reqSkill);
    }
  }

  // -------------------------------------------------------------------------
  // 2. Seniority Dimension (Weight: 25)
  // -------------------------------------------------------------------------
  const expAnalysis = analyzeExperienceHistory(candData.rawExperience, {
    referenceDate: options.referenceDate,
  });
  const hasSeniorityCand = expAnalysis.hasValidExperience;

  let candidateSeniorityLevel = null;
  if (hasSeniorityCand) {
    if (expAnalysis.years < 2) {
      candidateSeniorityLevel = 'entry';
    } else if (expAnalysis.years < 5) {
      candidateSeniorityLevel = 'mid';
    } else {
      candidateSeniorityLevel = 'senior';
    }
  }

  const listingSeniorityLevel = normalizeListingSeniority(
    listData.seniorityLevel,
    listData.minExperienceYears
  );
  const hasSeniorityList = listingSeniorityLevel !== null;

  let earnedSeniority = 0;
  if (hasSeniorityCand && hasSeniorityList) {
    earnedSeniority = SENIORITY_MATRIX[candidateSeniorityLevel][listingSeniorityLevel];
  }

  // -------------------------------------------------------------------------
  // 3. Title Alignment Dimension (Weight: 20)
  // -------------------------------------------------------------------------
  const candidateRoles = new Set();
  if (candData.headline) candidateRoles.add(candData.headline);
  for (const r of candData.rawTargetRoles) {
    if (typeof r === 'string' && r.trim()) candidateRoles.add(r.trim());
  }
  for (const exp of candData.rawExperience) {
    if (exp && typeof exp.title === 'string' && exp.title.trim()) {
      candidateRoles.add(exp.title.trim());
    }
  }

  const hasTitleCand = candidateRoles.size > 0;
  const hasTitleList = Boolean(listData.title);

  let earnedTitle = 0;
  let titleMatchType = 'NONE';

  if (hasTitleCand && hasTitleList) {
    const listCanonicalRole = normalizeRole(listData.title);

    let hasDirectMatch = false;
    let hasAdjacentMatch = false;

    for (const candRole of candidateRoles) {
      const candCanonicalRole = normalizeRole(candRole);
      if (!candCanonicalRole) continue;

      if (candCanonicalRole === listCanonicalRole) {
        hasDirectMatch = true;
        break;
      }

      const adjacentList = ADJACENT_ROLE_MAP[candCanonicalRole];
      const reverseAdjacent = ADJACENT_ROLE_MAP[listCanonicalRole];
      if (
        (adjacentList && adjacentList.includes(listCanonicalRole)) ||
        (reverseAdjacent && reverseAdjacent.includes(candCanonicalRole))
      ) {
        hasAdjacentMatch = true;
      }
    }

    if (hasDirectMatch) {
      earnedTitle = 20;
      titleMatchType = 'DIRECT';
    } else if (hasAdjacentMatch) {
      earnedTitle = 12;
      titleMatchType = 'ADJACENT';
    } else {
      earnedTitle = 0;
      titleMatchType = 'NONE';
    }
  }

  // -------------------------------------------------------------------------
  // 4. Location Dimension (Weight: 5)
  // -------------------------------------------------------------------------
  let earnedLocation = 0;
  let locationMatchType = 'UNEVALUATED';
  const hasLocationCand = Boolean(candData.location);

  // Strict Remote Invariance: remote listings exclude the location dimension from evaluation
  let hasLocationList = false;
  if (listData.isRemote) {
    locationMatchType = 'REMOTE_EXCLUDED';
    hasLocationList = false;
  } else {
    hasLocationList = Boolean(listData.location);
    if (hasLocationCand && hasLocationList) {
      const candNormLoc = normalizeLocation(candData.location);
      const listNormLoc = normalizeLocation(listData.location);

      if (candNormLoc && listNormLoc && candNormLoc === listNormLoc) {
        earnedLocation = 5;
        locationMatchType = 'MATCH';
      } else {
        earnedLocation = 0;
        locationMatchType = 'MISMATCH';
      }
    }
  }

  // -------------------------------------------------------------------------
  // 5. Mathematical Aggregation & Normalization
  // -------------------------------------------------------------------------
  const dCand = new Set();
  if (hasSkillsCand) dCand.add('skills');
  if (hasSeniorityCand) dCand.add('seniority');
  if (hasTitleCand) dCand.add('title');
  if (hasLocationCand) dCand.add('location');

  const dList = new Set();
  if (hasSkillsList) dList.add('skills');
  if (hasSeniorityList) dList.add('seniority');
  if (hasTitleList) dList.add('title');
  if (hasLocationList) dList.add('location');

  const dEval = new Set();
  for (const d of dCand) {
    if (dList.has(d)) {
      dEval.add(d);
    }
  }

  let wCand = 0;
  for (const d of dCand) wCand += DIMENSION_WEIGHTS[d];
  const cGlobal = wCand / MAX_POSSIBLE_SCORE;

  let wList = 0;
  for (const d of dList) wList += DIMENSION_WEIGHTS[d];
  const eList = wList / MAX_POSSIBLE_SCORE;

  let wEval = 0;
  for (const d of dEval) wEval += DIMENSION_WEIGHTS[d];

  const cApplicable = wList > 0 ? wEval / wList : 0;

  let pEarned = 0;
  if (dEval.has('skills')) pEarned += earnedSkills;
  if (dEval.has('seniority')) pEarned += earnedSeniority;
  if (dEval.has('title')) pEarned += earnedTitle;
  if (dEval.has('location')) pEarned += earnedLocation;

  const fEval = wEval > 0 ? pEarned / wEval : 0;
  const sRaw = fEval * Math.min(cApplicable, eList) * 100;
  const sVerified = Math.max(0, Math.min(100, Math.round(sRaw)));

  const tier = determineTier({
    cGlobal,
    cApplicable,
    eList,
    fEval,
    sRaw,
  });

  return {
    score: sVerified,
    rawScore: Math.round(sRaw * 100) / 100,
    tier,
    evaluatedFit: Math.round(fEval * 1000) / 1000,
    evidence: {
      candidateCoverage: Math.round(cGlobal * 100) / 100,
      listingEvaluability: Math.round(eList * 100) / 100,
      applicableCoverage: Math.round(cApplicable * 100) / 100,
      evaluatedDimensions: Array.from(dEval),
      totalEvaluatedWeight: wEval,
    },
    breakdown: {
      skills: {
        earned: Math.round(earnedSkills * 100) / 100,
        max: DIMENSION_WEIGHTS.skills,
        evaluated: dEval.has('skills'),
        matchedSkills: matchedDirectSkills,
        transferableMatches: matchedTransferableSkills,
        missingSkills,
      },
      seniority: {
        earned: earnedSeniority,
        max: DIMENSION_WEIGHTS.seniority,
        evaluated: dEval.has('seniority'),
        candidateLevel: candidateSeniorityLevel,
        listingLevel: listingSeniorityLevel,
        candidateYearsOfExperience: expAnalysis.years,
      },
      title: {
        earned: earnedTitle,
        max: DIMENSION_WEIGHTS.title,
        evaluated: dEval.has('title'),
        matchType: titleMatchType,
      },
      location: {
        earned: earnedLocation,
        max: DIMENSION_WEIGHTS.location,
        evaluated: dEval.has('location'),
        matchType: locationMatchType,
      },
    },
  };
}

/**
 * Scores and ranks a collection of job listings against a candidate profile.
 *
 * @param {Object} candidate - Candidate profile data
 * @param {Array<Object>} listings - Collection of job listings
 * @param {Object} [options={}]
 * @returns {Array<Object>} Listings enriched with match metadata, sorted descending by score
 */
function matchBatch(candidate, listings, options = {}) {
  if (!Array.isArray(listings)) return [];

  const evaluated = listings.map((listing) => {
    const match = scoreListing(candidate, listing, options);
    return {
      listing,
      match,
    };
  });

  evaluated.sort((a, b) => {
    if (b.match.score !== a.match.score) {
      return b.match.score - a.match.score;
    }
    if (b.match.evaluatedFit !== a.match.evaluatedFit) {
      return b.match.evaluatedFit - a.match.evaluatedFit;
    }
    if (b.match.evidence.applicableCoverage !== a.match.evidence.applicableCoverage) {
      return b.match.evidence.applicableCoverage - a.match.evidence.applicableCoverage;
    }
    if (b.match.evidence.candidateCoverage !== a.match.evidence.candidateCoverage) {
      return b.match.evidence.candidateCoverage - a.match.evidence.candidateCoverage;
    }
    return 0;
  });

  return evaluated;
}

/**
 * Computes standalone candidate evidence coverage and populated dimensions.
 *
 * @param {Object} candidate - Candidate profile data
 * @param {Object} [options={}]
 * @param {Date} [options.referenceDate] - Controllable date for ongoing experience
 * @returns {{
 *   candidateCoverage: number,
 *   dimensions: string[],
 *   totalWeight: number,
 *   isBaseline: boolean
 * }}
 */
function calculateCandidateEvidence(candidate, options = {}) {
  const candData = extractCandidateData(candidate);

  const candidateNormalizedSkills = new Set();
  for (const s of candData.rawSkills) {
    const norm = normalizeSkillToken(s);
    if (norm) candidateNormalizedSkills.add(norm);
  }
  const hasSkills = candidateNormalizedSkills.size > 0;

  const expAnalysis = analyzeExperienceHistory(candData.rawExperience, {
    referenceDate: options.referenceDate,
  });
  const hasSeniority = expAnalysis.hasValidExperience;

  const candidateRoles = new Set();
  if (candData.headline) candidateRoles.add(candData.headline);
  for (const r of candData.rawTargetRoles) {
    if (typeof r === 'string' && r.trim()) candidateRoles.add(r.trim());
  }
  for (const exp of candData.rawExperience) {
    if (exp && typeof exp.title === 'string' && exp.title.trim()) {
      candidateRoles.add(exp.title.trim());
    }
  }
  const hasTitle = candidateRoles.size > 0;

  const hasLocation = Boolean(candData.location && candData.location.trim());

  const dCand = new Set();
  if (hasSkills) dCand.add('skills');
  if (hasSeniority) dCand.add('seniority');
  if (hasTitle) dCand.add('title');
  if (hasLocation) dCand.add('location');

  let wCand = 0;
  for (const d of dCand) wCand += DIMENSION_WEIGHTS[d];
  const cGlobal = wCand / MAX_POSSIBLE_SCORE;

  return {
    candidateCoverage: Math.round(cGlobal * 100) / 100,
    dimensions: Array.from(dCand),
    totalWeight: wCand,
    isBaseline: wCand === 0,
  };
}

module.exports = {
  DIMENSION_WEIGHTS,
  MAX_POSSIBLE_SCORE,
  TIERS,
  DIRECTIONAL_TRANSFERABLE_SKILLS,
  SENIORITY_MATRIX,
  CANONICAL_ROLE_SYNONYMS,
  ADJACENT_ROLE_MAP,
  LOCATION_ALIASES,
  normalizeRole,
  normalizeLocation,
  normalizeListingSeniority,
  determineTier,
  scoreListing,
  matchBatch,
  calculateCandidateEvidence,
};
