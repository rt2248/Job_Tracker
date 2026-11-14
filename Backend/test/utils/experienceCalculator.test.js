/**
 * @file experienceCalculator.test.js
 * @description Unit test suite for shared experience calculator utility.
 *
 * Verifies calculation accuracy, options.referenceDate control, status categorization,
 * edge cases, backward compatibility, and ceiling limits.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  EXPERIENCE_STATUS,
  calculateYearsOfExperienceFromHistory,
  analyzeExperienceHistory,
} = require("../../src/utils/experienceCalculator");

describe("Experience Calculator Utility", () => {
  const FIXED_REF_DATE = new Date("2025-06-01T00:00:00.000Z");

  describe("calculateYearsOfExperienceFromHistory", () => {
    it("returns 0 for non-array or empty inputs", () => {
      assert.strictEqual(calculateYearsOfExperienceFromHistory(null), 0);
      assert.strictEqual(calculateYearsOfExperienceFromHistory(undefined), 0);
      assert.strictEqual(calculateYearsOfExperienceFromHistory("invalid"), 0);
      assert.strictEqual(calculateYearsOfExperienceFromHistory(42), 0);
      assert.strictEqual(calculateYearsOfExperienceFromHistory({}), 0);
      assert.strictEqual(calculateYearsOfExperienceFromHistory([]), 0);
    });

    it("returns 0 when entries lack startDate or contain invalid dates", () => {
      const history = [
        {},
        { company: "Tech Corp" },
        { startDate: "invalid-date" },
        { startDate: "2024-01-01", endDate: "invalid-end" },
      ];
      assert.strictEqual(calculateYearsOfExperienceFromHistory(history), 0);
    });

    it("skips records where endDate is before startDate", () => {
      const history = [
        { startDate: "2024-06-01", endDate: "2023-01-01" }, // inverted, skipped
        { startDate: "2023-01-01", endDate: "2024-01-01" }, // 12 months = 1.0 year
      ];
      const result = calculateYearsOfExperienceFromHistory(history);
      assert.strictEqual(result, 1.0);
    });

    it("computes duration correctly for completed roles", () => {
      const history = [
        { startDate: "2020-01-01", endDate: "2023-01-01" }, // 36 months = 3.0 yrs
        { startDate: "2023-01-01", endDate: "2024-07-01" }, // 18 months = 1.5 yrs
      ];
      const result = calculateYearsOfExperienceFromHistory(history);
      assert.strictEqual(result, 4.5);
    });

    it("evaluates ongoing roles using options.referenceDate", () => {
      const historyWithCurrent = [
        { startDate: "2023-06-01", current: true }, // 24 months to 2025-06-01
      ];
      const result1 = calculateYearsOfExperienceFromHistory(historyWithCurrent, {
        referenceDate: FIXED_REF_DATE,
      });
      assert.strictEqual(result1, 2.0);

      const historyWithoutEndDate = [
        { startDate: "2024-06-01" }, // 12 months to 2025-06-01
      ];
      const result2 = calculateYearsOfExperienceFromHistory(historyWithoutEndDate, {
        referenceDate: FIXED_REF_DATE,
      });
      assert.strictEqual(result2, 1.0);
    });

    it("defaults referenceDate to current date when omitted or invalid", () => {
      const history = [{ startDate: "2020-01-01", current: true }];
      const result = calculateYearsOfExperienceFromHistory(history, { referenceDate: "not-a-date" });
      assert.ok(typeof result === "number");
      assert.ok(result > 3.0);
    });

    it("preserves additive accumulation of overlapping periods (backward compatibility)", () => {
      const overlapping = [
        { startDate: "2022-01-01", endDate: "2023-01-01" }, // 12 months
        { startDate: "2022-06-01", endDate: "2023-06-01" }, // 12 months
      ];
      const result = calculateYearsOfExperienceFromHistory(overlapping);
      assert.strictEqual(result, 2.0);
    });

    it("rounds to 1 decimal place accurately", () => {
      // 14 months = 1.1666... -> 1.2 years
      const history = [{ startDate: "2022-01-01", endDate: "2023-03-01" }];
      const result = calculateYearsOfExperienceFromHistory(history);
      assert.strictEqual(result, 1.2);
    });

    it("clamps experience to maximum 70.0 years", () => {
      const extremeHistory = [
        { startDate: "1920-01-01", endDate: "2020-01-01" }, // 100 years
      ];
      const result = calculateYearsOfExperienceFromHistory(extremeHistory);
      assert.strictEqual(result, 70.0);
    });
  });

  describe("analyzeExperienceHistory", () => {
    it("identifies NO_HISTORY for null, undefined, or empty arrays", () => {
      const empty1 = analyzeExperienceHistory(null);
      assert.strictEqual(empty1.status, EXPERIENCE_STATUS.NO_HISTORY);
      assert.strictEqual(empty1.years, 0);
      assert.strictEqual(empty1.hasValidExperience, false);
      assert.strictEqual(empty1.validCount, 0);
      assert.strictEqual(empty1.invalidCount, 0);

      const empty2 = analyzeExperienceHistory([]);
      assert.strictEqual(empty2.status, EXPERIENCE_STATUS.NO_HISTORY);
      assert.strictEqual(empty2.hasValidExperience, false);
    });

    it("identifies INVALID_HISTORY when all records are unparseable or inverted", () => {
      const invalid = [
        null,
        { title: "Ghost job" },
        { startDate: "garbage" },
        { startDate: "2024-01-01", endDate: "2020-01-01" },
      ];
      const result = analyzeExperienceHistory(invalid);
      assert.strictEqual(result.status, EXPERIENCE_STATUS.INVALID_HISTORY);
      assert.strictEqual(result.years, 0);
      assert.strictEqual(result.validCount, 0);
      assert.strictEqual(result.invalidCount, 4);
      assert.strictEqual(result.hasValidExperience, false);
    });

    it("identifies VALID_ZERO_EXPERIENCE for valid records with 0 net months", () => {
      const zeroExp = [
        { startDate: "2024-01-05", endDate: "2024-01-20" }, // same month -> 0 diffMonths
      ];
      const result = analyzeExperienceHistory(zeroExp);
      assert.strictEqual(result.status, EXPERIENCE_STATUS.VALID_ZERO_EXPERIENCE);
      assert.strictEqual(result.years, 0);
      assert.strictEqual(result.validCount, 1);
      assert.strictEqual(result.invalidCount, 0);
      assert.strictEqual(result.hasValidExperience, true);
    });

    it("identifies VALID_EXPERIENCE when all records are valid and YOE > 0", () => {
      const valid = [
        { startDate: "2021-01-01", endDate: "2023-01-01" }, // 24 months = 2.0 yrs
        { startDate: "2023-01-01", endDate: "2024-01-01" }, // 12 months = 1.0 yr
      ];
      const result = analyzeExperienceHistory(valid);
      assert.strictEqual(result.status, EXPERIENCE_STATUS.VALID_EXPERIENCE);
      assert.strictEqual(result.years, 3.0);
      assert.strictEqual(result.validCount, 2);
      assert.strictEqual(result.invalidCount, 0);
      assert.strictEqual(result.hasValidExperience, true);
    });

    it("identifies PARTIALLY_VALID when valid records coexist with invalid ones", () => {
      const mixed = [
        { startDate: "2022-01-01", endDate: "2024-01-01" }, // valid 24 months = 2.0 yrs
        { startDate: "invalid-date" }, // invalid
        { startDate: "2023-01-01", endDate: "2021-01-01" }, // inverted -> invalid
      ];
      const result = analyzeExperienceHistory(mixed);
      assert.strictEqual(result.status, EXPERIENCE_STATUS.PARTIALLY_VALID);
      assert.strictEqual(result.years, 2.0);
      assert.strictEqual(result.validCount, 1);
      assert.strictEqual(result.invalidCount, 2);
      assert.strictEqual(result.hasValidExperience, true);
    });

    it("respects options.referenceDate in analyzeExperienceHistory", () => {
      const ongoing = [
        { startDate: "2022-06-01", current: true }, // 36 months to 2025-06-01 = 3.0 yrs
      ];
      const result = analyzeExperienceHistory(ongoing, { referenceDate: FIXED_REF_DATE });
      assert.strictEqual(result.years, 3.0);
      assert.strictEqual(result.status, EXPERIENCE_STATUS.VALID_EXPERIENCE);
      assert.strictEqual(result.hasValidExperience, true);
    });
  });
});
