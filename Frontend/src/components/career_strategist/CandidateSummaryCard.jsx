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

/**
 * Visual styling and metadata for pipeline health statuses.
 */
const PIPELINE_HEALTH_CONFIG = {
  healthy: {
    label: "Healthy Velocity",
    variant: "emerald",
    bgClass: "bg-green/10 text-green border-green/30",
    dotClass: "bg-green",
    description: "Pipeline shows balanced stage progression and steady interview conversion.",
  },
  needs_focus: {
    label: "Needs Focus",
    variant: "amber",
    bgClass: "bg-amber/10 text-amber border-amber/30",
    dotClass: "bg-amber",
    description: "Pipeline requires attention on specific stage conversion or follow-ups.",
  },
  critical_bottleneck: {
    label: "Critical Bottleneck",
    variant: "rose",
    bgClass: "bg-red/10 text-red border-red/30",
    dotClass: "bg-red",
    description: "Significant stagnation, high rejection rate, or low active volume detected.",
  },
  insufficient_data: {
    label: "Insufficient Data",
    variant: "subtle",
    bgClass: "bg-surface-secondary text-muted border-border-primary",
    dotClass: "bg-muted",
    description: "Telemetry volume is too limited to diagnose confident pipeline patterns.",
  },
  inconsistent_data: {
    label: "Inconsistent Telemetry",
    variant: "subtle",
    bgClass: "bg-surface-secondary text-muted border-border-primary",
    dotClass: "bg-muted",
    description: "Pipeline telemetry shows inconsistencies across recorded stages.",
  },
  // Aliases for resilience
  needs_attention: {
    label: "Needs Attention",
    variant: "amber",
    bgClass: "bg-amber/10 text-amber border-amber/30",
    dotClass: "bg-amber",
    description: "Applications are bottlenecking or conversion drop-off is elevated.",
  },
  critical: {
    label: "Critical Bottleneck",
    variant: "rose",
    bgClass: "bg-red/10 text-red border-red/30",
    dotClass: "bg-red",
    description: "Significant stagnation, high rejection rate, or low active volume detected.",
  },
};

/**
 * CandidateSummaryCard - Displays executive diagnosis of career stage, pipeline health,
 * and primary bottleneck.
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

  return (
    <Card className={cn("overflow-hidden border-border-primary", className)}>
      <CardHeader className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <span>Executive Assessment</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                healthConfig.bgClass
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", healthConfig.dotClass)} />
              {healthConfig.label}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Career Stage & Diagnostics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-lg bg-surface-secondary/60 border border-border-subtle">
            <span className="text-xs font-medium text-muted block mb-1 uppercase tracking-wider">
              Diagnosed Career Stage
            </span>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-ink text-sm sm:text-base">
                {stageLabel}
              </span>
              <Badge variant="indigo" size="sm">
                Verified
              </Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-secondary/60 border border-border-subtle">
            <span className="text-xs font-medium text-muted block mb-1 uppercase tracking-wider">
              Pipeline Health Assessment
            </span>
            <p className="text-xs text-ink-secondary leading-relaxed">
              {healthConfig.description}
            </p>
          </div>
        </div>

        {/* Primary Bottleneck Callout */}
        <div className="p-4 rounded-lg bg-surface border border-border-accent/40 bg-gradient-to-r from-surface to-surface-secondary">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-cyan/15 text-cyan flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-cyan/40">
              ⚡
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-cyan uppercase tracking-wider block mb-1">
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
