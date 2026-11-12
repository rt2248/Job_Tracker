import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../shared/Card";
import Badge from "../shared/Badge";
import { cn } from "../../utils/cn";

/**
 * Human-readable mapping for career stage identifiers.
 */
const CAREER_STAGE_LABELS = {
  entry_level: "Entry Level",
  mid_level: "Mid-Level Professional",
  senior: "Senior Professional",
  lead_architect: "Lead / Principal / Architect",
  transitioning: "Career Transitioning",
  unspecified: "Unspecified Stage",
  executive: "Executive / Director",
};

const EXPERIENCE_BOUNDED_STAGES = new Set([
  "entry_level",
  "mid_level",
  "senior",
  "lead_architect",
  "transitioning",
]);

/**
 * Visual styling and metadata for pipeline health statuses.
 */
const PIPELINE_HEALTH_CONFIG = {
  healthy: {
    label: "Healthy Velocity",
    variant: "emerald",
    description: "Pipeline shows balanced stage progression and steady interview conversion.",
  },
  needs_focus: {
    label: "Needs Focus",
    variant: "amber",
    description: "Pipeline requires attention on specific stage conversion or follow-ups.",
  },
  critical_bottleneck: {
    label: "Critical Bottleneck",
    variant: "rose",
    description: "Significant stagnation, high rejection rate, or low active volume detected.",
  },
  insufficient_data: {
    label: "Insufficient Data",
    variant: "subtle",
    description: "Telemetry volume is too limited to diagnose confident pipeline patterns.",
  },
  inconsistent_data: {
    label: "Inconsistent Telemetry",
    variant: "subtle",
    description: "Pipeline telemetry shows inconsistencies across recorded stages.",
  },
  // Aliases for resilience
  needs_attention: {
    label: "Needs Attention",
    variant: "amber",
    description: "Applications are bottlenecking or conversion drop-off is elevated.",
  },
  critical: {
    label: "Critical Bottleneck",
    variant: "rose",
    description: "Significant stagnation, high rejection rate, or low active volume detected.",
  },
};

/**
 * CandidateSummaryCard - Displays executive diagnosis of career stage, pipeline health,
 * and primary bottleneck with bounded accuracy.
 *
 * @param {Object} props
 * @param {Object} props.candidateSummary
 * @param {string} [props.className]
 */
export default function CandidateSummaryCard({ candidateSummary, className }) {
  if (!candidateSummary) return null;

  const { careerStage, pipelineHealth, primaryBottleneck } = candidateSummary;
  const stageLabel = CAREER_STAGE_LABELS[careerStage] || careerStage || "Not Specified";
  const healthConfig =
    PIPELINE_HEALTH_CONFIG[pipelineHealth] || PIPELINE_HEALTH_CONFIG.insufficient_data;

  const isUnspecified = !careerStage || careerStage === "unspecified";
  const isExperienceBounded = EXPERIENCE_BOUNDED_STAGES.has(careerStage);

  return (
    <Card className={cn("overflow-hidden border-border-primary", className)}>
      <CardHeader className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg">
            Executive Assessment
          </CardTitle>
          <Badge dot variant={healthConfig.variant} size="sm" className="font-semibold">
            {healthConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Career Stage & Health Summary Row (Flat divided sections, no boxed sub-cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted block uppercase tracking-wider">
              Diagnosed Career Stage
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-display font-semibold text-ink text-base sm:text-lg">
                {stageLabel}
              </span>
              {isUnspecified ? (
                <Badge variant="subtle" size="sm">
                  Unclassified
                </Badge>
              ) : isExperienceBounded ? (
                <Badge variant="indigo" size="sm">
                  Experience-Bounded
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted block uppercase tracking-wider">
              Pipeline Health Assessment
            </span>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              {healthConfig.description}
            </p>
          </div>
        </div>

        {/* Primary Bottleneck Callout (Left accent band without emoji or gradient) */}
        <div className="pt-4 border-t border-border-subtle">
          <div className="pl-3.5 border-l-2 border-l-cyan flex items-start gap-3">
            <svg
              className="w-4 h-4 text-cyan shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-xs font-semibold text-cyan uppercase tracking-wider block">
                Primary Pipeline Bottleneck
              </span>
              <p className="text-sm text-ink leading-relaxed font-sans">
                {primaryBottleneck || "No critical bottleneck detected in current stage progression."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
