import React from "react";
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
        "rounded-xl p-4 sm:p-5 border transition-all duration-200",
        "bg-amber/10 border-amber/30 text-ink",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-lg bg-amber/20 border border-amber/40 text-amber flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
          ⚡
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display font-semibold text-sm sm:text-base text-ink">
              Deterministic Heuristic Mode Engaged
            </h4>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber/20 text-amber border border-amber/40">
              Offline Fallback
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            The upstream provider (<span className="font-mono text-xs">{provider}</span>) was unreachable ({reason}).
            This assessment was generated locally using deterministic expert heuristics grounded in your pipeline metrics and profile evidence.
          </p>
          <div className="pt-1 text-xs text-muted flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
            <span>Grounded Invariant: Telemetry minimization and evidence bounds remain 100% enforced.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
