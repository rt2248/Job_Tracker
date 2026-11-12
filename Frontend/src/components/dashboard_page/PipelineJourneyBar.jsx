import React from "react";
import { STATUS_ORDER, STATUS_META } from "../../constants/jobStatus";
import { cn } from "../../utils/cn";

/**
 * PipelineJourneyBar - Streamlined milestone progression & stage quick-filter rail.
 * Keeps stage ordering, live counts, and focus-scroll interactions intact without
 * heavy redundant container nesting.
 */
export default function PipelineJourneyBar({
  jobsList = [],
  statusCounts = null,
  selectedStage = null,
  onSelectStage,
  className,
}) {
  const countsByStatus = React.useMemo(() => {
    const acc = {};
    for (const s of STATUS_ORDER) {
      acc[s] = 0;
    }
    if (statusCounts) {
      for (const s of STATUS_ORDER) {
        acc[s] = Number(statusCounts[s]) || 0;
      }
      return acc;
    }
    for (const job of jobsList) {
      if (acc[job.status] !== undefined) {
        acc[job.status] += 1;
      }
    }
    return acc;
  }, [jobsList, statusCounts]);

  const total = React.useMemo(
    () =>
      statusCounts
        ? STATUS_ORDER.reduce((sum, s) => sum + (countsByStatus[s] || 0), 0)
        : jobsList.length,
    [statusCounts, countsByStatus, jobsList.length]
  );

  return (
    <nav
      aria-label="Application pipeline stages"
      className={cn(
        "dashboard-well rounded-xl px-3.5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-x-2.5 gap-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between lg:justify-start gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-semibold uppercase tracking-wider text-muted">
            Pipeline Journey
          </span>
          <span className="font-mono text-[13px] font-bold text-ink bg-surface px-2 py-0.5 rounded-md border border-border-subtle">
            {total}
          </span>
        </div>

        {selectedStage && (
          <button
            type="button"
            onClick={() => onSelectStage(null)}
            className="lg:hidden inline-flex items-center gap-1 text-[13px] font-sans font-semibold text-cyan hover:underline cursor-pointer"
          >
            <span>Clear</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Horizontal Stage Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5 lg:pb-0 flex-1">
        {STATUS_ORDER.map((status, index) => {
          const meta = STATUS_META[status] || { label: status, color: "muted" };
          const count = countsByStatus[status] || 0;
          const isSelected = selectedStage === status;
          const hasCount = count > 0;

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
              ? "bg-yellow-500"
              : status === "accepted"
              ? "bg-emerald-500"
              : "bg-red";

          return (
            <React.Fragment key={status}>
              <button
                type="button"
                onClick={() => onSelectStage(isSelected ? null : status)}
                className={cn(
                  "shrink-0 flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] sm:text-sm font-sans transition-all cursor-pointer select-none border",
                  isSelected
                    ? "bg-surface border-cyan ring-1 ring-cyan/35 text-ink shadow-xs font-semibold"
                    : hasCount
                    ? "bg-surface/85 hover:bg-surface border-border-subtle/80 hover:border-border-primary text-ink font-medium"
                    : "bg-transparent hover:bg-surface/50 border-transparent text-muted opacity-75"
                )}
                aria-pressed={isSelected}
                aria-label={`Filter by ${meta.label} (${count} applications)`}
              >
                <span aria-hidden="true" className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
                <span className="whitespace-nowrap">{meta.label}</span>
                <span
                  className={cn(
                    "font-mono text-[13px] font-bold tabular-nums",
                    isSelected ? "text-cyan" : hasCount ? "text-ink" : "text-muted"
                  )}
                >
                  {count}
                </span>
              </button>

              {index < STATUS_ORDER.length - 1 && (
                <svg
                  viewBox="0 0 12 12"
                  className="hidden xl:block w-3 h-3 shrink-0 text-muted/40"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4.5 2.5 L8 6 L4.5 9.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {selectedStage && (
        <button
          type="button"
          onClick={() => onSelectStage(null)}
          className="hidden lg:inline-flex items-center gap-1 text-[13px] font-sans font-semibold text-cyan hover:text-cyan/80 cursor-pointer shrink-0 pl-1"
          title="Reset stage filter"
        >
          <span>Reset</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </nav>
  );
}
