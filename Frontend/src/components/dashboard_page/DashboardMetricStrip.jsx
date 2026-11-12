import React, { useMemo } from "react";
import { STATUS_ORDER } from "../../constants/jobStatus";
import { cn } from "../../utils/cn";

/**
 * Compact reference-inspired KPI Bento Row for Dashboard.
 * Every micro-visualization (stage bar distribution, submission sparkline,
 * active breakdown, offer yield arc) is strictly computed from live application data.
 */
export default function DashboardMetricStrip({
  jobsList = [],
  statusCounts = null,
  summary = null,
  className,
}) {
  const analytics = useMemo(() => {
    const byStatus = {};
    for (const s of STATUS_ORDER) byStatus[s] = 0;
    if (statusCounts) {
      for (const s of STATUS_ORDER) {
        byStatus[s] = Number(statusCounts[s]) || 0;
      }
    } else {
      for (const job of jobsList) {
        if (byStatus[job.status] !== undefined) {
          byStatus[job.status] += 1;
        }
      }
    }
    const total = statusCounts
      ? STATUS_ORDER.reduce((sum, s) => sum + (byStatus[s] || 0), 0)
      : jobsList.length;

    const applied = byStatus.applied || 0;
    const oa = byStatus.oa || 0;
    const interviews = byStatus.interview || 0;
    const active = applied + oa + interviews;
    const offersAndAccepted = (byStatus.offer || 0) + (byStatus.accepted || 0);
    const localSubmitted = statusCounts
      ? total - (byStatus.saved || 0)
      : jobsList.filter((j) => j.status !== "saved").length;

    const tracked = summary?.volumeMetrics?.trackedOpportunities ?? total;
    const submitted = summary?.volumeMetrics?.submittedApplications ?? localSubmitted;
    const pendingOffers = summary?.snapshotMetrics?.pendingOffers ?? (byStatus.offer || 0);

    const submittedPct = tracked > 0 ? Math.round((submitted / tracked) * 100) : 0;
    const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
    const yieldPct = total > 0 ? Math.round((offersAndAccepted / total) * 100) : 0;

    // 7-stage miniature distribution bars
    const stageCounts = [
      { key: "saved", count: byStatus.saved, color: "fill-muted/50" },
      { key: "applied", count: applied, color: "fill-cyan" },
      { key: "oa", count: oa, color: "fill-amber" },
      { key: "interview", count: interviews, color: "fill-red" },
      { key: "offer", count: byStatus.offer, color: "fill-yellow-500" },
      { key: "accepted", count: byStatus.accepted, color: "fill-emerald-500" },
      { key: "rejected", count: byStatus.rejected, color: "fill-red/60" },
    ];
    const maxStageCount = Math.max(1, ...stageCounts.map((s) => s.count));

    // Real 14-point sparkline from submission dailySeries
    const rawSeries = summary?.submissionActivity?.dailySeries || [];
    const lastPoints = rawSeries.slice(-14).map((d) => Number(d?.count) || 0);
    const sparkSeries = lastPoints.length >= 2 ? lastPoints : [0, ...lastPoints, submitted > 0 ? 1 : 0];
    const sparkMax = Math.max(1, ...sparkSeries);
    const sparkW = 68;
    const sparkH = 26;
    const sparkPath = sparkSeries
      .map((val, idx) => {
        const x = (idx / Math.max(1, sparkSeries.length - 1)) * sparkW;
        const y = sparkH - 3 - (val / sparkMax) * (sparkH - 6);
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

    return {
      total,
      submitted,
      active,
      interviews,
      offersAndAccepted,
      pendingOffers,
      submittedPct,
      activePct,
      yieldPct,
      applied,
      oa,
      stageCounts,
      maxStageCount,
      sparkPath,
      sparkW,
      sparkH,
    };
  }, [jobsList, statusCounts, summary]);

  // Circular arc geometry for Offers Yield
  const ringRadius = 15;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - Math.min(100, Math.max(0, analytics.yieldPct)) / 100);

  return (
    <section
      aria-label="Key Pipeline Metrics"
      className={cn("grid grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-4", className)}
    >
      {/* 1. Total Applications */}
      <div className="dashboard-panel rounded-xl px-4 py-5 sm:px-5 sm:py-6 flex flex-col justify-between gap-4 transition-colors hover:border-cyan/40">
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-[13px] sm:text-[15px] font-sans font-semibold text-ink-secondary">
            Total Applications
          </span>
          <span className="text-[13px] font-mono font-semibold text-cyan shrink-0">
            {analytics.active} active
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-3xl sm:text-4xl font-bold text-ink leading-none tracking-tight">
              {analytics.total}
            </p>
            <span className="text-[13px] sm:text-sm text-muted font-sans mt-2 block">
              Across 7 stages
            </span>
          </div>

          {/* 7-stage miniature distribution bars */}
          <svg
            width="64"
            height="28"
            viewBox="0 0 64 28"
            className="shrink-0"
            aria-hidden="true"
          >
            {analytics.stageCounts.map((s, idx) => {
              const barH = s.count > 0 ? Math.max(5, Math.round((s.count / analytics.maxStageCount) * 24)) : 3;
              return (
                <rect
                  key={s.key}
                  x={idx * 9 + 1}
                  y={27 - barH}
                  width="6"
                  height={barH}
                  rx="2"
                  className={s.count > 0 ? s.color : "fill-border-subtle/50"}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* 2. Submitted Applications */}
      <div className="dashboard-panel rounded-xl px-4 py-5 sm:px-5 sm:py-6 flex flex-col justify-between gap-4 transition-colors hover:border-cyan/40">
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-[13px] sm:text-[15px] font-sans font-semibold text-ink-secondary">
            Submitted
          </span>
          <span className="text-[13px] font-mono font-semibold text-cyan shrink-0">
            {analytics.submittedPct}% of tracked
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-3xl sm:text-4xl font-bold text-cyan leading-none tracking-tight">
              {analytics.submitted}
            </p>
            <span className="text-[13px] sm:text-sm text-muted font-sans mt-2 block">
              Non-saved roles
            </span>
          </div>

          {/* Live submission velocity sparkline */}
          <svg
            width={analytics.sparkW}
            height={analytics.sparkH}
            viewBox={`0 0 ${analytics.sparkW} ${analytics.sparkH}`}
            className="shrink-0 overflow-visible"
            aria-hidden="true"
          >
            <path
              d={analytics.sparkPath}
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-cyan"
            />
          </svg>
        </div>
      </div>

      {/* 3. In Pipeline & Interviews */}
      <div className="dashboard-panel rounded-xl px-4 py-5 sm:px-5 sm:py-6 flex flex-col justify-between gap-4 transition-colors hover:border-cyan/40">
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-[13px] sm:text-[15px] font-sans font-semibold text-ink-secondary">
            In Pipeline
          </span>
          <span className="text-[13px] font-mono font-semibold text-amber shrink-0">
            {analytics.interviews} interviews
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-3xl sm:text-4xl font-bold text-ink leading-none tracking-tight">
              {analytics.active}
            </p>
            <span className="text-[13px] sm:text-sm text-muted font-sans mt-2 block">
              {analytics.activePct}% active rate
            </span>
          </div>

          {/* Active Stage Proportion Bar */}
          <div className="w-16 flex flex-col gap-1.5 shrink-0 pb-0.5" aria-hidden="true">
            <div className="h-2 w-full rounded-full bg-surface-secondary overflow-hidden flex gap-0.5">
              {analytics.active > 0 ? (
                <>
                  {analytics.applied > 0 && (
                    <div
                      className="h-full bg-cyan"
                      style={{ width: `${(analytics.applied / analytics.active) * 100}%` }}
                    />
                  )}
                  {analytics.oa > 0 && (
                    <div
                      className="h-full bg-amber"
                      style={{ width: `${(analytics.oa / analytics.active) * 100}%` }}
                    />
                  )}
                  {analytics.interviews > 0 && (
                    <div
                      className="h-full bg-red"
                      style={{ width: `${(analytics.interviews / analytics.active) * 100}%` }}
                    />
                  )}
                </>
              ) : (
                <div className="h-full w-full bg-border-subtle/40" />
              )}
            </div>
            <div className="flex justify-between text-xs font-mono text-muted">
              <span>AP</span>
              <span>OA</span>
              <span>IN</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Offers & Accepted */}
      <div className="dashboard-panel rounded-xl px-4 py-5 sm:px-5 sm:py-6 flex flex-col justify-between gap-4 transition-colors hover:border-cyan/40">
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-[13px] sm:text-[15px] font-sans font-semibold text-ink-secondary">
            Offers &amp; Accepted
          </span>
          <span className="text-[13px] font-mono font-semibold text-emerald-500 shrink-0">
            {analytics.yieldPct}% yield
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-3xl sm:text-4xl font-bold text-emerald-500 leading-none tracking-tight">
              {analytics.offersAndAccepted}
            </p>
            <span className="text-[13px] sm:text-sm text-muted font-sans mt-2 block">
              {analytics.pendingOffers} pending decision
            </span>
          </div>

          {/* Crisp SVG Yield Arc */}
          <svg width="38" height="38" viewBox="0 0 38 38" className="shrink-0 -rotate-90" aria-hidden="true">
            <circle
              cx="19"
              cy="19"
              r={ringRadius}
              fill="none"
              strokeWidth="3.5"
              className="stroke-border-subtle/60"
            />
            <circle
              cx="19"
              cy="19"
              r={ringRadius}
              fill="none"
              strokeWidth="3.5"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              className="stroke-emerald-500 transition-all duration-500"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
