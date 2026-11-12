import React, { useState, useMemo, useRef } from "react";
import { cn } from "../../utils/cn";
import EmptyStateVisual from "./EmptyStateVisual";

/**
 * Formats an ISO YYYY-MM-DD date string into human-friendly format
 * e.g. "2026-10-18" -> "Oct 18"
 */
function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * Formats date string into full format for tooltips
 * e.g. "2026-10-18" -> "Sunday, Oct 18, 2026"
 */
function formatFullDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Builds continuous daily series filling zero-submission dates
 */
function buildContinuousSeries(rawSeries = [], range = "30d") {
  const map = new Map();
  let latestDate = null;
  let earliestDate = null;

  for (const item of rawSeries) {
    if (item && item.date) {
      const cnt = Number(item.count) || 0;
      map.set(item.date, (map.get(item.date) || 0) + cnt);
      if (!latestDate || item.date > latestDate) latestDate = item.date;
      if (!earliestDate || item.date < earliestDate) earliestDate = item.date;
    }
  }

  // Fallback to today if no dates
  const today = new Date().toISOString().split("T")[0];
  const anchorEnd = latestDate || today;

  let dayCount = 30;
  if (range === "90d") dayCount = 90;
  else if (range === "all") {
    if (!earliestDate) dayCount = 30;
    else {
      const startMs = new Date(earliestDate).getTime();
      const endMs = new Date(anchorEnd).getTime();
      const diffDays = Math.max(7, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
      dayCount = Math.min(365, diffDays);
    }
  }

  const result = [];
  const endDateObj = new Date(anchorEnd);

  for (let i = dayCount - 1; i >= 0; i--) {
    const cur = new Date(endDateObj);
    cur.setDate(cur.getDate() - i);
    const dateStr = cur.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      count: map.get(dateStr) || 0,
    });
  }

  return result;
}

/**
 * SubmissionActivityChart - Reusable Custom SVG Application Activity Chart
 *
 * Implements smooth SVG path, gradient fill, responsive coordinates,
 * zero-data handling, touch/click tooltip support, and full dark/light theme compatibility.
 *
 * @param {Object} props
 * @param {Array<{ date: string, count: number }>} [props.dailySeries=[]]
 * @param {'30d'|'90d'|'all'} [props.selectedRange='30d']
 * @param {(range: '30d'|'90d'|'all') => void} [props.onRangeChange]
 * @param {number} [props.totalSubmittedInPeriod]
 * @param {boolean} [props.isLoading=false]
 * @param {string} [props.className]
 */
