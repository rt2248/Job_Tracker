import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/formatDate";
import { cn } from "../../utils/cn";

/**
 * UpcomingDeadlinesCard - Impending Application Deadlines Widget
 *
 * Scans real application records for impending deadlines (today or in future).
 * Never fabricates mock deadlines or event cards.
 *
 * @param {Object} props
 * @param {Array} props.jobsList - Full authenticated user application records
 * @param {Function} props.onSelectJob - Opens JobDetailModal
 * @param {boolean} props.isLoading - Loading indicator
 * @param {string} [props.className]
 */
export default function UpcomingDeadlinesCard({
  jobsList = [],
  onSelectJob,
  isLoading = false,
  className,
}) {
  const navigate = useNavigate();

  const deadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return jobsList
      .filter((j) => {
        if (!j.deadline) return false;
        const d = new Date(j.deadline);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      })
      .map((j) => {
        const d = new Date(j.deadline);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
        return {
          ...j,
          diffDays,
          isToday: diffDays === 0,
          isTomorrow: diffDays === 1,
        };
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [jobsList]);

  if (isLoading) {
    return (
      <div className={cn("p-5 rounded-2xl bg-surface border border-border-primary animate-pulse", className)}>
        <div className="h-4 w-32 bg-surface-secondary rounded mb-3" />
        <div className="space-y-2.5">
          <div className="h-14 bg-surface-secondary rounded-xl" />
          <div className="h-14 bg-surface-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-labelledby="upcoming-deadlines-title"
      className={cn(
        "p-5 sm:p-6 rounded-2xl bg-surface/90 border border-border-primary shadow-sm flex flex-col justify-between transition-all card-3d",
        className
      )}
    >
      <div>
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 20 20"
              className="w-4 h-4 text-cyan"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="14" height="13" rx="2" />
              <path d="M16 2v4M4 2v4M3 8h14" />
            </svg>
            <h2
              id="upcoming-deadlines-title"
              className="font-display text-base sm:text-lg font-bold text-ink tracking-tight"
            >
              Upcoming Deadlines
            </h2>
          </div>

          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-secondary text-ink border border-border-subtle">
            {deadlines.length} {deadlines.length === 1 ? "due" : "due"}
          </span>
        </div>

        {/* List of Real Impending Deadlines */}
        {deadlines.length > 0 ? (
          <div className="space-y-2.5">
            {deadlines.slice(0, 3).map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => onSelectJob && onSelectJob(job)}
                className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-surface-secondary/70 hover:bg-surface-elevated border border-border-subtle hover:border-cyan/50 transition-all flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-xs sm:text-sm text-ink truncate group-hover:text-cyan transition-colors">
                      {job.company}
                    </span>
                    {job.workMode && (
                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-surface text-muted border border-border-subtle shrink-0">
                        {job.workMode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5 font-sans">
                    {job.role}
                  </p>
                </div>

                {/* Due badge */}
                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center text-[11px] font-mono font-semibold px-2 py-0.5 rounded border",
                      job.isToday
                        ? "bg-red/15 text-red border-red/40 animate-pulse"
                        : job.isTomorrow
                        ? "bg-amber/15 text-amber border-amber/40"
                        : "bg-surface text-ink border-border-subtle"
                    )}
                  >
                    {job.isToday ? "Today" : job.isTomorrow ? "Tomorrow" : `In ${job.diffDays}d`}
                  </span>
                  <p className="text-[10px] font-mono text-muted mt-0.5">
                    {formatDate(job.deadline)}
                  </p>
                </div>
              </button>
            ))}

            {deadlines.length > 3 && (
              <p className="text-xs font-mono text-muted text-center pt-1">
                +{deadlines.length - 3} more impending cutoff{deadlines.length > 4 ? "s" : ""}
              </p>
            )}
          </div>
        ) : (
          /* Clean Serene Empty State — Zero Fabricated Data */
          <div className="py-6 px-4 rounded-xl bg-surface-secondary/30 border border-dashed border-border-subtle text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-muted mb-2">
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 8l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm font-display font-medium text-ink">
              No Impending Deadlines
            </p>
            <p className="text-xs text-muted font-sans mt-0.5 max-w-[240px]">
              You have no active cutoffs approaching. Add deadlines to opportunities to monitor timelines.
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-xs font-sans text-muted">
          Active Cutoff Horizon
        </span>
        <button
          type="button"
          onClick={() => navigate("/search-jobs")}
          className="text-xs font-sans font-semibold text-cyan hover:underline cursor-pointer"
        >
          Explore roles →
        </button>
      </div>
    </div>
  );
}
