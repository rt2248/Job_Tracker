/**
 * Shared Experience Calculator Utility
 *
 * Provides deterministic, verifiable years-of-experience (YOE) calculation
 * and history analysis from candidate work history.
 *
 * Preserves 100% backward compatibility with Career Strategist controller.
 */

/**
 * Status enumeration for experience history analysis.
 */
const EXPERIENCE_STATUS = {
  NO_HISTORY: 'NO_HISTORY',
  VALID_ZERO_EXPERIENCE: 'VALID_ZERO_EXPERIENCE',
  VALID_EXPERIENCE: 'VALID_EXPERIENCE',
  PARTIALLY_VALID: 'PARTIALLY_VALID',
  INVALID_HISTORY: 'INVALID_HISTORY',
};

/**
 * Derives total years of experience from profile experience array.
 *
 * @param {Array<Object>} experienceList - Array of job experience items
 * @param {Object} [options={}]
 * @param {Date} [options.referenceDate] - Controlled reference date for ongoing roles (defaults to now)
 * @returns {number} Float rounded to 1 decimal place, clamped to [0, 70]
 */
function calculateYearsOfExperienceFromHistory(experienceList, options = {}) {
  if (!Array.isArray(experienceList) || experienceList.length === 0) {
    return 0;
  }

  const now = options.referenceDate instanceof Date && !isNaN(options.referenceDate.getTime())
    ? options.referenceDate
    : new Date();

  let totalMonths = 0;

  for (const exp of experienceList) {
    if (!exp || !exp.startDate) continue;
    const start = new Date(exp.startDate);
    if (isNaN(start.getTime())) continue;

    const end = exp.current || !exp.endDate ? now : new Date(exp.endDate);
    if (isNaN(end.getTime()) || end < start) continue;

    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, diffMonths);
  }

  const years = Math.round((totalMonths / 12) * 10) / 10;
  return Math.min(70, Math.max(0, years));
}

/**
 * Analyzes candidate work history, returning structured metadata and validation status.
 *
 * Distinguishes genuine zero-experience profiles (e.g. entry-level graduates with 0-duration records)
 * from unpopulated or invalid histories.
 *
 * @param {Array<Object>} experienceList - Array of job experience items
 * @param {Object} [options={}]
 * @param {Date} [options.referenceDate] - Controlled reference date for ongoing roles
 * @returns {{
 *   years: number,
 *   status: string,
 *   validCount: number,
 *   invalidCount: number,
 *   hasValidExperience: boolean
 * }}
 */
function analyzeExperienceHistory(experienceList, options = {}) {
  if (!Array.isArray(experienceList) || experienceList.length === 0) {
    return {
      years: 0,
      status: EXPERIENCE_STATUS.NO_HISTORY,
      validCount: 0,
      invalidCount: 0,
      hasValidExperience: false,
    };
  }

  const now = options.referenceDate instanceof Date && !isNaN(options.referenceDate.getTime())
    ? options.referenceDate
    : new Date();

  let totalMonths = 0;
  let validCount = 0;
  let invalidCount = 0;

  for (const exp of experienceList) {
    if (!exp || typeof exp !== 'object' || !exp.startDate) {
      invalidCount++;
      continue;
    }

    const start = new Date(exp.startDate);
    if (isNaN(start.getTime())) {
      invalidCount++;
      continue;
    }

    const end = exp.current || !exp.endDate ? now : new Date(exp.endDate);
    if (isNaN(end.getTime()) || end < start) {
      invalidCount++;
      continue;
    }

    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, diffMonths);
    validCount++;
  }

  const years = Math.min(70, Math.max(0, Math.round((totalMonths / 12) * 10) / 10));
  const hasValidExperience = validCount > 0;

  let status;
  if (validCount === 0 && invalidCount > 0) {
    status = EXPERIENCE_STATUS.INVALID_HISTORY;
  } else if (validCount > 0 && invalidCount > 0) {
    status = EXPERIENCE_STATUS.PARTIALLY_VALID;
  } else if (validCount > 0 && years === 0) {
    status = EXPERIENCE_STATUS.VALID_ZERO_EXPERIENCE;
  } else if (validCount > 0 && years > 0) {
    status = EXPERIENCE_STATUS.VALID_EXPERIENCE;
  } else {
    status = EXPERIENCE_STATUS.NO_HISTORY;
  }

  return {
    years,
    status,
    validCount,
    invalidCount,
    hasValidExperience,
  };
}

module.exports = {
  EXPERIENCE_STATUS,
  calculateYearsOfExperienceFromHistory,
  analyzeExperienceHistory,
};
