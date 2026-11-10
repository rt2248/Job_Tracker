import React from "react"
import { cn } from "../../utils/cn"

/**
 * ProfileCompletenessCard - Interactive Profile Completeness Checklist
 *
 * Visualizes profile completeness strictly using existing user profile and resume data.
 * Allows quick navigation to relevant edit sections.
 */
export default function ProfileCompletenessCard({
  completeness,
  onNavigateToSection,
  className,
}) {
  if (!completeness) return null

  const { score, completedCount, totalCount, statusLabel, statusVariant, items } = completeness
  const incompleteItems = items.filter((item) => !item.completed)

  return (
    <section
      aria-label="Profile Completeness"
      className={cn(
        "bg-surface border border-border-primary rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6",
        className
      )}
    >
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
              Profile Completeness
            </h3>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold",
                statusVariant === "emerald"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                  : statusVariant === "cyan"
                  ? "bg-cyan/15 text-cyan border border-cyan/40"
                  : statusVariant === "amber"
                  ? "bg-amber/15 text-amber border border-amber/40"
                  : "bg-surface-secondary text-muted border border-border-subtle"
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted font-sans mt-1">
            Complete your profile attributes to enhance role assessment and tracking accuracy.
          </p>
        </div>

        {/* Large Numeric Score */}
        <div className="flex items-baseline gap-2 self-start sm:self-auto shrink-0">
          <span className="font-mono text-3xl sm:text-4xl font-bold text-ink leading-none">
            {score}%
          </span>
          <span className="text-xs font-mono text-muted">
            ({completedCount}/{totalCount} sections)
          </span>
        </div>
      </div>

      {/* Visual Progress Track */}
      <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden border border-border-subtle">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            score >= 90
              ? "bg-gradient-to-r from-cyan to-emerald-400"
              : score >= 60
              ? "bg-cyan"
              : "bg-amber"
          )}
          style={{ width: `${Math.max(4, score)}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>

      {/* Checklist Matrix (Clean divided layout without nested boxed cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {items.map((item) => {
          const isCompleted = item.completed

          return (
            <div
              key={item.id}
              className={cn(
                "p-3 rounded-lg transition-colors flex items-start justify-between gap-3 text-xs sm:text-sm",
                isCompleted
                  ? "bg-surface-secondary/30 text-ink-secondary"
                  : "bg-surface-secondary/60 hover:bg-surface-secondary/80 text-ink"
              )}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-colors",
                    isCompleted
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-surface text-muted border border-border-subtle"
                  )}
                  aria-hidden="true"
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                  )}
                </span>
                <div className="min-w-0">
                  <span className={cn("font-medium block truncate", isCompleted ? "text-ink-secondary" : "text-ink")}>
                    {item.label}
                  </span>
                  <span className="text-muted text-[11px] sm:text-xs block truncate mt-0.5">
                    {item.description}
                  </span>
                </div>
              </div>

              {!isCompleted && onNavigateToSection && (
                <button
                  type="button"
                  onClick={() => onNavigateToSection(item)}
                  className="shrink-0 text-cyan hover:underline text-xs font-semibold font-sans cursor-pointer pt-0.5"
                  title={`Complete ${item.label}`}
                >
                  Add +
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Fully Complete Banner (Zero Emojis - Professional SVG Verified Icon) */}
      {incompleteItems.length === 0 && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm flex items-center gap-2.5">
          <svg className="w-4 h-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium font-sans">All profile categories are complete. Professional identity is fully configured.</span>
        </div>
      )}
    </section>
  )
}
