import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/formatDate";
import { cn } from "../../utils/cn";

/**
 * UpcomingDeadlinesCard - Tabular ledger for impending application cutoffs.
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
      <div className={cn("p-5 rounded-xl dashboard-panel animate-pulse", className)}>
        <div className="h-4 w-32 bg-surface-secondary rounded mb-3" />
        <div className="space-y-2.5">
          <div className="h-14 bg-surface-secondary rounded-lg" />
          <div className="h-14 bg-surface-secondary rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-labelledby="upcoming-deadlines-title"
      className={cn(
        "px-5 py-6 sm:px-6 sm:py-7 rounded-xl dashboard-panel flex flex-col justify-between transition-all",
        className
      )}
    >
      <div>
        {/* Ledger Header */}
        <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 20 20"
              className="w-4 h-4 text-cyan shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="14" height="13" rx="2" />
              <path d="M16 2v4M4 2v4M3 8h14" />
            </svg>
            <h3
              id="upcoming-deadlines-title"
              className="font-display text-base sm:text-lg font-bold text-ink tracking-tight"
            >
              Upcoming Deadlines
            </h3>
          </div>

          <span className="text-[13px] font-mono font-bold text-muted tabular-nums">
            {deadlines.length} due
          </span>
        </div>

        {/* Tabular Deadline Rows (Clean hairline dividers, no card-in-card spam) */}
        {deadlines.length > 0 ? (
          <div className="divide-y divide-border-subtle/80">
            {deadlines.slice(0, 3).map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => onSelectJob && onSelectJob(job)}
                className="w-full text-left py-3 px-1.5 -mx-1.5 rounded-lg hover:bg-surface-secondary/70 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-sm text-ink truncate group-hover:text-cyan transition-colors">
                      {job.company}
                    </span>
                    {job.workMode && (
                      <span className="text-xs font-mono text-muted shrink-0">
                        · {job.workMode}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] sm:text-sm text-muted truncate mt-0.5 font-sans">
                    {job.role}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "inline-block text-[13px] font-mono font-bold",
                      job.isToday
                        ? "text-red"
                        : job.isTomorrow
                        ? "text-amber"
                        : "text-ink"
                    )}
                  >
                    {job.isToday ? "Today" : job.isTomorrow ? "Tomorrow" : `In ${job.diffDays}d`}
                  </span>
                  <p className="text-xs font-mono text-muted mt-0.5">
                    {formatDate(job.deadline)}
                  </p>
                </div>
              </button>
            ))}

            {deadlines.length > 3 && (
              <p className="text-[13px] font-mono text-muted text-center pt-3">
                +{deadlines.length - 3} more impending cutoff{deadlines.length > 4 ? "s" : ""}
              </p>
            )}
          </div>
        ) : (
          /* Serene Compact Empty State — Zero Wasted Empty Container */
          <div className="py-6 px-2 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-ink">
                No Impending Deadlines
              </p>
              <p className="text-sm text-muted font-sans mt-1.5 leading-relaxed">
                No active cutoffs approaching. Set application deadlines on roles to track urgent submission dates here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="mt-5 pt-4 border-t border-border-subtle flex items-center justify-between">
        <span className="text-[13px] sm:text-sm font-sans text-muted">
          Active Cutoff Horizon
        </span>
        <button
          type="button"
          onClick={() => navigate("/jobsearch")}
          className="text-[13px] sm:text-sm font-sans font-semibold text-cyan hover:underline cursor-pointer"
        >
          Explore roles →
        </button>
      </div>
    </div>
  );
}
