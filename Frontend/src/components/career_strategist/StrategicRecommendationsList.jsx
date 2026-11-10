import React, { useState } from "react";
import { cn } from "../../utils/cn";

/**
 * Format category identifier into readable label.
 */
const CATEGORY_LABELS = {
  // Canonical Backend Categories
  pipeline_velocity: "Pipeline Velocity",
  targeting_alignment: "Targeting & Alignment",
  skill_acquisition: "Skill Acquisition",
  interview_preparation: "Interview Preparation",
  data_hygiene: "Data & Pipeline Hygiene",
  // Aliases for compatibility
  pipeline_hygiene: "Pipeline Hygiene",
  application_strategy: "Application Strategy",
  interview_prep: "Interview Preparation",
  positioning: "Resume & Positioning",
};

/**
 * Priority configuration for badges and accent borders.
 */
const PRIORITY_CONFIG = {
  high: {
    label: "High Priority",
    badgeVariant: "rose",
    borderClass: "border-l-4 border-l-red",
    bgBadge: "bg-red/15 text-red border-red/40",
  },
  medium: {
    label: "Medium Priority",
    badgeVariant: "amber",
    borderClass: "border-l-4 border-l-amber",
    bgBadge: "bg-amber/15 text-amber border-amber/40",
  },
  low: {
    label: "Strategic Guidance",
    badgeVariant: "cyan",
    borderClass: "border-l-4 border-l-cyan",
    bgBadge: "bg-cyan/15 text-cyan border-cyan/40",
  },
};

/**
 * Single Recommendation Item Card.
 */
function RecommendationCard({ recommendation, index }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const { priority = "medium", category, title, rationale, actionSteps = [], expectedImpact } =
    recommendation;

  const prio = PRIORITY_CONFIG[priority.toLowerCase()] || PRIORITY_CONFIG.medium;
  const categoryLabel = CATEGORY_LABELS[category] || category?.replace(/_/g, " ") || "Strategy";

  return (
    <div
      className={cn(
        "rounded-xl bg-surface border border-border-primary p-4 sm:p-5 transition-all duration-200",
        prio.borderClass
      )}
    >
      {/* Header with Title, Category, and Priority Badge */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                prio.bgBadge
              )}
            >
              {prio.label}
            </span>
            <span className="text-xs font-medium text-muted px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle">
              {categoryLabel}
            </span>
          </div>
          <h4 className="font-display font-semibold text-ink text-base sm:text-lg leading-snug">
            {index + 1}. {title}
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs text-muted hover:text-ink font-medium px-2 py-1 rounded hover:bg-surface-secondary transition-colors"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {/* Rationale */}
      <p className="text-xs sm:text-sm text-ink-secondary mb-4 leading-relaxed">
        {rationale}
      </p>

      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-border-subtle">
          {/* Action Steps */}
          {Array.isArray(actionSteps) && actionSteps.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-ink uppercase tracking-wider block mb-2">
                Action Steps:
              </span>
              <ul className="space-y-2">
                {actionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-secondary">
                    <span className="w-5 h-5 rounded-full bg-surface-secondary border border-border-primary text-cyan flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expected Impact */}
          {expectedImpact && (
            <div className="p-3 rounded-lg bg-surface-secondary/70 border border-border-subtle flex items-start gap-2.5">
              <span className="text-sm font-bold text-green shrink-0 mt-0.5">📈</span>
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-semibold text-ink block sm:inline sm:mr-1">
                  Expected Impact:
                </span>
                <span className="text-ink-secondary">{expectedImpact}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * StrategicRecommendationsList - Prioritized list of actionable recommendations.
 *
 * @param {Object} props
 * @param {Array} props.recommendations
 * @param {string} [props.className]
 */
export default function StrategicRecommendationsList({ recommendations = [], className }) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return null;
  }

  // Sort recommendations: high priority first, then medium, then low
  const priorityWeight = { high: 1, medium: 2, low: 3 };
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const pA = priorityWeight[a.priority?.toLowerCase()] || 4;
    const pB = priorityWeight[b.priority?.toLowerCase()] || 4;
    return pA - pB;
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-ink text-lg sm:text-xl flex items-center gap-2">
          <span>Strategic Recommendations</span>
          <span className="text-xs font-normal text-muted px-2 py-0.5 rounded-full bg-surface-secondary border border-border-subtle">
            {sortedRecommendations.length} Actions
          </span>
        </h3>
      </div>

      <div className="space-y-3.5">
        {sortedRecommendations.map((rec, idx) => (
          <RecommendationCard key={idx} recommendation={rec} index={idx} />
        ))}
      </div>
    </div>
  );
}