export default function SubmissionActivityChart({
  dailySeries = [],
  selectedRange = "30d",
  onRangeChange,
  totalSubmittedInPeriod,
  isLoading = false,
  showHeroTotal = false,
  comfortable = false,
  className,
}) {
  const [activePointIndex, setActivePointIndex] = useState(null);
  const chartSvgRef = useRef(null);

  // 1. Prepare continuous timeline
  const timelineData = useMemo(() => {
    return buildContinuousSeries(dailySeries, selectedRange);
  }, [dailySeries, selectedRange]);

  const totalSubmissions = useMemo(() => {
    if (typeof totalSubmittedInPeriod === "number") return totalSubmittedInPeriod;
    return timelineData.reduce((acc, cur) => acc + cur.count, 0);
  }, [timelineData, totalSubmittedInPeriod]);

  // 2. SVG Geometry Calculations
  const svgWidth = 640;
  const svgHeight = 220;
  const padding = { top: 24, right: 28, bottom: 36, left: 38 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const maxCount = useMemo(() => {
    const maxInSeries = Math.max(0, ...timelineData.map((d) => d.count));
    return Math.max(3, Math.ceil(maxInSeries));
  }, [timelineData]);

  // Y-axis gridlines
  const yTicks = useMemo(() => {
    const ticks = [];
    const step = maxCount <= 4 ? 1 : Math.ceil(maxCount / 3);
    for (let val = 0; val <= maxCount; val += step) {
      ticks.push(val);
    }
    if (!ticks.includes(maxCount)) ticks.push(maxCount);
    return ticks;
  }, [maxCount]);

  // Compute point coordinates
  const points = useMemo(() => {
    if (timelineData.length === 0) return [];
    const len = timelineData.length;
    return timelineData.map((item, index) => {
      const x = len > 1
        ? padding.left + (index / (len - 1)) * plotWidth
        : padding.left + plotWidth / 2;
      const y = padding.top + plotHeight - (item.count / maxCount) * plotHeight;
      return { ...item, x, y, index };
    });
  }, [timelineData, plotWidth, plotHeight, maxCount, padding.left, padding.top]);

  // Generate SVG Path
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };
    if (points.length === 1) {
      const p = points[0];
      const baseline = padding.top + plotHeight;
      return {
        linePath: `M ${p.x - 10} ${p.y} L ${p.x + 10} ${p.y}`,
        areaPath: `M ${p.x - 10} ${baseline} L ${p.x - 10} ${p.y} L ${p.x + 10} ${p.y} L ${p.x + 10} ${baseline} Z`,
      };
    }

    let dLine = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Linear segments for precise data tracking
      dLine += ` L ${points[i].x} ${points[i].y}`;
    }

    const baselineY = padding.top + plotHeight;
    const dArea = `${dLine} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

    return { linePath: dLine, areaPath: dArea };
  }, [points, padding.top, plotHeight]);

  // Sample X-axis labels
  const xLabels = useMemo(() => {
    if (points.length === 0) return [];
    const count = points.length <= 14 ? points.length : 5;
    const step = (points.length - 1) / (count - 1);
    const indices = [];
    for (let i = 0; i < count; i++) {
      indices.push(Math.round(i * step));
    }
    const unique = [...new Set(indices)];
    return unique.map((idx) => points[idx]).filter(Boolean);
  }, [points]);

  const activePoint = activePointIndex !== null && points[activePointIndex] ? points[activePointIndex] : null;

  if (isLoading) {
    return (
      <div
        className={cn(
          "dashboard-panel rounded-xl p-4 sm:p-6 transition-all animate-pulse",
          className
        )}
        aria-busy="true"
        aria-label="Loading submission activity"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-2">
            <div className="h-5 w-44 bg-surface-secondary rounded" />
            <div className="h-3 w-64 bg-surface-secondary/60 rounded" />
          </div>
          <div className="h-7 w-48 bg-surface-secondary rounded-lg" />
        </div>
        <div className="h-44 w-full bg-surface-secondary/40 rounded-lg flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "dashboard-panel rounded-xl p-4 sm:p-6 transition-all",
        className
      )}
      role="region"
      aria-label="Application submission activity chart"
    >
      {/* Header with Title and Range Filters */}
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-start justify-between gap-3",
        comfortable ? "mb-6 sm:mb-7" : "mb-5 sm:mb-6"
      )}>
        <div>
          <h3 className="font-display text-ink text-lg sm:text-xl font-semibold leading-tight">
            Submission Activity
          </h3>
          {showHeroTotal ? (
            <div className={cn("flex items-baseline gap-2.5", comfortable ? "mt-2.5" : "mt-2")}>
              <span className="font-mono text-3xl sm:text-4xl font-bold text-ink leading-none tracking-tight">
                {totalSubmissions}
              </span>
              <span className={cn(
                "text-muted font-sans",
                comfortable ? "text-sm sm:text-[15px]" : "text-xs sm:text-sm"
              )}>
                {totalSubmissions === 1 ? "application" : "applications"} submitted{" "}
                ({selectedRange === "30d" ? "last 30d" : selectedRange === "90d" ? "last 90d" : "all time"})
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted mt-1">
              Timeline of {totalSubmissions} {totalSubmissions === 1 ? "application" : "applications"} submitted to employers
            </p>
          )}
        </div>

        {/* Range Selector Pills */}
        <div
          className="inline-flex items-center p-0.5 rounded-lg bg-surface-secondary border border-border-subtle self-start sm:self-auto"
          role="tablist"
          aria-label="Time period selection"
        >
          {[
            { key: "30d", label: "30 Days" },
            { key: "90d", label: "90 Days" },
            { key: "all", label: "All Time" },
          ].map((tab) => {
            const isSelected = selectedRange === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onRangeChange && onRangeChange(tab.key)}
                className={cn(
                  "px-3 font-sans font-medium rounded-md transition-all select-none",
                  comfortable ? "py-2 text-[13px] sm:text-sm" : "py-1.5 text-xs sm:text-sm",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan/70",
                  isSelected
                    ? "bg-surface text-cyan font-semibold shadow-sm border border-border-primary"
                    : "text-muted hover:text-ink hover:bg-surface-overlay/50"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart Graphic / Zero State */}
      {totalSubmissions === 0 && dailySeries.length === 0 ? (
        <EmptyStateVisual
          iconType="activity"
          title="No Submissions in this Period"
          description="Applications moved to Applied, OA, Interview, or Offer will appear on this timeline."
          className="py-10"
        />
      ) : (
        <div className="relative w-full">
          {/* Accessible Text Description for Screen Readers */}
          <div className="sr-only">
            Application submission chart for {selectedRange === "30d" ? "past 30 days" : selectedRange === "90d" ? "past 90 days" : "all time"}. Total {totalSubmissions} submissions.
          </div>

          {/* SVG Vector Chart */}
          <svg
            ref={chartSvgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
            role="img"
            aria-label={`Activity timeline line chart showing ${totalSubmissions} total submissions`}
          >
            <defs>
              {/* Cyan gradient fill for area under line */}
              <linearGradient id="activityAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
                <stop offset="70%" stopColor="#0891b2" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.00" />
              </linearGradient>

              {/* Point glow filter */}
              <filter id="pointGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#22d3ee" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Horizontal Y-Gridlines & Value Labels */}
            {yTicks.map((tickVal) => {
              const y = padding.top + plotHeight - (tickVal / maxCount) * plotHeight;
              return (
                <g key={`ytick-${tickVal}`} className="transition-all">
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + plotWidth}
                    y2={y}
                    className="stroke-border-subtle"
                    strokeWidth="1"
                    strokeDasharray={tickVal === 0 ? "none" : "3 3"}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className={cn(
                      "fill-muted font-mono select-none",
                      comfortable ? "text-[15px]" : "text-xs"
                    )}
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#activityAreaGradient)"
                className="transition-all duration-300"
              />
            )}

            {/* Line Path */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-cyan transition-all duration-300"
              />
            )}

            {/* X-Axis Date Labels */}
            {xLabels.map((lbl) => (
              <text
                key={`xlbl-${lbl.date}-${lbl.index}`}
                x={lbl.x}
                y={padding.top + plotHeight + 22}
                textAnchor="middle"
                className={cn(
                  "fill-muted font-sans select-none",
                  comfortable ? "text-[15px]" : "text-xs"
                )}
              >
                {formatDateLabel(lbl.date)}
              </text>
            ))}

            {/* Active Crosshair Line on Selected Point */}
            {activePoint && (
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + plotHeight}
                className="stroke-cyan/50"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Interactive Data Points (Circles) */}
            {points.map((pt) => {
              const isNonZero = pt.count > 0;
              const isActive = activePointIndex === pt.index;

              return (
                <g
                  key={`pt-${pt.date}-${pt.index}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${formatFullDate(pt.date)}: ${pt.count} submissions`}
                  onMouseEnter={() => setActivePointIndex(pt.index)}
                  onMouseLeave={() => setActivePointIndex(null)}
                  onClick={() => setActivePointIndex(isActive ? null : pt.index)}
                  onFocus={() => setActivePointIndex(pt.index)}
                  onBlur={() => setActivePointIndex(null)}
                  className="cursor-pointer focus-visible:outline-none"
                >
                  {/* Invisible larger hit target for touch / mouse */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={Math.max(10, plotWidth / points.length / 2)}
                    fill="transparent"
                  />

                  {/* Render visible node if non-zero or active */}
                  {(isNonZero || isActive) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 5.5 : 3.5}
                      className={cn(
                        "transition-all duration-150",
                        isActive
                          ? "fill-white stroke-cyan stroke-[2.5]"
                          : "fill-cyan stroke-surface stroke-[1.5]"
                      )}
                      filter={isActive ? "url(#pointGlow)" : undefined}
                    />
                  )}
                </g>
              );
            })}

            {/* Floating SVG Tooltip Card */}
            {activePoint && (
              <g
                transform={`translate(${
                  Math.min(
                    svgWidth - 85,
                    Math.max(85, activePoint.x)
                  )
                }, ${
                  activePoint.y < 70
                    ? activePoint.y + 18
                    : activePoint.y - 54
                })`}
                className="pointer-events-none transition-transform duration-75"
              >
                {/* Tooltip Background Card */}
                <rect
                  x="-82"
                  y="-14"
                  width="164"
                  height="48"
                  rx="8"
                  className="fill-surface-elevated stroke-border-primary"
                  strokeWidth="1"
                />

                {/* Date string */}
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  className="fill-muted font-sans text-xs font-medium"
                >
                  {formatFullDate(activePoint.date)}
                </text>

                {/* Count value */}
                <text
                  x="0"
                  y="23"
                  textAnchor="middle"
                  className="fill-ink font-mono font-bold text-sm"
                >
                  {activePoint.count} {activePoint.count === 1 ? "application" : "applications"}
                </text>
              </g>
            )}
          </svg>

          {/* Footer note explaining zero days */}
          <div className={cn(
            "flex items-center justify-between text-muted border-t border-border-subtle",
            comfortable ? "text-[13px] sm:text-sm mt-5 pt-3.5" : "text-xs sm:text-sm mt-4 pt-3"
          )}>
            <span>
              Dates with no marks indicate 0 applications submitted on that day
            </span>
            {activePoint && (
              <span className="font-mono text-cyan font-medium hidden sm:inline">
                {formatDateLabel(activePoint.date)}: {activePoint.count} submitted
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
