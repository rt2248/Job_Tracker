import React from "react";
import Badge from "../shared/Badge";
import { cn } from "../../utils/cn";

/**
 * FallbackNoticeBanner - Displays transparent notification when offline heuristic mode is active.
 *
 * Ensures candidate is always aware when recommendations stem from deterministic
 * heuristic rules rather than live Groq LLM synthesis.
 *
 * @param {Object} props
 * @param {boolean} props.fallbackActive
 * @param {Object} [props.fallbackMetadata]
 * @param {string} [props.className]
 */
export default function FallbackNoticeBanner({
  fallbackActive,
  fallbackMetadata,
  className,
}) {
  if (!fallbackActive) return null;

  const reason = fallbackMetadata?.reason || "Upstream AI provider unavailable or timed out";
  const provider = fallbackMetadata?.provider || "groq";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-lg p-4 sm:p-5 border transition-colors duration-200",
        "bg-amber/10 border-amber/30 text-ink",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-md bg-amber/15 border border-amber/30 text-amber flex items-center justify-center shrink-0 mt-0.5">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="font-display font-semibold text-sm sm:text-base text-ink">
              Deterministic Heuristic Mode Engaged
            </h4>
            <Badge dot variant="amber" size="sm" className="font-semibold">
              Offline Fallback
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            The upstream provider (<span className="font-mono text-xs">{provider}</span>) was unreachable ({reason}).
            This assessment was generated locally using deterministic expert heuristics grounded in your pipeline metrics and profile evidence.
          </p>
          <div className="pt-1 text-xs text-muted flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block shrink-0" aria-hidden="true" />
            <span>Grounded Invariant: Telemetry minimization and evidence bounds remain enforced.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
