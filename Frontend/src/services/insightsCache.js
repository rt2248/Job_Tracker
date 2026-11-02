/**
 * insightsCache.js - Pure JavaScript Session & Per-User Insights Caching Layer
 *
 * Implements strict multi-tenant cache isolation, JWT payload decoding,
 * session-generation guards for in-flight request race conditions, and
 * safe cache invalidation on logout and session revocation.
 *
 * Decoupled from React to ensure import and runtime safety across utilities,
 * services, and hooks.
 */

// Monotonically increasing global session generation counter for global logout
let globalSessionGeneration = 1;

// Per-user session generation map to track in-flight requests per user
// Map<userId, number>
const userSessionGenerations = new Map();

/**
 * Returns the global session generation.
 *
 * @returns {number}
 */
export function getGlobalSessionGeneration() {
  return globalSessionGeneration;
}

/**
 * Returns the current session generation for a specific user.
 *
 * @param {string} userId
 * @returns {number}
 */
export function getUserSessionGeneration(userId) {
  if (!userId) return 0;
  return userSessionGenerations.get(String(userId)) || 1;
}

/**
 * Returns the composite session generation string for a given user.
 * Combines user ID, per-user generation, and global session generation.
 *
 * @param {string} [userId]
 * @returns {string}
 */
export function getSessionGeneration(userId = null) {
  if (userId) {
    const id = String(userId);
    const uGen = userSessionGenerations.get(id) || 1;
    return `${id}:${uGen}:${globalSessionGeneration}`;
  }
  return `global:${globalSessionGeneration}`;
}

/**
 * Evaluates whether a request session is still valid.
 * A request is valid if:
 * 1. The user ID is provided and matches the currently authenticated active user.
 * 2. The combined session generation (user generation + global generation) matches exactly.
 *
 * @param {string} requestUserId
 * @param {string} requestSessionGen
 * @returns {boolean}
 */
export function isSessionValid(requestUserId, requestSessionGen) {
  if (!requestUserId || !requestSessionGen) return false;
  const currentUserId = getAuthenticatedUserId();
  if (currentUserId !== String(requestUserId)) return false;
  return getSessionGeneration(requestUserId) === requestSessionGen;
}

/**
 * Bumps the session generation for a specific user, invalidating in-flight requests
 * for that user only (used on account switch, manual refresh, and auth failure).
 * Preserves other users' sessions and caches.
 *
 * @param {string} userId
 */
export function invalidateUserSession(userId) {
  if (!userId) return;
  const id = String(userId);
  const current = userSessionGenerations.get(id) || 1;
  userSessionGenerations.set(id, current + 1);
}

/**
 * Bumps the global session generation, invalidating all in-flight requests across all users.
 * Used on global logout.
 */
export function invalidateInFlightSessions() {
  globalSessionGeneration++;
  userSessionGenerations.clear();
}

/**
 * Safely decodes a Base64URL-encoded string into a UTF-8 JSON object.
 * Fully RFC 7519 compliant: handles '-', '_', and missing padding '='.
 *
 * @param {string} str
 * @returns {Object|null}
 */
export function decodeBase64Url(str) {
  if (typeof str !== "string" || !str.trim()) return null;

  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

    const remainder = base64.length % 4;
    if (remainder === 2) {
      base64 += "==";
    } else if (remainder === 3) {
      base64 += "=";
    } else if (remainder === 1) {
      return null;
    }

    let jsonStr = "";
    if (typeof atob === "function") {
      jsonStr = atob(base64);
    } else if (typeof Buffer !== "undefined") {
      jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    } else {
      return null;
    }

    const parsed = JSON.parse(jsonStr);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Extracts and strictly validates the authenticated userId from the active token in localStorage.
 * Requirements:
 * 1. Non-empty userId claim (string or number).
 * 2. Valid numeric exp claim (must be a finite number).
 * 3. Token must not be expired (exp * 1000 >= Date.now()).
 * 4. Never exposes or logs the token or credentials.
 * 5. Returns null if invalid, missing, or expired.
 *
 * Note: The returned userId is treated STRICTLY as a client-side cache partition selector,
 * never as cryptographic authentication proof. Backend requests continue to send the full
 * Bearer token for server-side verification.
 *
 * @returns {string|null}
 */
export function getAuthenticatedUserId() {
  try {
    const storage =
      typeof window !== "undefined" && window.localStorage
        ? window.localStorage
        : typeof globalThis !== "undefined" && globalThis.localStorage
        ? globalThis.localStorage
        : null;

    if (!storage) return null;
    const token = storage.getItem("token");
    if (typeof token !== "string" || !token.trim()) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = decodeBase64Url(parts[1]);
    if (!payload) return null;

    if (payload.userId === undefined || payload.userId === null) return null;
    const userIdStr = String(payload.userId).trim();
    if (!userIdStr) return null;

    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }

    if (payload.exp * 1000 < Date.now()) {
      return null;
    }

    return userIdStr;
  } catch {
    return null;
  }
}

