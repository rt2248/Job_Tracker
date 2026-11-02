import { useState, useEffect, useCallback, useRef } from "react";
import {
  getInsightsSummary,
  getPipelineSnapshot,
  getSkillFitAnalytics,
} from "../services/insightsService";
import {
  decodeBase64Url,
  getAuthenticatedUserId,
  userInsightsCache,
  getCachedUserInsights,
  setCachedUserSummary,
  setCachedUserPipeline,
  setCachedUserSkillFit,
  clearUserCache,
  clearAllInsightsCache,
  clearInsightsCache,
  globalSummaryCache,
  getSessionGeneration,
  getGlobalSessionGeneration,
  getUserSessionGeneration,
  isSessionValid,
  invalidateUserSession,
  invalidateInFlightSessions,
} from "../services/insightsCache";

// Re-export cache helpers for backward-compatibility & testing
export {
  decodeBase64Url,
  getAuthenticatedUserId,
  userInsightsCache,
  getCachedUserInsights,
  setCachedUserSummary,
  setCachedUserPipeline,
  setCachedUserSkillFit,
  clearUserCache,
  clearAllInsightsCache,
  clearInsightsCache,
  globalSummaryCache,
  getSessionGeneration,
  getGlobalSessionGeneration,
  getUserSessionGeneration,
  isSessionValid,
  invalidateUserSession,
  invalidateInFlightSessions,
};

/**
 * useInsights - Custom hook for managing Insights state & API calls
 *
 * Implements strict per-user cache isolation, preventing data leaks across
 * different authenticated users, expired/revoked sessions, and in-flight
 * race conditions during logout, manual refresh, or account switching.
 *
 * Pure render phase with side-effect separation: session invalidation and
 * external mutations execute strictly inside effect lifecycles.
 *
 * @param {Object} [options]
 * @param {'30d'|'90d'|'all'} [options.initialRange='30d']
 * @param {number} [options.staleDays=14]
 * @param {boolean} [options.summaryOnly=false]
 */
