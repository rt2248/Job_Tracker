import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../shared/Card";
import { cn } from "../../utils/cn";

/**
 * PipelineDiagnosticsCard - Surfaces application volume metrics, velocity, and
 * staleness diagnostics with clear insufficient-data and inconsistent-data context.
 *
 * @param {Object} props
 * @param {Object} props.pipelineDiagnostics
 * @param {string} [props.pipelineHealth]
 * @param {string} [props.dataLimitationsNoted]
 * @param {string} [props.className]
 */
export default function PipelineDiagnosticsCard({
  pipelineDiagnostics,
  pipelineHealth,
  dataLimitationsNoted,
  className,
}) {
  if (!pipelineDiagnostics) return null;

  const {
    volumeAssessment,
    stageProgressionVelocity,
    staleApplicationRisk,
  } = pipelineDiagnostics;

  const trimmedLimitations =
    typeof dataLimitationsNoted === "string" ? dataLimitationsNoted.trim() : "";

  const isInsufficientData = pipelineHealth === "insufficient_data";
  const isInconsistentData = pipelineHealth === "inconsistent_data";

  return (
    <Card className={cn("overflow-hidden border-border-primary", className)}>
      <CardHeader className="mb-4">
        <CardTitle className="text-base sm:text-lg">
          Pipeline Telemetry Diagnostics
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Insufficient Data Explanatory Notice */}
        {isInsufficientData && (
          <div
            role="status"
            className="p-3.5 rounded-md bg-surface-secondary border-l-4 border-l-amber text-xs sm:text-sm space-y-2"
          >
            <div className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-amber shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="space-y-1.5 leading-relaxed">
                <p className="font-semibold text-ink">
                  Insufficient Pipeline Activity for Performance Conclusions
                </p>
                <p className="text-ink-secondary">
                  Current tracked volume is too limited to evaluate stage progression speed, bottleneck causality, or meaningful staleness patterns reliably.
                </p>
                {trimmedLimitations && (
                  <p className="text-muted text-xs">
                    Reported limitation: {trimmedLimitations}
                  </p>
                )}
                <p className="text-muted text-xs">
                  To enable deeper diagnostics: track target roles, log submitted applications, and update stage transitions as applications progress.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inconsistent Data Caution Notice */}
        {isInconsistentData && (
          <div
            role="status"
            className="p-3.5 rounded-md bg-amber/10 border-l-4 border-l-amber text-xs sm:text-sm space-y-1.5"
          >
            <div className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-amber shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="space-y-1 leading-relaxed">
                <p className="font-semibold text-ink">
                  Pipeline Telemetry Review Recommended
                </p>
                <p className="text-ink-secondary">
                  Stage counts or recorded outcomes appear inconsistent. Review tracked application statuses and dates before relying on conversion conclusions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Clean Divided Diagnostic Rows (Zero nested card boxes) */}
        <div className="divide-y divide-border-subtle">
          {/* Volume Assessment */}
          <div className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Application Volume
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              {volumeAssessment || "No volume assessment available."}
            </p>
          </div>

          {/* Stage Progression Velocity */}
          <div className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Stage Velocity
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              {stageProgressionVelocity || "No velocity data available."}
            </p>
          </div>

          {/* Stale Application Risk */}
          <div className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Staleness &amp; Pipeline Hygiene
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              {staleApplicationRisk || "No stale risk reported."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
