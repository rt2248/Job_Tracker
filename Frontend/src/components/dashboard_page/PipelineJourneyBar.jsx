import React from "react";
import { STATUS_ORDER, STATUS_META } from "../../constants/jobStatus";
import { cn } from "../../utils/cn";

/**
 * PipelineJourneyBar - Horizontal milestone progression across the career lifecycle
 *
 * Visualizes the flow from Saved -> Applied -> OA -> Interview -> Offer -> Accepted
 * (+ Rejected outcome). Provides interactive quick-filtering to isolate columns or
 * applications by stage.
 *
 * @param {Object} props
 * @param {Array} props.jobsList - Full application records
 * @param {string|null} props.selectedStage - Currently filtered stage
 * @param {Function} props.onSelectStage - Callback when user clicks a stage milestone
 * @param {string} [props.className]
 */
export default function PipelineJourneyBar({
  jobsList = [],
  selectedStage = null,
  onSelectStage,
  className,
}) {
  // Count applications per stage from real data
  const countsByStatus = React.useMemo(() => {
    const acc = {};
    for (const s of STATUS_ORDER) {
      acc[s] = 0;
    }
    for (const job of jobsList) {
      if (acc[job.status] !== undefined) {
        acc[job.status] += 1;
      }
    }
    return acc;
  }, [jobsList]);

  const total = jobsList.length;

  return (
    <div
      role="navigation"
      aria-label="Application pipeline stages"
      className={cn(
        "p-3 sm:p-4 rounded-2xl bg-surface/80 border border-border-primary shadow-sm card-3d",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-ink">
            Pipeline Journey
          </span>
          <span className="text-border-primary/80">·</span>
          <span className="text-xs font-mono text-muted">
            {total} total opportunities
          </span>
        </div>

        {selectedStage && (
          <button
            type="button"
            onClick={() => onSelectStage(null)}
            className="text-xs font-sans font-medium text-cyan hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Reset stage filter</span>
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>

      {/* Responsive Milestone Progression Track */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {STATUS_ORDER.map((status, index) => {
          const meta = STATUS_META[status] || { label: status, color: "muted" };
          const count = countsByStatus[status] || 0;
          const isSelected = selectedStage === status;
          const hasCount = count > 0;

          // Color indicators
          const dotColor =
            status === "saved"
              ? "bg-slate-400"
              : status === "applied"
              ? "bg-cyan"
              : status === "oa"
              ? "bg-amber"
              : status === "interview"
              ? "bg-red"
              : status === "offer"
              ? "bg-yellow"
              : status === "accepted"
              ? "bg-green"
              : "bg-red";

          return (
            <React.Fragment key={status}>
              <button
                type="button"
                onClick={() => onSelectStage(isSelected ? null : status)}
                className={cn(
                  "group shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-sm font-sans transition-all cursor-pointer select-none",
                  isSelected
                    ? "bg-surface-elevated border-cyan ring-2 ring-cyan/30 text-ink shadow-sm"
                    : hasCount
                    ? "bg-surface-secondary/70 hover:bg-surface-secondary border-border-subtle hover:border-border-primary text-ink"
                    : "bg-surface-secondary/30 hover:bg-surface-secondary/50 border-border-subtle/50 text-muted opacity-75"
                )}
                aria-pressed={isSelected}
                aria-label={`Filter by ${meta.label} (${count} applications)`}
              >
                <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
                <span className="font-semibold whitespace-nowrap">
                  {meta.label}
                </span>
                <span
                  className={cn(
                    "font-mono text-xs px-1.5 py-0.2 rounded-md font-bold",
                    isSelected
                      ? "bg-cyan/20 text-cyan"
                      : hasCount
                      ? "bg-surface text-ink border border-border-subtle"
                      : "bg-transparent text-muted"
                  )}
                >
                  {count}
                </span>
              </button>

              {/* Step connector between consecutive stages (except after last) */}
              {index < STATUS_ORDER.length - 1 && (
                <div
                  className="hidden md:flex items-center justify-center shrink-0 text-muted/40"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor">
                    <path d="M4.5 2.5 L8 6 L4.5 9.5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