export default function useInsights({
  initialRange = "30d",
  staleDays = 14,
  summaryOnly = false,
} = {}) {
  // Component mount lifecycle safety guard (resilient to React StrictMode)
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const activeUserId = getAuthenticatedUserId();
  const cacheKey = `${initialRange}_${staleDays}`;

  const initialUserRecord = activeUserId ? getCachedUserInsights(activeUserId) : null;
  const initialSummary = initialUserRecord?.summaries?.[cacheKey] || null;
  const initialPipeline = initialUserRecord?.pipeline || null;
  const initialSkillFit = initialUserRecord?.skillFit || null;

  const [selectedRange, setSelectedRange] = useState(initialRange);
  const [summary, setSummary] = useState(() => initialSummary);
  const [pipeline, setPipeline] = useState(() => initialPipeline);
  const [skillFit, setSkillFit] = useState(() => initialSkillFit);
  const [isLoading, setIsLoading] = useState(() => !initialSummary);
  const [isRangeLoading, setIsRangeLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track the user ID that this component currently has rendered
  const [renderedUserId, setRenderedUserId] = useState(activeUserId);

  // Keep refs in sync for asynchronous operations & stable callback closures
  const activeUserIdRef = useRef(activeUserId);
  const selectedRangeRef = useRef(selectedRange);

  useEffect(() => {
    selectedRangeRef.current = selectedRange;
  }, [selectedRange]);

  // Request sequencing references to guarantee strict FIFO / latest-request ordering
  const activeLoadRequestIdRef = useRef(0);
  const activeRangeRequestIdRef = useRef(0);

  // Synchronous state adjustment during render when active user switches in the same tab.
  // Resets local React state purely without mutating external module-level state during render.
  if (activeUserId !== renderedUserId) {
    setRenderedUserId(activeUserId);

    const newRecord = activeUserId ? getCachedUserInsights(activeUserId) : null;
    const newSummary = newRecord?.summaries?.[cacheKey] || null;
    const newPipeline = newRecord?.pipeline || null;
    const newSkillFit = newRecord?.skillFit || null;

    setSummary(newSummary);
    setPipeline(newPipeline);
    setSkillFit(newSkillFit);
    setIsLoading(!newSummary);
    setError(null);
  }

  // Proper lifecycle effect for session invalidation on user change (keeps render pure)
  useEffect(() => {
    if (activeUserId !== activeUserIdRef.current) {
      const previousUserId = activeUserIdRef.current;
      activeUserIdRef.current = activeUserId;
      if (previousUserId) {
        invalidateUserSession(previousUserId);
      }
    }
  }, [activeUserId]);

  // 1. Initial Load / Cache Verification with In-Flight Race Condition Guards
  // Kept stable across range changes to avoid duplicate requests when onRangeChange is called
  const loadInsights = useCallback(
    async (force = false, targetRange = null) => {
      const currentUserId = getAuthenticatedUserId();

      // If session is invalid/expired, reset states and avoid fetching
      if (!currentUserId) {
        if (isMountedRef.current) {
          setSummary(null);
          setPipeline(null);
          setSkillFit(null);
          setIsLoading(false);
        }
        return;
      }

      const requestRange = targetRange || selectedRangeRef.current;
      const requestCacheKey = `${requestRange}_${staleDays}`;

      // Snapshot the request identity & session generation before making the async calls
      const requestUserId = currentUserId;
      const requestSessionGen = getSessionGeneration(requestUserId);
      const loadRequestId = ++activeLoadRequestIdRef.current;

      const userRecord = getCachedUserInsights(currentUserId);
      const cachedSummary = userRecord?.summaries?.[requestCacheKey];

      // Check user cache unless forcing refresh
      if (!force && cachedSummary) {
        if (isMountedRef.current && selectedRangeRef.current === requestRange) {
          setSummary(cachedSummary);
        }
        if (summaryOnly || (userRecord?.pipeline && userRecord?.skillFit)) {
          if (!summaryOnly && isMountedRef.current) {
            setPipeline(userRecord.pipeline);
            setSkillFit(userRecord.skillFit);
          }
          if (isMountedRef.current) {
            setIsLoading(false);
          }
          return;
        }
      }

      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      try {
        if (summaryOnly) {
          // Dashboard preview: fetch only summary
          const summaryRes = await getInsightsSummary({ range: requestRange, staleDays });

          // RACE CONDITION & ORDERING GUARD:
          if (
            !isSessionValid(requestUserId, requestSessionGen) ||
            loadRequestId !== activeLoadRequestIdRef.current
          ) {
            return;
          }

          setCachedUserSummary(requestUserId, requestCacheKey, summaryRes);
          // Only update summary state if the user hasn't switched to a different range while in flight
          if (isMountedRef.current && selectedRangeRef.current === requestRange) {
            setSummary(summaryRes);
          }
        } else {
          // Dedicated page: fetch only endpoints that are not yet cached (or when forced)
          const needSummary = force || !cachedSummary;
          const needPipeline = force || !userRecord?.pipeline;
          const needSkillFit = force || !userRecord?.skillFit;

          const promises = [];
          const promiseKeys = [];

          if (needSummary) {
            promises.push(getInsightsSummary({ range: requestRange, staleDays }));
            promiseKeys.push("summary");
          }
          if (needPipeline) {
            promises.push(getPipelineSnapshot());
            promiseKeys.push("pipeline");
          }
          if (needSkillFit) {
            promises.push(getSkillFitAnalytics());
            promiseKeys.push("skillFit");
          }

          if (promises.length > 0) {
            const results = await Promise.all(promises);

            // RACE CONDITION & ORDERING GUARD:
            if (
              !isSessionValid(requestUserId, requestSessionGen) ||
              loadRequestId !== activeLoadRequestIdRef.current
            ) {
              return;
            }

            for (let i = 0; i < promiseKeys.length; i++) {
              const key = promiseKeys[i];
              const res = results[i];
              if (key === "summary") {
                setCachedUserSummary(requestUserId, requestCacheKey, res);
                if (isMountedRef.current && selectedRangeRef.current === requestRange) {
                  setSummary(res);
                }
              } else if (key === "pipeline") {
                setCachedUserPipeline(requestUserId, res);
                if (isMountedRef.current) setPipeline(res);
              } else if (key === "skillFit") {
                setCachedUserSkillFit(requestUserId, res);
                if (isMountedRef.current) setSkillFit(res);
              }
            }
          }
        }
      } catch (err) {
        // RACE CONDITION GUARD:
        if (
          !isSessionValid(requestUserId, requestSessionGen) ||
          loadRequestId !== activeLoadRequestIdRef.current
        ) {
          return;
        }

        const isAuthError =
          err.status === 401 ||
          err.message?.includes("401") ||
          err.message?.toLowerCase().includes("session expired") ||
          err.message?.toLowerCase().includes("unauthorized");

        if (isAuthError) {
          // Current session 401:
          // 1. Invalidate this user's outstanding requests (prevents concurrent successes from repopulating)
          invalidateUserSession(requestUserId);
          // 2. Clear that user's analytics cache
          clearUserCache(requestUserId);
          // 3. Clear analytics state
          if (isMountedRef.current) {
            setSummary(null);
            setPipeline(null);
            setSkillFit(null);
            setError(err.message || "Session expired or unauthorized");
            // 4. Settle all relevant loading states safely
            setIsLoading(false);
            setIsRangeLoading(false);
          }
        } else {
          if (isMountedRef.current) {
            setError(err.message || "Failed to load insights data");
          }
        }
      } finally {
        if (isMountedRef.current) {
          // Settle loading state if this request still belongs to the active user session and is the latest request
          if (
            isSessionValid(requestUserId, requestSessionGen) &&
            loadRequestId === activeLoadRequestIdRef.current
          ) {
            setIsLoading(false);
          }
        }
      }
    },
    [staleDays, summaryOnly]
  );

  // Trigger load on initial mount and when authenticated user changes
  useEffect(() => {
    loadInsights();
  }, [loadInsights, renderedUserId]);

  // 2. Cross-Tab Logout & Account Switch Detection via Native Storage Event
  useEffect(() => {
    const handleAccountState = () => {
      const currentUserId = getAuthenticatedUserId();
      if (currentUserId !== activeUserIdRef.current) {
        const previousUserId = activeUserIdRef.current;
        activeUserIdRef.current = currentUserId;

        if (previousUserId) {
          invalidateUserSession(previousUserId);
        }

        if (!currentUserId) {
          clearAllInsightsCache();
          if (isMountedRef.current) {
            setSummary(null);
            setPipeline(null);
            setSkillFit(null);
          }
        } else {
          // New user session: read that user's cache and re-fetch
          const currentKey = `${selectedRangeRef.current}_${staleDays}`;
          const newRecord = getCachedUserInsights(currentUserId);
          if (isMountedRef.current) {
            setSummary(newRecord?.summaries?.[currentKey] || null);
            setPipeline(newRecord?.pipeline || null);
            setSkillFit(newRecord?.skillFit || null);
          }
          loadInsights(true);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleAccountState);
      return () => window.removeEventListener("storage", handleAccountState);
    }
  }, [staleDays, loadInsights]);

  // 3. Time Range Switcher (Uses active user cache or fetches on demand with range-request ordering guard)
  // Exclusively handles range switching without triggering full loadInsights duplicate calls
  const handleRangeChange = useCallback(
    async (nextRange) => {
      if (nextRange === selectedRangeRef.current) return;
      setSelectedRange(nextRange);
      selectedRangeRef.current = nextRange;

      const currentUserId = getAuthenticatedUserId();
      const nextCacheKey = `${nextRange}_${staleDays}`;

      if (currentUserId) {
        const userRecord = getCachedUserInsights(currentUserId);
        if (userRecord?.summaries?.[nextCacheKey]) {
          if (isMountedRef.current) {
            setSummary(userRecord.summaries[nextCacheKey]);
            setIsRangeLoading(false);
          }
          return;
        }
      }

      const requestUserId = currentUserId;
      const requestSessionGen = getSessionGeneration(requestUserId);
      const rangeRequestId = ++activeRangeRequestIdRef.current;

      if (isMountedRef.current) {
        setIsRangeLoading(true);
      }

      try {
        const nextSummary = await getInsightsSummary({ range: nextRange, staleDays });

        // RACE CONDITION & ORDERING GUARD:
        if (
          !isMountedRef.current ||
          !isSessionValid(requestUserId, requestSessionGen) ||
          rangeRequestId !== activeRangeRequestIdRef.current
        ) {
          return;
        }

        if (requestUserId) {
          setCachedUserSummary(requestUserId, nextCacheKey, nextSummary);
        }
        setSummary(nextSummary);
      } catch (err) {
        if (
          !isMountedRef.current ||
          !isSessionValid(requestUserId, requestSessionGen) ||
          rangeRequestId !== activeRangeRequestIdRef.current
        ) {
          return;
        }

        const isAuthError =
          err.status === 401 ||
          err.message?.includes("401") ||
          err.message?.toLowerCase().includes("session expired") ||
          err.message?.toLowerCase().includes("unauthorized");

        if (isAuthError && requestUserId) {
          invalidateUserSession(requestUserId);
          clearUserCache(requestUserId);
          setSummary(null);
          setPipeline(null);
          setSkillFit(null);
          setError(err.message || "Session expired or unauthorized");
          setIsRangeLoading(false);
          setIsLoading(false);
        } else {
          setError(err.message || "Failed to update time range");
        }
      } finally {
        if (isMountedRef.current) {
          if (
            isSessionValid(requestUserId, requestSessionGen) &&
            rangeRequestId === activeRangeRequestIdRef.current
          ) {
            setIsRangeLoading(false);
          }
        }
      }
    },
    [staleDays]
  );

  // 4. Manual Refetch
  // 1. Invalidate previous pending requests for this user
  // 2. Clear that user's cache
  // 3. Start fresh request using the new generation
  const refetch = useCallback(() => {
    const currentUserId = getAuthenticatedUserId();
    if (currentUserId) {
      invalidateUserSession(currentUserId);
      clearUserCache(currentUserId);
    }
    return loadInsights(true);
  }, [loadInsights]);

  return {
    summary,
    pipeline,
    skillFit,
    selectedRange,
    onRangeChange: handleRangeChange,
    isLoading,
    isRangeLoading,
    error,
    refetch,
  };
}
