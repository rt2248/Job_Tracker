import React, { useState } from "react";
import { cn } from "../../utils/cn";

/**
 * SegmentedBar - Reusable Proportional Distribution Bar
 *
 * Renders a segmented horizontal bar representing proportional shares of a total.
 * Supports active selection, touch/click interaction, tooltips, and accessible labels.
 *
 * @param {Object} props
 * @param {Array<{
 *   key: string,
 *   label: string,
 *   count: number,
 *   percentage: number,
 *   color: string,
 *   textColor?: string
 * }>} props.segments
 * @param {number} props.total
 * @param {string} [props.activeKey]
 * @param {(segment: Object) => void} [props.onSegmentClick]
 * @param {number} [props.height=14]
 * @param {string} [props.className]
 */
export default function SegmentedBar({
  segments = [],
  total = 0,
  activeKey,
  onSegmentClick,
  height = 14,
  className,
}) {
  const [hoveredKey, setHoveredKey] = useState(null);

  if (!segments || segments.length === 0 || total <= 0) {
    return (
      <div
        className={cn(
          "w-full rounded-full bg-surface-secondary border border-border-subtle flex items-center justify-center text-xs text-muted font-mono",
          className
        )}
        style={{ height }}
        role="progressbar"
        aria-valuenow={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Empty distribution bar"
      >
        <span className="sr-only">0 opportunities tracked</span>
      </div>
    );
  }

  // Filter out 0-count segments for the visual bar (they remain in legend/breakdown)
  const nonZeroSegments = segments.filter((s) => s.count > 0);

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="w-full flex items-center rounded-full overflow-hidden p-0.5 bg-surface-secondary/80 border border-border-primary/80 gap-0.5"
        style={{ height }}
        role="group"
        aria-label="Proportional stage distribution bar"
      >
        {nonZeroSegments.map((segment, index) => {
          const widthPct = Math.max(1.5, (segment.count / total) * 100);
          const isSelected = activeKey === segment.key || hoveredKey === segment.key;
          const isDimmed = (activeKey || hoveredKey) && !isSelected;

          return (
            <button
              key={segment.key}
              type="button"
              onClick={() => onSegmentClick && onSegmentClick(segment)}
              onMouseEnter={() => setHoveredKey(segment.key)}
              onMouseLeave={() => setHoveredKey(null)}
              onFocus={() => setHoveredKey(segment.key)}
              onBlur={() => setHoveredKey(null)}
              style={{ width: `${widthPct}%`, height: "100%" }}
              className={cn(
                "relative rounded-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70",
                segment.color || "bg-muted",
                index === 0 && "rounded-l-full",
                index === nonZeroSegments.length - 1 && "rounded-r-full",
                isSelected && "brightness-125 scale-y-110 z-10 shadow-sm",
                isDimmed && "opacity-35"
              )}
              aria-label={`${segment.label}: ${segment.count} (${segment.percentage}%)`}
              title={`${segment.label}: ${segment.count} (${segment.percentage}%)`}
            >
              <span className="sr-only">
                {segment.label}: {segment.count} items ({segment.percentage}%)
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
