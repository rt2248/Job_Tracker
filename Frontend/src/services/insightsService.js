import { getApiUrl } from "../utils/config";

const BASE_URL = getApiUrl("/api/insights");

/**
 * Retrieves consolidated metrics, stale applications, submission velocity,
 * and rule-based insights.
 *
 * @param {Object} [params]
 * @param {'30d'|'90d'|'all'} [params.range='30d']
 * @param {number} [params.staleDays=14]
 * @returns {Promise<Object>}
 */
export const getInsightsSummary = async ({ range = "30d", staleDays = 14 } = {}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();
  if (range) params.set("range", range);
  if (staleDays) params.set("staleDays", String(staleDays));

  const url = `${BASE_URL}/summary?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "Failed to fetch insights summary");
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Retrieves point-in-time pipeline snapshot segmented into Active Stages
 * and Closed Outcomes.
 *
 * @returns {Promise<Object>}
 */
export const getPipelineSnapshot = async () => {
  const token = localStorage.getItem("token");
  const url = `${BASE_URL}/pipeline`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "Failed to fetch pipeline snapshot");
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Retrieves skill-fit analysis for listing-linked applications against
 * the user's declared profile skills.
 *
 * @returns {Promise<Object>}
 */
export const getSkillFitAnalytics = async () => {
  const token = localStorage.getItem("token");
  const url = `${BASE_URL}/skill-fit`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "Failed to fetch skill-fit analytics");
    error.status = response.status;
    throw error;
  }

  return data;
};
