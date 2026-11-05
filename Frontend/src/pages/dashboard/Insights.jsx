import React, { useState } from "react";
import useInsights from "../../hooks/useInsights";
import Button from "../../components/shared/Button";
import ThemeToggleButton from "../../components/shared/ThemeToggleButton";
import StatusBadge from "../../components/applications_page/StatusBadge";
import {
  SubmissionActivityChart,
  PipelineDistributionChart,
  PipelineDistributionDetails,
  SkillFitChart,
  MetricCard,
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

  const [selectedStageKey, setSelectedStageKey] = useState(null);

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
      className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 pb-12 sm:pb-16 flex flex-col min-w-0"
      role="main"
      aria-label="Insights & Analytics Page"
    >
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-10 sm:mb-12 shrink-0">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink font-bold tracking-tight">
            Insights & Analytics
          </h1>
          <p className="text-muted text-sm sm:text-base mt-1.5 font-sans max-w-2xl leading-relaxed">
            Real-time pipeline metrics, submission momentum, stage conversion distributions, and skill matching generated from your tracked opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="text-sm text-muted hover:text-ink flex items-center gap-1.5"
            aria-label="Refresh analytics data"
            title="Refresh analytics data"
          >
            <svg
              viewBox="0 0 16 16"
              className={cn("w-4 h-4", isLoading && "animate-spin text-cyan")}
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
          <p className="text-ink font-display text-lg sm:text-xl font-semibold">
            Aggregating Opportunity Analytics...
          </p>
          <p className="text-muted text-sm font-sans mt-1.5">
            Analyzing status histories, calculating stage inactivity, and evaluating skill fit.
          </p>
        </div>
      )}

      {/* Error Alert */}
      {!isLoading && error && (
        <div
          className="p-4 sm:p-5 rounded-xl bg-red/10 border border-red/30 mb-6 text-sm sm:text-base text-red flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 20 20" className="w-5 h-5 shrink-0" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <span className="font-semibold text-ink">Failed to load analytics:</span> {error}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="text-sm shrink-0">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Main Dashboard Analytics Content */}
      {!isLoading && !error && (
        <div className="space-y-10 sm:space-y-12">
          {/* 2. Overview Metrics (Volume & Snapshot KPI Cards) */}
          <section aria-labelledby="kpi-metrics-heading">
            <h2 id="kpi-metrics-heading" className="sr-only">
              Application Overview Metrics
            </h2>

            {/* Volume Metrics (All-time tracking activity) */}
            <div className="mb-10 sm:mb-12">
              <div className="text-sm sm:text-base font-sans font-bold text-cyan uppercase tracking-wider mb-4 sm:mb-4.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan shrink-0" aria-hidden="true" />
                All-Time Cumulative Volume
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
                <MetricCard
                  label="Tracked"
                  value={volumeMetrics.trackedOpportunities}
                  description="Total added to tracker"
                  indicatorColor="bg-slate-400"
                  valueColor="text-ink"
                />

                <MetricCard
                  label="Submitted"
                  value={volumeMetrics.submittedApplications}
                  description="Non-saved applications"
                  indicatorColor="bg-cyan"
                  valueColor="text-cyan"
                />

                <MetricCard
                  label="Cumulative Offers"
                  value={volumeMetrics.cumulativeOffers}
                  description="Offer + Accepted"
                  indicatorColor="bg-emerald-500"
                  valueColor="text-emerald-600 dark:text-emerald-400"
                />

                <MetricCard
                  label="Rejections"
                  value={volumeMetrics.cumulativeRejections}
                  description="Closed without offer"
                  indicatorColor="bg-red"
                  valueColor="text-red"
                />
              </div>
            </div>

            {/* Snapshot Metrics (Current pipeline state) */}
            <div>
              <div className="text-sm sm:text-base font-sans font-bold text-amber-600 dark:text-amber uppercase tracking-wider mb-4 sm:mb-4.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber shrink-0" aria-hidden="true" />
                Current Pipeline State
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
                <MetricCard
                  label="Active in Pipeline"
                  value={snapshotMetrics.activeInPipeline}
                  description="Applied, OA &amp; Interview"
                  indicatorColor="bg-cyan"
                  valueColor="text-ink"
                />

                <MetricCard
                  label="Interviews in Progress"
                  value={snapshotMetrics.interviewsInProgress}
                  description="Active interview rounds"
                  indicatorColor="bg-amber-400 dark:bg-yellow-400"
                  valueColor="text-amber-500 dark:text-yellow-400"
                />

                <MetricCard
                  label="Pending Offers"
                  value={snapshotMetrics.pendingOffers}
                  description="Awaiting decision"
                  indicatorColor="bg-emerald-500"
                  valueColor="text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>
          </section>

          {/* 3. Primary Charts Row: Application Pipeline Distribution (Left) & Submission Activity (Right) */}
          <section aria-labelledby="primary-charts-heading">
            <h2 id="primary-charts-heading" className="sr-only">
              Application Pipeline Distribution and Submission Activity
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              {/* Left Column: Application Pipeline Distribution (Recharts Pie/Donut Chart) */}
              <PipelineDistributionChart
                pipelineData={pipeline}
                activeInPipeline={snapshotMetrics.activeInPipeline}
                selectedStageKey={selectedStageKey}
                onSelectStageKey={setSelectedStageKey}
                showDetails={false}
                className="h-full flex flex-col justify-between"
              />

              {/* Right Column: Submission Activity (Activity Graph) */}
              <SubmissionActivityChart
                dailySeries={summary?.submissionActivity?.dailySeries || []}
                selectedRange={selectedRange}
                onRangeChange={onRangeChange}
                totalSubmittedInPeriod={summary?.submissionActivity?.totalSubmittedInPeriod}
                isLoading={isRangeLoading}
                className="h-full flex flex-col justify-between"
              />
            </div>
          </section>

          {/* 4. Static Pipeline Information (Spans Full Available Width Beneath Both Charts) */}
          <section aria-labelledby="pipeline-details-heading">
            <h2 id="pipeline-details-heading" className="sr-only">
              Pipeline Stage Breakdown
            </h2>
            <PipelineDistributionDetails
              pipelineData={pipeline}
              selectedStageKey={selectedStageKey}
              onSelectStageKey={setSelectedStageKey}
            />
          </section>

          {/* 5. Recommendations & Stale Application Follow-ups */}
          <section
            aria-labelledby="recommendations-heading"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
          >
            {/* Rule-Based Recommendations */}
            <div className="bg-surface border border-border-primary rounded-xl p-4 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h3 id="recommendations-heading" className="font-display text-ink text-lg sm:text-xl font-semibold leading-tight">
                  Smart Recommendations
                </h3>
                <span className="text-xs sm:text-sm text-muted">
                  {ruleBasedInsights.length} {ruleBasedInsights.length === 1 ? "rule-based signal" : "rule-based signals"}
                </span>
              </div>

              {ruleBasedInsights.length > 0 ? (
                <div className="space-y-3.5 flex-1" role="list" aria-label="Recommendations list">
                  {ruleBasedInsights.map((rec) => {
                    const isWarning = rec.type === "warning";
                    const isPositive = rec.type === "positive";

                    return (
                      <div
                        key={rec.id}
                        role="listitem"
                        className={cn(
                          "p-3.5 rounded-xl border transition-all text-sm",
                          isWarning
                            ? "bg-amber-500/10 border-amber-500/30 text-ink"
                            : isPositive
                            ? "bg-emerald-500/10 border-emerald-500/30 text-ink"
                            : "bg-surface-secondary/40 border-border-subtle text-ink-secondary"
                        )}
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
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
                          <span className="font-display font-semibold text-sm sm:text-base text-ink">
                            {rec.title}
                          </span>
                        </div>
                        <p className="text-muted text-xs sm:text-sm leading-relaxed pl-4.5">
                          {rec.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center my-auto">
                  <p className="text-sm text-muted">No pending recommendations at this time.</p>
                </div>
              )}
            </div>

            {/* Stale Application Alerts */}
            <div className="bg-surface border border-border-primary rounded-xl p-4 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-ink text-lg sm:text-xl font-semibold leading-tight">
                    Stale Application Alerts
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-mono font-bold",
                      staleAlerts.staleCount > 0
                        ? "bg-amber/15 text-amber border border-amber/30"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    )}
                  >
                    {staleAlerts.staleCount} flagged
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-muted">&gt; {staleAlerts.thresholdDays} days inactive</span>
              </div>

              {/* Explanatory Caveat */}
              <p className="text-xs sm:text-sm text-muted leading-relaxed mb-6 sm:mb-7">
                {staleAlerts.caveat}
              </p>

              {staleAlerts.staleCount > 0 ? (
                <div className="space-y-3 flex-1 overflow-y-auto max-h-72 custom-scrollbar pr-1" role="list" aria-label="Stale applications list">
                  {staleAlerts.applications.map((app) => (
                    <div
                      key={app.id}
                      role="listitem"
                      className="p-3 rounded-lg bg-surface-secondary/40 border border-border-subtle hover:border-amber/40 transition-all flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-semibold text-ink truncate">
                            {app.company}
                          </span>
                          <span className="text-muted">•</span>
                          <span className="text-sm text-ink-secondary truncate">
                            {app.role}
                          </span>
                          <StatusBadge status={app.status} className="ml-0.5 text-xs sm:text-sm" />
                        </div>
                        {app.stageEnteredAt && (
                          <p className="text-xs sm:text-sm text-muted mt-0.5">
                            In stage since {formatEnteredDate(app.stageEnteredAt)}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm sm:text-base font-bold text-amber block">
                          {app.daysInactive}d inactive
                        </span>
                        <span className="text-xs text-muted font-sans">
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
                  <p className="font-display font-semibold text-sm sm:text-base text-ink mb-1">
                    All Active Applications Moving
                  </p>
                  <p className="text-xs sm:text-sm text-muted max-w-xs mx-auto">
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
