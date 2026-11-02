import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useInsights from "../../hooks/useInsights";
import Card from "../shared/Card";
import Button from "../shared/Button";
import { SubmissionActivityChart } from "../insights";
import { cn } from "../../utils/cn";

/**
 * DashboardInsightsSection - Compact Insights Section for Main Dashboard
 *
 * Integrates directly below the statistics area on /dashboard.
 * Surfaces key volume/pipeline metrics, 30-day activity preview,
 * highest-priority recommendation, and stale application alerts.
 * Uses `summaryOnly` mode to avoid redundant pipeline/skill-fit requests.
 *
 * @param {Object} props
 * @param {string} [props.className]
 */
export default function DashboardInsightsSection({ className }) {
  const navigate = useNavigate();

  // Fetch only the summary endpoint in 30d range for dashboard preview
  const { summary, isLoading, error, refetch } = useInsights({
    initialRange: "30d",
    staleDays: 14,
    summaryOnly: true,
  });

  const volumeMetrics = summary?.volumeMetrics || {
    trackedOpportunities: 0,
    submittedApplications: 0,
    cumulativeOffers: 0,
    cumulativeRejections: 0,
  };

  const snapshotMetrics = summary?.snapshotMetrics || {
    activeInPipeline: 0,
    interviewsInProgress: 0,
    pendingOffers: 0,
  };

  const staleAlerts = summary?.staleAlerts || {
    thresholdDays: 14,
    staleCount: 0,
    applications: [],
  };

  // Determine the highest priority recommendation: warning > positive > info
  const topRecommendation = useMemo(() => {
    const list = summary?.ruleBasedInsights;
    if (!list || list.length === 0) return null;
    const warning = list.find((r) => r.type === "warning");
    if (warning) return warning;
    const positive = list.find((r) => r.type === "positive");
    if (positive) return positive;
    return list[0];
  }, [summary?.ruleBasedInsights]);

  if (error) {
    return (
      <div
        className={cn(
          "p-4 rounded-xl bg-surface border border-border-primary mb-6 flex items-center justify-between gap-3 text-xs",
          className
        )}
      >
        <span className="text-muted">Unable to load insights summary.</span>
        <Button variant="ghost" size="sm" onClick={refetch} className="text-xs text-cyan">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="dashboard-insights-heading"
      className={cn(
        "p-4 sm:p-5 rounded-2xl bg-surface/50 border border-border-primary/80 mb-6 transition-all",
        className
      )}
    >
      {/* A. Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-border-subtle/80">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan shrink-0 animate-pulse" aria-hidden="true" />
          <h2
            id="dashboard-insights-heading"
            className="font-display text-base sm:text-lg text-ink font-semibold tracking-tight"
          >
            Your Insights
          </h2>
          <span className="text-muted text-xs font-sans hidden sm:inline">•</span>
          <p className="text-muted text-xs font-sans hidden sm:inline">
            30-day velocity, active pipeline, and follow-up alerts
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/insights")}
          className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-cyan hover:text-cyan/80 transition-colors self-start sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan/70 rounded"
          aria-label="View all insights on dedicated page"
        >
          View All Insights
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
            <path d="M6 3.5 L10.5 8 L6 12.5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading insights preview">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-surface-secondary/70 rounded-xl" />
            ))}
          </div>
          <div className="h-44 bg-surface-secondary/50 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* B. Key Metrics (4 Compact Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. Tracked Opportunities */}
            <Card className="p-3 bg-surface border-border-subtle/80 hover:border-border-accent/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-medium text-muted uppercase tracking-wider">
                  Tracked
                </span>
                <span className="w-2 h-2 rounded-full bg-slate-400" aria-hidden="true" />
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-ink mt-1">
                {volumeMetrics.trackedOpportunities}
              </p>
              <p className="text-[10px] text-muted font-sans mt-0.5">Total opportunities</p>
            </Card>

            {/* 2. Submitted Applications */}
            <Card className="p-3 bg-surface border-border-subtle/80 hover:border-border-accent/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-medium text-muted uppercase tracking-wider">
                  Submitted
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan" aria-hidden="true" />
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-cyan mt-1">
                {volumeMetrics.submittedApplications}
              </p>
              <p className="text-[10px] text-muted font-sans mt-0.5">Non-saved applications</p>
            </Card>

            {/* 3. Active in Pipeline */}
            <Card className="p-3 bg-surface border-border-subtle/80 hover:border-border-accent/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-medium text-muted uppercase tracking-wider">
                  Active
                </span>
                <span className="w-2 h-2 rounded-full bg-amber" aria-hidden="true" />
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-ink mt-1">
                {snapshotMetrics.activeInPipeline}
              </p>
              <p className="text-[10px] text-muted font-sans mt-0.5">Applied, OA &amp; Interview</p>
            </Card>

            {/* 4. Pending Offers */}
            <Card className="p-3 bg-surface border-border-subtle/80 hover:border-border-accent/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-medium text-muted uppercase tracking-wider">
                  Offers
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {snapshotMetrics.pendingOffers}
              </p>
              <p className="text-[10px] text-muted font-sans mt-0.5">Awaiting response</p>
            </Card>
          </div>

          {/* C & D: Submission Activity Preview & Actionable Insights Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
            {/* C. 30-Day Submission Activity Preview (7 Cols on desktop) */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <SubmissionActivityChart
                dailySeries={summary?.submissionActivity?.dailySeries || []}
                selectedRange="30d"
                totalSubmittedInPeriod={summary?.submissionActivity?.totalSubmittedInPeriod}
                className="h-full p-3.5 sm:p-4 border-border-subtle/80"
              />
            </div>

            {/* D. Actionable Insights Preview (5 Cols on desktop) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Top Recommendation Preview Card */}
              {topRecommendation && (
                <div
                  role="region"
                  aria-label="Priority recommendation"
                  className={cn(
                    "p-3.5 rounded-xl border text-xs transition-all flex flex-col justify-between",
                    topRecommendation.type === "warning"
                      ? "bg-amber-500/10 border-amber-500/30 text-ink"
                      : topRecommendation.type === "positive"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-ink"
                      : "bg-surface border-border-subtle text-ink-secondary"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          topRecommendation.type === "warning"
                            ? "bg-amber"
                            : topRecommendation.type === "positive"
                            ? "bg-emerald-500"
                            : "bg-cyan"
                        )}
                        aria-hidden="true"
                      />
                      <span className="font-display font-semibold text-xs text-ink">
                        {topRecommendation.title}
                      </span>
                    </div>
                    <p className="text-muted leading-relaxed line-clamp-2 pl-3.5">
                      {topRecommendation.message}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-border-subtle/40 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate("/insights")}
                      className="text-[11px] font-sans font-medium text-cyan hover:underline cursor-pointer"
                    >
                      Action details →
                    </button>
                  </div>
                </div>
              )}

              {/* Stale Application Follow-up Preview Card */}
              <div
                role="region"
                aria-label="Stale applications preview"
                className="p-3.5 rounded-xl bg-surface border border-border-subtle/80 text-xs flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-semibold text-xs text-ink flex items-center gap-1.5">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          staleAlerts.staleCount > 0 ? "bg-amber" : "bg-emerald-500"
                        )}
                        aria-hidden="true"
                      />
                      Follow-up Radar
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold",
                        staleAlerts.staleCount > 0
                          ? "bg-amber/15 text-amber"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {staleAlerts.staleCount > 0 ? `${staleAlerts.staleCount} stale` : "Healthy"}
                    </span>
                  </div>

                  {staleAlerts.staleCount > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-muted leading-snug">
                        {staleAlerts.staleCount} {staleAlerts.staleCount === 1 ? "application has" : "applications have"} been inactive for &gt; 14 days without stage movement:
                      </p>
                      {staleAlerts.applications.slice(0, 2).map((app) => (
                        <div
                          key={app.id}
                          className="p-2 rounded bg-surface-secondary/50 border border-border-subtle/60 flex items-center justify-between gap-2 text-[11px]"
                        >
                          <div className="min-w-0 truncate">
                            <span className="font-semibold text-ink">{app.company}</span>
                            <span className="text-muted ml-1">({app.role})</span>
                          </div>
                          <span className="font-mono text-amber font-semibold shrink-0">
                            {app.daysInactive}d
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted leading-relaxed py-1">
                      All your active applications in Applied and Assessment have had stage movement within the last 14 days.
                    </p>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-border-subtle/50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/insights")}
                    className="text-[11px] font-sans font-medium text-cyan hover:underline cursor-pointer"
                  >
                    View pipeline radar →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
