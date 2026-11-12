import React, { useState } from "react";
import Badge from "../shared/Badge";
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
 * Priority configuration using restrained dot/text variants and accent border.
 */
const PRIORITY_CONFIG = {
  high: {
    label: "High Priority",
    badgeVariant: "rose",
    borderClass: "border-l-4 border-l-red",
  },
  medium: {
    label: "Medium Priority",
    badgeVariant: "amber",
    borderClass: "border-l-4 border-l-amber",
  },
  low: {
    label: "Strategic Guidance",
    badgeVariant: "cyan",
    borderClass: "border-l-4 border-l-cyan",
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
        "rounded-lg bg-surface border border-border-primary p-5 sm:p-6 transition-colors duration-200",
        prio.borderClass
      )}
    >
      {/* Header with Priority Dot, Plain Category Label, and Numbered Title */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge dot variant={prio.badgeVariant} size="sm" className="font-semibold">
              {prio.label}
            </Badge>
            <span className="hidden sm:inline text-muted text-xs" aria-hidden="true">·</span>
            <span className="text-xs font-mono uppercase tracking-wider text-muted">
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
          className="text-xs text-muted hover:text-ink font-medium px-2.5 py-1 rounded hover:bg-surface-secondary transition-colors shrink-0"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {/* Problem Justification: Why It Matters */}
      {rationale && (
        <div className="mb-4 space-y-1">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
            Why It Matters
          </span>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            {rationale}
          </p>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-border-subtle">
          {/* Action Steps: Recommended Actions */}
          {Array.isArray(actionSteps) && actionSteps.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Recommended Actions
              </span>
              <ol className="space-y-2">
                {actionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-ink-secondary">
                    <span className="font-mono text-xs font-semibold text-cyan shrink-0 pt-0.5 w-4">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Expected Benefit (Clean divider without nested box or emoji) */}
          {expectedImpact && (
            <div className="pt-3 border-t border-border-subtle space-y-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Expected Benefit
              </span>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                {expectedImpact}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * StrategicRecommendationsList - Prioritized list of actionable recommendations
 * with transparent synthesis and fallback attribution.
 *
 * @param {Object} props
 * @param {Array} props.recommendations
 * @param {boolean} [props.fallbackActive=false]
 * @param {string} [props.pipelineHealth]
 * @param {string} [props.className]
 */
export default function StrategicRecommendationsList({
  recommendations = [],
  fallbackActive = false,
  pipelineHealth,
  className,
}) {
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

  const isInsufficient = pipelineHealth === "insufficient_data";

  return (
    <section aria-label="Strategic Recommendations" className={cn("space-y-4", className)}>
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display font-semibold text-ink text-lg sm:text-xl">
            Strategic Recommendations
          </h3>
          <span className="text-xs font-mono text-muted">
            {sortedRecommendations.length} {sortedRecommendations.length === 1 ? "Action" : "Actions"}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          {fallbackActive
            ? "Generated by local deterministic heuristic rules from your recorded telemetry and profile data. Inspect supporting inputs and scope limits in Evidence & Verification Audit below."
            : isInsufficient
            ? "AI-synthesized starting guidance under limited pipeline telemetry. Review recorded counts and missing-data notes in Evidence & Verification Audit below."
            : "AI-synthesized guidance informed by your submitted profile and tracked telemetry. Inspect verified facts and limitations in Evidence & Verification Audit below."}
        </p>
      </div>

      <div className="space-y-4">
        {sortedRecommendations.map((rec, idx) => (
          <RecommendationCard key={rec.id || idx} recommendation={rec} index={idx} />
        ))}
      </div>
    </section>
  );
}
