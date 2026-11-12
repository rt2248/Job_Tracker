import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useInsights from "../../hooks/useInsights";
import Button from "../shared/Button";
import { SubmissionActivityChart } from "../insights";
import PipelineConversionFunnel from "./PipelineConversionFunnel";
import { cn } from "../../utils/cn";

function DashboardInsightsView({
  jobsList = [],
  summary,
  selectedRange = "30d",
  onRangeChange,
  isLoading = false,
  isRangeLoading = false,
  error = null,
  refetch,
  className,
}) {
  const navigate = useNavigate();
  const [activeRightTab, setActiveRightTab] = useState("funnel"); // 'funnel' | 'radar'

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

  const topRecommendation = useMemo(() => {
    const list = summary?.ruleBasedInsights;
    if (!list || list.length === 0) return null;
    const warning = list.find((r) => r.type === "warning");
    if (warning) return warning;
    const positive = list.find((r) => r.type === "positive");
    if (positive) return positive;
    return list[0];
  }, [summary?.ruleBasedInsights]);

  const rangeDescriptor =
    selectedRange === "90d"
      ? "90-day velocity, conversion & follow-up alerts"
      : selectedRange === "all"
      ? "All-time velocity, conversion & follow-up alerts"
      : "30-day velocity, conversion & follow-up alerts";

  if (error) {
    return (
      <section aria-labelledby="dashboard-insights-heading" className={cn("mb-16", className)}>
        <div className="dashboard-panel rounded-xl px-4 py-5 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted">Unable to load insights summary.</span>
          <Button variant="ghost" size="sm" onClick={refetch} className="text-[13px] text-cyan">
            Retry
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="dashboard-insights-heading"
      className={cn("mb-16", className)}
    >
      {/* Open Workspace Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-x-2.5 gap-y-3 mb-6 px-0.5">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h2
            id="dashboard-insights-heading"
            className="font-display text-lg sm:text-xl text-ink font-bold tracking-tight"
          >
            Your Insights
          </h2>
          <span className="text-muted text-sm hidden sm:inline">·</span>
          <p className="text-muted text-sm sm:text-[15px] font-sans hidden sm:inline">
            {rangeDescriptor}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => navigate("/career-strategist")}
            className="inline-flex items-center gap-1.5 text-[13px] font-sans font-semibold text-ink hover:text-cyan transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan/70 rounded-lg px-2.5 py-2 bg-surface border border-border-subtle shadow-xs whitespace-nowrap shrink-0"
            aria-label="Launch AI Career Strategist"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 text-cyan shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" fill="currentColor" stroke="none" />
            </svg>
            <span>Career Strategist</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/insights")}
            className="inline-flex items-center gap-1 text-sm font-sans font-semibold text-cyan hover:text-cyan/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan/70 rounded whitespace-nowrap shrink-0"
            aria-label="View all insights on dedicated page"
          >
            View All Insights
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M6 3.5 L10.5 8 L6 12.5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grounded Analytical Workspace Deck */}
      <div className="dashboard-workspace-deck rounded-2xl px-3.5 py-5 sm:px-4 sm:py-6">
        {isLoading ? (
          <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading insights preview">
            <div className="h-14 bg-surface/60 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-8">
              <div className="lg:col-span-7 h-64 bg-surface/60 rounded-xl" />
              <div className="lg:col-span-5 h-64 bg-surface/60 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Integrated 4-Cell Summary Strip (Distinct horizontal ledger without card-spam) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3.5 sm:gap-0 sm:divide-x divide-border-subtle pt-0.5 pb-4 border-b border-border-subtle">
              <div className="pb-3 sm:pb-0 sm:pr-4 border-b border-border-subtle/50 sm:border-b-0 flex items-baseline justify-between gap-2">
                <div>
                  <span className="text-sm font-sans font-semibold text-ink-secondary block">Tracked</span>
                  <span className="text-xs sm:text-[13px] font-sans text-muted leading-snug mt-0.5 block">Total opportunities</span>
                </div>
                <span className="font-mono text-2xl font-bold text-ink tabular-nums shrink-0">
                  {volumeMetrics.trackedOpportunities}
                </span>
              </div>

              <div className="pb-3 sm:pb-0 sm:px-4 border-b border-border-subtle/50 sm:border-b-0 flex items-baseline justify-between gap-2">
                <div>
                  <span className="text-sm font-sans font-semibold text-ink-secondary block">Submitted</span>
                  <span className="text-xs sm:text-[13px] font-sans text-muted leading-snug mt-0.5 block">Non-saved roles</span>
                </div>
                <span className="font-mono text-2xl font-bold text-cyan tabular-nums shrink-0">
                  {volumeMetrics.submittedApplications}
                </span>
              </div>

              <div className="sm:px-4 flex items-baseline justify-between gap-2">
                <div>
                  <span className="text-sm font-sans font-semibold text-ink-secondary block">Active</span>
                  <span className="text-xs sm:text-[13px] font-sans text-muted leading-snug mt-0.5 block">Applied, OA &amp; Interview</span>
                </div>
                <span className="font-mono text-2xl font-bold text-ink tabular-nums shrink-0">
                  {snapshotMetrics.activeInPipeline}
                </span>
              </div>

              <div className="sm:pl-4 flex items-baseline justify-between gap-2">
                <div>
                  <span className="text-sm font-sans font-semibold text-ink-secondary block">Offers</span>
                  <span className="text-xs sm:text-[13px] font-sans text-muted leading-snug mt-0.5 block">Awaiting response</span>
                </div>
                <span className="font-mono text-2xl font-bold text-emerald-500 tabular-nums shrink-0">
                  {snapshotMetrics.pendingOffers}
                </span>
              </div>
            </div>

            {/* Asymmetric 12-Col Analytics Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-8 items-start">
              {/* Left (7 Cols): Prominent Submission Activity Timeline */}
              <div className="lg:col-span-7">
                <SubmissionActivityChart
                  showHeroTotal
                  comfortable
                  dailySeries={summary?.submissionActivity?.dailySeries || []}
                  selectedRange={selectedRange}
                  onRangeChange={onRangeChange}
                  totalSubmittedInPeriod={summary?.submissionActivity?.totalSubmittedInPeriod}
                  isLoading={isRangeLoading}
                  className="dashboard-panel border-0 px-4 py-5 sm:px-5 sm:py-6"
                />
              </div>

              {/* Right (5 Cols): Conversion Funnel / Radar & Alerts Unified Panel */}
              <div className="lg:col-span-5 dashboard-panel rounded-xl px-4 py-5 sm:px-5 sm:py-6 flex flex-col gap-5">
                <div
                  role="tablist"
                  aria-label="Insights perspective"
                  className="grid grid-cols-2 p-1 rounded-lg bg-surface-secondary/80 border border-border-subtle shrink-0"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeRightTab === "funnel"}
                    onClick={() => setActiveRightTab("funnel")}
                    className={cn(
                      "py-2 px-3 rounded-md text-[13px] sm:text-sm font-sans font-semibold transition-all cursor-pointer text-center select-none",
                      activeRightTab === "funnel"
                        ? "bg-surface text-ink shadow-xs border border-border-subtle/80 font-bold"
                        : "text-muted hover:text-ink"
                    )}
                  >
                    Conversion Funnel
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeRightTab === "radar"}
                    onClick={() => setActiveRightTab("radar")}
                    className={cn(
                      "py-2 px-3 rounded-md text-[13px] sm:text-sm font-sans font-semibold transition-all cursor-pointer text-center select-none flex items-center justify-center gap-1.5",
                      activeRightTab === "radar"
                        ? "bg-surface text-ink shadow-xs border border-border-subtle/80 font-bold"
                        : "text-muted hover:text-ink"
                    )}
                  >
                    <span>Radar &amp; Alerts</span>
                    {staleAlerts.staleCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                    )}
                  </button>
                </div>

                {activeRightTab === "funnel" ? (
                  <PipelineConversionFunnel jobsList={jobsList} embedded />
                ) : (
                  <div className="flex flex-col justify-between flex-1 divide-y divide-border-subtle gap-5">
                    {/* Priority Recommendation */}
                    {topRecommendation && (
                      <div
                        role="region"
                        aria-label="Priority recommendation"
                        className="space-y-2.5 pb-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
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
                            <span className="font-display font-semibold text-sm sm:text-base text-ink truncate">
                              {topRecommendation.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate("/insights")}
                            className="text-[13px] font-sans font-semibold text-cyan hover:underline cursor-pointer shrink-0"
                          >
                            Details →
                          </button>
                        </div>
                        <p className="text-muted text-sm leading-relaxed line-clamp-2">
                          {topRecommendation.message}
                        </p>
                      </div>
                    )}

                    {/* Follow-up Radar */}
                    <div
                      role="region"
                      aria-label="Stale applications preview"
                      className="pt-5 flex-1 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-semibold text-sm sm:text-base text-ink flex items-center gap-2">
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
                              "text-[13px] font-mono font-bold",
                              staleAlerts.staleCount > 0
                                ? "text-amber"
                                : "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {staleAlerts.staleCount > 0 ? `${staleAlerts.staleCount} stale` : "Healthy"}
                          </span>
                        </div>

                        {staleAlerts.staleCount > 0 ? (
                          <div className="space-y-2.5">
                            <p className="text-[13px] sm:text-sm text-muted leading-relaxed">
                              {staleAlerts.staleCount}{" "}
                              {staleAlerts.staleCount === 1 ? "application" : "applications"} inactive &gt; 14 days without stage movement:
                            </p>
                            <div className="divide-y divide-border-subtle/80 rounded-lg bg-surface-secondary/50 border border-border-subtle px-3">
                              {staleAlerts.applications.slice(0, 2).map((app) => (
                                <div
                                  key={app.id}
                                  className="py-2.5 flex items-center justify-between gap-2 text-[13px] sm:text-sm"
                                >
                                  <div className="min-w-0 truncate">
                                    <span className="font-semibold text-ink">{app.company}</span>
                                    <span className="text-muted ml-1.5">{app.role}</span>
                                  </div>
                                  <span className="font-mono text-amber font-bold shrink-0">
                                    {app.daysInactive}d
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[13px] sm:text-sm text-muted leading-relaxed">
                            All active applications in Applied and Assessment have stage movement within 14 days.
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border-subtle flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate("/insights")}
                          className="text-[13px] sm:text-sm font-sans font-semibold text-cyan hover:underline cursor-pointer"
                        >
                          View pipeline radar →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StandaloneInsightsContainer(props) {
  const insights = useInsights({
    initialRange: "30d",
    staleDays: 14,
    summaryOnly: true,
  });
  return <DashboardInsightsView {...props} {...insights} />;
}

export default function DashboardInsightsSection({ insightsState, ...props }) {
  if (insightsState) {
    return <DashboardInsightsView {...props} {...insightsState} />;
  }
  return <StandaloneInsightsContainer {...props} />;
}
