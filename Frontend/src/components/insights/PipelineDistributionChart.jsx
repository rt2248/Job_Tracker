import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "../../utils/cn";
import EmptyStateVisual from "./EmptyStateVisual";

/**
 * Stage visual meta mapping colors, accessible symbols, and semantic tags
 */
const STAGE_META = {
  saved: {
    label: "Saved",
    barColor: "bg-slate-500 dark:bg-slate-400",
    color: "#64748b",
    textColor: "text-slate-400",
    accentBorder: "border-slate-500/40",
    shape: "circle",
    isClosed: false,
  },
  applied: {
    label: "Applied",
    barColor: "bg-cyan",
    color: "#06b6d4",
    textColor: "text-cyan",
    accentBorder: "border-cyan/40",
    shape: "triangle",
    isClosed: false,
  },
  oa: {
    label: "Online Assessment",
    barColor: "bg-amber",
    color: "#f59e0b",
    textColor: "text-amber",
    accentBorder: "border-amber/40",
    shape: "square",
    isClosed: false,
  },
  interview: {
    label: "Interview",
    barColor: "bg-amber-400 dark:bg-yellow-400",
    color: "#fbbf24",
    textColor: "text-amber-500 dark:text-yellow-400",
    accentBorder: "border-amber-400/40 dark:border-yellow-400/40",
    shape: "diamond",
    isClosed: false,
  },
  offer: {
    label: "Offer",
    barColor: "bg-emerald-500 dark:bg-emerald-400",
    color: "#10b981",
    textColor: "text-emerald-600 dark:text-emerald-400",
    accentBorder: "border-emerald-500/40",
    shape: "star",
    isClosed: false,
  },
  accepted: {
    label: "Accepted",
    barColor: "bg-emerald-600 dark:bg-emerald-400",
    color: "#059669",
    textColor: "text-emerald-600 dark:text-emerald-400",
    accentBorder: "border-emerald-600/40",
    shape: "check",
    isClosed: true,
  },
  rejected: {
    label: "Rejected",
    barColor: "bg-red",
    color: "#ef4444",
    textColor: "text-red",
    accentBorder: "border-red/40",
    shape: "cross",
    isClosed: true,
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
 * Custom Tooltip for the Pipeline Distribution Pie Chart
 */
function CustomPieTooltip({ active, payload, snapshotTotal }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  if (!data) return null;

  const isClosed = data.isClosed;
  const meta = STAGE_META[data.status] || {};
  const calculatedPct =
    snapshotTotal > 0
      ? ((data.count / snapshotTotal) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="bg-surface-elevated/95 backdrop-blur-md border border-border-primary rounded-xl p-3 shadow-xl min-w-[210px] text-sm pointer-events-none transition-all">
      <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-border-subtle">
        <span className="font-display font-semibold text-ink text-sm sm:text-base flex items-center gap-1.5">
          <StageShapeIcon shape={meta.shape} className={meta.textColor} />
          {data.label}
        </span>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full border",
            !isClosed
              ? "bg-cyan/10 text-cyan border-cyan/25"
              : "bg-surface-secondary text-ink-secondary border-border-subtle"
          )}
        >
          {!isClosed ? "Active Stage" : "Closed Outcome"}
        </span>
      </div>
      <div className="space-y-1 font-sans">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted">
          <span>Opportunities:</span>
          <span className="font-mono font-bold text-ink">
            {data.count} {data.count === 1 ? "opportunity" : "opportunities"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted">
          <span>Share of Total:</span>
          <span className="font-mono font-bold text-cyan">
            {calculatedPct}%
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * PipelineDistributionChart - Reusable Pipeline Segmentation Chart Card
 *
 * Visualizes current application distribution in an intuitive Recharts Donut Pie Chart.
 * Designed to sit side-by-side with the Submission Activity graph on desktop.
 *
 * @param {Object} props
 * @param {Object} props.pipelineData - Data from GET /api/insights/pipeline
 * @param {number} [props.activeInPipeline] - KPI evaluation count (Applied + OA + Interview)
 * @param {string} [props.selectedStageKey] - Controlled selected stage key for synchronized highlighting
 * @param {(key: string|null) => void} [props.onSelectStageKey] - Selection change callback
 * @param {boolean} [props.showDetails=false] - When true, also renders the static details card internally
 * @param {string} [props.className]
 */
export default function PipelineDistributionChart({
  pipelineData,
  activeInPipeline,
  selectedStageKey: externalSelectedStageKey,
  onSelectStageKey: externalSetSelectedStageKey,
  showDetails = false,
  className,
}) {
  const [internalSelectedStageKey, setInternalSelectedStageKey] = useState(null);
  const selectedStageKey =
    externalSelectedStageKey !== undefined ? externalSelectedStageKey : internalSelectedStageKey;
  const setSelectedStageKey = externalSetSelectedStageKey || setInternalSelectedStageKey;

  const snapshotTotal = pipelineData?.snapshotTotal ?? 0;
  const activeSegment = pipelineData?.activeSegment ?? { totalActive: 0, stages: [] };

  // Combine stages with display metadata for Recharts Pie chart (non-zero slices only)
  const pieSlices = useMemo(() => {
    if (!pipelineData) return [];
    const items = [];
    const active = pipelineData.activeSegment?.stages || [];
    const closed = pipelineData.closedSegment?.stages || [];

    for (const stage of active) {
      if (stage.count > 0) {
        const meta = STAGE_META[stage.status] || {};
        items.push({
          status: stage.status,
          label: stage.label,
          count: stage.count,
          percentage: stage.percentage,
          isClosed: false,
          color: meta.color || "#06b6d4",
        });
      }
    }
    for (const stage of closed) {
      if (stage.count > 0) {
        const meta = STAGE_META[stage.status] || {};
        items.push({
          status: stage.status,
          label: stage.label,
          count: stage.count,
          percentage: stage.percentage,
          isClosed: true,
          color: meta.color || "#ef4444",
        });
      }
    }
    return items;
  }, [pipelineData]);

  if (!pipelineData) {
    return (
      <div className={cn("bg-surface border border-border-primary rounded-xl p-6", className)}>
        <EmptyStateVisual iconType="pipeline" title="Pipeline Data Unavailable" description="No pipeline metrics could be retrieved." />
      </div>
    );
  }

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

  return (
    <div
      className={cn(
        "bg-surface border border-border-primary rounded-xl p-4 sm:p-6 transition-all flex flex-col justify-between",
        className
      )}
      role="region"
      aria-label="Application pipeline distribution"
    >
      <div>
        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <h3 className="font-display text-ink text-lg sm:text-xl font-semibold leading-tight">
            Application Pipeline Distribution
          </h3>
          <p className="text-sm text-muted mt-1">
            Current point-in-time distribution of opportunities across stages
          </p>
        </div>

        {/* Distinction Callout: Active Segment vs Evaluation-Only Metric */}
        {typeof activeInPipeline === "number" && (
          <div className="mb-5 p-3 rounded-lg bg-surface-secondary/60 border border-border-subtle text-sm flex items-start gap-2.5 leading-relaxed">
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
      </div>

      {/* Donut Chart with Centered Total Tracked Opportunities */}
      <div className="relative w-full h-64 sm:h-72 lg:h-80 flex items-center justify-center my-auto py-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Tooltip content={<CustomPieTooltip snapshotTotal={snapshotTotal} />} />
            <Pie
              data={pieSlices}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={102}
              paddingAngle={pieSlices.length > 1 ? 2 : 0}
              cornerRadius={pieSlices.length > 1 ? 3 : 0}
              onClick={(data) => {
                const status = data?.status || data?.payload?.status;
                if (status) {
                  setSelectedStageKey((prev) => (prev === status ? null : status));
                }
              }}
              cursor="pointer"
            >
              {pieSlices.map((entry) => {
                const isSelected = selectedStageKey === entry.status;
                const isDimmed = selectedStageKey && !isSelected;

                return (
                  <Cell
                    key={`pie-cell-${entry.status}`}
                    fill={entry.color}
                    stroke={
                      isSelected
                        ? "#ffffff"
                        : "hsl(var(--surface-primary))"
                    }
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    opacity={isDimmed ? 0.35 : 1}
                    style={{
                      outline: "none",
                      transition: "opacity 0.2s ease, stroke 0.2s ease",
                    }}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centered Total Opportunities Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="font-mono text-3xl sm:text-4xl font-bold text-ink leading-none">
            {snapshotTotal}
          </span>
          <span className="text-xs sm:text-sm text-muted font-sans font-semibold mt-1">
            Total Tracked
          </span>
          <span className="text-xs text-muted/70 font-sans">
            opportunities
          </span>
        </div>
      </div>

      {/* Optional Inlined Details (when showDetails is explicitly true) */}
      {showDetails && (
        <PipelineDistributionDetails
          pipelineData={pipelineData}
          selectedStageKey={selectedStageKey}
          onSelectStageKey={setSelectedStageKey}
          className="mt-6 border-t border-border-subtle pt-6 p-0 bg-transparent border-0 rounded-none"
        />
      )}
    </div>
  );
}

/**
 * PipelineDistributionDetails - Full-width Static Pipeline Information Section
 *
 * Renders the stage legend, active & closed metrics, detailed stage breakdown cards,
 * and point-in-time disclaimer. Positioned beneath the two-chart row spanning full available width.
 *
 * @param {Object} props
 * @param {Object} props.pipelineData - Data from GET /api/insights/pipeline
 * @param {string} [props.selectedStageKey] - Controlled selected stage key for synchronized highlighting
 * @param {(key: string|null) => void} [props.onSelectStageKey] - Selection change callback
 * @param {string} [props.className]
 */
export function PipelineDistributionDetails({
  pipelineData,
  selectedStageKey: externalSelectedStageKey,
  onSelectStageKey: externalSetSelectedStageKey,
  className,
}) {
  const [internalSelectedStageKey, setInternalSelectedStageKey] = useState(null);
  const selectedStageKey =
    externalSelectedStageKey !== undefined ? externalSelectedStageKey : internalSelectedStageKey;
  const setSelectedStageKey = externalSetSelectedStageKey || setInternalSelectedStageKey;

  if (!pipelineData || (pipelineData.snapshotTotal ?? 0) === 0) {
    return null;
  }

  const {
    activeSegment = { totalActive: 0, stages: [] },
    closedSegment = { totalClosed: 0, stages: [] },
    disclaimer = "This represents a point-in-time snapshot of current application stages, not a historical cohort conversion funnel.",
  } = pipelineData;

  const activeStages = activeSegment.stages || [];
  const closedStages = closedSegment.stages || [];

  return (
    <div
      className={cn(
        "bg-surface border border-border-primary rounded-xl p-4 sm:p-6 transition-all",
        className
      )}
      role="region"
      aria-label="Current pipeline overview"
    >
      {/* Section Header */}
      <h3 className="font-display text-ink text-lg sm:text-xl font-semibold leading-tight mb-6 sm:mb-7">
        Current Pipeline Overview
      </h3>

      {/* Detailed Stage Cards Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
        {/* 1. Active Stages Column */}
        <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-border-subtle/80">
            <span className="font-display font-semibold text-sm sm:text-base text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan shrink-0" aria-hidden="true" />
              Active Opportunities
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-cyan">
              {activeSegment.totalActive} total
            </span>
          </div>

          <div className="space-y-2" role="list" aria-label="Active stages list">
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
                    <span className="font-sans text-sm font-medium text-ink-secondary truncate">
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

                    <span className="font-mono text-sm font-bold text-ink w-8 text-right">
                      {stage.count}
                    </span>

                    <span className="font-mono text-xs sm:text-sm text-muted w-14 text-right">
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Closed Outcomes Column */}
        <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-border-subtle/80">
            <span className="font-display font-semibold text-sm sm:text-base text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
              Closed Outcomes
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-ink">
              {closedSegment.totalClosed} total
            </span>
          </div>

          <div className="space-y-2" role="list" aria-label="Closed stages list">
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
                    <span className="font-sans text-sm font-medium text-ink-secondary truncate">
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

                    <span className="font-mono text-sm font-bold text-ink w-8 text-right">
                      {stage.count}
                    </span>

                    <span className="font-mono text-xs sm:text-sm text-muted w-14 text-right">
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
      <div className="mt-8 sm:mt-9 pt-4 border-t border-border-subtle/70 flex items-start gap-2 text-xs sm:text-sm text-muted leading-relaxed">
        <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25" />
          <path d="M7 6v4M7 4h.01" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
        <span>{disclaimer}</span>
      </div>
    </div>
  );
}

PipelineDistributionChart.Details = PipelineDistributionDetails;
