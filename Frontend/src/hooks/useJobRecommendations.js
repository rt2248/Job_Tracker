import { useState, useEffect, useCallback, useRef } from "react";
import { getRecommendations } from "../services/jobSearchService";

const initialSummary = {
    totalRecommended: 0,
    excellentCount: 0,
    goodCount: 0,
    potentialCount: 0,
    totalEvaluated: 0,
    onboardingCount: 0,
};

const initialRecommendations = {
    excellent: [],
    good: [],
    potential: [],
    onboarding: [],
};

export function useJobRecommendations() {
    const [profileState, setProfileState] = useState(null);
    const [candidateEvidenceCoverage, setCandidateEvidenceCoverage] = useState(0);
    const [summary, setSummary] = useState(initialSummary);
    const [recommendations, setRecommendations] = useState(initialRecommendations);
    const [meta, setMeta] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // In-memory cache ref to prevent re-fetching across tab switches
    const hasLoadedRef = useRef(false);

    const fetchRecommendations = useCallback(async (force = false) => {
        if (hasLoadedRef.current && !force) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await getRecommendations();
            if (data && data.success) {
                setProfileState(data.profileState || "EVALUATED");
                setCandidateEvidenceCoverage(data.candidateEvidenceCoverage ?? 0);
                setSummary(data.summary || initialSummary);
                setRecommendations({
                    excellent: data.recommendations?.excellent || [],
                    good: data.recommendations?.good || [],
                    potential: data.recommendations?.potential || [],
                    onboarding: data.recommendations?.onboarding || [],
                });
                setMeta(data.meta || {});
                hasLoadedRef.current = true;
            } else {
                throw new Error(data?.message || "Invalid recommendations response");
            }
        } catch (err) {
            console.error("[useJobRecommendations] Fetch error:", err);
            setError(err.message || "Failed to load personalized recommendations");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    const refetch = useCallback(() => {
        return fetchRecommendations(true);
    }, [fetchRecommendations]);

    return {
        profileState,
        candidateEvidenceCoverage,
        summary,
        recommendations,
        meta,
        isLoading,
        error,
        refetch,
    };
}
