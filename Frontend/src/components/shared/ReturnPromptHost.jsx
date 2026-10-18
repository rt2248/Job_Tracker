import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useTrackListing } from "../../hooks/useTrackListing";
import Button from "./Button";
import {
    MIN_AWAY_TIME_MS,
    DISMISS_COOLDOWN_MS,
    VISIT_EXPIRY_MS,
    getPendingVisits,
    clearPendingVisits,
    savePendingVisits,
    getDismissals,
    recordDismissal,
    getActiveClaim,
    setActiveClaim,
    getUserIdFromToken,
} from "../../utils/promptStorage";

export default function ReturnPromptHost() {
    const { returnPromptsEnabled, isLoading: isSettingsLoading } = useSettings();
    const { isTracked, addToTracker, isInFlight, isLoadingTracked } = useTrackListing();
    const [promptData, setPromptData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEvaluatingRef = useRef(false);

    const handleDismiss = useCallback((listingId) => {
        const userId = getUserIdFromToken();
        if (listingId && userId) {
            recordDismissal(listingId, userId);
        }
        if (userId) {
            clearPendingVisits(userId);
        }
        setPromptData(null);
    }, []);

    const checkForPrompt = useCallback(() => {
        // Wait for settings and tracking state to complete loading
        if (isSettingsLoading || isLoadingTracked) return;
        // Must have feature enabled
        if (!returnPromptsEnabled) return;
        // Do not interrupt if prompt is already displayed
        if (promptData) return;

        // Guard against simultaneous visibilitychange + focus evaluation
        if (isEvaluatingRef.current) return;
        isEvaluatingRef.current = true;

        try {
            const userId = getUserIdFromToken();
            if (!userId) return;

            const visits = getPendingVisits(userId);
            if (!Array.isArray(visits) || visits.length === 0) return;

            const now = Date.now();
            // Prune expired (> 30 mins)
            const validVisits = visits.filter((v) => now - v.clickedAt < VISIT_EXPIRY_MS);
            if (validVisits.length === 0) {
                clearPendingVisits(userId);
                return;
            }

            // Check the most recent external visit
            const candidate = validVisits[0];
            const awayDuration = now - candidate.clickedAt;

            // Must meet the minimum away threshold (8 seconds)
            if (awayDuration < MIN_AWAY_TIME_MS) {
                savePendingVisits(validVisits, userId);
                return;
            }

            // Consume all pending visits immediately so multiple tabs cannot cause a cascade queue
            clearPendingVisits(userId);

            // Check if already tracked
            if (isTracked(candidate.listingId)) {
                return;
            }

            // Check dismissal cooldown (24h cooldown, no permanent ban)
            const dismissals = getDismissals(userId);
            const dismissalEntry = dismissals[candidate.listingId];
            if (dismissalEntry && now - dismissalEntry.lastDismissedAt < DISMISS_COOLDOWN_MS) {
                return;
            }

            // Cross-tab claim guard (10 seconds)
            const activeClaim = getActiveClaim(userId);
            if (
                activeClaim &&
                activeClaim.listingId === candidate.listingId &&
                now - activeClaim.timestamp < 10000
            ) {
                return;
            }

            // Claim this prompt for current tab
            setActiveClaim({ listingId: candidate.listingId, timestamp: now }, userId);

            // Show prompt
            setPromptData(candidate);
        } catch (err) {
            console.error("Error evaluating return prompt:", err);
        } finally {
            isEvaluatingRef.current = false;
        }
    }, [isSettingsLoading, isLoadingTracked, returnPromptsEnabled, promptData, isTracked]);

    useEffect(() => {
        let timer = null;

        const triggerCheck = () => {
            if (timer) clearTimeout(timer);
            // Small debounce to collapse immediate visibilitychange + focus pairs
            timer = setTimeout(() => {
                checkForPrompt();
            }, 100);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                triggerCheck();
            }
        };

        const handleFocus = () => {
            triggerCheck();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);

        return () => {
            if (timer) clearTimeout(timer);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleFocus);
        };
    }, [checkForPrompt]);

    // Keyboard navigation & body scroll lock
    useEffect(() => {
        if (!promptData) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape" && !isSubmitting) {
                handleDismiss(promptData.listingId);
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [promptData, isSubmitting, handleDismiss]);

    if (!promptData || isTracked(promptData.listingId)) return null;

    const handleAdd = async () => {
        setIsSubmitting(true);
        try {
            await addToTracker({ id: promptData.listingId });
            const userId = getUserIdFromToken();
            if (userId) {
                clearPendingVisits(userId);
            }
            setPromptData(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasCompany = Boolean(promptData.company);
    const hasLocation = Boolean(promptData.location);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md animate-modal-backdrop"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) {
                    handleDismiss(promptData.listingId);
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-prompt-title"
        >
            {/* Modal Card matching LogoutModal design tokens */}
            <div className="relative w-full max-w-md p-6 overflow-hidden bg-surface/95 rounded-2xl border border-indigo/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_25px_rgba(99,102,241,0.12)] bg-[radial-gradient(100%_100%_at_50%_0%,rgba(99,102,241,0.12)_0%,transparent_75%)] animate-modal-content">

                {/* Close Button */}
                <button
                    onClick={() => handleDismiss(promptData.listingId)}
                    disabled={isSubmitting}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-secondary transition-all duration-200 focus:outline-none"
                    aria-label="Close dialog"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header Icon */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4 flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo/15 border border-indigo/30 text-indigo shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan rounded-full animate-ping opacity-75" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan rounded-full" />
                    </div>

                    {/* Title */}
                    <h3 id="return-prompt-title" className="text-xl font-bold font-display text-ink tracking-tight">
                        Thinking about this opportunity?
                    </h3>

                    {/* Opportunity Details */}
                    <div className="mt-3 p-3.5 rounded-xl bg-surface-secondary/70 border border-border-primary w-full text-center">
                        <p className="font-display text-base font-semibold text-ink">
                            {promptData.title}
                        </p>
                        {(hasCompany || hasLocation) && (
                            <p className="text-muted text-xs sm:text-sm font-sans mt-0.5">
                                {hasCompany && <span className="text-ink-secondary font-medium">{promptData.company}</span>}
                                {hasCompany && hasLocation && <span> · </span>}
                                {hasLocation && <span>{promptData.location}</span>}
                            </p>
                        )}
                    </div>

                    {/* Prompt message */}
                    <p className="mt-4 text-xs sm:text-sm font-sans text-muted leading-relaxed max-w-sm">
                        You’ve been exploring this opportunity. Would you like to keep it on your radar?
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border-subtle">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleDismiss(promptData.listingId)}
                        disabled={isSubmitting}
                        className="text-xs sm:text-sm"
                    >
                        Maybe Later
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleAdd}
                        disabled={isSubmitting || isInFlight(promptData.listingId)}
                        className="text-xs sm:text-sm flex items-center gap-1.5"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                Adding...
                            </>
                        ) : (
                            "+ Add to Tracker"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