/**
 * User-isolated in-memory cache partition store:
 * Map<userId, {
 *   summaries: { [cacheKey]: Object },
 *   pipeline: Object|null,
 *   skillFit: Object|null,
 *   cachedAt: number
 * }>
 */
export const userInsightsCache = new Map();

/**
 * Retrieves the cached insights record for a specific authenticated user.
 *
 * @param {string} userId
 * @returns {Object|null}
 */
export function getCachedUserInsights(userId) {
  if (!userId) return null;
  return userInsightsCache.get(String(userId)) || null;
}

/**
 * Updates the cached summary for a specific user.
 */
export function setCachedUserSummary(userId, cacheKey, data) {
  if (!userId || !data) return;
  const id = String(userId);
  let record = userInsightsCache.get(id);
  if (!record) {
    record = { summaries: {}, pipeline: null, skillFit: null, cachedAt: Date.now() };
    userInsightsCache.set(id, record);
  }
  record.summaries[cacheKey] = data;
}

/**
 * Updates the cached pipeline snapshot for a specific user.
 */
export function setCachedUserPipeline(userId, data) {
  if (!userId || !data) return;
  const id = String(userId);
  let record = userInsightsCache.get(id);
  if (!record) {
    record = { summaries: {}, pipeline: null, skillFit: null, cachedAt: Date.now() };
    userInsightsCache.set(id, record);
  }
  record.pipeline = data;
}

/**
 * Updates the cached skill-fit analytics for a specific user.
 */
export function setCachedUserSkillFit(userId, data) {
  if (!userId || !data) return;
  const id = String(userId);
  let record = userInsightsCache.get(id);
  if (!record) {
    record = { summaries: {}, pipeline: null, skillFit: null, cachedAt: Date.now() };
    userInsightsCache.set(id, record);
  }
  record.skillFit = data;
}

/**
 * Clears only a specific user's cached analytics data without invalidating
 * global session generation or disrupting unrelated sessions.
 *
 * @param {string} userId
 */
export function clearUserCache(userId) {
  if (!userId) return;
  userInsightsCache.delete(String(userId));
}

/**
 * Clears all cached analytics data and invalidates all in-flight sessions globally.
 * Used on user logout.
 */
export function clearAllInsightsCache() {
  invalidateInFlightSessions();
  userInsightsCache.clear();
}

/**
 * Unified cache clearer.
 * If userId is provided, clears only that user's partition (targeted deletion);
 * otherwise clears all partitions and invalidates all in-flight sessions globally.
 *
 * @param {string} [userId]
 */
export function clearInsightsCache(userId = null) {
  if (userId) {
    clearUserCache(userId);
  } else {
    clearAllInsightsCache();
  }
}

/**
 * Backward-compatible transparent proxy to userInsightsCache for the current authenticated user.
 */
export const globalSummaryCache = new Proxy(
  {},
  {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      const userId = getAuthenticatedUserId();
      if (!userId) return undefined;
      const record = userInsightsCache.get(userId);
      return record?.summaries?.[prop];
    },
    set(_target, prop, value) {
      if (typeof prop !== "string") return false;
      const userId = getAuthenticatedUserId();
      if (!userId) return false;
      setCachedUserSummary(userId, prop, value);
      return true;
    },
    deleteProperty(_target, prop) {
      if (typeof prop !== "string") return true;
      const userId = getAuthenticatedUserId();
      if (!userId) return true;
      const record = userInsightsCache.get(userId);
      if (record?.summaries) {
        delete record.summaries[prop];
      }
      return true;
    },
    ownKeys() {
      const userId = getAuthenticatedUserId();
      if (!userId) return [];
      const record = userInsightsCache.get(userId);
      return record?.summaries ? Object.keys(record.summaries) : [];
    },
    getOwnPropertyDescriptor(_target, prop) {
      const userId = getAuthenticatedUserId();
      if (!userId) return undefined;
      const record = userInsightsCache.get(userId);
      if (record?.summaries && prop in record.summaries) {
        return { enumerable: true, configurable: true, value: record.summaries[prop] };
      }
      return undefined;
    },
    has(_target, prop) {
      const userId = getAuthenticatedUserId();
      if (!userId) return false;
      const record = userInsightsCache.get(userId);
      return Boolean(record?.summaries && prop in record.summaries);
    },
  }
);
