import React from "react";
import { cn } from "../../utils/cn";

export default function RecommendationBucketHeader({
    title,
    count = 0,
    subtitle,
    tier,
    className,
}) {
    if (count === 0) return null;

    const accentDot =
        tier === "EXCELLENT"
            ? "bg-cyan"
            : tier === "GOOD"
            ? "bg-indigo"
            : "bg-amber-400";

    return (
        <div className={cn("pt-4 pb-2 mb-1 border-b border-border-subtle", className)}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", accentDot)} aria-hidden="true" />
                    <h2 className="font-display text-ink font-bold text-base sm:text-lg tracking-tight">
                        {title}
                    </h2>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-elevated border border-border-primary text-ink-secondary">
                        {count}
                    </span>
                </div>
            </div>
            {subtitle && (
                <p className="text-muted text-xs sm:text-sm font-sans mt-0.5 ml-4 leading-relaxed">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
