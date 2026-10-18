import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "../utils/config";
import { useToast } from "../hooks/useToast";

const TrackingContext = createContext(null);

export function TrackingProvider({ children }) {
    const [trackedMap, setTrackedMap] = useState({});
    const [inFlightIds, setInFlightIds] = useState(new Set());
    const [isLoadingTracked, setIsLoadingTracked] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const fetchTrackedListings = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setIsLoadingTracked(true);
            const response = await fetch(getApiUrl("/api/jobs/tracked-listings"), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.tracked) {
                    setTrackedMap(data.tracked);
                }
            }
        } catch (err) {
            console.error("Failed to load tracked listings:", err);
        } finally {
            setIsLoadingTracked(false);
        }
    }, []);

    useEffect(() => {
        fetchTrackedListings();
    }, [fetchTrackedListings]);

    const isTracked = useCallback((listingId) => {
        if (!listingId) return false;
        return Boolean(trackedMap[listingId]);
    }, [trackedMap]);

    const getJobId = useCallback((listingId) => {
        if (!listingId) return undefined;
        return trackedMap[listingId];
    }, [trackedMap]);

    const isInFlight = useCallback((listingId) => {
        if (!listingId) return false;
        return inFlightIds.has(listingId);
    }, [inFlightIds]);

    const addToTracker = useCallback(async (listing) => {
        if (!listing?.id) return { success: false, error: "Missing listing" };
        const listingId = listing.id;

        // In-flight guard: prevent concurrent requests for the same listing
        if (inFlightIds.has(listingId)) {
            return { success: false, inFlight: true };
        }

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please log in to track jobs");
            return { success: false, error: "Unauthorized" };
        }

        setInFlightIds((prev) => new Set(prev).add(listingId));

        try {
            const response = await fetch(getApiUrl("/api/jobs/from-listing"), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ listingId }),
            });

            const data = await response.json();

            if (response.status === 201) {
                const jobId = data.job?.id;
                if (jobId) {
                    setTrackedMap((prev) => ({ ...prev, [listingId]: jobId }));
                }
                toast.success("Job added to tracker", {
                    action: jobId ? {
                        label: "View Application",
                        onClick: () => navigate(`/applications?job=${jobId}`),
                    } : null,
                });
                return { success: true, job: data.job };
            }

            if (response.status === 409) {
                const jobId = data.job?.id;
                if (jobId) {
                    setTrackedMap((prev) => ({ ...prev, [listingId]: jobId }));
                }
                toast.info("Already in your tracker", {
                    action: jobId ? {
                        label: "View in Tracker",
                        onClick: () => navigate(`/applications?job=${jobId}`),
                    } : null,
                });
                return { success: false, duplicate: true, job: data.job };
            }

            const errorMsg = data.message || "Failed to add job to tracker";
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        } catch (err) {
            console.error("Network error adding to tracker:", err);
            toast.error("Network error while adding to tracker");
            return { success: false, error: err };
        } finally {
            setInFlightIds((prev) => {
                const next = new Set(prev);
                next.delete(listingId);
                return next;
            });
        }
    }, [inFlightIds, toast, navigate]);

    const value = {
        trackedMap,
        isLoadingTracked,
        isTracked,
        getJobId,
        isInFlight,
        addToTracker,
        fetchTrackedListings,
    };

    return (
        <TrackingContext.Provider value={value}>
            {children}
        </TrackingContext.Provider>
    );
}

export { TrackingContext };
