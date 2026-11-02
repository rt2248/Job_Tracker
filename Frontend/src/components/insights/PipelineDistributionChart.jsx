import React, { useState } from "react";
import { cn } from "../../utils/cn";
import EmptyStateVisual from "./EmptyStateVisual";

/**
 * Stage visual meta mapping colors, accessible symbols, and semantic tags
 */
const STAGE_META = {
  saved: {
    label: "Saved",
    barColor: "bg-slate-500 dark:bg-slate-400",
    textColor: "text-slate-400",
    accentBorder: "border-slate-500/40",
    shape: "circle",
  },
  applied: {
    label: "Applied",
    barColor: "bg-cyan",
    textColor: "text-cyan",
    accentBorder: "border-cyan/40",
    shape: "triangle",
  },
  oa: {
    label: "Online Assessment",
    barColor: "bg-amber",
    textColor: "text-amber",
    accentBorder: "border-amber/40",
    shape: "square",
  },
  interview: {
    label: "Interview",
    barColor: "bg-amber-400 dark:bg-yellow-400",
    textColor: "text-amber-500 dark:text-yellow-400",
    accentBorder: "border-amber-400/40 dark:border-yellow-400/40",
    shape: "diamond",
  },
  offer: {
    label: "Offer",
    barColor: "bg-emerald-500 dark:bg-emerald-400",
    textColor: "text-emerald-600 dark:text-emerald-400",
    accentBorder: "border-emerald-500/40",
    shape: "star",
  },
  accepted: {
    label: "Accepted",
    barColor: "bg-emerald-600 dark:bg-emerald-400",
    textColor: "text-emerald-600 dark:text-emerald-400",
    accentBorder: "border-emerald-600/40",
    shape: "check",
  },
  rejected: {
    label: "Rejected",
    barColor: "bg-red",
    textColor: "text-red",
    accentBorder: "border-red/40",
    shape: "cross",
  },
};

/**
 * Accessible SVG Shape Icon ensuring non-color identification
 */
function StageShapeIcon({ shape, className }) {
  switch (shape) {
    case "square":
      return (
        <svg viewBox="0 0 12 12" className={cn("w-3 h-3 shrink-0", className)} aria-hidden="true">
          <rect x="2" y="2" width="8" height="8" rx="1.5" fill="currentColor" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 12 12" className={cn("w-3 h-3 shrink-0", className)} aria-hidden="true">
          <polygon points="6,1 11,6 6,11 1,6" fill="currentColor" />
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 12 12" className={cn("w-3 h-3 shrink-0", className)} aria-hidden="true">
          <polygon points="6,1.5 11,10.5 1,10.5" fill="currentColor" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 12 12" className={cn("w-3 h-3 shrink-0", className)} aria-hidden="true">
          <polygon points="6,1 7.5,4.5 11,4.5 8.2,6.8 9.2,10.5 6,8.2 2.8,10.5 3.8,6.8 1,4.5 4.5,4.5" fill="currentColor" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 12 12" className={cn("w-3 h-3 shrink-0", className)} aria-hidden="true">
          <path d="M2.5 6.5 L4.5 8.5 L9.5 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 12 12" className={cn("w-3 h-3 shrink-0", className)} aria-hidden="true">
          <path d="M3 3 L9 9 M9 3 L3 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 12 12" className={cn("w-3 h-3 shrink-0", className)} aria-hidden="true">
          <circle cx="6" cy="6" r="4" fill="currentColor" />
        </svg>
      );
  }
}

/**
 * PipelineDistributionChart - Reusable Pipeline Segmentation Component
 *
 * Visualizes current application distribution split across Active Pipeline and Closed Outcomes.
 * Preserves the architectural distinction between active stages (including offers) and evaluation-only active metrics.
 *
 * @param {Object} props
 * @param {Object} props.pipelineData - Data from GET /api/insights/pipeline
 * @param {number} [props.activeInPipeline] - KPI evaluation count (Applied + OA + Interview)
 * @param {string} [props.className]
 */
