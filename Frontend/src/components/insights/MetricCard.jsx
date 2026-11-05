import React from "react";
import Card from "../shared/Card";
import { cn } from "../../utils/cn";

/**
 * MetricCard - Shared KPI & Metric Display Card
 *
 * Implements the refined visual hierarchy:
 * 1. Metric Label: Clearly visible, semibold, high contrast text-ink.
 * 2. Numerical Value: Prominent, bold, font-mono with domain status color coding.
 * 3. Supporting Description: Subdued text-muted helper text.
 *
 * @param {Object} props
 * @param {string} props.label - Primary metric label (e.g. "Tracked", "Cumulative Offers")
 * @param {string|number} props.value - Numerical or formatted value
 * @param {string} [props.description] - Supporting descriptive text below the value
 * @param {string} [props.indicatorColor='bg-slate-400'] - Tailwind background class for status dot
 * @param {string} [props.valueColor='text-ink'] - Tailwind color class for numerical value
 * @param {boolean} [props.compact=false] - Whether to render in compact mode for denser dashboards
 * @param {string} [props.className] - Additional wrapper card classes
 */
export default function MetricCard({
  label,
  value,
  description,
  indicatorColor = "bg-slate-400",
  valueColor = "text-ink",
  compact = false,
  className,
}) {
  return (
    <Card
      className={cn(
        "bg-surface border-border-primary flex flex-col justify-between transition-all",
        compact ? "p-3" : "p-3.5 sm:p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "font-sans font-semibold text-ink leading-tight",
            compact ? "text-sm" : "text-base sm:text-lg"
          )}
        >
          {label}
        </span>
        <span
          className={cn("w-2 h-2 rounded-full shrink-0", indicatorColor)}
          aria-hidden="true"
        />
      </div>

      <p
        className={cn(
          "font-mono font-bold",
          compact ? "text-2xl sm:text-3xl mt-1" : "text-3xl sm:text-4xl mt-1.5",
          valueColor
        )}
      >
        {value}
      </p>

      {description && (
        <p
          className={cn(
            "text-muted font-sans mt-0.5 leading-normal",
            compact ? "text-xs mt-0.5" : "text-xs sm:text-sm mt-1"
          )}
        >
          {description}
        </p>
      )}
    </Card>
  );
}
