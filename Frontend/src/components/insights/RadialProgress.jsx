import React from "react";
import { cn } from "../../utils/cn";

/**
 * RadialProgress - Reusable custom SVG circular progress ring
 *
 * Supports dark and light themes, accessible ARIA attributes,
 * and scalable vector rendering without external dependencies.
 *
 * @param {Object} props
 * @param {number|null} props.value - Percentage (0-100) or null if unavailable
 * @param {number} [props.size=68] - Diameter in pixels
 * @param {number} [props.strokeWidth=6] - Stroke width in pixels
 * @param {'cyan'|'amber'|'green'|'red'|'yellow'|'default'} [props.variant='cyan'] - Color variant
 * @param {boolean} [props.showValue=true] - Whether to render text in the center
 * @param {string} [props.label] - Accessible label for screen readers
 * @param {string} [props.sublabel] - Secondary text displayed beneath the value
 * @param {string} [props.className] - Additional wrapper classes
 */
export default function RadialProgress({
  value,
  size = 68,
  strokeWidth = 6,
  variant = "cyan",
  showValue = true,
  label,
  sublabel,
  className,
}) {
  const hasValue = typeof value === "number" && !Number.isNaN(value);
  const clampedValue = hasValue ? Math.max(0, Math.min(100, Math.round(value))) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasValue
    ? circumference - (clampedValue / 100) * circumference
    : circumference;

  const center = size / 2;

  // Variant color definitions compatible with dark & light themes
  const variantStyles = {
    cyan: {
      stroke: "stroke-cyan",
      text: "text-cyan",
      track: "text-cyan/15",
    },
    amber: {
      stroke: "stroke-amber",
      text: "text-amber",
      track: "text-amber/15",
    },
    yellow: {
      stroke: "stroke-amber-400 dark:stroke-yellow-400",
      text: "text-amber-500 dark:text-yellow-400",
      track: "text-amber-400/15 dark:text-yellow-400/15",
    },
    green: {
      stroke: "stroke-emerald-500 dark:stroke-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
      track: "text-emerald-500/15",
    },
    red: {
      stroke: "stroke-red",
      text: "text-red",
      track: "text-red/15",
    },
    default: {
      stroke: "stroke-ink-secondary",
      text: "text-ink",
      track: "text-border-subtle",
    },
  };

  const style = variantStyles[variant] || variantStyles.cyan;
  const ariaText = label || (hasValue ? `${clampedValue}%` : "Not available");

  return (
    <div
      className={cn("relative inline-flex flex-col items-center justify-center shrink-0", className)}
      role="progressbar"
      aria-valuenow={hasValue ? clampedValue : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaText}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-current transition-colors", style.track)}
        />

        {/* Foreground progress circle */}
        {hasValue && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-700 ease-out",
              style.stroke
            )}
          />
        )}
      </svg>

      {/* Center content */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hasValue ? (
            <>
              <span className={cn("font-mono font-bold leading-none tracking-tight", style.text, size < 55 ? "text-xs font-bold" : size < 80 ? "text-sm sm:text-base font-bold" : "text-base sm:text-lg font-bold")}>
                {clampedValue}%
              </span>
              {sublabel && (
                <span className="text-xs text-muted font-sans font-semibold uppercase tracking-wider mt-0.5">
                  {sublabel}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs sm:text-sm text-muted font-mono font-medium">N/A</span>
          )}
        </div>
      )}
    </div>
  );
}