export default function PipelineDistributionChart({
  pipelineData,
  activeInPipeline,
  className,
}) {
  const [selectedStageKey, setSelectedStageKey] = useState(null);

  if (!pipelineData) {
    return (
      <div className={cn("bg-surface border border-border-primary rounded-xl p-6", className)}>
        <EmptyStateVisual iconType="pipeline" title="Pipeline Data Unavailable" description="No pipeline metrics could be retrieved." />
      </div>
    );
  }

  const {
    snapshotTotal = 0,
    activeSegment = { totalActive: 0, stages: [] },
    closedSegment = { totalClosed: 0, stages: [] },
    disclaimer = "This represents a point-in-time snapshot of current application stages, not a historical cohort conversion funnel.",
  } = pipelineData;

  const activeStages = activeSegment.stages || [];
  const closedStages = closedSegment.stages || [];

  if (snapshotTotal === 0) {
    return (
      <div className={cn("bg-surface border border-border-primary rounded-xl p-6", className)}>
        <EmptyStateVisual
          iconType="pipeline"
          title="Pipeline is Empty"
          description="Start tracking opportunities to visualize your current active stages and outcomes."
        />
      </div>
    );
  }

  // Calculate percentage shares of total
  const activePct = ((activeSegment.totalActive / snapshotTotal) * 100).toFixed(1);
  const closedPct = ((closedSegment.totalClosed / snapshotTotal) * 100).toFixed(1);

  return (
    <div
      className={cn(
        "bg-surface border border-border-primary rounded-xl p-4 sm:p-6 transition-all",
        className
      )}
      role="region"
      aria-label="Application pipeline distribution"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-ink text-base sm:text-lg font-semibold leading-tight">
              Application Pipeline Distribution
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-secondary text-ink-secondary border border-border-subtle">
              {snapshotTotal} total tracked
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Current point-in-time distribution of opportunities across stages
          </p>
        </div>

        {/* High-level Segment Summary Badges */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan/10 border border-cyan/25 text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan shrink-0" aria-hidden="true" />
            <span className="font-sans text-ink-secondary">Active:</span>
            <span className="font-mono font-bold text-cyan">{activeSegment.totalActive}</span>
            <span className="text-muted text-[11px] font-mono">({activePct}%)</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-secondary border border-border-subtle text-xs">
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
            <span className="font-sans text-ink-secondary">Closed:</span>
            <span className="font-mono font-bold text-ink">{closedSegment.totalClosed}</span>
            <span className="text-muted text-[11px] font-mono">({closedPct}%)</span>
          </div>
        </div>
      </div>

      {/* Distinction Callout: Active Segment vs Evaluation-Only Metric */}
      {typeof activeInPipeline === "number" && (
        <div className="mb-5 p-3 rounded-lg bg-surface-secondary/60 border border-border-subtle text-xs flex items-start gap-2.5">
          <svg viewBox="0 0 16 16" className="w-4 h-4 text-cyan shrink-0 mt-0.5" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="leading-relaxed text-ink-secondary">
            <span className="font-semibold text-ink">Semantic Note:</span>{" "}
            The active pipeline contains <span className="font-mono text-cyan font-bold">{activeSegment.totalActive}</span> total opportunities (including saved and offers), while <span className="font-mono text-cyan font-bold">{activeInPipeline}</span> are actively undergoing employer evaluation (applied, assessment, and interviews).
          </div>
        </div>
      )}

      {/* Proportional Segmented Track */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted font-sans font-medium mb-1.5">
          <span>Active Pipeline ({activeSegment.totalActive})</span>
          <span>Closed Outcomes ({closedSegment.totalClosed})</span>
        </div>

        {/* Segmented Track Bar with Divider */}
        <div className="w-full flex items-center h-4 sm:h-5 rounded-full overflow-hidden p-0.5 bg-surface-secondary border border-border-primary gap-0.5">
          {/* Active Stages Proportional Track */}
          {activeStages.filter((s) => s.count > 0).map((stage) => {
            const meta = STAGE_META[stage.status] || {};
            const widthPct = Math.max(2, (stage.count / snapshotTotal) * 100);
            const isSelected = selectedStageKey === stage.status;
            const isDimmed = selectedStageKey && !isSelected;

            return (
              <button
                key={`bar-act-${stage.status}`}
                type="button"
                onClick={() => setSelectedStageKey(isSelected ? null : stage.status)}
                style={{ width: `${widthPct}%`, height: "100%" }}
                className={cn(
                  "relative rounded-[2px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70",
                  meta.barColor || "bg-cyan",
                  isSelected && "brightness-125 scale-y-115 z-10 shadow-sm",
                  isDimmed && "opacity-30"
                )}
                title={`${stage.label}: ${stage.count} (${stage.percentage}%)`}
                aria-label={`${stage.label}: ${stage.count} (${stage.percentage}%)`}
              />
            );
          })}

          {/* Clean Visual Divider between Active and Closed */}
          {activeSegment.totalActive > 0 && closedSegment.totalClosed > 0 && (
            <div className="w-1.5 h-full bg-border-primary rounded-full shrink-0" aria-hidden="true" />
          )}

          {/* Closed Stages Proportional Track */}
          {closedStages.filter((s) => s.count > 0).map((stage) => {
            const meta = STAGE_META[stage.status] || {};
            const widthPct = Math.max(2, (stage.count / snapshotTotal) * 100);
            const isSelected = selectedStageKey === stage.status;
            const isDimmed = selectedStageKey && !isSelected;

            return (
              <button
                key={`bar-cls-${stage.status}`}
                type="button"
                onClick={() => setSelectedStageKey(isSelected ? null : stage.status)}
                style={{ width: `${widthPct}%`, height: "100%" }}
                className={cn(
                  "relative rounded-[2px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70",
                  meta.barColor || "bg-slate-500",
                  isSelected && "brightness-125 scale-y-115 z-10 shadow-sm",
                  isDimmed && "opacity-30"
                )}
                title={`${stage.label}: ${stage.count} (${stage.percentage}%)`}
                aria-label={`${stage.label}: ${stage.count} (${stage.percentage}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Detailed Stage Cards Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Active Stages Column */}
        <div className="flex flex-col gap-2 p-3.5 sm:p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle">
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-border-subtle/80">
            <span className="font-display font-semibold text-xs sm:text-sm text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan shrink-0" aria-hidden="true" />
              Active Opportunities
            </span>
            <span className="font-mono text-xs font-bold text-cyan">
              {activeSegment.totalActive} total
            </span>
          </div>

          <div className="space-y-1.5" role="list" aria-label="Active stages list">
            {activeStages.map((stage) => {
              const meta = STAGE_META[stage.status] || {};
              const isSelected = selectedStageKey === stage.status;
              const isDimmed = selectedStageKey && !isSelected;

              return (
                <div
                  key={`act-${stage.status}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedStageKey(isSelected ? null : stage.status)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedStageKey(isSelected ? null : stage.status);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer select-none",
                    "border border-transparent hover:border-border-subtle hover:bg-surface-secondary/80",
                    isSelected && "bg-surface-secondary border-border-accent/40 shadow-sm ring-1 ring-border-accent/30",
                    isDimmed && "opacity-40"
                  )}
                  aria-label={`${stage.label}: ${stage.count} applications (${stage.percentage}%)`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("p-1 rounded-md bg-surface border shrink-0", meta.accentBorder, meta.textColor)}>
                      <StageShapeIcon shape={meta.shape} className={meta.textColor} />
                    </span>
                    <span className="font-sans text-xs font-medium text-ink-secondary truncate">
                      {stage.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Mini SVG proportional track */}
                    <div className="w-16 sm:w-20 h-1.5 rounded-full bg-surface overflow-hidden border border-border-subtle/50 hidden sm:block">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300", meta.barColor)}
                        style={{ width: `${Math.min(100, stage.percentage)}%` }}
                      />
                    </div>

                    <span className="font-mono text-xs font-bold text-ink w-7 text-right">
                      {stage.count}
                    </span>

                    <span className="font-mono text-[11px] text-muted w-12 text-right">
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Closed Outcomes Column */}
        <div className="flex flex-col gap-2 p-3.5 sm:p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle">
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-border-subtle/80">
            <span className="font-display font-semibold text-xs sm:text-sm text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
              Closed Outcomes
            </span>
            <span className="font-mono text-xs font-bold text-ink">
              {closedSegment.totalClosed} total
            </span>
          </div>

          <div className="space-y-1.5" role="list" aria-label="Closed stages list">
            {closedStages.map((stage) => {
              const meta = STAGE_META[stage.status] || {};
              const isSelected = selectedStageKey === stage.status;
              const isDimmed = selectedStageKey && !isSelected;

              return (
                <div
                  key={`cls-${stage.status}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedStageKey(isSelected ? null : stage.status)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedStageKey(isSelected ? null : stage.status);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer select-none",
                    "border border-transparent hover:border-border-subtle hover:bg-surface-secondary/80",
                    isSelected && "bg-surface-secondary border-border-accent/40 shadow-sm ring-1 ring-border-accent/30",
                    isDimmed && "opacity-40"
                  )}
                  aria-label={`${stage.label}: ${stage.count} applications (${stage.percentage}%)`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("p-1 rounded-md bg-surface border shrink-0", meta.accentBorder, meta.textColor)}>
                      <StageShapeIcon shape={meta.shape} className={meta.textColor} />
                    </span>
                    <span className="font-sans text-xs font-medium text-ink-secondary truncate">
                      {stage.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Mini SVG proportional track */}
                    <div className="w-16 sm:w-20 h-1.5 rounded-full bg-surface overflow-hidden border border-border-subtle/50 hidden sm:block">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300", meta.barColor)}
                        style={{ width: `${Math.min(100, stage.percentage)}%` }}
                      />
                    </div>

                    <span className="font-mono text-xs font-bold text-ink w-7 text-right">
                      {stage.count}
                    </span>

                    <span className="font-mono text-[11px] text-muted w-12 text-right">
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mandatory Snapshot Disclaimer Banner */}
      <div className="mt-5 pt-3 border-t border-border-subtle/70 flex items-start gap-2 text-[11px] text-muted">
        <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25" />
          <path d="M7 6v4M7 4h.01" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
        <span>{disclaimer}</span>
      </div>
    </div>
  );
}
