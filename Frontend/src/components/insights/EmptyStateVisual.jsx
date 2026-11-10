import React from "react";
import { cn } from "../../utils/cn";

/**
 * EmptyStateVisual - Custom SVG Empty State Graphic and Container
 *
 * Designed with Job Tracker's dark obsidian / light slate design language.
 * Uses clean geometric axes, data nodes, and soft orbit rings.
 *
 * @param {Object} props
 * @param {string} props.title - Headline
 * @param {string} props.description - Explanatory message
 * @param {'activity'|'pipeline'|'skills'|'general'} [props.iconType='general'] - Visual motif
 * @param {React.ReactNode} [props.action] - Optional CTA button or link
 * @param {string} [props.className] - Container class
 */
export default function EmptyStateVisual({
  title,
  description,
  iconType = "general",
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-xl",
        "bg-surface-secondary/40 border border-border-subtle",
        className
      )}
      role="region"
      aria-label={title || "No data available"}
    >
      {/* Custom SVG Graphic */}
      <div className="relative mb-4 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full text-muted select-none"
          fill="none"
          aria-hidden="true"
        >
          {/* Subtle background ambient ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-border-subtle"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle
            cx="50"
            cy="50"
            r="32"
            className="stroke-border-primary/50"
            strokeWidth="1"
          />

          {iconType === "activity" && (
            <>
              {/* Activity Trendline Motif */}
              <line
                x1="20"
                y1="75"
                x2="80"
                y2="75"
                className="stroke-border-primary"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="20"
                y1="25"
                x2="20"
                y2="75"
                className="stroke-border-primary"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 22 72 Q 38 68 50 55 T 78 36"
                className="stroke-cyan/40"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
              <circle cx="50" cy="55" r="3" className="fill-cyan/70" />
              <circle cx="78" cy="36" r="3.5" className="fill-cyan stroke-surface" strokeWidth="1.5" />
            </>
          )}

          {iconType === "pipeline" && (
            <>
              {/* Pipeline Funnel / Stages Motif */}
              <rect x="22" y="30" width="56" height="7" rx="3.5" className="fill-cyan/30 stroke-cyan/60" strokeWidth="1" />
              <rect x="28" y="44" width="44" height="7" rx="3.5" className="fill-amber/30 stroke-amber/60" strokeWidth="1" />
              <rect x="36" y="58" width="28" height="7" rx="3.5" className="fill-emerald-500/30 stroke-emerald-500/60" strokeWidth="1" />
              <rect x="42" y="72" width="16" height="7" rx="3.5" className="fill-red/30 stroke-red/60" strokeWidth="1" />
            </>
          )}

          {iconType === "skills" && (
            <>
              {/* Skill Nodes & Constellation Motif */}
              <circle cx="50" cy="50" r="14" className="stroke-cyan/50 fill-cyan/10" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="5" className="fill-cyan" />
              <line x1="50" y1="36" x2="50" y2="24" className="stroke-border-primary" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="62" y1="58" x2="74" y2="66" className="stroke-border-primary" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="38" y1="58" x2="26" y2="66" className="stroke-border-primary" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="50" cy="22" r="4" className="fill-amber/60" />
              <circle cx="76" cy="68" r="4" className="fill-emerald-500/60" />
              <circle cx="24" cy="68" r="4" className="fill-border-primary" />
            </>
          )}

          {iconType === "general" && (
            <>
              {/* Standard Analytics Motif */}
              <rect x="30" y="52" width="9" height="26" rx="2" className="fill-border-primary" />
              <rect x="45" y="38" width="9" height="40" rx="2" className="fill-cyan/50" />
              <rect x="60" y="46" width="9" height="32" rx="2" className="fill-border-primary" />
              <line x1="22" y1="80" x2="78" y2="80" className="stroke-border-subtle" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </svg>
      </div>

      {/* Copy */}
      {title && (
        <h4 className="font-display text-base sm:text-lg font-semibold text-ink mb-1.5">
          {title}
        </h4>
      )}
      {description && (
        <p className="text-sm sm:text-base text-muted max-w-md mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {/* Action CTA */}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
