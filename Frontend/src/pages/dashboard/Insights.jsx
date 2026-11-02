import React from "react";
import useInsights from "../../hooks/useInsights";
import Card from "../../components/shared/Card";
import Button from "../../components/shared/Button";
import ThemeToggleButton from "../../components/shared/ThemeToggleButton";
import StatusBadge from "../../components/applications_page/StatusBadge";
import {
  SubmissionActivityChart,
  PipelineDistributionChart,
  SkillFitChart,
} from "../../components/insights";
import { cn } from "../../utils/cn";

/**
 * Formats ISO timestamp to short date string (e.g. "Oct 12, 2026")
 */
function formatEnteredDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Insights - Dedicated Analytics & Insights Page
 *
 * Integrates Stage 6 SVG visualization components, backend volume & snapshot KPIs,
 * stale application alerts, and rule-based recommendations.
 */
export default function Insights() {
  const {
    summary,
    pipeline,
    skillFit,
    selectedRange,
    onRangeChange,
    isLoading,
    isRangeLoading,
    error,
    refetch,
  } = useInsights();

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
    caveat:
      "Inactivity is measured from the most recent stage transition timestamp and indicates lack of stage movement, not verified employer response time.",
  };

  const ruleBasedInsights = summary?.ruleBasedInsights || [];

  return (
    <main
      className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 flex flex-col min-w-0"
      role="main"
      aria-label="Insights & Analytics Page"
    >
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-xl sm:text-2xl text-ink font-semibold tracking-tight">
              Insights & Analytics
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-sans font-medium bg-cyan/10 text-cyan border border-cyan/25">
              Live Opportunity Telemetry
            </span>
          </div>
          <p className="text-muted text-xs sm:text-sm mt-1 font-sans max-w-2xl">
            Real-time pipeline metrics, submission momentum, stage conversion distributions, and skill matching generated from your tracked opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="text-xs text-muted hover:text-ink flex items-center gap-1.5"
            aria-label="Refresh analytics data"
            title="Refresh analytics data"
          >
            <svg
              viewBox="0 0 16 16"
              className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-cyan")}
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                d="M13.5 8a5.5 5.5 0 1 1-1.61-3.89L13.5 2.5m0 0v3.5m0-3.5H10"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <ThemeToggleButton />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-16 text-center my-auto" aria-busy="true">
          <div className="w-9 h-9 rounded-full border-2 border-cyan border-t-transparent animate-spin mb-4" />
          <p className="text-ink font-display text-base font-semibold">
            Aggregating Opportunity Analytics...
          </p>
          <p className="text-muted text-xs font-sans mt-1">
            Analyzing status histories, calculating stage inactivity, and evaluating skill fit.
          </p>
        </div>
      )}

      {/* Error Alert */}
      {!isLoading && error && (
        <div
          className="p-4 sm:p-5 rounded-xl bg-red/10 border border-red/30 mb-6 text-xs sm:text-sm text-red flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 20 20" className="w-5 h-5 shrink-0" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <span className="font-semibold text-ink">Failed to load analytics:</span> {error}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="text-xs shrink-0">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Main Dashboard Analytics Content */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {/* 2. Overview Metrics (Volume & Snapshot KPI Cards) */}
          <section aria-labelledby="kpi-metrics-heading">
            <h2 id="kpi-metrics-heading" className="sr-only">
              Application Overview Metrics
            </h2>

            {/* Volume Metrics (All-time tracking activity) */}
            <div className="mb-3">
              <div className="text-[11px] font-sans font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan" aria-hidden="true" />
                All-Time Cumulative Volume
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="p-3.5 sm:p-4 bg-surface border-border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-sans font-medium">Tracked</span>
                    <span className="w-2 h-2 rounded-full bg-slate-400" aria-hidden="true" />
                  </div>
                  <p className="font-mono text-2xl sm:text-3xl font-bold text-ink mt-2">
                    {volumeMetrics.trackedOpportunities}
                  </p>
                  <p className="text-[11px] text-muted font-sans mt-0.5">Total added to tracker</p>
                </Card>

                <Card className="p-3.5 sm:p-4 bg-surface border-border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-sans font-medium">Submitted</span>
                    <span className="w-2 h-2 rounded-full bg-cyan" aria-hidden="true" />
                  </div>
                  <p className="font-mono text-2xl sm:text-3xl font-bold text-cyan mt-2">
                    {volumeMetrics.submittedApplications}
                  </p>
                  <p className="text-[11px] text-muted font-sans mt-0.5">Non-saved applications</p>
                </Card>

                <Card className="p-3.5 sm:p-4 bg-surface border-border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-sans font-medium">Cumulative Offers</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  </div>
                  <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                    {volumeMetrics.cumulativeOffers}
                  </p>
                  <p className="text-[11px] text-muted font-sans mt-0.5">Offer + Accepted</p>
                </Card>

                <Card className="p-3.5 sm:p-4 bg-surface border-border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-sans font-medium">Rejections</span>
                    <span className="w-2 h-2 rounded-full bg-red" aria-hidden="true" />
                  </div>
                  <p className="font-mono text-2xl sm:text-3xl font-bold text-red mt-2">
                    {volumeMetrics.cumulativeRejections}
                  </p>
                  <p className="text-[11px] text-muted font-sans mt-0.5">Closed without offer</p>
                </Card>
              </div>
            </div>

            {/* Snapshot Metrics (Current pipeline state) */}
            <div>
              <div className="text-[11px] font-sans font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber" aria-hidden="true" />
                Current Pipeline State
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-3.5 sm:p-4 bg-surface border-border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-sans font-medium">Active in Pipeline</span>
                    <span className="w-2 h-2 rounded-full bg-cyan" aria-hidden="true" />
                  </div>
                  <p className="font-mono text-2xl sm:text-3xl font-bold text-ink mt-2">
                    {snapshotMetrics.activeInPipeline}
                  </p>
                  <p className="text-[11px] text-muted font-sans mt-0.5">Applied, OA &amp; Interview</p>
                </Card>

                <Card className="p-3.5 sm:p-4 bg-surface border-border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-sans font-medium">Interviews in Progress</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 dark:bg-yellow-400" aria-hidden="true" />
                  </div>
                  <p className="font-mono text-2xl sm:text-3xl font-bold text-amber-500 dark:text-yellow-400 mt-2">
                    {snapshotMetrics.interviewsInProgress}
                  </p>
                  <p className="text-[11px] text-muted font-sans mt-0.5">Active interview rounds</p>
                </Card>

                <Card className="p-3.5 sm:p-4 bg-surface border-border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-sans font-medium">Pending Offers</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  </div>
                  <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                    {snapshotMetrics.pendingOffers}
                  </p>
                  <p className="text-[11px] text-muted font-sans mt-0.5">Awaiting decision</p>
                </Card>
              </div>
            </div>
          </section>

          {/* 3. Submission Activity Chart */}
          <section aria-labelledby="activity-chart-heading">
            <h2 id="activity-chart-heading" className="sr-only">
              Application Submission Activity Chart
            </h2>
            <SubmissionActivityChart
              dailySeries={summary?.submissionActivity?.dailySeries || []}
              selectedRange={selectedRange}
              onRangeChange={onRangeChange}
              totalSubmittedInPeriod={summary?.submissionActivity?.totalSubmittedInPeriod}
              isLoading={isRangeLoading}
            />
          </section>

          {/* 4. Application Pipeline Distribution */}
          <section aria-labelledby="pipeline-chart-heading">
            <h2 id="pipeline-chart-heading" className="sr-only">
              Application Pipeline Distribution
            </h2>
            <PipelineDistributionChart
              pipelineData={pipeline}
              activeInPipeline={snapshotMetrics.activeInPipeline}
            />
          </section>

          {/* 5. Recommendations & Stale Application Follow-ups */}
          <section
            aria-labelledby="recommendations-heading"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Rule-Based Recommendations */}
            <div className="bg-surface border border-border-primary rounded-xl p-4 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 id="recommendations-heading" className="font-display text-ink text-base sm:text-lg font-semibold leading-tight">
                    Smart Recommendations
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-secondary text-ink-secondary border border-border-subtle">
                    {ruleBasedInsights.length}
                  </span>
                </div>
                <span className="text-xs text-muted">Rule-based signals</span>
              </div>

              {ruleBasedInsights.length > 0 ? (
                <div className="space-y-3 flex-1" role="list" aria-label="Recommendations list">
                  {ruleBasedInsights.map((rec) => {
                    const isWarning = rec.type === "warning";
                    const isPositive = rec.type === "positive";

                    return (
                      <div
                        key={rec.id}
                        role="listitem"
                        className={cn(
                          "p-3.5 rounded-xl border transition-all text-xs",
                          isWarning
                            ? "bg-amber-500/10 border-amber-500/30 text-ink"
                            : isPositive
                            ? "bg-emerald-500/10 border-emerald-500/30 text-ink"
                            : "bg-surface-secondary/40 border-border-subtle text-ink-secondary"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              isWarning
                                ? "bg-amber"
                                : isPositive
                                ? "bg-emerald-500"
                                : "bg-cyan"
                            )}
                            aria-hidden="true"
                          />
                          <span className="font-display font-semibold text-xs sm:text-sm text-ink">
                            {rec.title}
                          </span>
                        </div>
                        <p className="text-muted leading-relaxed pl-4">
                          {rec.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center my-auto">
                  <p className="text-xs text-muted">No pending recommendations at this time.</p>
                </div>
              )}
            </div>

            {/* Stale Application Alerts */}
            <div className="bg-surface border border-border-primary rounded-xl p-4 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-ink text-base sm:text-lg font-semibold leading-tight">
                    Stale Application Alerts
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold",
                      staleAlerts.staleCount > 0
                        ? "bg-amber/15 text-amber border border-amber/30"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    )}
                  >
                    {staleAlerts.staleCount} flagged
                  </span>
                </div>
                <span className="text-xs text-muted">&gt; {staleAlerts.thresholdDays} days inactive</span>
              </div>

              {/* Explanatory Caveat */}
              <p className="text-[11px] text-muted leading-tight mb-4">
                {staleAlerts.caveat}
              </p>

              {staleAlerts.staleCount > 0 ? (
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-72 custom-scrollbar pr-1" role="list" aria-label="Stale applications list">
                  {staleAlerts.applications.map((app) => (
                    <div
                      key={app.id}
                      role="listitem"
                      className="p-3 rounded-lg bg-surface-secondary/40 border border-border-subtle hover:border-amber/40 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-ink truncate">
                            {app.company}
                          </span>
                          <span className="text-muted">•</span>
                          <span className="text-ink-secondary truncate">
                            {app.role}
                          </span>
                          <StatusBadge status={app.status} className="ml-0.5" />
                        </div>
                        {app.stageEnteredAt && (
                          <p className="text-[11px] text-muted mt-0.5">
                            In stage since {formatEnteredDate(app.stageEnteredAt)}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-amber block">
                          {app.daysInactive}d inactive
                        </span>
                        <span className="text-[10px] text-muted font-sans">
                          Needs follow-up
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-lg bg-surface-secondary/30 border border-border-subtle/70 text-center my-auto">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto mb-2 flex items-center justify-center">
                    ✓
                  </div>
                  <p className="font-display font-semibold text-xs sm:text-sm text-ink mb-1">
                    All Active Applications Moving
                  </p>
                  <p className="text-xs text-muted max-w-xs mx-auto">
                    None of your applications in Applied or Online Assessment have been idle for more than {staleAlerts.thresholdDays} days.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 6. Skill-Fit Analysis */}
          <section aria-labelledby="skill-fit-chart-heading">
            <h2 id="skill-fit-chart-heading" className="sr-only">
              Skill-Fit Analysis
            </h2>
            <SkillFitChart skillFitData={skillFit} />
          </section>
        </div>
      )}
    </main>
  );
}
