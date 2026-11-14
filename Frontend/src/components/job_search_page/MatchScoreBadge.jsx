import React from "react";
import { cn } from "../../utils/cn";

const TIER_LABELS = {
    EXCELLENT: "Excellent Match",
    GOOD: "Good Match",
    POTENTIAL: "Potential Match",
    POTENTIAL_PARTIAL_EVIDENCE: "Potential (Partial Evidence)",
};

export default function MatchScoreBadge({
    score,
    tier,
    showTier = false,
    size = "md",
    className,
}) {
    // In onboarding mode or when score is nullish, never display fabricated match scores
    if (tier === "ONBOARDING_BASELINE" || score === undefined || score === null) {
        return null;
    }

    const numericScore = Math.round(Number(score) || 0);

    const isExcellent = tier === "EXCELLENT" || numericScore >= 75;
    const isGood = tier === "GOOD" || (numericScore >= 50 && numericScore < 75);

    const tierStyle = isExcellent
        ? "text-cyan border-cyan/50 bg-cyan/10"
        : isGood
        ? "text-indigo border-indigo/50 bg-indigo/10"
        : "text-amber-400 border-amber-400/40 bg-amber-400/10";

    const sizeStyle =
        size === "sm"
            ? "text-xs px-2 py-0.5"
            : "text-xs sm:text-sm px-2.5 py-1";

    const tierLabel = TIER_LABELS[tier] || (isExcellent ? "Excellent" : isGood ? "Good" : "Potential");

    return (
        <span
            role="status"
            aria-label={`${numericScore}% match fit, ${tierLabel}`}
            className={cn(
                "inline-flex items-center gap-1.5 font-mono font-bold rounded-lg border tracking-tight shrink-0 transition-colors",
                tierStyle,
                sizeStyle,
                className
            )}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
            <span>{numericScore}% Match</span>
            {showTier && (
                <span className="text-muted font-sans font-medium text-xs hidden sm:inline">
                    · {tierLabel}
                </span>
            )}
        </span>
    );
}
